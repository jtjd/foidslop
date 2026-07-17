(function () {
  'use strict';

  function track(name, parameters) {
    if (!window.__foidslopGALoaded || typeof window.gtag !== 'function') return;
    window.gtag('event', name, Object.assign({ transport_type: 'beacon' }, parameters || {}));
  }

  function randomIndex(length) {
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      var values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0] % length;
    }
    return Math.floor(Math.random() * length);
  }

  var poolNode = document.getElementById('random-recipe-pool');
  var pool = [];
  if (poolNode) {
    try {
      pool = JSON.parse(poolNode.textContent);
    } catch (error) {
      pool = [];
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-random-recipe]'), function (button) {
    if (!pool.length) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
      return;
    }
    button.addEventListener('click', function () {
      var slug = pool[randomIndex(pool.length)];
      track('home_random_recipe', { recipe_slug: slug });
      window.location.assign('slop/' + slug);
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-track]'), function (element) {
    element.addEventListener('click', function () {
      var name = element.getAttribute('data-track');
      if (!name) return;
      var parameters = {};
      if (element.dataset.intent) parameters.intent = element.dataset.intent;
      if (element.dataset.recipe) parameters.recipe_slug = element.dataset.recipe;
      track(name, parameters);
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-newsletter-form]'), function (form) {
    form.addEventListener('submit', function () {
      if (form.checkValidity()) track('newsletter_submit', { location: form.closest('.zine-newsletter-repeat') ? 'footer' : 'primary' });
    });
  });
}());
