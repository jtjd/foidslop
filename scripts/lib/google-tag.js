const MEASUREMENT_ID = 'G-VT527DETQ2';

// Keep the loader in the HTML so installation checks can discover it without
// executing the consent banner. Consent is queued synchronously before loading.
function googleTagSnippet() {
  return `<!-- google-tag:start -->
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
(function () {
  var accepted = false;
  try { accepted = localStorage.getItem('foidslop_consent') === 'accepted'; } catch (e) {}
  window.__foidslopGATagInitialized = true;
  window.__foidslopGALoaded = accepted;
  gtag('consent', 'default', {
    analytics_storage: accepted ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
})();
gtag('set', 'ads_data_redaction', true);
gtag('js', new Date());
gtag('config', '${MEASUREMENT_ID}', {
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});
</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}"></script>
<!-- google-tag:end -->`;
}

function syncGoogleTag(html) {
  // Remove the managed block before inserting the current version.
  const cleaned = html.replace(/<!-- google-tag:start -->[\s\S]*?<!-- google-tag:end -->\s*/g, '');
  if (!cleaned.includes('cookie-consent.js')) return cleaned;
  return cleaned.replace(/<head>/i, `<head>\n${googleTagSnippet()}`);
}

module.exports = { MEASUREMENT_ID, googleTagSnippet, syncGoogleTag };
