(function () {
  const CONSENT_KEY = 'gbl-analytics-consent';
  const GA_ID = 'G-5G6RGJ3BQW';
  const cookieHref = location.pathname.endsWith('terms.html') ? '#cookies' : 'terms.html#cookies';

  function loadAnalytics() {
    if (window.gblAnalyticsLoaded) return;
    window.gblAnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);
  }

  function getConsent() {
    try { return window.localStorage.getItem(CONSENT_KEY); } catch { return null; }
  }

  function setConsent(value) {
    try { window.localStorage.setItem(CONSENT_KEY, value); } catch { /* storage unavailable */ }
  }

  function dismiss(banner) {
    banner.classList.remove('is-visible');
    window.setTimeout(() => banner.remove(), 350);
  }

  function showBanner() {
    if (document.querySelector('.cookie-banner')) return;
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = `
      <p class="cookie-banner-text">We use Google Analytics to understand how visitors use this site. <a href="${cookieHref}">Read the cookie notice</a>.</p>
      <div class="cookie-banner-actions">
        <button type="button" class="button button-small instagram-button">Decline</button>
        <button type="button" class="button button-small">Accept</button>
      </div>`;
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('is-visible'));

    const [declineBtn, acceptBtn] = banner.querySelectorAll('button');
    acceptBtn.addEventListener('click', () => {
      setConsent('accepted');
      loadAnalytics();
      dismiss(banner);
    });
    declineBtn.addEventListener('click', () => {
      setConsent('declined');
      dismiss(banner);
    });
  }

  function addPreferencesLink() {
    document.querySelectorAll('.footer-links').forEach((list) => {
      if (list.querySelector('.cookie-preferences-link')) return;
      const link = document.createElement('a');
      link.href = '#';
      link.className = 'cookie-preferences-link';
      link.textContent = 'Cookie preferences';
      link.addEventListener('click', (event) => {
        event.preventDefault();
        showBanner();
      });
      list.appendChild(link);
    });
  }

  const consent = getConsent();
  if (consent === 'accepted') {
    loadAnalytics();
  } else if (consent !== 'declined') {
    showBanner();
  }
  addPreferencesLink();
})();
