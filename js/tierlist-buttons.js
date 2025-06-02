// Nenhum JS adicional é necessário além do inline onclick
// Se quiser um identificador visual quando a tier está em foco (opcional):
window.addEventListener('hashchange', () => {
  ['tier-ss','tier-s','tier-a'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('highlighted-tier');
  });
  const hash = document.location.hash.replace('#','');
  if (hash && document.getElementById(hash)) {
    document.getElementById(hash).classList.add('highlighted-tier');
  }
});
// Opcional: Adicione uma animação visual ao elemento da tier quando focada via botão