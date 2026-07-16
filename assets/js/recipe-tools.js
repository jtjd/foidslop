(function () {
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
