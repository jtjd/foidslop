const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/cookie-consent.js'), 'utf8');

function visit(choice, storageBlocked = false) {
  const clicks = {};
  const scripts = [];
  const banners = [];
  const window = {};
  const banner = {
    setAttribute() {},
    classList: { add() {}, remove() {} },
    querySelector: selector => ({ addEventListener: (event, handler) => { clicks[selector] = handler; } }),
    addEventListener() {}
  };
  const context = vm.createContext({
    window,
    localStorage: {
      getItem() { if (storageBlocked) throw new Error('Storage blocked'); return choice; },
      setItem(key, value) { if (storageBlocked) throw new Error('Storage blocked'); choice = value; }
    },
    requestAnimationFrame: callback => callback(),
    document: {
      currentScript: { getAttribute: () => 'G-VT527DETQ2' },
      readyState: 'complete',
      createElement: tag => tag === 'script' ? {} : banner,
      head: { appendChild(script) {
        // Consent must already be queued when the remote script can execute.
        assert.equal(window.dataLayer[0][0], 'consent');
        scripts.push(script);
      } },
      body: { appendChild: element => banners.push(element) }
    }
  });
  vm.runInContext(source, context);
  return { window, scripts, banners, clicks, context, choice: () => choice,
    commands: () => JSON.parse(JSON.stringify(window.dataLayer.map(command => Array.from(command)))) };
}

for (const choice of [null, 'declined', 'accepted']) {
  test(`initial visit with ${choice || 'no'} consent initializes the correct tag and storage state`, () => {
    const page = visit(choice);
    assert.equal(page.scripts.length, 1);
    assert.equal(page.scripts[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-VT527DETQ2');
    assert.equal(page.scripts[0].async, true);
    const commands = page.commands();
    assert.deepEqual(commands[0], ['consent', 'default', {
      analytics_storage: choice === 'accepted' ? 'granted' : 'denied',
      ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
    }]);
    const config = commands.find(command => command[0] === 'config');
    assert.equal(config[1], 'G-VT527DETQ2');
    assert.equal(config[2].allow_google_signals, false);
    assert.equal(config[2].allow_ad_personalization_signals, false);
    assert.equal(page.window.__foidslopGALoaded, choice === 'accepted');
    assert.equal(page.banners.length, choice === null ? 1 : 0);
    vm.runInContext(source, page.context);
    assert.equal(page.scripts.length, 1);
    assert.equal(page.commands().filter(command => command[0] === 'config').length, 1);
  });
}

for (const accepted of [true, false]) {
  test(`clicking ${accepted ? 'Accept' : 'Decline'} updates consent without configuring a duplicate page view`, () => {
    const page = visit(null);
    page.clicks[`.cookie-consent-${accepted ? 'accept' : 'decline'}`]();
    assert.equal(page.choice(), accepted ? 'accepted' : 'declined');
    const update = page.commands().at(-1);
    assert.equal(update[0], 'consent');
    assert.equal(update[1], 'update');
    assert.equal(update[2].analytics_storage, accepted ? 'granted' : 'denied');
    assert.equal(update[2].ad_storage, 'denied');
    assert.equal(update[2].ad_user_data, 'denied');
    assert.equal(update[2].ad_personalization, 'denied');
    assert.equal(page.window.__foidslopGALoaded, accepted);
    assert.equal(page.scripts.length, 1);
    assert.equal(page.commands().filter(command => command[0] === 'config').length, 1);
  });
}

test('blocked local storage still defaults to denied and permits acceptance for the current page', () => {
  const page = visit(null, true);
  assert.equal(page.commands()[0][2].analytics_storage, 'denied');
  page.clicks['.cookie-consent-accept']();
  assert.equal(page.commands().at(-1)[2].analytics_storage, 'granted');
});
