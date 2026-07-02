/* ══════════════════════════════════════════
 *  cookie-consent.js — foidslop
 *  Renders a consent banner and only loads
 *  Google Analytics after the visitor accepts.
 *  Include on every page via:
 *    <script src="/cookie-consent.js" data-ga-id="G-VT527DETQ2"></script>
 *  (use ../cookie-consent.js from /slop/ pages)
 * ══════════════════════════════════════════ */
(function () {
  var STORAGE_KEY = 'foidslop_consent'; // 'accepted' | 'declined'
  var script = document.currentScript;
  var GA_ID = (script && script.getAttribute('data-ga-id')) || 'G-VT527DETQ2';

  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }

  function loadAnalytics() {
    if (window.__foidslopGALoaded) return;
    window.__foidslopGALoaded = true;

    var gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(gtagScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
  }

  function buildBanner() {
    var wrap = document.createElement('div');
    wrap.className = 'cookie-consent';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', 'Cookie consent');
    wrap.setAttribute('aria-live', 'polite');
    wrap.innerHTML =
      '<div class="cookie-consent-inner">' +
        '<p class="cookie-consent-text">' +
          '<span class="cookie-consent-mark" aria-hidden="true">&#10022;</span>' +
          'We use cookies for basic analytics. No ads, nothing sold. ' +
          '<a href="' + (location.pathname.indexOf('/slop/') === 0 ? '../privacy.html' : 'privacy.html') + '#analytics">Read more</a>' +
        '</p>' +
        '<div class="cookie-consent-actions">' +
          '<button type="button" class="cookie-consent-btn cookie-consent-decline">Decline</button>' +
          '<button type="button" class="cookie-consent-btn cookie-consent-accept">Accept</button>' +
        '</div>' +
      '</div>';
    return wrap;
  }

  function showBanner() {
    var banner = buildBanner();
    document.body.appendChild(banner);

    // Force reflow then animate in
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { banner.classList.add('visible'); });
    });

    function dismiss(consentValue) {
      setConsent(consentValue);
      banner.classList.remove('visible');
      banner.addEventListener('transitionend', function handler() {
        banner.removeEventListener('transitionend', handler);
        banner.remove();
      });
      if (consentValue === 'accepted') loadAnalytics();
    }

    banner.querySelector('.cookie-consent-accept').addEventListener('click', function () {
      dismiss('accepted');
    });
    banner.querySelector('.cookie-consent-decline').addEventListener('click', function () {
      dismiss('declined');
    });
  }

  function init() {
    var consent = getConsent();
    if (consent === 'accepted') {
      loadAnalytics();
    } else if (consent !== 'declined') {
      // No choice made yet — show the banner
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showBanner);
      } else {
        showBanner();
      }
    }
    // If declined, do nothing — analytics stays off
  }

  init();
})();
