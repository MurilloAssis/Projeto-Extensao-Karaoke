const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Limpeza Visual (Remove comentários, barra lateral e overlay superior)
    const style = document.createElement('style');
    style.innerHTML = `
        #secondary, #comments, ytd-playlist-panel-renderer, .ytp-chrome-top, .ytp-show-cards-title { display: none !important; }
        ytd-watch-flexy[flexy] { --ytd-watch-flexy-sidebar-width: 0px !important; }
        .html5-video-player { height: 100vh !important; width: 100vw !important; }
    `;
    document.head.appendChild(style);

    // 2. Loop Caçador de Anúncios
    setInterval(() => {
        const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern');
        const adOverlay = document.querySelector('.ytp-ad-overlay-close-button');
        
        if (skipBtn) skipBtn.click();
        if (adOverlay) adOverlay.click();
    }, 1000);

    // 3. Detector de Fim de Música
    const checkVideo = setInterval(() => {
        const video = document.querySelector('video');
        if (video) {
            clearInterval(checkVideo);
            
            // Quando a tag de vídeo nativa chegar ao fim, avisa o nosso aplicativo
            video.addEventListener('ended', () => {
                ipcRenderer.sendToHost('video-ended'); 
            });
            
            // Força o play automático 
            video.play().catch(e => console.log("Aguardando liberação de Autoplay", e));
        }
    }, 1000);
});