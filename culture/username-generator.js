(() => {
  const root = document.querySelector('[data-username-generator]');
  const dataNode = document.getElementById('username-generator-data');
  if (!root || !dataNode) return;
  const config = JSON.parse(dataNode.textContent || '{}');
  const output = root.querySelector('[data-username-output]');
  const deptLabel = root.querySelector('[data-username-department-label]');
  const generate = root.querySelector('[data-username-generate]');
  const copy = root.querySelector('[data-username-copy]');
  const tabs = [...root.querySelectorAll('[data-username-tab]')];
  const variants = [...root.querySelectorAll('[data-username-variant]')];
  let active = 'mixed';

  const random = () => {
    if (globalThis.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      crypto.getRandomValues(value);
      return value[0] / 4294967296;
    }
    return Math.random();
  };
  const pick = items => items[Math.floor(random() * items.length)];
  const realKeys = () => Object.keys(config.categories || {});

  function make(categoryKey) {
    const category = config.categories[categoryKey] || config.categories.soft;
    const base = pick(category.bases);
    const modifier = pick(category.modifiers);
    const suffix = pick(category.suffixes);
    if (categoryKey === '2009') {
      return pick([`xX${base}Xx`, `${modifier}${base}${suffix}`, `${base}${suffix}`, `x_${base}_${suffix}`]).replace(/\s+/g, '').toLowerCase();
    }
    return pick([`${modifier}${base}`, `${base}${suffix}`, `${modifier}${base}${random() > .72 ? suffix : ''}`, base]).replace(/\s+/g, '').toLowerCase();
  }

  function categoryForRoll() { return active === 'mixed' ? pick(realKeys()) : active; }
  function size(value) {
    output.dataset.length = value.length > 24 ? 'very-long' : value.length > 18 ? 'long' : 'normal';
  }
  function show(value, key) {
    output.textContent = value;
    output.dataset.value = value;
    size(value);
    const label = config.categories[key]?.label || 'Mixed';
    deptLabel.textContent = `${label} department`;
    copy.textContent = 'Copy handle';
  }
  function makeUnique(count, exclude = new Set()) {
    const values = [];
    let attempts = 0;
    while (values.length < count && attempts < 40) {
      const key = categoryForRoll();
      const value = make(key);
      attempts += 1;
      if (exclude.has(value) || values.some(item => item.value === value)) continue;
      values.push({ value, key });
    }
    return values;
  }
  function reroll() {
    const key = categoryForRoll();
    const value = make(key);
    show(value, key);
    const alts = makeUnique(variants.length, new Set([value]));
    variants.forEach((button, index) => {
      const item = alts[index] || { value: make(categoryForRoll()), key: categoryForRoll() };
      button.textContent = `@${item.value}`;
      button.dataset.value = item.value;
      button.dataset.category = item.key;
    });
  }

  tabs.forEach(tab => tab.addEventListener('click', () => {
    active = tab.dataset.usernameTab || 'mixed';
    tabs.forEach(item => item.setAttribute('aria-pressed', String(item === tab)));
    reroll();
  }));
  variants.forEach(button => button.addEventListener('click', () => show(button.dataset.value || '', button.dataset.category || categoryForRoll())));
  generate.addEventListener('click', reroll);
  copy.addEventListener('click', async () => {
    const value = output.dataset.value || output.textContent;
    try {
      await navigator.clipboard.writeText(value);
      copy.textContent = 'Copied';
      setTimeout(() => { copy.textContent = 'Copy handle'; }, 1200);
    } catch {
      copy.textContent = 'Select it';
      const selection = getSelection();
      selection?.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(output);
      selection?.addRange(range);
    }
  });
  reroll();
})();
