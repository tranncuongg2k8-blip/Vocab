import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { test } from 'node:test';
import { createApp } from '../src/app.js';
import { cards as allCards, sets as allSets } from '../src/data.js';

const cards = allCards.filter((card) => card.setId === '1');
const sets = allSets.filter((set) => set.id === '1');

const sprint1Cards = JSON.parse(readFileSync(new URL('./fixtures/sprint1-cards.json', import.meta.url), 'utf8'));

async function start(t, fixtures) {
  const server = createApp({ sqlitePath: ':memory:', ...fixtures });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  async function call(path, options) {
    const response = await fetch(`${baseUrl}${path}`, options);
    assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
    return { status: response.status, body: await response.json(), headers: response.headers };
  }
  return {
    baseUrl,
    call,
    rate: (body) => call('/progress', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' },
      body: JSON.stringify(body),
    }),
    stats: async (setId = '1') => {
      const result = await call(`/progress/${setId}`);
      assert.equal(result.status, 200);
      return result.body;
    },
  };
}

function summary(mastered = 0, review = 0, total = 10, setId = '1') {
  return { data: { setId, mastered, review, unseen: total - mastered - review, total } };
}

function assertError(result, status, code, message) {
  assert.equal(result.status, status);
  assert.deepEqual(Object.keys(result.body), ['error']);
  assert.deepEqual(Object.keys(result.body.error).sort(), ['code', 'message']);
  assert.equal(result.body.error.code, code);
  assert.equal(typeof result.body.error.message, 'string');
  assert.ok(result.body.error.message.length > 0);
  if (message) assert.equal(result.body.error.message, message);
}

test('B4: all ten cards preserve every Sprint 1 field and seed exactly five new fields', async (t) => {
  const api = await start(t);
  const { status, body } = await api.call('/sets/1/cards');
  assert.equal(status, 200);
  assert.equal(body.data.length, 10);
  for (const [index, card] of body.data.entries()) {
    const { meaning, exampleVi, synonyms, antonyms, wordType, ...legacy } = card;
    assert.deepEqual(legacy, sprint1Cards[index]);
    assert.equal(meaning, card.back);
    assert.equal(typeof exampleVi, 'string');
    assert.ok(exampleVi.length > 0);
    assert.ok(Array.isArray(synonyms) && synonyms.length > 0);
    assert.ok(Array.isArray(antonyms));
    for (const word of [...synonyms, ...antonyms]) {
      assert.equal(typeof word, 'string');
      assert.ok(word.length > 0);
    }
    assert.ok(['Danh từ', 'Động từ', 'Tính từ'].includes(wordType));
  }
});

test('B4: cards without the optional fields remain usable for reads and ratings', async (t) => {
  const api = await start(t, { cards: sprint1Cards });
  assert.deepEqual((await api.call('/sets/1/cards')).body, { data: sprint1Cards, total: 10 });
  assert.equal((await api.rate({ setId: '1', cardId: '1', level: 'remembered' })).status, 200);
  assert.deepEqual(await api.stats(), summary(1));
});

test('GET /progress/:setId initially reports every card as unseen', async (t) => {
  const api = await start(t);
  assert.deepEqual(await api.stats(), summary());
  assert.deepEqual(await api.stats('%31'), summary());
});

test('GET /progress/:setId returns SET_NOT_FOUND for an unknown set', async (t) => {
  const api = await start(t);
  assertError(await api.call('/progress/missing'), 404, 'SET_NOT_FOUND', 'Set not found');
});

test('GET /progress/:setId returns a standard 400 for malformed encoding', async (t) => {
  const api = await start(t);
  assertError(await api.call('/progress/%ZZ'), 400, 'INVALID_REQUEST');
});

