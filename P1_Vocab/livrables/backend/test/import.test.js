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
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    assert.equal(response.status, status);
    if (response.headers.get('content-type')?.startsWith('application/json')) return response.json();
    return { text: await response.text(), contentType: response.headers.get('content-type') };
  };
}

async function makeDeckGroup(call) {
  const { data: deck } = await call('/my/decks', { method: 'POST', body: { title: 'Imports' } });
  const { data: group } = await call(`/my/decks/${deck.id}/groups`, { method: 'POST', body: { title: 'CSV' } });
  return { deck, group };
}

test('B17: template is CSV with exactly the seven contracted column headings', async (t) => {
  const call = await start(t);
  const template = await call('/my/import/template');
  assert.equal(template.contentType, 'text/csv; charset=utf-8');
  assert.equal(template.text, 'word,IPA,wordType,meaning,example,exampleVi,notes\r\n');
});

test('B17: import accepts valid cards, reports invalid rows and continues after failures', async (t) => {
  const call = await start(t);
  const { deck, group } = await makeDeckGroup(call);
  const result = await call(`/my/groups/${group.id}/import`, {
    method: 'POST', body: { cards: [
      { front: 'journey', phonetic: '/ˈdʒɜːni/', wordType: 'noun', meaning: 'chuyến đi', example: 'The journey was long.', exampleVi: 'Chuyến đi dài.' },
      { front: '', meaning: 'bad row' },
      { front: 'reserve', meaning: 'đặt trước' },
      { front: 'unknown', meaning: 'không biết', wordType: 'invalid' },
    ] },
  });
  assert.deepEqual(result, { data: { imported: 2, failed: [
    { line: 2, error: 'front is required' },
    { line: 4, error: 'wordType is invalid' },
  ] } });
  const { data: cards, total } = await call(`/sets/${deck.id}/cards`);
  assert.equal(total, 2);
  assert.deepEqual(cards.map(({ front, meaning, back, groupId }) => ({ front, meaning, back, groupId })), [
    { front: 'journey', meaning: 'chuyến đi', back: 'chuyến đi', groupId: group.id },
    { front: 'reserve', meaning: 'đặt trước', back: 'đặt trước', groupId: group.id },
  ]);
  assert.equal((await call('/my/decks')).data.find((item) => item.id === deck.id).cardCount, 2);
  assert.equal((await call(`/my/decks/${deck.id}/groups`)).data[0].cardCount, 2);
});

test('B17: malformed import requests fail without adding cards', async (t) => {
  const call = await start(t);
  const { deck, group } = await makeDeckGroup(call);
  for (const body of [{}, { cards: {} }, { cards: [], extra: true }]) {
    const result = await call(`/my/groups/${group.id}/import`, { method: 'POST', body, status: 400 });
    assert.deepEqual(Object.keys(result.error).sort(), ['code', 'message']);
    assert.equal(result.error.code, 'INVALID_REQUEST');
  }
  assert.deepEqual(await call(`/sets/${deck.id}/cards`), { data: [], total: 0 });
});

test('B17/B23: imports above 600 cards succeed', async (t) => {
  const call = await start(t);
  const { deck, group } = await makeDeckGroup(call);
  const rows = Array.from({ length: 601 }, (_, index) => ({ front: `word${index}`, meaning: `meaning ${index}` }));
  assert.deepEqual(await call(`/my/groups/${group.id}/import`, { method: 'POST', body: { cards: rows } }), {
    data: { imported: 601, failed: [] },
  });
  await call(`/my/groups/${group.id}/import`, {
    method: 'POST', body: { cards: [{ front: 'extra', meaning: 'thêm nữa' }] },
  });
  assert.equal((await call(`/sets/${deck.id}/cards`)).total, 602);
});

test('B17: import validates group ID and uses the standard error shape', async (t) => {
  const call = await start(t);
  assert.deepEqual(await call('/my/groups/missing/import', {
    method: 'POST', body: { cards: [] }, status: 404,
  }), { error: { code: 'GROUP_NOT_FOUND', message: 'Group not found' } });
});
