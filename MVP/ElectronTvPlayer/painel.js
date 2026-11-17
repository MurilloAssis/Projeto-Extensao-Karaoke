// Layout do telão: preenche o index.html com o que o processo principal recebe da API.
// Dados da API entram só por textContent.
(() => {
  const $ = (id) => document.getElementById(id);
  const estado = { fila: null, sessao: { aberta: false }, modo: 'descanso', aviso: '' };
  let timerAnuncio = null;

  const nomeDe = (item) => item?.solicitante?.nome || 'Cliente';
  const musicaDe = (item) => item?.musica?.titulo ?? '';

  function itemDaFila(item) {
    const li = document.createElement('li');
    li.className = 'queue-item';
    const avatar = document.createElement('div');
    avatar.className = 'singer-avatar';
    avatar.textContent = nomeDe(item).charAt(0).toUpperCase();
    const info = document.createElement('div');
    info.className = 'queue-item-info';
    const titulo = document.createElement('span');
    titulo.className = 'queue-item-title';
    titulo.textContent = `${nomeDe(item)} - ${musicaDe(item)}`;
    info.appendChild(titulo);
    li.append(avatar, info);
    return li;
  }

  function renderizarFila() {
    const atual = estado.fila?.atual ?? null;
    const proximos = estado.fila?.proximos ?? [];

    $('current-singer-song').textContent = atual ? `${nomeDe(atual)} - ${musicaDe(atual)}` : 'Palco livre';
    $('soundwave').style.visibility = atual && estado.modo === 'video' ? 'visible' : 'hidden';

    const lista = $('queue-list');
    lista.replaceChildren();
    if (proximos.length === 0) {
      const vazio = document.createElement('li');
      vazio.className = 'queue-empty';
      vazio.textContent = estado.sessao.aberta
        ? 'Fila vazia. Escaneie o QR Code e peça sua música!'
        : 'Fila vazia.';
      lista.appendChild(vazio);
    } else {
      proximos.forEach((item) => lista.appendChild(itemDaFila(item)));
    }

    $('next-rockstar-name').textContent = proximos.length ? nomeDe(proximos[0]) : '—';
    renderizarDescanso();
  }

  function renderizarSessao() {
    const { aberta, codigo, qr } = estado.sessao;
    for (const caixa of [$('qr-code-box'), $('idle-qr')]) {
      caixa.replaceChildren();
      if (aberta && qr) {
        const img = document.createElement('img');
        img.src = qr;
        img.alt = `QR Code da sessão ${codigo}`;
        caixa.appendChild(img);
        caixa.classList.remove('qr-fechado');
      } else {
        const texto = document.createElement('span');
        texto.textContent = 'Sessão fechada';
        caixa.appendChild(texto);
        caixa.classList.add('qr-fechado');
      }
    }
    $('idle-qr').hidden = !aberta;
    $('idle-codigo').textContent = aberta ? `Código: ${codigo}` : '';
    renderizarFila();
  }

  function renderizarDescanso() {
    const atual = estado.fila?.atual ?? null;
    const proximo = estado.fila?.proximos?.[0] ?? null;
    $('idle-standby').hidden = estado.modo === 'video';

    let titulo = 'Palco Apache Gru Aberto';
    let texto = 'Escaneie o QR Code para pedir sua música!';
    if (!estado.sessao.aberta) {
      titulo = 'Palco Apache Gru';
      texto = 'Aguardando o DJ abrir a sessão.';
    } else if (!atual && proximo) {
      titulo = `Próximo: ${nomeDe(proximo)}`;
      texto = `${musicaDe(proximo)} — aguardando o DJ chamar ao palco.`;
    }
    $('idle-titulo').textContent = titulo;
    $('idle-texto').textContent = texto;
    $('idle-aviso').textContent = estado.aviso;
    $('idle-aviso').hidden = !estado.aviso;
  }

  window.telao.aoReceberFila((fila) => {
    estado.fila = fila;
    if (fila?.atual) estado.aviso = '';
    renderizarFila();
  });

  window.telao.aoReceberSessao((sessao) => {
    estado.sessao = sessao;
    renderizarSessao();
  });

  window.telao.aoMudarPalco(({ modo }) => {
    estado.modo = modo;
    renderizarFila();
  });

  window.telao.aoAnunciar(({ nome, titulo, artista, ms }) => {
    $('tts-singer-name').textContent = nome || 'Próximo cantor';
    $('tts-song-title').textContent = artista ? `${titulo} - ${artista}` : titulo;
    $('tts-overlay').classList.add('active');
    clearTimeout(timerAnuncio);
    timerAnuncio = setTimeout(() => $('tts-overlay').classList.remove('active'), ms);
  });

  window.telao.aoMudarConexao((conectado) => {
    const indicador = $('conexao');
    indicador.textContent = conectado ? '● AO VIVO' : '● RECONECTANDO…';
    indicador.classList.toggle('offline', !conectado);
  });

  window.telao.aoAvisar((texto) => {
    estado.aviso = texto;
    renderizarDescanso();
  });

  renderizarSessao();
})();
