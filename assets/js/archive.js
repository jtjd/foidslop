(function () {
  'use strict';

  var grid = document.getElementById('archive-grid');
  if (!grid) return;

  function track(name, parameters) {
    if (!window.__foidslopGALoaded || typeof window.gtag !== 'function') return;
    window.gtag('event', name, Object.assign({ transport_type: 'beacon' }, parameters || {}));
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function buildCard(entry) {
    var article = document.createElement('article');
    article.className = 'archive-card';
    article.hidden = true;
    article.setAttribute('data-search', entry.search);
    article.setAttribute('data-filters', entry.filters);
    article.innerHTML = '<a href="./' + esc(entry.slug) + '">'
      + '<div class="archive-card-img"><picture><source type="image/webp" srcset="img/' + esc(entry.slug) + '-480.webp 480w, img/' + esc(entry.slug) + '-768.webp 768w" sizes="(max-width: 560px) 100vw, (max-width: 960px) 50vw, 33vw"><img src="img/' + esc(entry.img) + '" alt="' + esc(entry.alt) + '" width="600" height="600" loading="lazy"></picture></div>'
      + '<div class="archive-card-body"><p class="archive-card-name">' + esc(entry.name) + '</p>'
      + '<div class="archive-card-meta"><span class="archive-card-date">' + esc(entry.date) + '</span><div class="archive-card-tags">'
      + (entry.tags || []).map(function (tag) { return '<span class="archive-card-tag">' + esc(tag) + '</span>'; }).join('')
      + '</div></div></div></a>';
    return article;
  }

  // Older recipes arrive as a JSON manifest and hydrate into the same card
  // markup the publisher renders server-side for the newest chunk.
  var manifest = document.getElementById('archive-manifest');
  if (manifest) {
    var entries = [];
    try { entries = JSON.parse(manifest.textContent) || []; } catch (error) { entries = []; }
    if (entries.length) {
      var fragment = document.createDocumentFragment();
      entries.forEach(function (entry) { fragment.appendChild(buildCard(entry)); });
      grid.appendChild(fragment);
    }
  }

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
  var lastMatchCount = 0;
  var searchTimer = null;
  var lastTrackedSearch = '';

  search.value = params.get('q') || '';

  function readUrlState() {
    var currentParams = new URLSearchParams(window.location.search);
    search.value = currentParams.get('q') || '';
    activeFilter = allowed.indexOf(currentParams.get('filter')) >= 0 ? currentParams.get('filter') : 'all';
  }

  function syncUrl() {
    var next = new URLSearchParams();
    var query = search.value.trim();
    if (query) next.set('q', query);
    if (activeFilter !== 'all') next.set('filter', activeFilter);
    var suffix = next.toString();
    window.history.replaceState(null, '', window.location.pathname + (suffix ? '?' + suffix : '') + window.location.hash);
  }

  function scheduleSearchTracking() {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      var query = search.value.trim().toLowerCase();
      if (query.length < 3 && activeFilter === 'all') return;
      var state = query + '|' + activeFilter + '|' + lastMatchCount;
      if (state === lastTrackedSearch) return;
      lastTrackedSearch = state;
      var parameters = {
        search_term: query || '(filter only)',
        filter: activeFilter,
        result_count: String(lastMatchCount),
        has_results: lastMatchCount ? 'true' : 'false'
      };
      track('archive_search', parameters);
      if (!lastMatchCount) track('archive_search_no_results', parameters);
    }, 1200);
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
    lastMatchCount = matches.length;
    syncUrl();
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      activeFilter = button.dataset.filter;
      visibleLimit = 12;
      apply();
      scheduleSearchTracking();
    });
  });
  search.addEventListener('input', function () {
    visibleLimit = 12;
    apply();
    scheduleSearchTracking();
  });
  loadMore.addEventListener('click', function () { visibleLimit += 12; apply(); });

  window.addEventListener('popstate', function () {
    readUrlState();
    visibleLimit = 12;
    apply();
    scheduleSearchTracking();
  });

  var backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', function () { backToTop.classList.toggle('visible', window.scrollY > 400); }, { passive: true });
    backToTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  apply();
  scheduleSearchTracking();
}());
