(function () {
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('foidslop-theme'); } catch (error) {}
  root.dataset.theme = saved === 'light' ? 'light' : 'dark';
  function update() {
    var dark = root.dataset.theme !== 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    try { localStorage.setItem('foidslop-theme', root.dataset.theme); } catch (error) {}
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.querySelector('.theme-toggle-label').textContent = dark ? 'Light mode' : 'Dark mode';
      button.querySelector('.theme-toggle-mark').textContent = dark ? '☼' : '☾';
    });
  }
  function bind() {
    var buttons = document.querySelectorAll('.theme-toggle');
    if (!buttons.length) return;
    updateLabels();
    buttons.forEach(function (button) { button.addEventListener('click', update); });
  }
  function updateLabels() {
    var dark = root.dataset.theme === 'dark';
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      button.querySelector('.theme-toggle-label').textContent = dark ? 'Light mode' : 'Dark mode';
      button.querySelector('.theme-toggle-mark').textContent = dark ? '☼' : '☾';
      button.setAttribute('aria-pressed', String(dark));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
}());
