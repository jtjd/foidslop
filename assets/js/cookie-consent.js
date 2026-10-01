/* ══════════════════════════════════════════
 *  cookie-consent.js — foidslop
 *  Loads Google Analytics with Consent Mode v2.
 *  Analytics cookies require the visitor to accept.
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

  function consentSettings(accepted) {
    return {
      analytics_storage: accepted ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    };
  }

  function loadAnalytics(accepted) {
    if (window.__foidslopGATagInitialized) return;
    window.__foidslopGATagInitialized = true;
    // Existing interaction trackers use this flag to require acceptance.
    window.__foidslopGALoaded = accepted;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    // Queue consent before configuration or loading Google's script.
    window.gtag('consent', 'default', consentSettings(accepted));
    window.gtag('set', 'ads_data_redaction', true);
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });

    var gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(gtagScript);

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
          'Allow cookies for basic analytics? Without them, Google receives limited cookieless measurements. No ads, nothing sold. ' +
          '<a href="/privacy#analytics">Read more about our privacy policy</a>' +
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
      var accepted = consentValue === 'accepted';
      window.__foidslopGALoaded = accepted;
      window.gtag('consent', 'update', consentSettings(accepted));
      banner.classList.remove('visible');
      banner.addEventListener('transitionend', function handler() {
        banner.removeEventListener('transitionend', handler);
        banner.remove();
      });
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
    loadAnalytics(consent === 'accepted');
    if (consent !== 'accepted' && consent !== 'declined') {
      // No choice made yet — show the banner
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showBanner);
      } else {
        showBanner();
      }
    }
    // Unknown and declined choices keep analytics storage denied.
  }

  init();
})();
