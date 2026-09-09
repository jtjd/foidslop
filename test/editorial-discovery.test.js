const test = require('node:test');
const assert = require('node:assert');

const {
  parseFeedText,
  clusterSignals,
  scoreCluster,
  buildInboxFromSignals
} = require('../scripts/editorial-discover.js');

const config = {
  lookbackHours: 72,
  maxInboxItems: 20,
  minimumScore: 3,
  interestTerms: [
    { term: 'trial', weight: 1.5, tags: ['case'] },
    { term: 'mistrial', weight: 2, tags: ['case'] },
    { term: 'postpartum', weight: 1.8, tags: ['case', 'motherhood'] },
    { term: 'tiktok', weight: 1.4, tags: ['internet'] },
    { term: 'dating', weight: 1.6, tags: ['relationships'] }
  ],
  downrankTerms: [
    { term: 'football', weight: 1 }
  ]
};

test('parses Google News RSS without dependencies', () => {
  const xml = `<?xml version="1.0"?><rss><channel><item>
    <title><![CDATA[Lindsay Clancy mistrial draws new attention - Example News]]></title>
    <link>https://news.google.com/articles/abc</link>
    <pubDate>Wed, 09 Sep 2026 18:00:00 GMT</pubDate>
    <source url="https://example.com">Example News</source>
  </item></channel></rss>`;
  const items = parseFeedText(xml, { id: 'g', kind: 'google-news', label: 'Google News' });
  assert.equal(items.length, 1);
  assert.equal(items[0].publisher, 'Example News');
  assert.equal(items[0].title, 'Lindsay Clancy mistrial draws new attention');
  assert.equal(items[0].url, 'https://news.google.com/articles/abc');
});

test('clusters repeated coverage of the same named story', () => {
  const signals = [
    { title: 'Lindsay Clancy mistrial follows deadlocked jury', url: 'https://a.test/1', publisher: 'A', publishedAt: '2026-09-09T18:00:00.000Z', feedId: 'a', feedKind: 'google-news', feedLabel: 'A' },
    { title: 'Lindsay Clancy trial ends after jury deadlock', url: 'https://b.test/2', publisher: 'B', publishedAt: '2026-09-09T17:00:00.000Z', feedId: 'b', feedKind: 'google-news', feedLabel: 'B' },
    { title: 'Discussion: Lindsay Clancy mistrial and postpartum psychosis', url: 'https://reddit.com/3', publisher: 'Reddit', publishedAt: '2026-09-09T16:00:00.000Z', feedId: 'r', feedKind: 'reddit-search', feedLabel: 'Reddit' }
  ];
  const result = clusterSignals(signals);
  assert.equal(result.clusters.length, 1);
  assert.equal(result.clusters[0].signals.length, 3);
});

test('audience-relevant, fresh, multi-source stories score above unrelated noise', () => {
  const now = new Date('2026-09-09T20:00:00.000Z');
  const strong = {
    signals: [
      { title: 'Lindsay Clancy mistrial after trial over postpartum case', url: 'https://a.test/1', publisher: 'A', publishedAt: '2026-09-09T18:00:00.000Z', feedId: 'a', feedKind: 'google-news' },
      { title: 'Lindsay Clancy trial ends in mistrial', url: 'https://b.test/2', publisher: 'B', publishedAt: '2026-09-09T17:00:00.000Z', feedId: 'b', feedKind: 'google-news' }
    ]
  };
  const weak = {
    signals: [
      { title: 'Football schedule announced for weekend', url: 'https://c.test/3', publisher: 'C', publishedAt: '2026-09-09T18:00:00.000Z', feedId: 'c', feedKind: 'google-news' }
    ]
  };
  assert.ok(scoreCluster(strong, config, now).score > scoreCluster(weak, config, now).score);
});

test('builds a ranked mechanical inbox and labels it as non-AI discovery', () => {
  const now = new Date('2026-09-09T20:00:00.000Z');
  const signals = [
    { title: 'Viral TikTok dating trend sparks relationship debate', url: 'https://a.test/1', publisher: 'A', publishedAt: '2026-09-09T18:00:00.000Z', feedId: 'a', feedKind: 'google-news', feedLabel: 'A' },
    { title: 'TikTok dating trend discussion goes viral', url: 'https://b.test/2', publisher: 'B', publishedAt: '2026-09-09T17:00:00.000Z', feedId: 'b', feedKind: 'google-news', feedLabel: 'B' }
  ];
  const inbox = buildInboxFromSignals(signals, config, now, [{ id: 'a', ok: true, itemCount: 2 }]);
  assert.equal(inbox.candidateCount, 1);
  assert.match(inbox.note, /No AI API was used/);
  assert.ok(inbox.candidates[0].score >= config.minimumScore);
  assert.deepEqual(inbox.candidates[0].audienceTags.sort(), ['internet', 'relationships']);
});
