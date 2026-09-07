#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const BASE = process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
const OUT = path.join(process.cwd(), 'navigation-audit-screens');
fs.mkdirSync(OUT, { recursive: true });

const routes = [
  { path: '/', active: null, name: 'home' },
  { path: '/slop/antipasto-skewers', active: 'Today', name: 'today' },
  { path: '/slop/archive', active: 'Archive', name: 'archive' },
  { path: '/culture', active: 'Culture', name: 'culture' },
  { path: '/culture/is-it-foidslop', active: 'Culture', name: 'trial' },
  { path: '/dictionary', active: 'Dictionary', name: 'dictionary' },
  { path: '/what-is-foidslop', active: 'Dictionary', name: 'definition' },
  { path: '/about', active: null, name: 'about' },
  { path: '/privacy', active: null, name: 'privacy' },
  { path: '/not-a-real-page', active: null, name: '404', expectedStatus: 404 }
];
const viewports = [
  { width: 1440, height: 900, label: 'desktop' },
  { width: 1120, height: 900, label: 'laptop' },
  { width: 390, height: 844, label: 'mobile' }
];
const expectedLinks = ['Today', 'Archive', 'Culture', 'Dictionary', 'Dispatch'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
  const report = [];
  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      for (const route of routes) {
        const response = await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle' });
        const status = response ? response.status() : 0;
        assert(status === (route.expectedStatus || 200), `${route.path} @ ${viewport.label}: unexpected status ${status}`);
        const result = await page.evaluate(({ expectedLinks, mobile }) => {
          const header = document.querySelector('.site-header');
          const hamburger = document.querySelector('#nav-hamburger');
          const menu = document.querySelector('#nav-dropdown');
          const desktopLinks = [...document.querySelectorAll('.header-right .nav-link')];
          const rect = header?.getBoundingClientRect();
          return {
            hasHeader: !!header,
            headerLeft: rect?.left ?? null,
            headerRight: rect?.right ?? null,
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            hamburgerDisplay: hamburger ? getComputedStyle(hamburger).display : null,
            menuDisplay: menu ? getComputedStyle(menu).display : null,
            desktopVisible: desktopLinks.filter(link => getComputedStyle(link).display !== 'none').map(link => link.textContent.trim()),
            desktopLabels: desktopLinks.map(link => link.textContent.trim()),
            activeDesktop: desktopLinks.filter(link => link.classList.contains('active')).map(link => link.textContent.trim()),
            mobileLabels: [...document.querySelectorAll('#nav-dropdown .nav-dropdown-link')].map(link => link.textContent.trim()),
            mobile
          };
        }, { expectedLinks, mobile: viewport.width <= 1024 });

        assert(result.hasHeader, `${route.path} @ ${viewport.label}: site header missing`);
        assert(result.scrollWidth <= result.innerWidth + 1, `${route.path} @ ${viewport.label}: horizontal overflow ${result.scrollWidth}/${result.innerWidth}`);
        assert(result.headerLeft >= -1 && result.headerRight <= result.innerWidth + 1, `${route.path} @ ${viewport.label}: header clipped`);
        assert(JSON.stringify(result.desktopLabels) === JSON.stringify(expectedLinks), `${route.path}: desktop link set drifted: ${result.desktopLabels.join(', ')}`);
        assert(JSON.stringify(result.mobileLabels) === JSON.stringify(expectedLinks), `${route.path}: mobile link set drifted: ${result.mobileLabels.join(', ')}`);
        assert(JSON.stringify(result.activeDesktop) === JSON.stringify(route.active ? [route.active] : []), `${route.path}: wrong active nav ${result.activeDesktop.join(', ')}`);

        if (viewport.width > 1024) {
          assert(result.hamburgerDisplay === 'none', `${route.path} @ ${viewport.label}: hamburger should be hidden`);
          assert(JSON.stringify(result.desktopVisible) === JSON.stringify(expectedLinks), `${route.path} @ ${viewport.label}: desktop links hidden: ${result.desktopVisible.join(', ')}`);
        } else {
          assert(result.hamburgerDisplay !== 'none', `${route.path} @ mobile: hamburger is hidden`);
          assert(result.desktopVisible.length === 0, `${route.path} @ mobile: desktop links still visible`);
          await page.click('#nav-hamburger');
          const open = await page.evaluate(() => {
            const button = document.querySelector('#nav-hamburger');
            const menu = document.querySelector('#nav-dropdown');
            const rect = menu.getBoundingClientRect();
            return {
              expanded: button.getAttribute('aria-expanded'),
              hidden: menu.getAttribute('aria-hidden'),
              open: menu.classList.contains('open'),
              display: getComputedStyle(menu).display,
              left: rect.left,
              right: rect.right,
              bottom: rect.bottom,
              width: window.innerWidth
            };
          });
          assert(open.expanded === 'true' && open.hidden === 'false' && open.open, `${route.path} @ mobile: hamburger did not open menu`);
          assert(open.display !== 'none', `${route.path} @ mobile: open menu not displayed`);
          assert(open.left >= -1 && open.right <= open.width + 1, `${route.path} @ mobile: menu clipped horizontally`);
          await page.keyboard.press('Escape');
          const closed = await page.getAttribute('#nav-hamburger', 'aria-expanded');
          assert(closed === 'false', `${route.path} @ mobile: Escape did not close menu`);
        }

        report.push({ route: route.path, viewport: viewport.label, status, active: route.active, ok: true });
        if ((viewport.label === 'laptop' || viewport.label === 'mobile') && ['home', 'culture', 'dictionary', '404'].includes(route.name)) {
          await page.screenshot({ path: path.join(OUT, `${route.name}-${viewport.label}.png`), fullPage: false });
        }
      }
      await page.close();
    }
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    console.log(`Browser navigation audit passed: ${report.length} route/viewport checks.`);
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
