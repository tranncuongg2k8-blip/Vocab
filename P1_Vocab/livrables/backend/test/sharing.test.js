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
  return {
    baseUrl,
    async call(path, { method = 'GET', body, status = 200, headers = {} } = {}) {
      const response = await fetch(`${baseUrl}${path}`, body === undefined ? { method, headers } : {
        method, headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
      });
      assert.equal(response.status, status);
      assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
      return { body: await response.json(), headers: response.headers };
    },
  };
}

async function createDeck(call, title = 'Shared vocabulary') {
  return (await call('/my/decks', { method: 'POST', body: { title } })).body.data;
}

test('B18: publishing changes only status and returns the existing Deck schema', async (t) => {
  const api = await start(t);
  const draft = await createDeck(api.call);
  assert.deepEqual(Object.keys(draft).sort(), ['cardCount', 'groupCount', 'id', 'language', 'status', 'title']);
  assert.equal(draft.status, 'draft');
  const response = await api.call(`/my/decks/${draft.id}/publish`, { method: 'PUT' });
  assert.deepEqual(response.body, { data: { ...draft, status: 'published' } });
  assert.deepEqual((await api.call('/my/decks')).body.data[0], response.body.data);
  assert.deepEqual((await api.call(`/sets/${draft.id}`)).body.data, {
    id: draft.id, title: draft.title, description: '', cardCount: 0, language: 'en-vi',
  });
});

test('B18: shared deck is inaccessible while draft, then public by existing deck ID after publish', async (t) => {
  const api = await start(t);
  const draft = await createDeck(api.call);
  const notShared = await api.call(`/shared/${draft.id}`, { status: 404 });
  assert.deepEqual(notShared.body, { error: { code: 'DECK_NOT_FOUND', message: 'Deck not found' } });
  await api.call(`/my/decks/${draft.id}/publish`, { method: 'PUT' });
  const shared = await api.call(`/shared/${draft.id}`);
  assert.deepEqual(shared.body, { data: {
    deck: { ...draft, status: 'published' }, groups: [], cards: [], total: 0,
  } });
  assert.deepEqual(Object.keys(shared.body.data).sort(), ['cards', 'deck', 'groups', 'total']);
});

test('B18: publishing an unknown deck and sharing an unknown ID return 404', async (t) => {
  const api = await start(t);
  assert.deepEqual((await api.call('/my/decks/missing/publish', { method: 'PUT', status: 404 })).body, {
    error: { code: 'DECK_NOT_FOUND', message: 'Deck not found' },
  });
  assert.deepEqual((await api.call('/shared/missing', { status: 404 })).body, {
    error: { code: 'DECK_NOT_FOUND', message: 'Deck not found' },
  });
  assert.deepEqual((await api.call('/shared/%ZZ', { status: 404 })).body, {
    error: { code: 'DECK_NOT_FOUND', message: 'Deck not found' },
  });
});

test('B18: publish and shared routes reject uncontracted methods', async (t) => {
  const api = await start(t);
  const deck = await createDeck(api.call);
  for (const [path, method] of [[`/my/decks/${deck.id}/publish`, 'GET'],
    [`/my/decks/${deck.id}/publish`, 'POST'], [`/my/decks/${deck.id}/unpublish`, 'PUT'],
    ['/shared/example', 'POST']]) {
    assert.deepEqual((await api.call(path, { method, status: 404 })).body, {
      error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' },
    });
  }
});

