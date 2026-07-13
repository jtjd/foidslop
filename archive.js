(function () {
  var grid = document.getElementById('archive-grid');
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.archive-card'));
  var search = document.getElementById('archive-search');
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll('.archive-filter'));
  var count = document.getElementById('archive-count');
  var results = document.getElementById('archive-results');
  var empty = document.getElementById('archive-empty');
  var loadMoreWrap = document.getElementById('archive-load-more');
  var loadMore = document.getElementById('load-more-btn');
  var allowed = filterButtons.map(function (button) { return button.dataset.filter; });
  var params = new URLSearchParams(window.location.search);
  var activeFilter = allowed.indexOf(params.get('filter')) >= 0 ? params.get('filter') : 'all';
  var visibleLimit = 12;

  search.value = params.get('q') || '';

  function syncUrl() {
    var next = new URLSearchParams();
    var query = search.value.trim();
    if (query) next.set('q', query);
    if (activeFilter !== 'all') next.set('filter', activeFilter);
    var suffix = next.toString();
    window.history.replaceState(null, '', window.location.pathname + (suffix ? '?' + suffix : '') + window.location.hash);
  }

  function apply() {
    var query = search.value.trim().toLowerCase();
    var filtering = query || activeFilter !== 'all';
    var matches = cards.filter(function (card) {
      var textMatches = !query || card.dataset.search.indexOf(query) >= 0;
      var cardFilters = (card.dataset.filters || '').split(/\s+/);
      var filterMatches = activeFilter === 'all' || cardFilters.indexOf(activeFilter) >= 0;
      return textMatches && filterMatches;
    });

    cards.forEach(function (card) { card.hidden = true; });
    matches.slice(0, filtering ? matches.length : visibleLimit).forEach(function (card) { card.hidden = false; });

    filterButtons.forEach(function (button) {
      var active = button.dataset.filter === activeFilter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    var shown = filtering ? matches.length : Math.min(visibleLimit, matches.length);
    count.textContent = matches.length + (matches.length === 1 ? ' recipe' : ' recipes');
    results.textContent = matches.length ? 'Showing ' + shown + (shown < matches.length ? ' of ' + matches.length : '') + (matches.length === 1 ? ' recipe' : ' recipes') : 'No recipes found';
    empty.hidden = matches.length !== 0;
    loadMoreWrap.hidden = filtering || visibleLimit >= matches.length;
    syncUrl();
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      activeFilter = button.dataset.filter;
      visibleLimit = 12;
      apply();
    });
  });
  search.addEventListener('input', function () { visibleLimit = 12; apply(); });
  loadMore.addEventListener('click', function () { visibleLimit += 12; apply(); });

  var backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () { backToTop.classList.toggle('visible', window.scrollY > 400); }, { passive: true });
    backToTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  apply();
}());
