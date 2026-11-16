const { app, BrowserWindow, BrowserView, session, ipcMain } = require('electron/main');
const path = require('node:path');

const YT_PARTITION = 'persist:youtube_apache';
const INITIAL_VIDEO_URL = 'https://youtu.be/9Lxm0iSnKNc?si=ao92e7KXzQIoiSMl';
const YT_LOGIN_URL = 'https://accounts.google.com/ServiceLogin?service=youtube&uilel=3&passive=true&continue=https%3A%2F%2Fwww.youtube.com%2F';

// Libera autoplay com áudio sem exigir clique do usuário (Requisito N04)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow;
let youtubeView;
let loginWindow = null;
let flushTimeout = null;

// Calcula a posição exata da div #video-mount-area no index.html e posiciona a BrowserView por cima
async function syncYoutubeBounds() {
  if (!mainWindow || mainWindow.isDestroyed() || !youtubeView) return;

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

    if (bounds && bounds.width > 0 && bounds.height > 0) {
      youtubeView.setBounds(bounds);
    }
  } catch (error) {
    console.error('Erro ao ajustar dimensões da BrowserView do YouTube:', error);
  }
}

// Verifica se já existem cookies de autenticação do Google/YouTube salvos na partição persistente
async function isYoutubeLoggedIn(ytSession) {
  try {
    const cookies = await ytSession.cookies.get({ url: 'https://www.youtube.com' });
    const authCookieNames = ['SID', 'SSID', 'HSID', '__Secure-3PSID', 'SAPISID', 'LOGIN_INFO'];
    return cookies.some((cookie) => authCookieNames.includes(cookie.name) && Boolean(cookie.value));
  } catch (error) {
    console.error('Erro ao verificar cookies de login do YouTube:', error);
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
      nodeIntegration: false
    }
  });

  loginWindow.loadURL(YT_LOGIN_URL);

  // Monitora quando o usuário conclui o login no Google e é redirecionado de volta ao YouTube
  const checkLoginRedirect = async (_event, url) => {
    if (url.startsWith('https://www.youtube.com') && !url.includes('accounts.google.com')) {
      const loggedIn = await isYoutubeLoggedIn(ytSession);
      if (loggedIn) {
        await ytSession.cookies.flushStore();
        console.log('Sessão do YouTube Premium autenticada e salva no disco com sucesso!');
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

function createWindow() {
  // 1. Cria uma única janela principal que carrega o layout do palco (index.html)
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#0B0E14'
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

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
      nodeIntegration: false
    }
  });

  youtubeView.webContents.setUserAgent(app.userAgentFallback);

  // Acopla a BrowserView do YouTube na janela principal
  mainWindow.setBrowserView(youtubeView);

  // Sincroniza a posição da BrowserView assim que o index.html terminar de carregar
  mainWindow.webContents.on('did-finish-load', async () => {
    await syncYoutubeBounds();

    const loggedIn = await isYoutubeLoggedIn(ytSession);
    if (loggedIn) {
      console.log('Login do YouTube Premium detectado na sessão persistente!');
      youtubeView.webContents.loadURL(INITIAL_VIDEO_URL);
    } else {
      console.log('Nenhum login detectado. Abrindo janela de autenticação do YouTube Premium...');
      openYoutubeLoginWindow(ytSession, () => {
        youtubeView.webContents.loadURL(INITIAL_VIDEO_URL);
      });
    }
  });

  // Atalho F2 (ou Ctrl+L) para abrir manualmente a janela de login/troca de conta do YouTube a qualquer momento
  const handleShortcut = (event, input) => {
    if (input.type === 'keyDown' && (input.key === 'F2' || (input.control && input.key.toLowerCase() === 'l'))) {
      event.preventDefault();
      openYoutubeLoginWindow(ytSession, () => {
        youtubeView.webContents.reload();
      });
    }
  };
  mainWindow.webContents.on('before-input-event', handleShortcut);
  youtubeView.webContents.on('before-input-event', handleShortcut);

  mainWindow.on('resize', syncYoutubeBounds);

  // Garante a gravação dos cookies no disco ao fechar
  mainWindow.on('close', async () => {
    await ytSession.cookies.flushStore();
  });
}

// Recebe o evento do preload.js quando o vídeo do YouTube chega ao fim
ipcMain.on('player:video-ended', () => {
  console.log('Vídeo finalizado! Pronto para chamar o próximo da fila.');
});

app.whenReady().then(() => {
  session.defaultSession.webRequest.onBeforeSendHeaders({urls:["<all_urls>"]}, (details, callback) => {
    details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:70.0) Gecko/20100101 Firefox/70.0'
    callback({ requestHeaders: details.requestHeaders })
  })

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


