import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createApp } from '../src/app.js';
import { cards as allCards, sets as allSets } from '../src/data.js';

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

function assertPairs(body, sourceCards, expectedCount) {
  assert.deepEqual(Object.keys(body).sort(), ['data', 'total']);
  assert.equal(body.total, sourceCards.length);
  assert.equal(body.data.length, expectedCount);
  assert.equal(new Set(body.data.map((pair) => pair.cardId)).size, expectedCount);
  for (const pair of body.data) {
    assert.deepEqual(Object.keys(pair).sort(), ['cardId', 'definition', 'term']);
    for (const value of Object.values(pair)) assert.equal(typeof value, 'string');
    const card = sourceCards.find((item) => item.id === pair.cardId);
    assert.ok(card, 'Pair must refer to a card in the requested set');
    assert.equal(pair.term, card.front);
    assert.equal(pair.definition, card.meaning ?? card.back);
  }
}

test('GET /matching/:setId defaults to six correctly mapped pairs with only contracted fields', async (t) => {
  const api = await start(t);
  const { body } = await api.call('/matching/1');
  assertPairs(body, cards, 6);
  assert.deepEqual((await api.call('/matching/%31')).body, body);
});

test('matching count controls pair count, is capped by available cards and preserves total', async (t) => {
  const api = await start(t);
  for (const count of [1, 3, 6, 10, 11, 100, Number.MAX_SAFE_INTEGER]) {
    assertPairs((await api.call(`/matching/1?count=${count}`)).body, cards, Math.min(count, cards.length));
  }
});

for (const query of ['count=', 'count=0', 'count=-1', 'count=1.5', 'count=abc',
  'count=Infinity', 'count=NaN', 'count=1e2', 'count=0x10', 'count=%20',
  'count=%201', 'count=%2B1', 'count=9007199254740992', 'count=1&count=2', 'count=1&count=1']) {
  test(`matching rejects ${query} with 400 INVALID_PAGINATION`, async (t) => {
    const api = await start(t);
    assert.deepEqual((await api.call(`/matching/1?${query}`, 400)).body, {
      error: { code: 'INVALID_PAGINATION', message: 'count must be a positive safe integer' },
    });
  });
}

test('unknown matching sets return exact SET_NOT_FOUND before validating count', async (t) => {
  const api = await start(t);
  for (const path of ['/matching/missing', '/matching/missing?count=-1']) {
    assert.deepEqual((await api.call(path, 404)).body, {
      error: { code: 'SET_NOT_FOUND', message: 'Set not found' },
    });
  }
});

test('matching rejects malformed encoded set IDs using the standard 400 format', async (t) => {
  const api = await start(t);
  assert.deepEqual((await api.call('/matching/%ZZ', 400)).body, {
    error: { code: 'INVALID_REQUEST', message: 'Invalid set ID encoding' },
  });
});

test('small sets return only their own cards even when IDs overlap with another set', async (t) => {
  const secondCards = cards.slice(0, 2).map((card) => ({
    ...card, setId: '2', front: `other ${card.front}`, meaning: `nghĩa khác: ${card.meaning}`,
  }));
  const api = await start(t, {
    sets: [...sets, { ...sets[0], id: '2', cardCount: 2 }], cards: [...cards, ...secondCards],
  });
  assertPairs((await api.call('/matching/2')).body, secondCards, 2);
  assertPairs((await api.call('/matching/2?count=100')).body, secondCards, 2);
  assertPairs((await api.call('/matching/2?count=1')).body, secondCards, 1);
  assertPairs((await api.call('/matching/1')).body, cards, 6);
});

test('a one-card set is playable without borrowing pairs', async (t) => {
  const api = await start(t, { sets: [{ ...sets[0], cardCount: 1 }], cards: [cards[0]] });
  assertPairs((await api.call('/matching/1')).body, [cards[0]], 1);
});

test('empty matching sets return an empty list but still validate count', async (t) => {
  const api = await start(t, { sets: [{ ...sets[0], cardCount: 0 }], cards: [] });
  for (const path of ['/matching/1', '/matching/1?count=6']) {
    assert.deepEqual((await api.call(path)).body, { data: [], total: 0 });
  }
  await api.call('/matching/1?count=0', 400);
});

test('matching supports legacy cards without optional meaning', async (t) => {
  const legacy = JSON.parse(readFileSync(new URL('./fixtures/sprint1-cards.json', import.meta.url), 'utf8'));
  const api = await start(t, { cards: legacy });
  assertPairs((await api.call('/matching/1?count=10')).body, legacy, 10);
});

test('matching prefers meaning over back and retains distinct cards with identical meanings', async (t) => {
  const fixtures = cards.map((card) => ({ ...card, meaning: 'nghĩa chung', back: 'nghĩa cũ' }));
  const api = await start(t, { cards: fixtures });
  const { body } = await api.call('/matching/1?count=10');
  assertPairs(body, fixtures, 10);
  assert.ok(body.data.every((pair) => pair.definition === 'nghĩa chung'));
});

test('matching reads and errors do not modify source cards or progress', async (t) => {
  const api = await start(t);
  await api.call('/progress', 200, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setId: '1', cardId: '1', level: 'remembered' }),
  });
  const beforeCards = (await api.call('/sets/1/cards')).body;
  const beforeProgress = (await api.call('/progress/1')).body;
  await api.call('/matching/1');
  await api.call('/matching/1?count=10');
  await api.call('/matching/1?count=-1', 400);
  assert.deepEqual((await api.call('/sets/1/cards')).body, beforeCards);
  assert.deepEqual((await api.call('/progress/1')).body, beforeProgress);
});

test('matching supports frontend CORS for success and errors plus GET preflight', async (t) => {
  const api = await start(t);
  for (const [path, status] of [['/matching/1', 200], ['/matching/missing', 404], ['/matching/1?count=0', 400]]) {
    const { headers } = await api.call(path, status, { headers: { Origin: 'http://localhost:3000' } });
    assert.equal(headers.get('access-control-allow-origin'), 'http://localhost:3000');
    assert.equal(headers.get('vary'), 'Origin');
  }
  const response = await fetch(`${api.baseUrl}/matching/1`, {
    method: 'OPTIONS', headers: {
      Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'content-type',
    },
  });
  assert.equal(response.status, 204);
  assert.equal(await response.text(), '');
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
  assert.equal(response.headers.get('access-control-allow-methods'), 'GET, OPTIONS');
  assert.equal(response.headers.get('access-control-allow-headers'), 'Content-Type');
  const { headers } = await api.call('/matching/1', 200, { headers: { Origin: 'http://example.com' } });
  assert.equal(headers.get('access-control-allow-origin'), null);
});

test('unsupported matching methods and routes remain unavailable', async (t) => {
  const api = await start(t);
  for (const [path, method] of [['/matching/1', 'POST'], ['/matching/1', 'PUT'],
    ['/matching/1', 'DELETE'], ['/matching', 'GET'], ['/matching/1/submit', 'POST'],
    ['/matching/1/cards', 'GET'], ['/games/matching', 'GET']]) {
    assert.deepEqual((await api.call(path, 404, { method })).body, {
      error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' },
    });
  }
});
