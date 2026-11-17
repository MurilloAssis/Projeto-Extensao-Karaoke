const { ipcRenderer } = require('electron');

// CSS que esconde menus/comentários do YouTube e faz o player ocupar a BrowserView inteira.
// O <video> e os controles ficam por conta do próprio player (encaixe sem corte e barra de controles visível).
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

  #movie_player {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: none !important;
    max-height: none !important;
    z-index: 9999 !important;
    background-color: #000000 !important;
  }
`;

// O player recalcula o tamanho do vídeo e dos controles quando a janela "muda de tamanho".
let timerAjuste = null;
function reajustarPlayer() {
    clearTimeout(timerAjuste);
    timerAjuste = setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
}

const videoIdDaPagina = () => new URLSearchParams(window.location.search).get('v');

// Fim de anúncio não conta como fim da música.
const emAnuncio = () => Boolean(document.querySelector('#movie_player.ad-showing'));

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
            reajustarPlayer();
        } else if (styleEl) {
            styleEl.remove();
        }
    };

    applyCleanPlayerMode();
    // O YouTube navega como SPA, então reaplica a limpeza a cada troca de página interna
    window.addEventListener('yt-navigate-finish', applyCleanPlayerMode);
});

// Ao carregar o vídeo (e depois de anúncios), o player já existe e precisa se reencaixar.
document.addEventListener('loadedmetadata', reajustarPlayer, true);

// O <video> do YouTube é trocado entre vídeos; a captura no document pega o 'ended' de qualquer um.
document.addEventListener('ended', (evento) => {
    const video = evento.target;
    if (!(video instanceof HTMLVideoElement) || emAnuncio()) return;
    if (Number.isFinite(video.duration) && video.currentTime < video.duration - 2) return;
    ipcRenderer.send('player:video-ended', { videoId: videoIdDaPagina() });
}, true);
