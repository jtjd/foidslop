(function () {
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('foidslop-theme'); } catch (error) {}
  root.dataset.theme = saved === 'light' ? 'light' : 'dark';

  function updateTheme() {
    var dark = root.dataset.theme !== 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    try { localStorage.setItem('foidslop-theme', root.dataset.theme); } catch (error) {}
    updateLabels();
  }

  function updateLabels() {
    var dark = root.dataset.theme === 'dark';
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      var label = button.querySelector('.theme-toggle-label');
      var mark = button.querySelector('.theme-toggle-mark');
      if (label) label.textContent = dark ? 'Light mode' : 'Dark mode';
      if (mark) mark.textContent = dark ? '*' : 'o';
      button.setAttribute('aria-pressed', String(dark));
    });
  }

  function bindNavigation() {
    var header = document.getElementById('site-header');
    var button = document.getElementById('nav-hamburger');
    var menu = document.getElementById('nav-dropdown');
    if (!header || !button || !menu) return;

    function setOpen(open) {
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      menu.setAttribute('aria-hidden', String(!open));
      button.classList.toggle('open', open);
      menu.classList.toggle('open', open);
    }

    button.addEventListener('click', function () {
      setOpen(button.getAttribute('aria-expanded') !== 'true');
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('click', function (event) {
      if (!header.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        button.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024) setOpen(false);
    });
  }

  function bind() {
    updateLabels();
    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      button.addEventListener('click', updateTheme);
    });
    bindNavigation();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
}());
