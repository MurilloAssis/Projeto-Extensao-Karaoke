const { contextBridge, ipcRenderer } = require('electron');

// Único canal entre o processo principal (API) e o layout do telão: só recebe dados.
const ouvir = (canal) => (callback) => {
  ipcRenderer.on(canal, (_evento, dados) => callback(dados));
};

contextBridge.exposeInMainWorld('telao', {
  aoReceberFila: ouvir('fila'),
  aoReceberSessao: ouvir('sessao'),
  aoMudarPalco: ouvir('palco'),
  aoAnunciar: ouvir('anuncio'),
  aoMudarConexao: ouvir('conexao'),
  aoAvisar: ouvir('aviso'),
});
