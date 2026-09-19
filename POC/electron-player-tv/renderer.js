const path = require('path');
const webview = document.getElementById('youtube-player');
const statusEl = document.getElementById('status');

// Anexa dinamicamente o script "hacker" que vai rodar DENTRO do YouTube
webview.setAttribute('preload', `file://${path.join(__dirname, 'preload.js')}`);

// Conecta na API Spring Boot
const socket = new SockJS('http://localhost:8080/ws-karaoke');
const client = new StompJs.Client({
    webSocketFactory: () => socket,
    onConnect: () => {
        statusEl.innerText = "TV Conectada! Aguardando o DJ...";
        
        // Escuta o ID enviado pelo AdminController
        client.subscribe('/topico/player', (mensagem) => {
            const videoId = mensagem.body;
            tocarVideo(videoId);
        });
    }
});
client.activate();

function tocarVideo(id) {
    statusEl.style.display = 'none';
    webview.style.display = 'flex';
    // O webview carrega a página oficial do YouTube
    webview.src = `https://www.youtube.com/watch?v=${id}`;
}

// Escuta a mensagem enviada pelo preload.js informando que o vídeo acabou
webview.addEventListener('ipc-message', (event) => {
    if (event.channel === 'video-ended') {
        webview.style.display = 'none';
        webview.src = 'about:blank';
        statusEl.style.display = 'block';
        statusEl.innerText = "Música finalizada. Chamando a próxima da fila...";
        
        // Em um sistema completo, aqui você faria um:
        // fetch('http://localhost:8080/api/admin/proxima', { method: 'POST' })
    }
});