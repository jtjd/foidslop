#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, '.deploy');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 4173);

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8'
};

function runBuild() {
  for (const script of ['scripts/seo-check.js', 'scripts/build-deploy.js']) {
    const result = spawnSync(process.execPath, [script], {
      cwd: ROOT,
      stdio: 'inherit'
    });
    if (result.status !== 0) process.exit(result.status || 1);
  }
}

function loadRedirects() {
  const redirectFile = path.join(PUBLIC, '_redirects');
  if (!fs.existsSync(redirectFile)) return new Map();

  return new Map(fs.readFileSync(redirectFile, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const [source, destination, status = '302'] = line.split(/\s+/);
      return [source, { destination, status: Number(status) }];
    }));
}

function publicFile(requestPath) {
  const relative = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const candidates = [
    relative,
    path.extname(relative) ? null : `${relative}.html`,
    path.extname(relative) ? null : path.join(relative, 'index.html')
  ].filter(Boolean);

  for (const candidate of candidates) {
    const absolute = path.resolve(PUBLIC, candidate);
    if (!absolute.startsWith(`${PUBLIC}${path.sep}`)) continue;
    if (fs.existsSync(absolute) && fs.statSync(absolute).isFile()) return absolute;
  }

  return null;
}

runBuild();
const redirects = loadRedirects();

const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method not allowed');
    return;
  }

  let requestPath;
  try {
    requestPath = decodeURIComponent(new URL(request.url, `http://${HOST}`).pathname);
  } catch {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }

  const redirect = redirects.get(requestPath);
  if (redirect) {
    response.writeHead(redirect.status, { Location: redirect.destination });
    response.end();
    return;
  }

  const file = publicFile(requestPath);
  const fallback = path.join(PUBLIC, '404.html');
  const body = file || fallback;
  const status = file ? 200 : 404;
  const headers = {
    'Cache-Control': 'no-store',
    'Content-Type': CONTENT_TYPES[path.extname(body).toLowerCase()] || 'application/octet-stream'
  };

  response.writeHead(status, headers);
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  fs.createReadStream(body).pipe(response);
});

server.listen(PORT, HOST, () => {
  console.log(`Previewing ${PUBLIC} at http://${HOST}:${PORT}`);
  console.log('Press Ctrl+C to stop.');
});
