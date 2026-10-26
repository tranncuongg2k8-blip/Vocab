import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { createApp } from '../src/app.js';

async function start(t) {
  const server = createApp({ sqlitePath: ':memory:' });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  return async (path, { method = 'GET', body, status = 200 } = {}) => {
    const response = await fetch(`${baseUrl}${path}`, body === undefined ? { method } : {
      method, headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3000' }, body: JSON.stringify(body),
    });
    assert.equal(response.status, status);
    if (response.headers.get('content-type')?.startsWith('application/json')) return response.json();
    return { text: await response.text(), contentType: response.headers.get('content-type') };
  };
}

test('B15: create, list, rename and delete decks with exact contracted schemas', async (t) => {
  const call = await start(t);
  assert.deepEqual(await call('/my/decks'), { data: [] });
  const created = await call('/my/decks', { method: 'POST', body: { title: '  My words  ' } });
  assert.deepEqual(Object.keys(created.data).sort(), ['cardCount', 'groupCount', 'id', 'language', 'status', 'title']);
  assert.deepEqual(created.data, {
    id: created.data.id, title: 'My words', status: 'draft', cardCount: 0, groupCount: 0, language: 'en-vi',
  });
  assert.deepEqual(await call('/my/decks'), { data: [created.data] });
  const updated = await call(`/my/decks/${created.data.id}`, { method: 'PUT', body: { title: 'Renamed' } });
  assert.deepEqual(updated, { data: { ...created.data, title: 'Renamed' } });
  const sets = await call('/sets');
  const visibleSet = sets.data.find((set) => set.id === created.data.id);
  assert.deepEqual(visibleSet, {
    id: created.data.id, title: 'Renamed', description: '', cardCount: 0, language: 'en-vi',
  });
  assert.deepEqual(await call(`/my/decks/${created.data.id}`, { method: 'DELETE' }), {
    data: { id: created.data.id },
  });
  assert.deepEqual(await call('/my/decks'), { data: [] });
  await call(`/sets/${created.data.id}/cards`, { status: 404 });
});

test('B23: deck creation has no three-deck limit', async (t) => {
  const call = await start(t);
  for (let index = 1; index <= 5; index++) {
    const result = await call('/my/decks', { method: 'POST', body: { title: `Deck ${index}` } });
    assert.equal(result.data.cardCount, 0);
  }
  assert.equal((await call('/my/decks')).data.length, 5);
});

test('B15: missing titles and unknown deck IDs return standard errors', async (t) => {
  const call = await start(t);
  for (const body of [{}, { title: '' }, { title: '   ' }, { title: 4 }]) {
    assert.deepEqual(await call('/my/decks', { method: 'POST', body, status: 400 }), {
      error: { code: 'INVALID_REQUEST', message: 'title is required' },
    });
  }
  assert.deepEqual(await call('/my/decks', { method: 'POST', body: { title: 'ok', extra: true }, status: 400 }), {
    error: { code: 'INVALID_REQUEST', message: 'Only title is accepted' },
  });
  for (const [method, body] of [['PUT', { title: 'x' }], ['DELETE', undefined]]) {
    assert.deepEqual(await call(`/my/decks/missing`, { method, body, status: 404 }), {
      error: { code: 'DECK_NOT_FOUND', message: 'Deck not found' },
    });
  }
});

test('B15: deleting a deck frees quota and removes its groups and cards', async (t) => {
  const call = await start(t);
  const { data: deck } = await call('/my/decks', { method: 'POST', body: { title: 'Temporary' } });
  const { data: group } = await call(`/my/decks/${deck.id}/groups`, { method: 'POST', body: { title: 'Group' } });
  await call(`/my/groups/${group.id}/cards`, {
    method: 'POST', body: { front: 'hello', meaning: 'xin chào' },
  });
  await call(`/my/decks/${deck.id}`, { method: 'DELETE' });
  assert.deepEqual(await call(`/my/decks/${deck.id}/groups`, { status: 404 }), {
    error: { code: 'DECK_NOT_FOUND', message: 'Deck not found' },
  });
  await call('/my/decks', { method: 'POST', body: { title: 'Replacement' } });
});

test('B15: deck CORS preflight permits both contracted methods', async (t) => {
  const server = createApp({ sqlitePath: ':memory:' });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/v1/my/decks`, {
    method: 'OPTIONS', headers: {
      Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'POST',
    },
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
  assert.equal(response.headers.get('access-control-allow-methods'), 'GET, POST, OPTIONS');
});
