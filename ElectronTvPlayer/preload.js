const { ipcRenderer } = require('electron');

// CSS que esconde menus/comentários do YouTube e força o vídeo em 100% da BrowserView
const KIOSK_YOUTUBE_CSS = `
  #masthead-container,
  #secondary,
  #below,
  #comments,
  #related,
  ytd-merch-shelf-renderer,
  .ytp-chrome-top,
  .ytp-watermark,
  .ytp-ce-element,
  .ytp-endscreen-content {
    display: none !important;
  }

  html, body, ytd-app, #content, #page-manager {
    overflow: hidden !important;
    background-color: #000000 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  #player-theater-container,
  #player-container-outer,
  #player-container-inner,
  #player-container,
  #movie_player,
  .html5-video-container,
  video.html5-main-video {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    z-index: 9999 !important;
  }
`;

window.addEventListener('DOMContentLoaded', () => {
    const applyCleanPlayerMode = () => {
        let styleEl = document.getElementById('apache-kiosk-style');

        // Só oculta a interface se estiver reproduzindo um vídeo (/watch)
        if (window.location.pathname.startsWith('/watch')) {
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'apache-kiosk-style';
                styleEl.textContent = KIOSK_YOUTUBE_CSS;
                document.head.appendChild(styleEl);
            }

            const video = document.querySelector('video.html5-main-video');
            if (video) {
                video.muted = false;
                video.play().catch(() => { });
                video.onended = () => ipcRenderer.send('player:video-ended');
            }
        } else if (styleEl) {
            styleEl.remove();
        }
    };

    applyCleanPlayerMode();
    // O YouTube navega como SPA, então reaplica a limpeza a cada troca de página interna
    window.addEventListener('yt-navigate-finish', applyCleanPlayerMode);
});