for (const level of ['forgot', 'vague', 'remembered', 'mastered']) {
  test(`POST /progress accepts ${level}, returns only contracted fields and updates its group`, async (t) => {
    const api = await start(t);
    const result = await api.rate({ setId: '1', cardId: '1', level });
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { data: { cardId: '1', level } });
    assert.deepEqual(await api.stats(), ['forgot', 'vague'].includes(level) ? summary(0, 1) : summary(1));
  });
}

test('ratings on distinct cards aggregate correctly and rating all cards leaves zero unseen', async (t) => {
  const api = await start(t);
  for (const [index, level] of ['forgot', 'vague', 'remembered', 'mastered'].entries()) {
    assert.equal((await api.rate({ setId: '1', cardId: String(index + 1), level })).status, 200);
  }
  assert.deepEqual(await api.stats(), summary(2, 2));
  for (let index = 5; index <= 10; index++) {
    assert.equal((await api.rate({ setId: '1', cardId: String(index), level: 'remembered' })).status, 200);
  }
  assert.deepEqual(await api.stats(), summary(8, 2));
});

test('re-rating replaces the previous level without double counting', async (t) => {
  const api = await start(t);
  for (const [level, expected] of [
    ['forgot', summary(0, 1)], ['forgot', summary(0, 1)], ['vague', summary(0, 1)],
    ['remembered', summary(1)], ['mastered', summary(1)], ['forgot', summary(0, 1)],
  ]) {
    assert.equal((await api.rate({ setId: '1', cardId: '1', level })).status, 200);
    assert.deepEqual(await api.stats(), expected);
  }
});

for (const level of ['invalid', 'Remembered', '', 1, null, {}, [], undefined]) {
  test(`POST /progress rejects invalid level ${JSON.stringify(level)} without changing progress`, async (t) => {
    const api = await start(t);
    await api.rate({ setId: '1', cardId: '1', level: 'remembered' });
    assertError(await api.rate({ setId: '1', cardId: '1', level }), 400, 'INVALID_LEVEL');
    assert.deepEqual(await api.stats(), summary(1));
  });
}

test('POST /progress returns SET_NOT_FOUND and CARD_NOT_FOUND without changing progress', async (t) => {
  const api = await start(t);
  for (const setId of ['missing', '']) {
    assertError(await api.rate({ setId, cardId: '1', level: 'forgot' }), 404, 'SET_NOT_FOUND', 'Set not found');
  }
  for (const cardId of ['missing', '']) {
    assertError(await api.rate({ setId: '1', cardId, level: 'forgot' }), 404, 'CARD_NOT_FOUND', 'Card not found');
  }
  assert.deepEqual(await api.stats(), summary());
});

test('ratings are isolated by set and cards must belong to the requested set', async (t) => {
  const api = await start(t, {
    sets: [...sets, { ...sets[0], id: '2', cardCount: 1 }],
    cards: [...cards, { ...cards[0], setId: '2' }],
  });
  assertError(await api.rate({ setId: '2', cardId: '2', level: 'forgot' }), 404, 'CARD_NOT_FOUND');
  assert.equal((await api.rate({ setId: '1', cardId: '1', level: 'mastered' })).status, 200);
  assert.deepEqual(await api.stats('2'), summary(0, 0, 1, '2'));
  assert.equal((await api.rate({ setId: '2', cardId: '1', level: 'vague' })).status, 200);
  assert.deepEqual(await api.stats(), summary(1));
  assert.deepEqual(await api.stats('2'), summary(0, 1, 1, '2'));
});

test('an empty set has zero total, mastered, review and unseen', async (t) => {
  const api = await start(t, { sets: [{ ...sets[0], cardCount: 0 }], cards: [] });
  assert.deepEqual(await api.stats(), summary(0, 0, 0));
  assertError(await api.rate({ setId: '1', cardId: '1', level: 'forgot' }), 404, 'CARD_NOT_FOUND');
});

test('new app instances start with empty in-memory progress', async (t) => {
  const first = await start(t);
  await first.rate({ setId: '1', cardId: '1', level: 'mastered' });
  const second = await start(t);
  assert.deepEqual(await second.stats(), summary());
  assert.deepEqual(await first.stats(), summary(1));
});

