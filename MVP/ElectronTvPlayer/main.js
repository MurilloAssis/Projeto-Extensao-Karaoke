const { app, BrowserWindow, BrowserView, session, ipcMain } = require('electron/main');
const fs = require('node:fs');
const path = require('node:path');
const WebSocket = require('ws');
const { Client } = require('@stomp/stompjs');
const QRCode = require('qrcode');

// Configuração: variável de ambiente > config.json (fora do Git) > padrão.
function lerConfigArquivo() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  } catch {
    return {};
  }
}
const configArquivo = lerConfigArquivo();
const config = (nome, padrao) => process.env[nome] ?? configArquivo[nome] ?? padrao;
const ligado = (nome, padrao) => String(config(nome, padrao)) === 'true';

const API_URL = String(config('API_URL', 'http://localhost:8080')).replace(/\/$/, '');
const WS_URL = API_URL.replace(/^http/, 'ws') + '/ws';
const PLAYER_API_KEY = String(config('PLAYER_API_KEY', ''));
const CLIENTE_URL = String(config('CLIENTE_URL', 'http://localhost:5174')).replace(/\/$/, '');
const TELA_CHEIA = ligado('TELA_CHEIA', 'false');
const DEVTOOLS = ligado('DEVTOOLS', 'false');
const LOGIN_YOUTUBE = ligado('LOGIN_YOUTUBE', 'true');
const ANUNCIO_MS = Number(config('ANUNCIO_MS', 4000));

const TOPICO_FILA = '/topic/fila-atualizada';
const TOPICO_SESSAO = '/topic/sessao-atualizada';
const YT_PARTITION = 'persist:youtube_apache';
const YT_LOGIN_URL = 'https://accounts.google.com/ServiceLogin?service=youtube&uilel=3&passive=true&continue=https%3A%2F%2Fwww.youtube.com%2F';
const HOSTS_YOUTUBE = ['www.youtube.com', 'm.youtube.com', 'youtube.com', 'consent.youtube.com', 'accounts.google.com'];
const ESCONDIDA = { x: 0, y: 0, width: 0, height: 0 };

// Libera autoplay com áudio sem exigir clique do usuário (Requisito N04)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow;
let youtubeView;
let loginWindow = null;
let flushTimeout = null;
let arquivoLog;

let atual = null; // pedido em reprodução no telão: { idFila, videoId, urlVideo }
let finalizado = null; // idFila cujo vídeo já terminou (aguardando a API)
let videoVisivel = false;
let timerAnuncio = null;
let ultimaVersao = 0;
let ultimaLeituraFila = 0;
let ultimaLeituraSessao = 0;

function log(...args) {
  const linha = `${new Date().toISOString()} ${args.join(' ')}`;
  console.log(linha);
  if (arquivoLog) fs.appendFile(arquivoLog, linha + '\n', () => {});
}

const painel = (canal, dados) => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(canal, dados);
};

function videoIdDe(url) {
  try {
    const u = new URL(url);
    return HOSTS_YOUTUBE.includes(u.hostname) && u.pathname === '/watch' ? u.searchParams.get('v') : null;
  } catch {
    return null;
  }
}

function urlDoYoutube(url) {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && HOSTS_YOUTUBE.includes(hostname);
  } catch {
    return false;
  }
}

// Calcula a posição exata da div #video-mount-area no index.html e posiciona a BrowserView por cima
async function syncYoutubeBounds() {
  if (!mainWindow || mainWindow.isDestroyed() || !youtubeView) return;
  if (!videoVisivel) {
    youtubeView.setBounds(ESCONDIDA);
    return;
  }

  try {
    const bounds = await mainWindow.webContents.executeJavaScript(`
      (() => {
        const el = document.getElementById('video-mount-area');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      })()
    `);

    if (videoVisivel && bounds && bounds.width > 0 && bounds.height > 0) {
      youtubeView.setBounds(bounds);
    }
  } catch (error) {
    log('Erro ao ajustar dimensões da BrowserView do YouTube:', error.message);
  }
}

