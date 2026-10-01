#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { syncGoogleTag } = require('./lib/google-tag');

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
let changed = 0;

function sync(directory, recursive) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory() && recursive) sync(file, true);
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const html = fs.readFileSync(file, 'utf8');
    const updated = syncGoogleTag(html);
    if (html === updated) continue;
    changed++;
    if (checkOnly) console.error(`Google tag needs synchronization: ${path.relative(root, file)}`);
    else fs.writeFileSync(file, updated);
  }
}

sync(root, false);
for (const directory of ['slop', 'culture', 'dictionary', 'recipes']) sync(path.join(root, directory), true);
if (checkOnly && changed) process.exitCode = 1;
else console.log(checkOnly ? 'Google tag snippets are current.' : `Synchronized Google tag on ${changed} pages.`);
