import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createApp } from '../src/app.js';
import { cards as allCards, sets as allSets } from '../src/data.js';
import { createQuiz } from '../src/quiz.js';

// These regression scenarios target set 1; synthetic sets must not collide with seed sets.
const cards = allCards.filter((card) => card.setId === '1');
const sets = allSets.filter((set) => set.id === '1');

async function start(t, fixtures) {
  const server = createApp({ sqlitePath: ':memory:', ...fixtures });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  return {
    baseUrl,
    async call(path, expectedStatus = 200, options) {
      const response = await fetch(`${baseUrl}${path}`, options);
      assert.equal(response.status, expectedStatus);
      assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
      return { body: await response.json(), headers: response.headers };
    },
  };
}

function assertQuiz(body, sourceCards, expectedCount, pool = sourceCards) {
  assert.deepEqual(Object.keys(body).sort(), ['data', 'total']);
  assert.equal(body.total, sourceCards.length);
  assert.equal(body.data.length, expectedCount);
  assert.equal(new Set(body.data.map((question) => question.cardId)).size, expectedCount);
  const meanings = new Set(pool.map((card) => card.meaning ?? card.back));
  for (const question of body.data) {
    assert.deepEqual(Object.keys(question).sort(), ['answerIndex', 'cardId', 'options', 'prompt']);
    const card = sourceCards.find((item) => item.id === question.cardId);
    assert.ok(card, 'Question must belong to the requested set');
    assert.equal(question.prompt, card.front);
    assert.ok(Array.isArray(question.options));
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options).size, 4);
    for (const option of question.options) {
      assert.equal(typeof option, 'string');
      assert.ok(meanings.has(option), 'Every option must be a real Vietnamese meaning');
    }
    assert.ok(Number.isInteger(question.answerIndex));
    assert.ok(question.answerIndex >= 0 && question.answerIndex < 4);
    const answer = card.meaning ?? card.back;
    assert.equal(question.options[question.answerIndex], answer);
    assert.equal(question.options.filter((option) => option === answer).length, 1);
  }
}

test('GET /quiz/:setId defaults to all cards with exactly four options and the correct answer', async (t) => {
  const api = await start(t);
  assertQuiz((await api.call('/quiz/1')).body, cards, 10);
  assertQuiz((await api.call('/quiz/%31')).body, cards, 10);
});

test('count selects distinct questions, retains total and is capped at the number of cards', async (t) => {
  const api = await start(t);
  for (const count of [1, 3, 10, 11, 100, Number.MAX_SAFE_INTEGER]) {
    assertQuiz((await api.call(`/quiz/1?count=${count}`)).body, cards, Math.min(count, 10));
  }
});

for (const query of ['count=', 'count=0', 'count=-1', 'count=1.5', 'count=abc',
  'count=Infinity', 'count=NaN', 'count=1e2', 'count=0x10', 'count=%20',
  'count=%201', 'count=%2B1', 'count=9007199254740992', 'count=1&count=2', 'count=1&count=1']) {
  test(`invalid ${query} returns 400 INVALID_PAGINATION`, async (t) => {
    const api = await start(t);
    assert.deepEqual((await api.call(`/quiz/1?${query}`, 400)).body, {
      error: { code: 'INVALID_PAGINATION', message: 'count must be a positive safe integer' },
    });
  });
}

test('unknown quiz sets return exactly the contracted 404 even with an invalid count', async (t) => {
  const api = await start(t);
  for (const path of ['/quiz/missing', '/quiz/missing?count=-1']) {
    assert.deepEqual((await api.call(path, 404)).body, {
      error: { code: 'SET_NOT_FOUND', message: 'Set not found' },
    });
  }
});

test('malformed set ID encoding returns the existing standard 400', async (t) => {
  const api = await start(t);
  assert.deepEqual((await api.call('/quiz/%ZZ', 400)).body, {
    error: { code: 'INVALID_REQUEST', message: 'Invalid set ID encoding' },
  });
});

test('HTTP quiz shuffles questions and choices using the supplied random source', async (t) => {
  const unchanged = await start(t, { quizRandomInt: (max) => max - 1 });
  const moved = await start(t, { quizRandomInt: () => 0 });
  const first = (await unchanged.call('/quiz/1')).body;
  const second = (await moved.call('/quiz/1')).body;
  assertQuiz(first, cards, 10);
  assertQuiz(second, cards, 10);
  assert.notDeepEqual(first.data.map((question) => question.cardId), second.data.map((question) => question.cardId));
  assert.ok(first.data.every((question) => question.answerIndex === 0));
  assert.ok(second.data.every((question) => question.answerIndex === 3));
});

