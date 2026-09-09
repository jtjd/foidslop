const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

test('editorial desk validates checked-in story packets', () => {
  const output = execFileSync(process.execPath, ['scripts/editorial-desk.js', 'check'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  assert.match(output, /Editorial desk OK:/);
});

test('editorial desk lists the seeded Lindsay Clancy candidate', () => {
  const output = execFileSync(process.execPath, ['scripts/editorial-desk.js', 'list'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  assert.match(output, /candidate\s+9\.1\s+lindsay-clancy-case/);
});
