const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { Client } = require('@stomp/stompjs');

// Configuração: variável de ambiente > config.json (fora do Git) > padrão. A chave não fica no código.
function lerConfigArquivo() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  } catch {
    return {};
  }
}
const configArquivo = lerConfigArquivo();
const config = (nome, padrao) => process.env[nome] || configArquivo[nome] || padrao;

const API_URL = config('API_URL', 'http://localhost:8080');
const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws';
const PLAYER_API_KEY = config('PLAYER_API_KEY', '');
const TELA_CHEIA = String(config('TELA_CHEIA', 'false')) === 'true';
const DEVTOOLS = String(config('DEVTOOLS', 'false')) === 'true';
const TOPICO = '/topic/fila-atualizada';
const HOSTS_PERMITIDOS = ['www.youtube.com', 'm.youtube.com', 'youtube.com', 'consent.youtube.com', 'accounts.google.com'];

let janela;
let atual = null; // pedido em reprodução segundo a API: { idFila, videoId, urlVideo, titulo }
let finalizado = null; // idFila cujo vídeo já terminou no telão (aguardando a API promover o próximo)
let ultimaVersao = 0;
let arquivoLog;

function log(...args) {
  const linha = `${new Date().toISOString()} ${args.join(' ')}`;
  console.log(linha);
  if (arquivoLog) fs.appendFile(arquivoLog, linha + '\n', () => {});
}

function videoIdDe(url) {
  try {
    const u = new URL(url);
    return HOSTS_PERMITIDOS.includes(u.hostname) && u.pathname === '/watch' ? u.searchParams.get('v') : null;
  } catch {
    return null;
  }
}

function urlPermitida(url) {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'file:' || (protocol === 'https:' && HOSTS_PERMITIDOS.includes(hostname));
  } catch {
    return false;
  }
}