test('option shuffling supports all 24 permutations with the answer equally in each position', () => {
  const permutations = new Set();
  const positions = [0, 0, 0, 0];
  for (let a = 0; a < 4; a++) {
    for (let b = 0; b < 3; b++) {
      for (let c = 0; c < 2; c++) {
        // First two draws retain distractor order; the last three permute four options.
        const draws = [2, 1, a, b, c];
        const questions = createQuiz([cards[0]], cards.slice(0, 4), 1, (max) => {
          const draw = draws.shift();
          assert.ok(draw >= 0 && draw < max);
          return draw;
        });
        assert.equal(draws.length, 0);
        assertQuiz({ data: questions, total: 1 }, [cards[0]], 1, cards.slice(0, 4));
        permutations.add(JSON.stringify(questions[0].options));
        positions[questions[0].answerIndex]++;
      }
    }
  }
  assert.equal(permutations.size, 24);
  assert.deepEqual(positions, [6, 6, 6, 6]);
});

test('quiz falls back to back for legacy cards without meaning', async (t) => {
  const legacyCards = JSON.parse(readFileSync(new URL('./fixtures/sprint1-cards.json', import.meta.url), 'utf8'));
  const api = await start(t, { cards: legacyCards });
  assertQuiz((await api.call('/quiz/1')).body, legacyCards, 10);
});

test('quiz prefers meaning and excludes duplicate meanings from the options', async (t) => {
  const fixtures = cards.map((card, index) => ({
    ...card, meaning: index === 1 ? 'hoàn thành' : index === 0 ? 'hoàn thành' : card.meaning,
  }));
  const api = await start(t, { cards: fixtures });
  assertQuiz((await api.call('/quiz/1')).body, fixtures, 10);
});

test('small sets borrow distractors but never questions from another set', async (t) => {
  const smallSetCards = cards.slice(0, 2).map((card) => ({ ...card, setId: '2' }));
  const fixtures = [...cards, ...smallSetCards];
  const api = await start(t, {
    sets: [...sets, { ...sets[0], id: '2', cardCount: 2 }], cards: fixtures,
  });
  assertQuiz((await api.call('/quiz/2')).body, smallSetCards, 2, fixtures);
  assertQuiz((await api.call('/quiz/2?count=1')).body, smallSetCards, 1, fixtures);
});

test('an empty set returns an empty quiz with zero total', async (t) => {
  const api = await start(t, { sets: [{ ...sets[0], cardCount: 0 }], cards: [] });
  for (const path of ['/quiz/1', '/quiz/1?count=5']) {
    assert.deepEqual((await api.call(path)).body, { data: [], total: 0 });
  }
  await api.call('/quiz/1?count=invalid', 400);
});

test('insufficient distinct source meanings return a standard 500 without leaking details', async (t) => {
  t.mock.method(console, 'error', () => {});
  const api = await start(t, {
    sets: [{ ...sets[0], cardCount: 3 }], cards: cards.slice(0, 3),
  });
  assert.deepEqual((await api.call('/quiz/1', 500)).body, {
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' },
  });
  assert.deepEqual((await api.call('/health')).body, { status: 'ok' });
});

test('generating quizzes never changes cards, their order or learning progress', async (t) => {
  const api = await start(t);
  await api.call('/progress', 200, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setId: '1', cardId: '1', level: 'mastered' }),
  });
  const beforeCards = (await api.call('/sets/1/cards')).body;
  const beforeProgress = (await api.call('/progress/1')).body;
  await api.call('/quiz/1?count=3');
  await api.call('/quiz/1');
  await api.call('/quiz/1?count=-1', 400);
  assert.deepEqual((await api.call('/sets/1/cards')).body, beforeCards);
  assert.deepEqual((await api.call('/progress/1')).body, beforeProgress);
});

test('CORS allows quiz success, errors and GET preflight only for the frontend origin', async (t) => {
  const api = await start(t);
  for (const [path, status] of [['/quiz/1', 200], ['/quiz/missing', 404], ['/quiz/1?count=0', 400]]) {
    const { headers } = await api.call(path, status, { headers: { Origin: 'http://localhost:3000' } });
    assert.equal(headers.get('access-control-allow-origin'), 'http://localhost:3000');
    assert.equal(headers.get('vary'), 'Origin');
  }
  const response = await fetch(`${api.baseUrl}/quiz/1`, {
    method: 'OPTIONS', headers: {
      Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'GET',
    },
  });
  assert.equal(response.status, 204);
  assert.equal(await response.text(), '');
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
  assert.equal(response.headers.get('access-control-allow-methods'), 'GET, OPTIONS');
  const { headers } = await api.call('/quiz/1', 200, { headers: { Origin: 'http://example.com' } });
  assert.equal(headers.get('access-control-allow-origin'), null);
});

test('unsupported quiz methods, submission routes and future modes remain unavailable', async (t) => {
  const api = await start(t);
  for (const [path, method] of [['/quiz/1', 'POST'], ['/quiz/1', 'PUT'], ['/quiz/1', 'DELETE'],
    ['/quiz', 'GET'], ['/quiz/1/submit', 'POST'], ['/games/quiz', 'GET'], ['/matching/1', 'POST']]) {
    assert.deepEqual((await api.call(path, 404, { method })).body, {
      error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' },
    });
  }
});
