const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  applyRecipeSwap,
  buildDispatchEmail,
  buildKitBroadcastBody,
  communityUrl,
  localInstant,
  mutateTallyForm,
  pollWindow,
  resolveVotes,
  selectPoll,
  validateQueue
} = require('../scripts/weekly-community');
const { chronological } = require('../scripts/lib/publication-order');

const ROOT = path.resolve(__dirname, '..');
const queue = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'weekly-polls.json'), 'utf8'));
const homepage = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'homepage.json'), 'utf8'));
const mealsDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'foidslop-meals.json'), 'utf8'));
const poll = structuredClone(queue.polls[0]);

test('the real twelve-week queue is internally valid', () => {
  assert.deepEqual(validateQueue(queue, mealsDb), { total: 12, remaining: 12 });
});

test('New York local instants handle daylight and standard time', () => {
  assert.equal(localInstant('2026-07-23', '18:00').toISOString(), '2026-07-23T22:00:00.000Z');
  assert.equal(localInstant('2026-12-03', '18:00').toISOString(), '2026-12-03T23:00:00.000Z');
});

test('poll windows open Sunday and close Thursday', () => {
  const window = pollWindow(poll, queue);
  assert.equal(window.opensDate, '2026-07-19');
  assert.equal(window.closesDate, '2026-07-23');
  assert.equal(window.dispatchAt.toISOString(), '2026-07-19T14:00:00.000Z');
  assert.equal(selectPoll(queue, { date: '2026-07-19' }, 'open').id, poll.id);
  assert.equal(selectPoll(queue, { date: '2026-07-23' }, 'resolve').id, poll.id);
});

test('community links carry the poll id without losing existing parameters', () => {
  assert.equal(
    communityUrl('https://tally.so/r/EkE4QX?source=home', poll.id),
    'https://tally.so/r/EkE4QX?source=home&poll_id=2026-07-24'
  );
});

function tallyFixture() {
  const existingLabels = ['15-minute pasta', 'Something on toast', 'A no-cook plate'];
  return {
    name: 'The Table',
    settings: {
      styles: '{"background":"#08090b"}',
      redirectOnCompletion: 'https://example.com/old-redirect'
    },
    blocks: [
      { uuid: 'title', groupUuid: 'title', type: 'FORM_TITLE', payload: { title: 'The Table' } },
      { uuid: 'poll-label', groupUuid: 'poll-label', groupType: 'QUESTION', type: 'LABEL', payload: { html: "<p>Pick Friday's dinner</p>" } },
      ...existingLabels.map((label, index) => ({
        slot: String.fromCharCode(65 + index),
        label
      })).map((choice, index) => ({
        uuid: `option-${choice.slot}`, groupUuid: 'poll', groupType: 'MULTIPLE_CHOICE',
        type: 'MULTIPLE_CHOICE_OPTION',
        payload: { index, text: choice.label, isRequired: true }
      })),
      { uuid: 'deadline', groupUuid: 'deadline', type: 'TEXT', payload: { html: "<p>The most popular choice becomes Friday's recipe. Voting closes Thursday.</p>" } },
      { uuid: 'evidence', groupUuid: 'evidence', type: 'TEXTAREA', payload: { title: 'What did you make, and how did it go?' } },
      { uuid: 'submit', groupUuid: 'submit', type: 'FORM_BUTTON', payload: { text: 'Submit' } }
    ]
  };
}

test('Tally mutation preserves evidence and design while adding poll state', () => {
  const original = tallyFixture();
  const result = mutateTallyForm(original, queue.polls[1], queue, homepage, 'open');
  assert.equal(original.blocks.some(block => block.type === 'HIDDEN_FIELDS'), false);
  assert.equal(result.form.settings.styles, original.settings.styles);
  assert.deepEqual(result.form.settings.redirectOnCompletion, {
    html: 'https://foidslop.com/#table',
    mentions: []
  });
  assert.ok(result.form.blocks.some(block => block.uuid === 'evidence'));
  assert.ok(result.form.blocks.some(block => block.type === 'HIDDEN_FIELDS'
    && block.payload.hiddenFields.some(field => field.name === 'poll_id')));
  const choices = result.form.blocks.filter(block => block.type === 'MULTIPLE_CHOICE_OPTION');
  assert.deepEqual(choices.map(block => block.payload.text), queue.polls[1].choices.map(choice => choice.label));
  assert.ok(result.form.blocks.find(block => block.uuid === 'deadline').payload.html.includes('July 30'));

  const closedPoll = structuredClone(queue.polls[0]);
  closedPoll.winnerSlot = 'A';
  const closed = mutateTallyForm(tallyFixture(), closedPoll, queue, homepage, 'closed');
  assert.match(closed.form.blocks.find(block => block.uuid === 'poll-label').payload.html, /Voting is closed/);
});

