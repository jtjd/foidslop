#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const QUEUE_FILE = path.join(ROOT, 'data', 'weekly-polls.json');
const HOMEPAGE_FILE = path.join(ROOT, 'data', 'homepage.json');
const MEALS_FILE = path.join(ROOT, 'data', 'foidslop-meals.json');
const DEFAULT_TIMEZONE = 'America/New_York';
const TALLY_API = 'https://api.tally.so';
const KIT_API = 'https://api.kit.com/v4';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function parseArgs(argv) {
  const args = { command: argv[2] || 'queue-check', dryRun: false, json: false, send: false };
  for (let index = 3; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--date') args.date = argv[++index];
    else if (value === '--poll') args.pollId = argv[++index];
    else if (value === '--operation') args.operation = argv[++index];
    else if (value === '--snapshot') args.snapshot = argv[++index];
    else if (value === '--dry-run') args.dryRun = true;
    else if (value === '--json') args.json = true;
    else if (value === '--send') args.send = true;
    else throw new Error(`Unknown argument: ${value}`);
  }
  if (args.command === 'dry-run') {
    args.command = args.operation || 'queue-check';
    args.dryRun = true;
  }
  return args;
}

function dateInZone(now = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now).reduce((out, part) => {
    out[part.type] = part.value;
    return out;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDays(dateString, amount) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function localInstant(dateString, timeString, timeZone = DEFAULT_TIMEZONE) {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute] = timeString.split(':').map(Number);
  let instant = new Date(Date.UTC(year, month - 1, day, hour, minute));
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(instant).reduce((out, part) => {
      out[part.type] = part.value;
      return out;
    }, {});
    const represented = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour), Number(parts.minute)
    );
    const wanted = Date.UTC(year, month - 1, day, hour, minute);
    instant = new Date(instant.getTime() + wanted - represented);
  }
  return instant;
}

function pollWindow(poll, queue) {
  const timeZone = queue.timezone || DEFAULT_TIMEZONE;
  const opensDate = addDays(poll.targetFriday, -5);
  const closesDate = addDays(poll.targetFriday, -1);
  return {
    opensDate,
    closesDate,
    opensAt: localInstant(opensDate, queue.opensLocalTime || '07:00', timeZone),
    closesAt: localInstant(closesDate, queue.closesLocalTime || '18:00', timeZone),
    dispatchAt: localInstant(opensDate, queue.dispatchLocalTime || '10:00', timeZone)
  };
}

function prettyDate(dateString, options = {}) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC', month: 'long', day: 'numeric', ...options
  }).format(new Date(`${dateString}T12:00:00Z`));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

function blockStrings(value, output = []) {
  if (typeof value === 'string') output.push(stripHtml(value));
  else if (Array.isArray(value)) value.forEach(item => blockStrings(item, output));
  else if (value && typeof value === 'object') Object.values(value).forEach(item => blockStrings(item, output));
  return output.filter(Boolean);
}

function replaceBlockText(block, matcher, replacement) {
  const payload = block.payload || {};
  for (const key of ['html', 'text', 'name', 'title']) {
    if (typeof payload[key] !== 'string' || !matcher.test(stripHtml(payload[key]))) continue;
    payload[key] = /<[^>]+>/.test(payload[key]) ? `<p>${escapeHtml(replacement)}</p>` : replacement;
    return true;
  }
  return false;
}

function optionLabel(block) {
  const payload = block.payload || {};
  return stripHtml(payload.text || payload.name || payload.title || payload.html || '');
}

function setOptionLabel(block, label) {
  const payload = block.payload || (block.payload = {});
  const keys = ['text', 'name', 'title', 'html'].filter(key => typeof payload[key] === 'string');
  if (!keys.length) payload.text = label;
  for (const key of keys) payload[key] = key === 'html' ? `<p>${escapeHtml(label)}</p>` : label;
}