test('B18: publish preflight allows PUT from the frontend and shared access needs no auth', async (t) => {
  const api = await start(t);
  const deck = await createDeck(api.call);
  const response = await fetch(`${api.baseUrl}/my/decks/${deck.id}/publish`, {
    method: 'OPTIONS', headers: {
      Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'PUT',
    },
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
  assert.equal(response.headers.get('access-control-allow-methods'), 'PUT, OPTIONS');
  const unpublishPreflight = await fetch(`${api.baseUrl}/my/decks/${deck.id}/unpublish`, {
    method: 'OPTIONS', headers: {
      Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'POST',
    },
  });
  assert.equal(unpublishPreflight.status, 204);
  assert.equal(unpublishPreflight.headers.get('access-control-allow-methods'), 'POST, OPTIONS');
  await api.call(`/my/decks/${deck.id}/publish`, { method: 'PUT' });
  const shared = await api.call(`/shared/${deck.id}`, {
    headers: { Origin: 'http://example.com' },
  });
  assert.equal(shared.body.data.deck.id, deck.id);
  assert.equal(shared.headers.get('access-control-allow-origin'), null);
});

test('B18: publishing is idempotent and deleting the deck revokes its share ID', async (t) => {
  const api = await start(t);
  const deck = await createDeck(api.call);
  const first = await api.call(`/my/decks/${deck.id}/publish`, { method: 'PUT' });
  const second = await api.call(`/my/decks/${deck.id}/publish`, { method: 'PUT' });
  assert.deepEqual(second.body, first.body);
  await api.call(`/my/decks/${deck.id}`, { method: 'DELETE' });
  assert.deepEqual((await api.call(`/shared/${deck.id}`, { status: 404 })).body, {
    error: { code: 'DECK_NOT_FOUND', message: 'Deck not found' },
  });
});

test('B19: unpublishing is idempotent and revokes the public shared response', async (t) => {
  const api = await start(t);
  const deck = await createDeck(api.call);
  const { body: published } = await api.call(`/my/decks/${deck.id}/publish`, { method: 'PUT' });
  const first = await api.call(`/my/decks/${deck.id}/unpublish`, { method: 'POST' });
  const second = await api.call(`/my/decks/${deck.id}/unpublish`, { method: 'POST' });
  assert.deepEqual(first.body, { data: { ...published.data, status: 'draft' } });
  assert.deepEqual(second.body, first.body);
  assert.deepEqual((await api.call('/my/decks')).body.data[0], first.body.data);
  assert.deepEqual((await api.call(`/shared/${deck.id}`, { status: 404 })).body, {
    error: { code: 'DECK_NOT_FOUND', message: 'Deck not found' },
  });
});

test('B19: unpublishing an unknown deck returns 404 DECK_NOT_FOUND', async (t) => {
  const api = await start(t);
  assert.deepEqual((await api.call('/my/decks/missing/unpublish', { method: 'POST', status: 404 })).body, {
    error: { code: 'DECK_NOT_FOUND', message: 'Deck not found' },
  });
});

test('B19: shared view returns only contracted Deck, Groups and Cards with consistent total', async (t) => {
  const api = await start(t);
  const deck = await createDeck(api.call);
  const groupA = (await api.call(`/my/decks/${deck.id}/groups`, {
    method: 'POST', body: { title: 'First' },
  })).body.data;
  const groupB = (await api.call(`/my/decks/${deck.id}/groups`, {
    method: 'POST', body: { title: 'Second' },
  })).body.data;
  const cardA = (await api.call(`/my/groups/${groupA.id}/cards`, {
    method: 'POST', body: { front: 'journey', meaning: 'chuyến đi' },
  })).body.data;
  const cardB = (await api.call(`/my/groups/${groupB.id}/cards`, {
    method: 'POST', body: { front: 'arrive', meaning: 'đến nơi' },
  })).body.data;
  await api.call(`/my/decks/${deck.id}/publish`, { method: 'PUT' });
  const shared = (await api.call(`/shared/${deck.id}`)).body.data;
  assert.deepEqual(Object.keys(shared).sort(), ['cards', 'deck', 'groups', 'total']);
  assert.deepEqual(shared.deck, { ...deck, cardCount: 2, groupCount: 2, status: 'published' });
  assert.deepEqual(shared.groups, [groupA, groupB].map((group) => ({ ...group, cardCount: 1 })));
  assert.deepEqual(shared.cards, [cardA, cardB]);
  assert.equal(shared.total, 2);
});