function submission(id, respondentId, answer, submittedAt, pollId = poll.id) {
  return {
    id,
    submittedAt,
    responses: [
      { questionId: 'poll-id', answer: pollId, respondentId },
      { questionId: 'choice', answer, respondentId }
    ]
  };
}

function responseFixture(submissions) {
  return {
    questions: [
      { id: 'poll-id', title: 'poll_id', fields: [] },
      {
        id: 'choice',
        title: "Pick Friday's dinner",
        fields: poll.choices.map(choice => ({ uuid: `option-${choice.slot}`, title: choice.label }))
      }
    ],
    submissions
  };
}

test('vote resolution keeps the latest vote per respondent and ignores other polls', () => {
  const result = resolveVotes(responseFixture([
    submission('one', 'reader-one', 'option-A', '2026-07-20T10:00:00Z'),
    submission('two', 'reader-one', 'option-B', '2026-07-21T10:00:00Z'),
    submission('three', 'reader-two', poll.choices[1].label, '2026-07-21T11:00:00Z'),
    submission('other-poll', 'reader-three', 'option-C', '2026-07-21T12:00:00Z', '2026-07-31')
  ]), poll);
  assert.deepEqual(result.counts, { A: 0, B: 2, C: 0 });
  assert.equal(result.winner.slot, 'B');
  assert.equal(result.total, 2);
});

test('a tied poll has no winner', () => {
  const result = resolveVotes(responseFixture([
    submission('one', 'one', 'option-A', '2026-07-20T10:00:00Z'),
    submission('two', 'two', 'option-B', '2026-07-20T11:00:00Z')
  ]), poll);
  assert.equal(result.winner, null);
  assert.deepEqual(result.counts, { A: 1, B: 1, C: 0 });
});

test('recipe swap preserves one recipe per date and is idempotent', () => {
  const db = {
    meals: [
      { slug: 'scheduled-friday', publishDate: poll.targetFriday, status: 'scheduled' },
      { slug: poll.choices[0].recipeSlug, publishDate: '2026-10-10', status: 'scheduled' }
    ]
  };
  const state = structuredClone(poll);
  const first = applyRecipeSwap(db, state, poll.choices[0]);
  assert.deepEqual(first, {
    winner: poll.choices[0].recipeSlug,
    movedTo: poll.targetFriday,
    displaced: 'scheduled-friday',
    movedToDate: '2026-10-10'
  });
  assert.deepEqual(db.meals.map(meal => meal.publishDate).sort(), [poll.targetFriday, '2026-10-10'].sort());
  assert.equal(applyRecipeSwap(db, state, poll.choices[0]).alreadyApplied, true);
});

test('a moved high-id winner does not remain today after its Friday', () => {
  const meals = [
    { id: 84, slug: 'normal-saturday', publishDate: '2026-07-25' },
    { id: 190, slug: 'poll-winner', publishDate: '2026-07-24' },
    { id: 83, slug: 'normal-friday', publishDate: '2026-10-10' }
  ].sort(chronological);
  assert.deepEqual(meals.map(meal => meal.slug), ['poll-winner', 'normal-saturday', 'normal-friday']);
});

test('weekly email is image-free, branded, and includes recipes and poll links', () => {
  const html = buildDispatchEmail(homepage, queue, mealsDb, poll);
  assert.ok(html.includes('#ef4a35'));
  assert.ok(html.includes("Pick Friday's dinner"));
  assert.ok(html.includes('poll_id=2026-07-24'));
  assert.ok(html.includes('https://foidslop.com/slop/'));
  assert.equal(/<img\b/i.test(html), false);
  assert.equal(/fonts\.googleapis/i.test(html), false);
});

test('Kit all-subscriber broadcasts omit unsupported recipient filters', () => {
  const body = buildKitBroadcastBody(
    homepage,
    '<p>Weekly dispatch</p>',
    'foidslop-weekly:2026-07-19',
    'The Weekly Slop - July 19',
    new Date('2026-07-19T14:00:00Z'),
    null
  );
  assert.equal(Object.hasOwn(body, 'subscriber_filter'), false);
  assert.equal(body.email_address, 'dispatch@foidslop.com');
  assert.equal(body.public, false);
  assert.equal(body.send_at, null);
});

test('queue exhaustion still produces a dispatch without a stale vote', () => {
  const html = buildDispatchEmail(homepage, queue, mealsDb, null, '2026-10-11');
  assert.ok(html.includes('No vote this week'));
  assert.equal(html.includes('poll_id='), false);
  assert.equal(html.includes('VOTE BY THURSDAY'), false);
});
