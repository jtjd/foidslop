#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const CONFIG_FILE = path.join(ROOT, 'data', 'editorial-discovery.json');
const INBOX_FILE = path.join(ROOT, 'data', 'editorial-inbox.json');
const USER_AGENT = 'foidslop-editorial-discovery/1.0 (+https://foidslop.com)';

const STOPWORDS = new Set(`a an and are as at be been but by for from had has have he her hers him his how i if in into is it its just more most new no not of on or our out over she so than that the their them there these they this to up was we were what when where which who why will with would you your after amid among about says say said report reports reporting live latest update updates breaking news today yesterday tomorrow case court judge jury juror trial lawsuit viral trend controversy discourse`.split(/\s+/));
const TOKEN_ALIASES = new Map([
  ['mistrial', 'trial'], ['trials', 'trial'], ['jurors', 'jury'], ['juror', 'jury'],
  ['lawsuits', 'lawsuit'], ['suing', 'lawsuit'], ['sued', 'lawsuit'], ['memes', 'meme'],
  ['influencers', 'influencer'], ['relationships', 'relationship'], ['mothers', 'mother']
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJsonAtomic(file, value) {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temp, file);
}

function decodeXml(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function plainText(value) {
  return decodeXml(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function tagValue(block, names) {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
    if (match) return plainText(match[1]);
  }
  return '';
}

function atomLink(block) {
  const alternate = block.match(/<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  if (alternate) return decodeXml(alternate[1]);
  const any = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/i);
  return any ? decodeXml(any[1]) : '';
}

function validDate(value) {
  const date = new Date(value || '');
  return Number.isFinite(date.getTime()) ? date : null;
}

function cleanGoogleTitle(title, publisher) {
  if (!publisher) return title;
  const suffix = ` - ${publisher}`;
  return title.endsWith(suffix) ? title.slice(0, -suffix.length).trim() : title;
}

function parseFeedText(xml, feed) {
  const isRss = /<item\b/i.test(xml);
  const blocks = isRss
    ? (xml.match(/<item\b[\s\S]*?<\/item>/gi) || [])
    : (xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || []);

  return blocks.map(block => {
    const publisher = feed.kind === 'google-news'
      ? tagValue(block, ['source'])
      : feed.kind === 'reddit-search' ? 'Reddit' : (tagValue(block, ['source', 'name']) || feed.label);
    let title = tagValue(block, ['title']);
    if (feed.kind === 'google-news') title = cleanGoogleTitle(title, publisher);
    const rssLink = tagValue(block, ['link']);
    const link = rssLink || atomLink(block);
    const published = tagValue(block, ['pubDate', 'published', 'updated']);
    const date = validDate(published);
    if (!title || !link || !date) return null;
    return {
      title,
      url: link,
      publisher: publisher || feed.label,
      publishedAt: date.toISOString(),
      feedId: feed.id,
      feedKind: feed.kind,
      feedLabel: feed.label
    };
  }).filter(Boolean);
}

function feedUrl(feed) {
  if (feed.kind === 'google-news') {
    return `https://news.google.com/rss/search?q=${encodeURIComponent(feed.query)}&hl=en-US&gl=US&ceid=US:en`;
  }
  if (feed.kind === 'reddit-search') {
    return `https://www.reddit.com/search.rss?q=${encodeURIComponent(feed.query)}&sort=new&t=week`;
  }
  if (feed.kind === 'rss' && /^https:\/\//.test(feed.url || '')) return feed.url;
  throw new Error(`Unsupported feed ${feed.id}: ${feed.kind}`);
}

async function fetchText(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': USER_AGENT, accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
      redirect: 'follow'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function normalizeText(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function tokensFor(value) {
  const tokens = normalizeText(value).split(/\s+/).filter(token => token.length >= 3 && !STOPWORDS.has(token));
  return [...new Set(tokens.map(token => TOKEN_ALIASES.get(token) || token))];
}

function termRegex(term) {
  const escaped = normalizeText(term).split(/\s+/).filter(Boolean).map(piece => piece.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
  return new RegExp(`(?:^|\\b)${escaped}(?:\\b|$)`, 'i');
}

function matchingTerms(text, entries) {
  return (entries || []).filter(entry => termRegex(entry.term).test(normalizeText(text)));
}

function dedupeSignals(signals) {
  const seenUrls = new Set();
  const seenTitles = new Set();
  const output = [];
  for (const signal of signals.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))) {
    const titleKey = normalizeText(signal.title);
    if (seenUrls.has(signal.url) || seenTitles.has(titleKey)) continue;
    seenUrls.add(signal.url);
    seenTitles.add(titleKey);
    output.push(signal);
  }
  return output;
}

function documentFrequency(signals) {
  const counts = new Map();
  for (const signal of signals) {
    for (const token of tokensFor(signal.title)) counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
}

function tokenWeight(token, df, total) {
  return 1 + Math.log((total + 1) / ((df.get(token) || 0) + 1));
}

function titleSimilarity(a, b, df, total) {
  const aa = new Set(a);
  const bb = new Set(b);
  const shared = [...aa].filter(token => bb.has(token));
  if (shared.length < 2) return { shared: shared.length, score: 0 };
  const sharedWeight = shared.reduce((sum, token) => sum + tokenWeight(token, df, total), 0);
  const weightA = [...aa].reduce((sum, token) => sum + tokenWeight(token, df, total), 0);
  const weightB = [...bb].reduce((sum, token) => sum + tokenWeight(token, df, total), 0);
  return { shared: shared.length, score: sharedWeight / Math.max(1, Math.min(weightA, weightB)) };
}

function clusterSignals(signals) {
  const df = documentFrequency(signals);
  const total = Math.max(1, signals.length);
  const clusters = [];

  for (const signal of signals.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))) {
    const tokens = tokensFor(signal.title);
    let best = null;
    for (const cluster of clusters) {
      const match = titleSimilarity(tokens, cluster.anchorTokens, df, total);
      const qualifies = (match.shared >= 2 && match.score >= 0.5) || (match.shared >= 3 && match.score >= 0.36);
      if (qualifies && (!best || match.score > best.score)) best = { cluster, score: match.score };
    }
    if (best) {
      best.cluster.signals.push(signal);
      const union = new Set([...best.cluster.anchorTokens, ...tokens]);
      best.cluster.anchorTokens = [...union];
    } else {
      clusters.push({ signals: [signal], anchorTokens: tokens });
    }
  }
  return { clusters, df, total };
}

function sourceKey(signal) {
  if (signal.feedKind === 'reddit-search') return 'reddit.com';
  return normalizeText(signal.publisher) || (() => {
    try { return new URL(signal.url).hostname; } catch { return signal.feedId; }
  })();
}

function representativeSignal(cluster, config) {
  return [...cluster.signals].sort((a, b) => {
    const aw = matchingTerms(a.title, config.interestTerms).reduce((sum, item) => sum + Number(item.weight || 0), 0);
    const bw = matchingTerms(b.title, config.interestTerms).reduce((sum, item) => sum + Number(item.weight || 0), 0);
    if (bw !== aw) return bw - aw;
    if (a.feedKind !== b.feedKind) return a.feedKind === 'google-news' ? -1 : 1;
    return a.title.length - b.title.length;
  })[0];
}

function scoreCluster(cluster, config, now = new Date()) {
  const allText = cluster.signals.map(signal => signal.title).join(' | ');
  const matched = matchingTerms(allText, config.interestTerms);
  const downranked = matchingTerms(allText, config.downrankTerms);
  const matchedWeight = matched.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  const penalty = downranked.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  const sourceCount = new Set(cluster.signals.map(sourceKey)).size;
  const feedKinds = new Set(cluster.signals.map(signal => signal.feedKind));
  const newest = new Date(Math.max(...cluster.signals.map(signal => new Date(signal.publishedAt).getTime())));
  const ageHours = Math.max(0, (now.getTime() - newest.getTime()) / 3600000);

  const audience = Math.min(4.5, matchedWeight * 0.75);
  const diversity = Math.min(2, Math.log2(sourceCount + 1));
  const repetition = Math.min(1.4, Math.max(0, cluster.signals.length - 1) * 0.3);
  const recency = ageHours <= 6 ? 1.5 : ageHours <= 24 ? 1.2 : ageHours <= 48 ? 0.7 : 0.3;
  const mixedDiscourse = feedKinds.has('reddit-search') && feedKinds.has('google-news') ? 0.5 : 0;
  const feedDiversity = Math.min(0.5, Math.max(0, new Set(cluster.signals.map(signal => signal.feedId)).size - 1) * 0.15);
  const score = Math.max(0, Math.min(10, 0.5 + audience + diversity + repetition + recency + mixedDiscourse + feedDiversity - penalty));

  const tags = [...new Set(matched.flatMap(item => item.tags || []))];
  return { score: Number(score.toFixed(2)), matched, downranked, sourceCount, ageHours, tags };
}

function stableStoryKey(cluster, df, total) {
  const weighted = [...new Set(cluster.signals.flatMap(signal => tokensFor(signal.title)))]
    .map(token => ({ token, weight: tokenWeight(token, df, total) }))
    .sort((a, b) => b.weight - a.weight || a.token.localeCompare(b.token))
    .slice(0, 6).map(item => item.token).sort();
  const raw = weighted.join('|') || normalizeText(cluster.signals[0].title);
  return crypto.createHash('sha1').update(raw).digest('hex').slice(0, 12);
}

function reasonLines(cluster, scored) {
  const reasons = [];
  if (scored.matched.length) reasons.push(`Audience terms: ${scored.matched.map(item => item.term).join(', ')}.`);
  if (scored.sourceCount > 1) reasons.push(`${scored.sourceCount} independent source labels are carrying the story.`);
  if (cluster.signals.length > 2) reasons.push(`${cluster.signals.length} fresh signals were clustered into the same topic.`);
  if (scored.ageHours <= 24) reasons.push('The newest signal is less than 24 hours old.');
  const kinds = new Set(cluster.signals.map(signal => signal.feedKind));
  if (kinds.has('reddit-search') && kinds.has('google-news')) reasons.push('The topic appears in both reporting and Reddit discussion.');
  return reasons;
}

function buildInboxFromSignals(rawSignals, config, now = new Date(), feedStatus = []) {
  const cutoff = now.getTime() - Number(config.lookbackHours || 72) * 3600000;
  const signals = dedupeSignals(rawSignals).filter(signal => new Date(signal.publishedAt).getTime() >= cutoff);
  const { clusters, df, total } = clusterSignals(signals);
  const items = clusters.map(cluster => {
    const scored = scoreCluster(cluster, config, now);
    const representative = representativeSignal(cluster, config);
    const sortedSignals = [...cluster.signals].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    return {
      id: `discovery-${stableStoryKey(cluster, df, total)}`,
      topic: representative.title,
      score: scored.score,
      audienceTags: scored.tags,
      matchedTerms: scored.matched.map(item => item.term),
      signalCount: cluster.signals.length,
      sourceCount: scored.sourceCount,
      firstSeenAt: sortedSignals.at(-1).publishedAt,
      lastSeenAt: sortedSignals[0].publishedAt,
      reasons: reasonLines(cluster, scored),
      signals: sortedSignals.slice(0, 12)
    };
  }).filter(item => item.score >= Number(config.minimumScore || 0))
    .sort((a, b) => b.score - a.score || b.lastSeenAt.localeCompare(a.lastSeenAt))
    .slice(0, Number(config.maxInboxItems || 30));

  return {
    generatedAt: now.toISOString(),
    lookbackHours: Number(config.lookbackHours || 72),
    signalCount: signals.length,
    candidateCount: items.length,
    note: 'Mechanical discovery only. No AI API was used. Candidates are not researched, fact-checked, or approved for publication.',
    feedStatus,
    candidates: items
  };
}

async function collect(config) {
  const signals = [];
  const feedStatus = [];
  for (const feed of config.feeds || []) {
    const url = feedUrl(feed);
    try {
      const xml = await fetchText(url);
      const parsed = parseFeedText(xml, feed).slice(0, Number(config.maxSignalsPerFeed || 40));
      signals.push(...parsed);
      feedStatus.push({ id: feed.id, ok: true, itemCount: parsed.length });
      console.log(`OK ${feed.id}: ${parsed.length} item(s)`);
    } catch (error) {
      feedStatus.push({ id: feed.id, ok: false, error: String(error.message || error) });
      console.warn(`WARN ${feed.id}: ${error.message || error}`);
    }
  }
  return { signals, feedStatus };
}

async function main() {
  const config = readJson(CONFIG_FILE);
  const { signals, feedStatus } = await collect(config);
  const successful = feedStatus.filter(feed => feed.ok).length;
  if (successful < Number(config.minimumSuccessfulFeeds || 1)) {
    throw new Error(`Only ${successful} feed(s) succeeded; refusing to replace the existing inbox.`);
  }
  if (!signals.length) throw new Error('No feed signals were collected; refusing to replace the existing inbox.');

  const inbox = buildInboxFromSignals(signals, config, new Date(), feedStatus);
  writeJsonAtomic(INBOX_FILE, inbox);
  console.log(`Editorial inbox refreshed: ${inbox.signalCount} signal(s), ${inbox.candidateCount} candidate(s).`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(`Editorial discovery failed: ${error.stack || error.message || error}`);
    process.exitCode = 1;
  });
}

module.exports = { parseFeedText, tokensFor, clusterSignals, scoreCluster, buildInboxFromSignals };
