const { ipcRenderer } = require('electron');

// Roda dentro da página do YouTube (contextIsolation + sandbox): só avisa o fim do vídeo.
function videoIdDaPagina() {
  return new URL(location.href).searchParams.get('v');
}

function anuncioNaTela() {
  return document.querySelector('#movie_player')?.classList.contains('ad-showing') ?? false;
}

if (location.hostname.endsWith('youtube.com')) {
  // 'ended' não propaga, mas é capturado no document; funciona mesmo se o YouTube trocar o <video>.
  document.addEventListener('ended', (evento) => {
    const video = evento.target;
    if (!(video instanceof HTMLVideoElement)) return;
    if (anuncioNaTela()) return; // fim de anúncio, não da música
    if (!video.duration || video.currentTime < video.duration - 2) return;
    ipcRenderer.send('video:fim', { videoId: videoIdDaPagina() });
  }, true);
}