test('concurrent requests on distinct cards do not lose ratings', async (t) => {
  const api = await start(t);
  const results = await Promise.all(cards.map((card) => api.rate({ setId: card.setId, cardId: card.id, level: 'remembered' })));
  results.forEach((result) => assert.equal(result.status, 200));
  assert.deepEqual(await api.stats(), summary(10));
});

test('malformed, empty and non-object JSON return standard 400 without mutation', async (t) => {
  const api = await start(t);
  for (const body of ['', '{', 'null', '[]', 'true', '42', '"forgot"']) {
    assertError(await api.call('/progress', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
    }), 400, 'INVALID_REQUEST');
  }
  assert.deepEqual(await api.stats(), summary());
});

test('missing or non-string IDs and uncontracted request fields return standard 400', async (t) => {
  const api = await start(t);
  for (const change of [{ setId: undefined }, { cardId: undefined }, { setId: 1 }, { cardId: 1 },
    { setId: null }, { cardId: [] }, { cardId: {} }, { extra: true }]) {
    assertError(await api.rate({ setId: '1', cardId: '1', level: 'forgot', ...change }), 400, 'INVALID_REQUEST');
  }
  assert.deepEqual(await api.stats(), summary());
});

test('oversized JSON is rejected and the API remains responsive', async (t) => {
  const api = await start(t);
  assertError(await api.rate({ setId: '1', cardId: '1'.repeat(17000), level: 'forgot' }), 400, 'INVALID_REQUEST');
  assert.deepEqual(await api.stats(), summary());
  assert.equal((await api.call('/health')).status, 200);
});

test('POST /progress reads JSON sent in multiple HTTP chunks', async (t) => {
  const api = await start(t);
  const result = await new Promise((resolve, reject) => {
    const request = httpRequest(`${api.baseUrl}/progress`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('error', reject);
      response.on('end', () => resolve({ status: response.statusCode, body: JSON.parse(body) }));
    });
    request.on('error', reject);
    request.write('{"setId":"1",');
    request.write('"cardId":"1","level":');
    request.end('"remembered"}');
  });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { data: { cardId: '1', level: 'remembered' } });
  assert.deepEqual(await api.stats(), summary(1));
});

test('CORS allows POST preflight and both progress responses including errors', async (t) => {
  const api = await start(t);
  for (const [path, method] of [['/progress', 'POST'], ['/progress/1', 'GET']]) {
    const response = await fetch(`${api.baseUrl}${path}`, {
      method: 'OPTIONS', headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': method,
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
    assert.equal(response.headers.get('access-control-allow-methods'), `${method}, OPTIONS`);
    assert.equal(response.headers.get('access-control-allow-headers'), 'Content-Type');
  }
  const results = [
    await api.rate({ setId: '1', cardId: '1', level: 'forgot' }),
    await api.rate({ setId: '1', cardId: '1', level: 'wrong' }),
    await api.rate({ setId: '1', cardId: 'missing', level: 'forgot' }),
    await api.call('/progress/1', { headers: { Origin: 'http://localhost:3000' } }),
    await api.call('/progress/missing', { headers: { Origin: 'http://localhost:3000' } }),
  ];
  for (const result of results) {
    assert.equal(result.headers.get('access-control-allow-origin'), 'http://localhost:3000');
    assert.equal(result.headers.get('vary'), 'Origin');
  }
  const denied = await api.call('/progress/1', { headers: { Origin: 'http://example.com' } });
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
});

test('unsupported progress routes and methods remain 404', async (t) => {
  const api = await start(t);
  for (const [path, method] of [['/progress', 'GET'], ['/progress', 'PUT'], ['/progress/1', 'POST'],
    ['/progress/1', 'DELETE'], ['/progress/1/cards', 'GET']]) {
    assertError(await api.call(path, { method }), 404, 'ROUTE_NOT_FOUND');
  }
});