function criarJanela() {
  janela = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: TELA_CHEIA,
    // Fora do telão, a tela cheia do player ocupa só a janela.
    fullscreenable: TELA_CHEIA,
    autoHideMenuBar: true,
    backgroundColor: '#0B0E14',
    webPreferences: {
      preload: path.join(__dirname, 'preload-youtube.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });

  const conteudo = janela.webContents;
  conteudo.setWindowOpenHandler(() => ({ action: 'deny' }));
  conteudo.on('will-navigate', (evento, url) => {
    if (!urlPermitida(url)) {
      log('navegação bloqueada:', url);
      evento.preventDefault();
    }
  });

  // O YouTube troca de vídeo sem recarregar a página (autoplay, recomendações).
  conteudo.on('did-navigate-in-page', (_evento, url) => verificarVideoNaTela(url));
  conteudo.on('did-navigate', (_evento, url) => verificarVideoNaTela(url));
  conteudo.on('did-finish-load', () => {
    if (videoIdDe(conteudo.getURL())) colocarPlayerEmTelaCheia();
  });

  if (DEVTOOLS) conteudo.openDevTools({ mode: 'detach' });
  mostrarEspera();
}

function mostrarEspera(aviso) {
  janela.loadFile(path.join(__dirname, 'espera.html'), aviso ? { query: { aviso } } : undefined);
}

function tocar(item) {
  const videoId = videoIdDe(item.musica?.urlVideo ?? '');
  if (!videoId) {
    log('urlVideo inválida, ignorada:', item.musica?.urlVideo);
    return;
  }
  atual = { idFila: item.idFila, videoId, urlVideo: item.musica.urlVideo, titulo: item.musica.titulo };
  finalizado = null;
  log(`tocando pedido ${item.idFila}: ${item.musica.titulo}`);
  janela.loadURL(atual.urlVideo);
}

// Só troca o vídeo quando o pedido em execução muda.
function aplicarAtual(item) {
  const novoId = item?.idFila ?? null;
  if (novoId === (atual?.idFila ?? null)) return;
  if (item) {
    tocar(item);
  } else {
    atual = null;
    finalizado = null;
    log('nada tocando: tela de espera');
    mostrarEspera();
  }
}

// Clica no botão de tela cheia do próprio YouTube: os controles nativos continuam funcionando.
async function colocarPlayerEmTelaCheia() {
  const script = `(() => {
    if (document.fullscreenElement) return true;
    const botao = document.querySelector('.ytp-fullscreen-button');
    if (!botao) return false;
    botao.click();
    return true;
  })()`;
  for (let tentativa = 0; tentativa < 40; tentativa++) {
    if (!videoIdDe(janela.webContents.getURL())) return;
    try {
      if (await janela.webContents.executeJavaScript(script, true)) return;
    } catch {
      // página ainda carregando
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  log('botão de tela cheia do YouTube não encontrado');
}

// Fim do vídeo do pedido: sai do YouTube na hora (evita o autoplay) e avisa a API.
function finalizarVideo(origem) {
  if (!atual || finalizado === atual.idFila) return;
  finalizado = atual.idFila;
  log(`fim do vídeo do pedido ${atual.idFila} (${origem})`);
  mostrarEspera();
  concluir(atual.idFila);
}

// Qualquer outro vídeo na tela enquanto o pedido toca significa que o nosso terminou.
function verificarVideoNaTela(url) {
  if (!atual || finalizado === atual.idFila) return;
  const videoId = videoIdDe(url);
  if (videoId && videoId !== atual.videoId) {
    log(`YouTube abriu outro vídeo (${videoId}); bloqueado`);
    finalizarVideo('troca de vídeo');
  }
}

async function concluir(idFila, tentativa = 1) {
  try {
    const resposta = await fetch(`${API_URL}/api/fila/${idFila}/concluir`, {
      method: 'POST',
      headers: { 'X-Player-Key': PLAYER_API_KEY },
    });
    // 200: a API concluiu e promoveu o próximo (chega pelo WebSocket); 409: o admin já tinha avançado.
    log(`concluir ${idFila}: HTTP ${resposta.status}`);
    if (resposta.status === 401) {
      log('PLAYER_API_KEY recusada pela API: confira a variável de ambiente.');
      mostrarEspera('A API recusou a chave do reprodutor (PLAYER_API_KEY). Use Próxima música no painel do DJ.');
    }
  } catch (erro) {
    log(`falha ao avisar o fim do vídeo (tentativa ${tentativa}):`, erro.message);
    if (tentativa < 3) setTimeout(() => concluir(idFila, tentativa + 1), 3000);
    else mostrarEspera('Sem conexão com a API. Use Próxima música no painel do DJ.');
  }
}

function conectarApi() {
  const cliente = new Client({
    webSocketFactory: () => new WebSocket(WS_URL),
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });

  cliente.onConnect = () => {
    log('conectado a', WS_URL);
    ultimaVersao = 0;
    cliente.subscribe(TOPICO, (frame) => {
      let mensagem;
      try {
        mensagem = JSON.parse(frame.body);
      } catch {
        return;
      }
      if (mensagem.versao <= ultimaVersao) return;
      ultimaVersao = mensagem.versao;
      log(`fila-atualizada v${mensagem.versao} (${mensagem.motivo})`);
      aplicarAtual(mensagem.fila?.atual ?? null);
    });
    carregarAtual();
  };
  cliente.onWebSocketClose = () => log('conexão com a API perdida; tentando novamente…');
  cliente.onStompError = (frame) => log('erro STOMP:', frame.headers.message);

  cliente.activate();
}

async function carregarAtual() {
  try {
    const resposta = await fetch(`${API_URL}/api/fila/atual`);
    aplicarAtual(resposta.status === 200 ? await resposta.json() : null);
  } catch (erro) {
    log('falha ao buscar a música atual:', erro.message);
  }
}

// Aviso do preload: o vídeo da página terminou (anúncios já filtrados lá).
ipcMain.on('video:fim', (evento, dados) => {
  if (evento.sender !== janela.webContents || !atual) return;
  if (dados?.videoId !== atual.videoId) return; // fim de outro vídeo
  finalizarVideo('fim do vídeo');
});

app.whenReady().then(() => {
  arquivoLog = path.join(app.getPath('logs'), 'karaoke-player.log');
  log(`iniciando; API ${API_URL}; log em ${arquivoLog}`);
  if (!PLAYER_API_KEY) log('PLAYER_API_KEY não definida: o fim do vídeo não será aceito pela API.');
  criarJanela();
  conectarApi();
});

app.on('window-all-closed', () => {
  app.quit();
});