// Verifica se já existem cookies de autenticação do Google/YouTube salvos na partição persistente
async function isYoutubeLoggedIn(ytSession) {
  try {
    const cookies = await ytSession.cookies.get({ url: 'https://www.youtube.com' });
    const authCookieNames = ['SID', 'SSID', 'HSID', '__Secure-3PSID', 'SAPISID', 'LOGIN_INFO'];
    return cookies.some((cookie) => authCookieNames.includes(cookie.name) && Boolean(cookie.value));
  } catch (error) {
    log('Erro ao verificar cookies de login do YouTube:', error.message);
    return false;
  }
}

// Abre uma janela modal compartilhando a mesma partição persistente para realizar ou gerenciar o login do YouTube Premium
function openYoutubeLoginWindow(ytSession, onLoginCompleted) {
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.focus();
    return;
  }

  loginWindow = new BrowserWindow({
    width: 960,
    height: 720,
    parent: mainWindow,
    modal: true,
    autoHideMenuBar: true,
    title: 'Login YouTube Premium - Apache Gru Karaoke',
    backgroundColor: '#121722',
    webPreferences: {
      partition: YT_PARTITION,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  loginWindow.loadURL(YT_LOGIN_URL);

  // Monitora quando o usuário conclui o login no Google e é redirecionado de volta ao YouTube
  const checkLoginRedirect = async (_event, url) => {
    if (url.startsWith('https://www.youtube.com') && !url.includes('accounts.google.com')) {
      const loggedIn = await isYoutubeLoggedIn(ytSession);
      if (loggedIn) {
        await ytSession.cookies.flushStore();
        log('Sessão do YouTube Premium autenticada e salva no disco.');
        if (loginWindow && !loginWindow.isDestroyed()) {
          loginWindow.close();
        }
        if (typeof onLoginCompleted === 'function') {
          onLoginCompleted();
        }
      }
    }
  };

  loginWindow.webContents.on('did-navigate', checkLoginRedirect);
  loginWindow.webContents.on('did-redirect-navigation', checkLoginRedirect);

  loginWindow.on('closed', async () => {
    loginWindow = null;
    await ytSession.cookies.flushStore();
  });
}

// ---------------------------------------------------------------------------
// Palco: vídeo da API ou tela de descanso
// ---------------------------------------------------------------------------

function mostrarVideo(visivel) {
  videoVisivel = visivel;
  painel('palco', { modo: visivel ? 'video' : 'descanso' });
  syncYoutubeBounds();
}

function mostrarDescanso() {
  clearTimeout(timerAnuncio);
  mostrarVideo(false);
  youtubeView.webContents.loadURL('about:blank');
}

function tocar(item) {
  const videoId = videoIdDe(item.musica?.urlVideo ?? '');
  if (!videoId) {
    log('urlVideo inválida, ignorada:', item.musica?.urlVideo);
    return;
  }
  atual = { idFila: item.idFila, videoId, urlVideo: item.musica.urlVideo };
  finalizado = null;
  log(`chamando ao palco: pedido ${item.idFila} (${item.musica.titulo})`);

  // Anúncio "Suba ao Palco" em tela cheia; o vídeo começa quando ele termina.
  clearTimeout(timerAnuncio);
  mostrarVideo(false);
  youtubeView.webContents.loadURL('about:blank');
  painel('anuncio', { nome: item.solicitante?.nome ?? '', titulo: item.musica.titulo, artista: item.musica.artista ?? '', ms: ANUNCIO_MS });
  timerAnuncio = setTimeout(() => {
    if (atual?.idFila !== item.idFila) return;
    youtubeView.webContents.loadURL(atual.urlVideo);
    mostrarVideo(true);
  }, ANUNCIO_MS);
}

// Só troca o vídeo quando o pedido em reprodução muda.
function aplicarFila(fila) {
  painel('fila', fila);
  const item = fila?.atual ?? null;
  const novoId = item?.idFila ?? null;
  if (novoId === (atual?.idFila ?? null)) return;
  if (item) {
    tocar(item);
  } else {
    atual = null;
    finalizado = null;
    log('palco livre: tela de descanso (o próximo começa com o Play do DJ)');
    mostrarDescanso();
  }
}

// Fim do vídeo do pedido: sai do YouTube na hora (evita o autoplay) e avisa a API.
function finalizarVideo(origem) {
  if (!atual || finalizado === atual.idFila) return;
  finalizado = atual.idFila;
  log(`fim do vídeo do pedido ${atual.idFila} (${origem})`);
  mostrarDescanso();
  concluir(atual.idFila);
}

// Qualquer outro vídeo na tela enquanto o pedido toca significa que o nosso terminou.
function verificarVideoNaTela(url) {
  if (!atual || finalizado === atual.idFila || !videoVisivel) return;
  const videoId = videoIdDe(url);
  if (videoId && videoId !== atual.videoId) {
    log(`YouTube abriu outro vídeo (${videoId}); bloqueado`);
    finalizarVideo('troca de vídeo');
  }
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

const comChave = { headers: { 'X-Player-Key': PLAYER_API_KEY } };

function avisoChave(status) {
  if (status !== 401) return false;
  log('PLAYER_API_KEY recusada pela API: confira o config.json.');
  painel('aviso', 'A API recusou a chave do telão (PLAYER_API_KEY). Confira o config.json.');
  return true;
}

async function concluir(idFila, tentativa = 1) {
  try {
    const resposta = await fetch(`${API_URL}/api/fila/${idFila}/concluir`, { method: 'POST', ...comChave });
    // 200: concluído (o próximo começa com o Play do DJ); 409: o DJ já tinha avançado.
    log(`concluir ${idFila}: HTTP ${resposta.status}`);
    avisoChave(resposta.status);
  } catch (erro) {
    log(`falha ao avisar o fim do vídeo (tentativa ${tentativa}):`, erro.message);
    if (tentativa < 3) setTimeout(() => concluir(idFila, tentativa + 1), 3000);
    else painel('aviso', 'Sem conexão com a API. Use Próxima música no painel do DJ.');
  }
}

async function carregarFila() {
  const leitura = ++ultimaLeituraFila;
  try {
    const resposta = await fetch(`${API_URL}/api/fila/telao`, comChave);
    if (avisoChave(resposta.status)) return;
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const fila = await resposta.json();
    if (leitura === ultimaLeituraFila) aplicarFila(fila);
  } catch (erro) {
    log('falha ao buscar a fila:', erro.message);
  }
}

async function carregarSessao() {
  const leitura = ++ultimaLeituraSessao;
  try {
    const resposta = await fetch(`${API_URL}/api/sessoes/atual`, comChave);
    if (avisoChave(resposta.status)) return;
    if (resposta.status === 204) {
      if (leitura === ultimaLeituraSessao) painel('sessao', { aberta: false });
      return;
    }
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const sessao = await resposta.json();
    const link = `${CLIENTE_URL}/cliente?sessao=${sessao.codigo}`;
    const qr = await QRCode.toDataURL(link, { margin: 1, width: 420 });
    if (leitura === ultimaLeituraSessao) {
      log(`sessão aberta: código ${sessao.codigo}`);
      painel('sessao', { aberta: true, codigo: sessao.codigo, qr });
    }
  } catch (erro) {
    log('falha ao buscar a sessão:', erro.message);
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
    painel('conexao', true);
    ultimaVersao = 0; // a API pode ter reiniciado e o contador recomeça
    cliente.subscribe(TOPICO_FILA, (frame) => {
      let mensagem;
      try {
        mensagem = JSON.parse(frame.body);
      } catch {
        return;
      }
      if (mensagem.versao <= ultimaVersao) return;
      ultimaVersao = mensagem.versao;
      log(`fila-atualizada v${mensagem.versao} (${mensagem.motivo})`);
      carregarFila(); // a mensagem é pública (sem nomes); a fila do telão vem por HTTP
    });
    cliente.subscribe(TOPICO_SESSAO, () => carregarSessao());
    carregarFila();
    carregarSessao();
  };
  cliente.onWebSocketClose = () => {
    painel('conexao', false);
    log('conexão com a API perdida; tentando novamente…');
  };
  cliente.onStompError = (frame) => log('erro STOMP:', frame.headers.message);

  cliente.activate();
}

// ---------------------------------------------------------------------------
// Janela
// ---------------------------------------------------------------------------

function createWindow() {
  // 1. Cria uma única janela principal que carrega o layout do palco (index.html)
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: TELA_CHEIA,
    autoHideMenuBar: true,
    backgroundColor: '#0B0E14',
    webPreferences: {
      preload: path.join(__dirname, 'preload-painel.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.on('will-navigate', (evento) => evento.preventDefault());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // 2. Configura sessão persistente para manter o login do YouTube Premium salvo em disco
  const ytSession = session.fromPartition(YT_PARTITION);
  ytSession.setUserAgent(app.userAgentFallback);

  // Persiste automaticamente no disco sempre que os cookies da sessão mudarem (evita perda se o PC desligar direto)
  ytSession.cookies.on('changed', () => {
    clearTimeout(flushTimeout);
    flushTimeout = setTimeout(() => {
      ytSession.cookies.flushStore().catch(() => { });
    }, 1000);
  });

  // 3. Cria a janela embutida (BrowserView) exclusiva do YouTube sobreposta à mainWindow
  youtubeView = new BrowserView({
    webPreferences: {
      partition: YT_PARTITION,
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  youtubeView.webContents.setUserAgent(app.userAgentFallback);
  youtubeView.setBounds(ESCONDIDA);

  const video = youtubeView.webContents;
  video.setWindowOpenHandler(() => ({ action: 'deny' }));
  video.on('will-navigate', (evento, url) => {
    if (!urlDoYoutube(url)) {
      log('navegação bloqueada:', url);
      evento.preventDefault();
    }
  });
  // O YouTube troca de vídeo sem recarregar a página (autoplay, recomendações).
  video.on('did-navigate-in-page', (_evento, url) => verificarVideoNaTela(url));
  video.on('did-navigate', (_evento, url) => verificarVideoNaTela(url));

  // Acopla a BrowserView do YouTube na janela principal
  mainWindow.setBrowserView(youtubeView);

  let primeiraCarga = true;
  mainWindow.webContents.on('did-finish-load', async () => {
    if (!primeiraCarga) {
      // Layout recarregado (Ctrl+R): reenvia o estado ao painel.
      painel('palco', { modo: videoVisivel ? 'video' : 'descanso' });
      carregarFila();
      carregarSessao();
      return;
    }
    primeiraCarga = false;
    conectarApi();

    if (!LOGIN_YOUTUBE) return;
    const loggedIn = await isYoutubeLoggedIn(ytSession);
    if (loggedIn) {
      log('Login do YouTube Premium detectado na sessão persistente.');
    } else {
      log('Nenhum login do YouTube detectado. Abrindo janela de autenticação do YouTube Premium...');
      openYoutubeLoginWindow(ytSession, () => {
        if (videoVisivel && atual) video.loadURL(atual.urlVideo);
      });
    }
  });

  // Atalho F2 (ou Ctrl+L) para abrir manualmente a janela de login/troca de conta do YouTube a qualquer momento
  const handleShortcut = (event, input) => {
    if (input.type === 'keyDown' && (input.key === 'F2' || (input.control && input.key.toLowerCase() === 'l'))) {
      event.preventDefault();
      openYoutubeLoginWindow(ytSession, () => {
        if (videoVisivel && atual) video.reload();
      });
    }
  };
  mainWindow.webContents.on('before-input-event', handleShortcut);
  video.on('before-input-event', handleShortcut);

  mainWindow.on('resize', syncYoutubeBounds);

  if (DEVTOOLS) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    video.openDevTools({ mode: 'detach' });
  }

  // Garante a gravação dos cookies no disco ao fechar
  mainWindow.on('close', async () => {
    await ytSession.cookies.flushStore();
  });
}

// Aviso do preload.js: o vídeo do YouTube chegou ao fim (anúncios já filtrados lá)
ipcMain.on('player:video-ended', (evento, dados) => {
  if (!youtubeView || evento.sender !== youtubeView.webContents || !atual) return;
  if (dados?.videoId !== atual.videoId) return; // fim de outro vídeo
  finalizarVideo('fim do vídeo');
});

app.whenReady().then(() => {
  arquivoLog = path.join(app.getPath('logs'), 'karaoke-telao.log');
  log(`iniciando; API ${API_URL}; cliente ${CLIENTE_URL}; log em ${arquivoLog}`);
  if (!PLAYER_API_KEY) log('PLAYER_API_KEY não definida: o telão não lê a fila nem avisa o fim do vídeo.');

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