function findPollOptionBlocks(form, queue, homepage) {
  const groups = new Map();
  for (const block of form.blocks || []) {
    if (block.type !== 'MULTIPLE_CHOICE_OPTION') continue;
    if (!groups.has(block.groupUuid)) groups.set(block.groupUuid, []);
    groups.get(block.groupUuid).push(block);
  }
  const knownSets = [
    ...(queue.polls || []).map(poll => poll.choices.map(choice => choice.label.toLowerCase())),
    (homepage.community?.choices || []).map(choice => choice.label.toLowerCase())
  ];
  const threeOptionGroups = [...groups.values()].filter(blocks => blocks.length === 3);
  const matches = threeOptionGroups.filter(blocks => {
    const labels = blocks.map(optionLabel).map(label => label.toLowerCase());
    return knownSets.some(known => known.length === 3
      && labels.filter(label => known.includes(label)).length >= 2);
  });
  if (matches.length === 1) return matches[0].sort((a, b) => (a.payload?.index || 0) - (b.payload?.index || 0));

  const questionBlock = (form.blocks || []).find(block => blockStrings(block.payload).some(text => /pick friday'?s dinner/i.test(text)));
  if (questionBlock) {
    const options = groups.get(questionBlock.groupUuid) || [];
    if (options.length === 3) return options.sort((a, b) => (a.payload?.index || 0) - (b.payload?.index || 0));
  }
  if (threeOptionGroups.length === 1) {
    return threeOptionGroups[0].sort((a, b) => (a.payload?.index || 0) - (b.payload?.index || 0));
  }
  throw new Error('Could not uniquely identify the three Tally poll choices. Keep the question titled "Pick Friday\'s dinner".');
}

function ensurePollIdField(form) {
  let hidden = (form.blocks || []).find(block => block.type === 'HIDDEN_FIELDS');
  if (!hidden) {
    const uuid = crypto.randomUUID();
    hidden = {
      uuid, type: 'HIDDEN_FIELDS', groupUuid: uuid, groupType: 'HIDDEN_FIELDS',
      payload: { hiddenFields: [] }
    };
    const submitIndex = form.blocks.findIndex(block => /SUBMIT|BUTTON/.test(block.type));
    form.blocks.splice(submitIndex >= 0 ? submitIndex : form.blocks.length, 0, hidden);
  }
  const fields = hidden.payload.hiddenFields || (hidden.payload.hiddenFields = []);
  let field = fields.find(candidate => candidate.name === 'poll_id');
  if (!field) {
    field = { uuid: crypto.randomUUID(), name: 'poll_id' };
    fields.push(field);
  }
  return field.uuid;
}

function mutateTallyForm(form, poll, queue, homepage, mode) {
  const clone = structuredClone(form);
  const options = findPollOptionBlocks(clone, queue, homepage);
  const questionGroup = options[0].groupUuid;
  const window = pollWindow(poll, queue);
  poll.choices.forEach((choice, index) => {
    setOptionLabel(options[index], choice.label);
    options[index].payload.isRequired = mode === 'open';
  });

  const question = clone.blocks.find(block => block.type !== 'MULTIPLE_CHOICE_OPTION'
    && blockStrings(block.payload).some(text => /pick friday|voting is closed/i.test(text)));
  if (question) replaceBlockText(question, /pick friday|voting is closed/i,
    mode === 'open' ? "Pick Friday's dinner" : `Voting is closed for Friday`);

  const deadlineBlock = clone.blocks.find(block => blockStrings(block.payload).some(text =>
    /voting closes|most popular choice|friday'?s pick/i.test(text)));
  const resultChoice = poll.choices.find(choice => choice.slot === poll.winnerSlot);
  const supportingText = mode === 'open'
    ? `The most popular choice becomes Friday's recipe. Voting closes Thursday, ${prettyDate(window.closesDate)} at 6 PM ET.`
    : resultChoice
      ? `Voting is closed. Friday's pick is ${resultChoice.label}. You can still send a note or photo below.`
      : `Voting is closed. Friday's original recipe stays on the schedule. You can still send a note or photo below.`;
  if (deadlineBlock) replaceBlockText(deadlineBlock, /voting closes|most popular choice|friday'?s pick/i, supportingText);

  const pollIdFieldUuid = ensurePollIdField(clone);
  clone.settings = clone.settings || {};
  clone.settings.isClosed = false;
  clone.settings.closeTimezone = queue.timezone || DEFAULT_TIMEZONE;
  clone.settings.redirectOnCompletion = {
    html: 'https://foidslop.com/#table',
    mentions: []
  };
  return { form: clone, pollOptionGroupUuid: questionGroup, pollIdFieldUuid };
}

function tallyPayload(form) {
  return { name: form.name, blocks: form.blocks, settings: form.settings };
}

async function requestJson(url, options = {}, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      const text = await response.text();
      const body = text ? JSON.parse(text) : null;
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 500)}`);
      return body;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, attempt * 750));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

function tallyHeaders() {
  if (!process.env.TALLY_API_KEY) throw new Error('TALLY_API_KEY is required for live Tally operations.');
  return { Authorization: `Bearer ${process.env.TALLY_API_KEY}`, 'Content-Type': 'application/json' };
}

async function fetchTallyForm(formId) {
  return requestJson(`${TALLY_API}/forms/${formId}`, { headers: tallyHeaders() });
}

async function patchTallyForm(formId, form) {
  return requestJson(`${TALLY_API}/forms/${formId}`, {
    method: 'PATCH', headers: tallyHeaders(), body: JSON.stringify(tallyPayload(form))
  });
}

async function fetchTallySubmissions(formId, startDate, endDate) {
  const submissions = [];
  let questions = [];
  for (let page = 1; ; page += 1) {
    const url = new URL(`${TALLY_API}/forms/${formId}/submissions`);
    url.searchParams.set('filter', 'completed');
    url.searchParams.set('limit', '500');
    url.searchParams.set('page', String(page));
    url.searchParams.set('startDate', startDate.toISOString());
    url.searchParams.set('endDate', endDate.toISOString());
    const result = await requestJson(url, { headers: tallyHeaders() });
    submissions.push(...(result.submissions || []));
    questions = result.questions || questions;
    if (!result.hasMore) break;
  }
  return { questions, submissions };
}

function normalizeAnswer(value) {
  if (Array.isArray(value)) return value.flatMap(normalizeAnswer);
  if (value && typeof value === 'object') return Object.values(value).flatMap(normalizeAnswer);
  if (typeof value !== 'string') return [String(value ?? '')];
  try {
    const parsed = JSON.parse(value);
    if (parsed !== value) return normalizeAnswer(parsed);
  } catch {}
  return [stripHtml(value)];
}

function resolveVotes(payload, poll) {
  const questionById = new Map((payload.questions || []).map(question => [question.id, question]));
  const pollIdQuestion = (payload.questions || []).find(question => question.title === 'poll_id'
    || (question.fields || []).some(field => field.title === 'poll_id'));
  const choiceQuestion = (payload.questions || []).find(question => /pick friday|voting is closed/i.test(question.title || ''));
  if (!pollIdQuestion) throw new Error('Tally submissions do not contain the poll_id hidden field.');
  if (!choiceQuestion) throw new Error('Tally submissions do not contain the Friday poll question.');

  const fieldLabels = new Map((choiceQuestion.fields || []).map(field => [field.uuid, field.title]));
  const latestByRespondent = new Map();
  for (const submission of payload.submissions || []) {
    const responseMap = new Map((submission.responses || []).map(response => [response.questionId, response]));
    const pollIdResponse = responseMap.get(pollIdQuestion.id);
    const choiceResponse = responseMap.get(choiceQuestion.id);
    if (!pollIdResponse || !choiceResponse) continue;
    const pollIds = normalizeAnswer(pollIdResponse.answer || pollIdResponse.formattedAnswer);
    if (!pollIds.includes(poll.id)) continue;

    const answers = normalizeAnswer(choiceResponse.answer || choiceResponse.formattedAnswer)
      .map(answer => fieldLabels.get(answer) || answer);
    const choice = poll.choices.find(candidate => answers.some(answer =>
      [candidate.slot, candidate.label, candidate.recipeSlug].some(value => value.toLowerCase() === answer.toLowerCase())));
    if (!choice) continue;
    const respondentKey = choiceResponse.respondentId || choiceResponse.sessionUuid || submission.id;
    const submittedAt = new Date(submission.submittedAt || choiceResponse.createdAt || 0);
    const existing = latestByRespondent.get(respondentKey);
    if (!existing || submittedAt > existing.submittedAt) latestByRespondent.set(respondentKey, { choice, submittedAt });
  }

  const counts = Object.fromEntries(poll.choices.map(choice => [choice.slot, 0]));
  for (const vote of latestByRespondent.values()) counts[vote.choice.slot] += 1;
  const ranked = poll.choices.map(choice => ({ choice, count: counts[choice.slot] }))
    .sort((left, right) => right.count - left.count);
  const winner = ranked[0].count > 0 && ranked[0].count > ranked[1].count ? ranked[0].choice : null;
  return { counts, winner, total: latestByRespondent.size };
}

function validateQueue(queue, mealsDb) {
  const errors = [];
  const polls = queue.polls || [];
  const meals = mealsDb.meals || [];
  const mealBySlug = new Map(meals.map(meal => [meal.slug, meal]));
  const usedSlugs = new Set();
  let previousFriday = null;
  for (const poll of polls) {
    const target = new Date(`${poll.targetFriday}T12:00:00Z`);
    if (Number.isNaN(target.getTime()) || target.getUTCDay() !== 5) errors.push(`${poll.id}: targetFriday must be a Friday`);
    if (poll.id !== poll.targetFriday) errors.push(`${poll.id}: poll id must equal targetFriday`);
    if (previousFriday && addDays(previousFriday, 7) !== poll.targetFriday) errors.push(`${poll.id}: poll Fridays are not consecutive`);
    previousFriday = poll.targetFriday;
    if (!['pending', 'open', 'resolved'].includes(poll.status)) errors.push(`${poll.id}: invalid status`);
    if (!Array.isArray(poll.choices) || poll.choices.length !== 3) {
      errors.push(`${poll.id}: exactly three choices are required`);
      continue;
    }
    if (poll.choices.map(choice => choice.slot).join('') !== 'ABC') errors.push(`${poll.id}: choice slots must be A, B, C`);
    for (const choice of poll.choices) {
      const meal = mealBySlug.get(choice.recipeSlug);
      if (!choice.label || !meal) errors.push(`${poll.id}: invalid choice ${choice.slot}`);
      if (usedSlugs.has(choice.recipeSlug)) errors.push(`${poll.id}: recipe appears in more than one poll (${choice.recipeSlug})`);
      usedSlugs.add(choice.recipeSlug);
      if (meal && poll.status !== 'resolved' && meal.publishDate <= poll.targetFriday) {
        errors.push(`${poll.id}: candidate must still be scheduled after the target Friday (${choice.recipeSlug})`);
      }
      if (meal) {
        const jpg = path.join(ROOT, 'slop', 'img', `${choice.recipeSlug}.jpg`);
        const png = path.join(ROOT, 'slop', 'img', `${choice.recipeSlug}.png`);
        if (!fs.existsSync(jpg) && !fs.existsSync(png)) errors.push(`${poll.id}: missing source image (${choice.recipeSlug})`);
      }
    }
    const fridayMeals = meals.filter(meal => meal.publishDate === poll.targetFriday && meal.status !== 'retired');
    if (poll.status !== 'resolved' && fridayMeals.length !== 1) errors.push(`${poll.id}: target Friday must have exactly one scheduled recipe`);
  }
  if (errors.length) throw new Error(`Weekly queue validation failed:\n- ${errors.join('\n- ')}`);
  return { total: polls.length, remaining: polls.filter(poll => poll.status === 'pending').length };
}

function selectPoll(queue, args, command, now = new Date()) {
  if (args.pollId) {
    const selected = queue.polls.find(poll => poll.id === args.pollId);
    if (!selected) throw new Error(`Unknown poll: ${args.pollId}`);
    return selected;
  }
  const date = args.date || dateInZone(now, queue.timezone);
  if (command === 'bootstrap' || command === 'open' || command === 'dispatch') {
    return queue.polls.find(poll => pollWindow(poll, queue).opensDate === date);
  }
  if (command === 'resolve') {
    return queue.polls.find(poll => pollWindow(poll, queue).closesDate === date);
  }
  return null;
}

function communityUrl(base, pollId) {
  const url = new URL(base);
  url.searchParams.set('poll_id', pollId);
  return url.toString();
}

function updateHomepageForPoll(homepage, poll, queue, status) {
  const window = pollWindow(poll, queue);
  homepage.community.pollId = poll.id;
  homepage.community.status = status;
  homepage.community.question = status === 'open' ? "Pick Friday's dinner" : 'Voting is closed';
  homepage.community.choices = poll.choices.map(({ slot, label }) => ({ slot, label }));
  homepage.community.submissionUrl = communityUrl(`https://tally.so/r/${homepage.community.formId}`, poll.id);
  if (status === 'open') {
    homepage.community.promise = "The most popular choice becomes Friday's recipe.";
    homepage.community.deadline = `Voting closes Thursday, ${prettyDate(window.closesDate)} at 6 PM ET.`;
  } else {
    const winner = poll.choices.find(choice => choice.slot === poll.winnerSlot);
    homepage.community.promise = winner
      ? `${winner.label} won and becomes Friday's recipe.`
      : poll.totalVotes
        ? "The vote tied, so Friday's original recipe stays on the schedule."
        : "No winner this week, so Friday's original recipe stays on the schedule.";
    homepage.community.deadline = 'Voting is closed. Notes and photos are still welcome.';
    homepage.community.lastResult = {
      pollId: poll.id,
      targetFriday: poll.targetFriday,
      winnerLabel: winner?.label || null,
      winnerRecipeSlug: poll.winnerRecipeSlug || null,
      counts: poll.counts || {},
      totalVotes: poll.totalVotes || 0
    };
  }
}

function applyRecipeSwap(mealsDb, poll, winnerChoice) {
  if (!winnerChoice) return null;
  const winnerMeal = mealsDb.meals.find(meal => meal.slug === winnerChoice.recipeSlug);
  const fridayMeal = mealsDb.meals.find(meal => meal.publishDate === poll.targetFriday && meal.status !== 'retired');
  if (!winnerMeal || !fridayMeal) throw new Error('Could not find both recipes required for the Friday swap.');
  if (winnerMeal.slug === fridayMeal.slug) {
    return { winner: winnerMeal.slug, movedTo: poll.targetFriday, displaced: poll.originalFridaySlug || null, alreadyApplied: true };
  }
  const winnerOriginalDate = winnerMeal.publishDate;
  poll.originalFridaySlug = fridayMeal.slug;
  poll.originalWinnerDate = winnerOriginalDate;
  winnerMeal.publishDate = poll.targetFriday;
  fridayMeal.publishDate = winnerOriginalDate;
  poll.swapApplied = true;
  return { winner: winnerMeal.slug, movedTo: poll.targetFriday, displaced: fridayMeal.slug, movedToDate: winnerOriginalDate };
}

function runNode(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${script} exited with status ${result.status}`);
}

async function openPoll(context) {
  const { queue, homepage, poll, args } = context;
  if (!poll) {
    const date = args.date || dateInZone(new Date(), queue.timezone);
    const preview = { operation: 'open', poll: null, queueExhausted: true, date };
    if (args.dryRun) return preview;
    homepage.community.pollId = `queue-empty-${date}`;
    homepage.community.status = 'idle';
    homepage.community.question = 'No vote this week';
    homepage.community.promise = 'Reader notes and photos are still open while the next poll batch is prepared.';
    homepage.community.deadline = 'A new question will appear after the editorial queue is refilled.';
    homepage.community.choices = [];
    homepage.community.submissionUrl = `https://tally.so/r/${homepage.community.formId}`;
    writeJson(HOMEPAGE_FILE, homepage);
    return preview;
  }
  if (poll.status === 'resolved') throw new Error(`${poll.id} is already resolved.`);
  const preview = {
    operation: 'open', poll: poll.id, choices: poll.choices.map(choice => `${choice.slot}: ${choice.label}`),
    formUrl: communityUrl(`https://tally.so/r/${homepage.community.formId}`, poll.id)
  };
  if (args.dryRun) return preview;

  const originalForm = await fetchTallyForm(homepage.community.formId);
  const mutated = mutateTallyForm(originalForm, poll, queue, homepage, 'open');
  const snapshot = args.snapshot || process.env.TALLY_SNAPSHOT_FILE;
  if (snapshot) writeJson(snapshot, originalForm);
  await patchTallyForm(homepage.community.formId, mutated.form);

  poll.status = 'open';
  poll.openedAt = poll.openedAt || new Date().toISOString();
  delete poll.resolvedAt;
  updateHomepageForPoll(homepage, poll, queue, 'open');
  writeJson(QUEUE_FILE, queue);
  writeJson(HOMEPAGE_FILE, homepage);
  return { ...preview, pollOptionGroupUuid: mutated.pollOptionGroupUuid, pollIdFieldUuid: mutated.pollIdFieldUuid };
}

async function resolvePoll(context) {
  const { queue, homepage, mealsDb, poll, args } = context;
  if (!poll) throw new Error('No poll is scheduled to close on this date.');
  if (poll.status === 'resolved') return { operation: 'resolve', poll: poll.id, alreadyResolved: true };
  const window = pollWindow(poll, queue);
  if (args.dryRun) {
    return { operation: 'resolve', poll: poll.id, window: [window.opensAt.toISOString(), window.closesAt.toISOString()] };
  }

  const payload = await fetchTallySubmissions(homepage.community.formId, window.opensAt, window.closesAt);
  const result = resolveVotes(payload, poll);
  poll.counts = result.counts;
  poll.totalVotes = result.total;
  poll.winnerSlot = result.winner?.slot || null;
  poll.winnerRecipeSlug = result.winner?.recipeSlug || null;
  poll.resolvedAt = new Date().toISOString();
  poll.status = 'resolved';

  let swap = null;
  if (result.winner) {
    swap = applyRecipeSwap(mealsDb, poll, result.winner);
    if (!swap?.alreadyApplied) {
      writeJson(MEALS_FILE, mealsDb);
      runNode('scripts/optimize-images.js', ['--slug', result.winner.recipeSlug]);
    }
  } else {
    poll.swapApplied = false;
  }

  updateHomepageForPoll(homepage, poll, queue, 'closed');
  writeJson(QUEUE_FILE, queue);
  writeJson(HOMEPAGE_FILE, homepage);

  const originalForm = await fetchTallyForm(homepage.community.formId);
  const mutated = mutateTallyForm(originalForm, poll, queue, homepage, 'closed');
  const snapshot = args.snapshot || process.env.TALLY_SNAPSHOT_FILE;
  if (snapshot) writeJson(snapshot, originalForm);
  await patchTallyForm(homepage.community.formId, mutated.form);
  return { operation: 'resolve', poll: poll.id, counts: result.counts, totalVotes: result.total, winner: result.winner?.slot || null, swap };
}

function emailRecipeList(meals, date) {
  return meals.filter(meal => meal.publishDate <= date && meal.status !== 'retired')
    .sort((left, right) => left.publishDate.localeCompare(right.publishDate))
    .slice(-7).reverse();
}

function buildDispatchEmail(homepage, queue, mealsDb, poll, dateOverride = null) {
  const window = poll
    ? pollWindow(poll, queue)
    : {
      opensDate: dateOverride,
      dispatchAt: localInstant(dateOverride, queue.dispatchLocalTime || '10:00', queue.timezone || DEFAULT_TIMEZONE)
    };
  const recipes = emailRecipeList(mealsDb.meals, window.opensDate);
  const previous = queue.polls.filter(candidate => candidate.status === 'resolved'
    && (!poll || candidate.targetFriday < poll.targetFriday)).at(-1);
  const previousWinner = previous?.choices.find(choice => choice.slot === previous.winnerSlot);
  const note = poll?.dispatchNote
    || (poll
      ? `This week: ${recipes[0]?.name || 'seven dinners'}, six more ways to feed yourself, and a vote for Friday.`
      : `This week: ${recipes[0]?.name || 'seven dinners'} and six more ways to feed yourself.`);
  const recipeRows = recipes.map(meal => {
    const total = (Number.parseInt(meal.prep) || 0) + (Number.parseInt(meal.cook) || 0);
    return `<tr><td style="padding:14px 0;border-top:1px solid #d5d0c5;"><a href="https://foidslop.com/slop/${escapeHtml(meal.slug)}" style="color:#171815;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;text-decoration:none;text-transform:uppercase;">${escapeHtml(meal.name)}</a><br><span style="color:#66645f;font-family:Arial,Helvetica,sans-serif;font-size:12px;">${escapeHtml(meal.publishDate)} / ${total ? `${total} min` : 'No cook'} / ${escapeHtml(meal.category)}</span></td></tr>`;
  }).join('');
  const choices = (poll?.choices || []).map(choice =>
    `<li style="margin:0 0 8px;"><strong style="color:#ef4a35;">${choice.slot}</strong> &nbsp;${escapeHtml(choice.label)}</li>`).join('');
  const result = previous
    ? `<p style="margin:0 0 26px;color:#66645f;font-size:13px;">Last vote: ${previousWinner ? `<strong style="color:#171815;">${escapeHtml(previousWinner.label)}</strong> won` : 'there was no unique winner'}${previous.totalVotes != null ? ` from ${previous.totalVotes} vote${previous.totalVotes === 1 ? '' : 's'}` : ''}.</p>`
    : '';
  const voteUrl = poll ? communityUrl(`https://tally.so/r/${homepage.community.formId}`, poll.id) : null;
  const tableSection = poll
    ? `<div style="margin:30px 0 0;padding:24px;background:#171815;color:#f4f1e8;">
      <p style="margin:0 0 8px;color:#ef4a35;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.4px;">THE TABLE / VOTE BY THURSDAY</p>
      <h2 style="margin:0 0 16px;font-family:Arial Black,Arial,Helvetica,sans-serif;font-size:27px;text-transform:uppercase;">Pick Friday's dinner</h2>
      <ol style="margin:0 0 22px;padding-left:22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;">${choices}</ol>
      <a href="${escapeHtml(voteUrl)}" style="display:inline-block;padding:13px 18px;background:#ef4a35;color:#fff;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;text-decoration:none;text-transform:uppercase;">Vote at The Table</a>
    </div>`
    : `<div style="margin:30px 0 0;padding:24px;background:#171815;color:#f4f1e8;">
      <p style="margin:0 0 8px;color:#ef4a35;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.4px;">THE TABLE</p>
      <h2 style="margin:0 0 12px;font-family:Arial Black,Arial,Helvetica,sans-serif;font-size:27px;text-transform:uppercase;">No vote this week</h2>
      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;">The next batch is being prepared. Notes and photos are still welcome on the site.</p>
    </div>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#f4f1e8;"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fffdf8;border:1px solid #d5d0c5;"><tr><td style="padding:30px 28px 12px;">
    <p style="margin:0 0 10px;color:#ef4a35;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;">* FOID SLOP / THE WEEKLY SLOP</p>
    <h1 style="margin:0;color:#171815;font-family:Arial Black,Arial,Helvetica,sans-serif;font-size:42px;line-height:.95;letter-spacing:-2px;text-transform:uppercase;">Dinner for one.<br>Seven times.</h1>
    <p style="margin:24px 0 28px;color:#171815;font-family:Georgia,serif;font-size:20px;line-height:1.45;">${escapeHtml(note)}</p>
    ${result}
    <h2 style="margin:0 0 10px;color:#171815;font-family:Arial Black,Arial,Helvetica,sans-serif;font-size:24px;text-transform:uppercase;">This week in slop</h2>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${recipeRows}</table>
    ${tableSection}
    <p style="margin:26px 0 12px;color:#66645f;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;">Made something? Reply and tell me how it went. One email every Sunday. No life story.</p>
  </td></tr></table></td></tr></table>`;
}

function kitHeaders() {
  if (!process.env.KIT_API_KEY) throw new Error('KIT_API_KEY is required for live Kit operations.');
  return { 'X-Kit-Api-Key': process.env.KIT_API_KEY, 'Content-Type': 'application/json' };
}

async function findKitBroadcast(marker) {
  let after = null;
  const matches = [];
  do {
    const url = new URL(`${KIT_API}/broadcasts`);
    url.searchParams.set('per_page', '1000');
    if (after) url.searchParams.set('after', after);
    const result = await requestJson(url, { headers: kitHeaders() });
    matches.push(...(result.broadcasts || []).filter(broadcast => broadcast.description === marker));
    after = result.pagination?.has_next_page ? result.pagination.end_cursor : null;
  } while (after);
  if (matches.length > 1) throw new Error(`Duplicate Kit broadcasts found for ${marker}; resolve them manually.`);
  return matches[0] || null;
}

function buildKitBroadcastBody(homepage, content, marker, subject, dispatchAt, sendAt) {
  const body = {
    content,
    description: marker,
    public: false,
    published_at: dispatchAt.toISOString(),
    send_at: sendAt?.toISOString() || null,
    thumbnail_alt: null,
    thumbnail_url: null,
    preview_text: 'Seven dinners for one and one vote for Friday.',
    subject,
    email_address: homepage.newsletter.fromAddress
  };
  if (Number.isInteger(homepage.newsletter.emailTemplateId)) {
    body.email_template_id = homepage.newsletter.emailTemplateId;
  }
  return body;
}

async function dispatch(context) {
  const { queue, homepage, mealsDb, poll, args } = context;
  const dispatchDate = args.date || dateInZone(new Date(), queue.timezone);
  const window = poll
    ? pollWindow(poll, queue)
    : { opensDate: dispatchDate, dispatchAt: localInstant(dispatchDate, queue.dispatchLocalTime || '10:00', queue.timezone) };
  const marker = `foidslop-weekly:${window.opensDate}`;
  const subject = `The Weekly Slop - ${prettyDate(window.opensDate)}`;
  const content = buildDispatchEmail(homepage, queue, mealsDb, poll, dispatchDate);
  const shouldSend = args.send || homepage.newsletter.automationEnabled === true;
  let sendAt = shouldSend ? window.dispatchAt : null;
  const now = new Date();
  if (sendAt && now > sendAt) {
    const noon = localInstant(window.opensDate, '12:00', queue.timezone);
    sendAt = now < noon ? new Date(now.getTime() + 5 * 60 * 1000) : null;
  }
  const body = buildKitBroadcastBody(
    homepage, content, marker, subject, window.dispatchAt, sendAt
  );
  if (args.dryRun) return { operation: 'dispatch', marker, subject, sendAt: body.send_at, contentBytes: Buffer.byteLength(content) };

  const existing = await findKitBroadcast(marker);
  if (existing?.status === 'completed' || existing?.status === 'sending') {
    return { operation: 'dispatch', marker, broadcastId: existing.id, status: existing.status, unchanged: true };
  }
  const method = existing ? 'PUT' : 'POST';
  const url = existing ? `${KIT_API}/broadcasts/${existing.id}` : `${KIT_API}/broadcasts`;
  const response = await requestJson(url, { method, headers: kitHeaders(), body: JSON.stringify(body) });
  return {
    operation: 'dispatch', marker, broadcastId: response.broadcast?.id,
    status: body.send_at ? 'scheduled' : 'draft', sendAt: body.send_at
  };
}

async function restoreTally(homepage, snapshot) {
  if (!snapshot || !fs.existsSync(snapshot)) throw new Error('A valid --snapshot file is required.');
  const form = readJson(snapshot);
  await patchTallyForm(homepage.community.formId, form);
  return { operation: 'restore-tally', formId: homepage.community.formId };
}

async function main() {
  const args = parseArgs(process.argv);
  const queue = readJson(QUEUE_FILE);
  const homepage = readJson(HOMEPAGE_FILE);
  const mealsDb = readJson(MEALS_FILE);
  const queueStatus = validateQueue(queue, mealsDb);
  const poll = selectPoll(queue, args, args.command);
  const context = { args, queue, homepage, mealsDb, poll };
  let result;
  if (args.command === 'queue-check') result = { operation: 'queue-check', ...queueStatus };
  else if (args.command === 'bootstrap' || args.command === 'open') result = await openPoll(context);
  else if (args.command === 'resolve') result = await resolvePoll(context);
  else if (args.command === 'dispatch') result = await dispatch(context);
  else if (args.command === 'restore-tally') result = await restoreTally(homepage, args.snapshot || process.env.TALLY_SNAPSHOT_FILE);
  else throw new Error(`Unknown command: ${args.command}`);
  console.log(args.json ? JSON.stringify(result) : JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = {
  addDays,
  applyRecipeSwap,
  buildDispatchEmail,
  buildKitBroadcastBody,
  communityUrl,
  dateInZone,
  findPollOptionBlocks,
  localInstant,
  mutateTallyForm,
  normalizeAnswer,
  pollWindow,
  resolveVotes,
  selectPoll,
  validateQueue
};
