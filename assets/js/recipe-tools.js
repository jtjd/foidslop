(function () {
  'use strict';

  function track(name, parameters) {
    if (!window.__foidslopGALoaded || typeof window.gtag !== 'function') return;
    window.gtag('event', name, Object.assign({ transport_type: 'beacon' }, parameters || {}));
  }

  function pageSlug() {
    var rate = document.getElementById('rate-recipe');
    return rate ? rate.getAttribute('data-slug') : '';
  }

  // Recipe pages render data-track actions (share row, report prompt, today's
  // slop links) that home.js never sees, so bind them here.
  document.addEventListener('click', function (event) {
    var element = event.target.closest ? event.target.closest('[data-track]') : null;
    if (!element) return;
    var name = element.getAttribute('data-track');
    if (!name) return;
    var parameters = { recipe_slug: pageSlug() };
    if (element.dataset.intent) parameters.intent = element.dataset.intent;
    if (element.dataset.recipe) parameters.recipe_slug = element.dataset.recipe;
    track(name, parameters);
  });

  var printButton = document.getElementById('print-recipe');
  var copyButton = document.getElementById('copy-ingredients');
  var status = document.getElementById('recipe-tool-status');

  if (printButton) printButton.addEventListener('click', function () { window.print(); });
  if (!copyButton) return;

  function recipeText() {
    var title = document.querySelector('.slop-title');
    var lines = Array.prototype.map.call(document.querySelectorAll('.ingredient-item'), function (item) {
      var amount = item.querySelector('.ingredient-amount');
      var name = item.querySelector('.ingredient-name');
      return ((amount ? amount.textContent.trim() : '') + ' ' + (name ? name.textContent.trim() : '')).trim();
    });
    return (title ? title.textContent.replace(/\s+/g, ' ').trim() : 'foidslop recipe') + '\n\nIngredients\n' + lines.join('\n');
  }

  function legacyCopy(text) {
    var field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    var copied = document.execCommand('copy');
    field.remove();
    return copied;
  }

  function report(message) {
    status.textContent = message;
    copyButton.classList.add('copied');
    window.setTimeout(function () {
      status.textContent = '';
      copyButton.classList.remove('copied');
    }, 2500);
  }

  copyButton.addEventListener('click', function () {
    var text = recipeText();
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { report('Ingredients copied.'); }, function () {
        report(legacyCopy(text) ? 'Ingredients copied.' : 'Copy failed.');
      });
    } else {
      report(legacyCopy(text) ? 'Ingredients copied.' : 'Copy failed.');
    }
  });
}());

(function () {
  var root = document.getElementById('rate-recipe');
  if (!root) return;
  var slug = root.getAttribute('data-slug');
  var stars = Array.prototype.slice.call(root.querySelectorAll('.rate-star'));
  var summary = document.getElementById('rate-summary');
  var storageKey = 'foidslop-rated:' + slug;
  var done = false;

  function text(message) { if (summary) summary.textContent = message; }

  function paint(value) {
    stars.forEach(function (star) {
      var active = Number(star.getAttribute('data-value')) <= value;
      star.classList.toggle('active', active);
      star.setAttribute('aria-pressed', String(active));
    });
  }

  function finish(value, message) {
    done = true;
    paint(value);
    stars.forEach(function (star) { star.disabled = true; });
    root.classList.add('rated');
    text(message);
    try { localStorage.setItem(storageKey, String(value)); } catch (error) {}
  }

  try {
    var previous = Number(localStorage.getItem(storageKey));
    if (previous >= 1 && previous <= 5) {
      track('rate_recipe', { recipe_slug: slug, rating: String(previous), engagement: 'returning' });
      finish(previous, 'You rated this ' + previous + '/5. Thanks.');
    }
  } catch (error) {}

  stars.forEach(function (star) {
    star.addEventListener('click', function () {
      if (done) return;
      var value = Number(star.getAttribute('data-value'));
      star.disabled = true;
      track('rate_recipe', { recipe_slug: slug, rating: String(value), engagement: 'submit' });
      fetch('/api/rate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: slug, rating: value, website: '' })
      }).then(function (response) { return response.json().then(function (data) { return { ok: response.ok, data: data }; }); })
        .then(function (result) {
          if (!result.ok) throw new Error(result.data && result.data.error);
          var fresh = result.data.summary;
          var message = fresh
            ? 'Rated ' + fresh.average + '/5 by ' + fresh.count + (fresh.count === 1 ? ' reader.' : ' readers.')
            : 'Thanks for rating.';
          finish(value, message);
        })
        .catch(function () {
          star.disabled = false;
          text('Rating did not go through. Try again.');
        });
    });
  });
}());

(function () {
  var button = document.getElementById('copy-page-link');
  if (!button) return;
  var original = button.textContent;

  function done() {
    button.textContent = 'Copied';
    window.setTimeout(function () { button.textContent = original; }, 2000);
  }

  function legacyCopy(text) {
    var field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    var copied = document.execCommand('copy');
    field.remove();
    return copied;
  }

  button.addEventListener('click', function () {
    var url = button.getAttribute('data-url') || window.location.href;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(done, function () { if (legacyCopy(url)) done(); });
    } else if (legacyCopy(url)) {
      done();
    }
  });
}());

(function () {
  var form = document.querySelector('form[data-newsletter-form]');
  if (!form) return;
  form.addEventListener('submit', function () {
    if (!window.__foidslopGALoaded || typeof window.gtag !== 'function') return;
    if (form.checkValidity()) window.gtag('event', 'newsletter_submit', { transport_type: 'beacon', location: 'recipe' });
  });
}());
