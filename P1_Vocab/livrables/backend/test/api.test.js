import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import { createApp } from '../src/app.js';

let server;
let baseUrl;
before(async () => {
  server = createApp({ sqlitePath: ':memory:' });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
});
after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function get(path, expectedStatus = 200, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  assert.equal(response.status, expectedStatus);
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
  return { body: await response.json(), headers: response.headers };
}

function assertSet(set) {
  assert.deepEqual(Object.keys(set).sort(), ['cardCount', 'description', 'id', 'language', 'title']);
  for (const key of ['description', 'id', 'title']) assert.equal(typeof set[key], 'string');
  assert.equal(set.language, 'en-vi');
  assert.ok(Number.isInteger(set.cardCount));
}

test('GET /health returns only the contracted status', async () => {
  assert.deepEqual((await get('/health')).body, { status: 'ok' });
});

test('GET /sets returns seeded sets with exactly the contracted fields', async () => {
  const { body } = await get('/sets');
  assert.deepEqual(Object.keys(body), ['data']);
  assert.ok(body.data.length >= 1);
  body.data.forEach(assertSet);
});

test('GET /sets/:id matches its list entry', async () => {
  const { body: list } = await get('/sets');
  const { body } = await get(`/sets/${list.data[0].id}`);
  assert.deepEqual(body, { data: list.data[0] });
  assertSet(body.data);
});

test('GET /sets/:id/cards returns at least 10 valid cards and a consistent count', async () => {
  const { body: detail } = await get('/sets/1');
  const { body } = await get('/sets/1/cards');
  assert.deepEqual(Object.keys(body).sort(), ['data', 'total']);
  assert.ok(body.data.length >= 10);
  assert.equal(body.total, body.data.length);
  assert.equal(body.total, detail.data.cardCount);
  assert.equal(new Set(body.data.map((card) => card.id)).size, body.total);
  for (const card of body.data) {
    assert.deepEqual(Object.keys(card).sort(), ['antonyms', 'audioUrl', 'back', 'example', 'exampleVi', 'front', 'id', 'meaning', 'phonetic', 'setId', 'synonyms', 'wordType']);
    for (const key of ['back', 'example', 'front', 'id', 'phonetic', 'setId']) {
      assert.equal(typeof card[key], 'string');
      assert.ok(card[key].length > 0);
    }
    assert.equal(card.setId, detail.data.id);
    assert.ok(card.audioUrl === null || typeof card.audioUrl === 'string');
  }
});

for (const path of ['/health/missing', '/sets/1/unknown', '/unknown']) {
  test(`GET ${path} returns the standard route 404`, async () => {
    assert.deepEqual((await get(path, 404)).body, {
      error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' },
    });
  });
}

for (const path of ['/sets/missing', '/sets/missing/cards']) {
  test(`GET ${path} returns the exact contracted set 404`, async () => {
    assert.deepEqual((await get(path, 404)).body, {
      error: { code: 'SET_NOT_FOUND', message: 'Set not found' },
    });
  });
}

test('pagination applies limit and offset without changing total', async () => {
  const { body: all } = await get('/sets/1/cards');
  for (const [query, expected] of [
    ['limit=3&offset=2', all.data.slice(2, 5)],
    ['limit=2', all.data.slice(0, 2)],
    ['offset=8', all.data.slice(8)],
    ['limit=100', all.data],
    ['limit=0', []],
    ['offset=999', []],
    ['limit=9007199254740991&offset=9007199254740991', []],
  ]) {
    assert.deepEqual((await get(`/sets/1/cards?${query}`)).body, { data: expected, total: all.total });
  }
});

for (const query of ['limit=-1', 'offset=-1', 'limit=1.5', 'offset=abc', 'limit=',
  'offset=', 'limit=Infinity', 'limit=1e2', 'limit=9007199254740992',
  'offset=9007199254740992', 'limit=1&limit=2', 'offset=1&offset=2']) {
  test(`invalid pagination ${query} returns standard 400`, async () => {
    assert.deepEqual((await get(`/sets/1/cards?${query}`, 400)).body, {
      error: { code: 'INVALID_PAGINATION', message: 'limit and offset must be non-negative safe integers' },
    });
  });
}

test('missing set takes precedence over invalid pagination', async () => {
  assert.deepEqual((await get('/sets/missing/cards?limit=-1', 404)).body, {
    error: { code: 'SET_NOT_FOUND', message: 'Set not found' },
  });
});

test('encoded set IDs work and malformed encoding returns standard 400', async () => {
  assert.equal((await get('/sets/%31')).body.data.id, '1');
  assert.deepEqual((await get('/sets/%ZZ', 400)).body, {
    error: { code: 'INVALID_REQUEST', message: 'Invalid set ID encoding' },
  });
});

test('CORS permits the frontend on success and error responses', async () => {
  for (const [path, status] of [['/health', 200], ['/sets', 200], ['/sets/1', 200],
    ['/sets/1/cards', 200], ['/sets/missing', 404], ['/sets/1/cards?limit=-1', 400]]) {
    const { headers } = await get(path, status, { headers: { Origin: 'http://localhost:3000' } });
    assert.equal(headers.get('access-control-allow-origin'), 'http://localhost:3000');
    assert.equal(headers.get('vary'), 'Origin');
  }
});

test('CORS does not grant access to other origins or wildcard origins', async () => {
  for (const origin of ['http://example.com', 'http://localhost:3000.evil.test', 'null']) {
    const { headers } = await get('/health', 200, { headers: { Origin: origin } });
    assert.equal(headers.get('access-control-allow-origin'), null);
  }
  assert.equal((await get('/health')).headers.get('access-control-allow-origin'), null);
});

test('OPTIONS preflight permits frontend GET requests', async () => {
  const response = await fetch(`${baseUrl}/sets/1/cards`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:3000',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'content-type',
    },
  });
  assert.equal(response.status, 204);
  assert.equal(await response.text(), '');
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
  assert.equal(response.headers.get('access-control-allow-methods'), 'GET, OPTIONS');
  assert.equal(response.headers.get('access-control-allow-headers'), 'Content-Type');
});

test('uncontracted methods and game endpoints are unavailable', async () => {
  for (const [path, method] of [['/sets', 'POST'], ['/sets/1', 'PUT'],
    ['/sets/1', 'DELETE'], ['/progress', 'GET'], ['/progress/1', 'POST'], ['/games/quiz', 'GET']]) {
    assert.deepEqual((await get(path, 404, { method })).body, {
      error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' },
    });
  }
});
