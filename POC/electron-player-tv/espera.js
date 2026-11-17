const aviso = new URLSearchParams(location.search).get('aviso');
if (aviso) {
  const elemento = document.getElementById('aviso');
  elemento.textContent = aviso;
  elemento.hidden = false;
}
