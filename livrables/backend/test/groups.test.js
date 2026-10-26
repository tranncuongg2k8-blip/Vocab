import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { createApp } from '../src/app.js';
import { WORD_TYPES } from '../src/my-decks.js';

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
    assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
    return response.json();
  };
}

async function makeDeckAndGroup(call) {
  const { data: deck } = await call('/my/decks', { method: 'POST', body: { title: 'My Deck' } });
  const { data: group } = await call(`/my/decks/${deck.id}/groups`, { method: 'POST', body: { title: 'Basics' } });
  return { deck, group };
}

test('B16: Group create, list, rename and delete follow the exact contract schema', async (t) => {
  const call = await start(t);
  const { deck, group } = await makeDeckAndGroup(call);
  assert.deepEqual(Object.keys(group).sort(), ['cardCount', 'deckId', 'id', 'title']);
  assert.deepEqual(group, { id: group.id, deckId: deck.id, title: 'Basics', cardCount: 0 });
  assert.deepEqual(await call(`/my/decks/${deck.id}/groups`), { data: [group] });
  assert.deepEqual((await call('/my/decks')).data.find((item) => item.id === deck.id), {
    id: deck.id, title: deck.title, status: 'draft', cardCount: 0, groupCount: 1, language: 'en-vi',
  });
  assert.deepEqual(await call(`/my/groups/${group.id}`, { method: 'PUT', body: { title: 'Renamed' } }), {
    data: { ...group, title: 'Renamed' },
  });
  assert.deepEqual(await call(`/my/groups/${group.id}`, { method: 'DELETE' }), { data: { id: group.id } });
  assert.deepEqual(await call(`/my/decks/${deck.id}/groups`), { data: [] });
  assert.deepEqual((await call('/my/decks')).data.find((item) => item.id === deck.id).groupCount, 0);
  assert.deepEqual(await call(`/my/groups/${group.id}`, { method: 'DELETE', status: 404 }), {
    error: { code: 'GROUP_NOT_FOUND', message: 'Group not found' },
  });
});

test('B16: missing deck/group IDs and blank titles return contracted errors', async (t) => {
  const call = await start(t);
  const missingDeck = await call('/my/decks/missing/groups', {
    method: 'POST', body: { title: 'Group' }, status: 404,
  });
  assert.deepEqual(missingDeck, { error: { code: 'DECK_NOT_FOUND', message: 'Deck not found' } });
  const { deck, group } = await makeDeckAndGroup(call);
  for (const body of [{}, { title: '' }, { title: '   ' }, { title: 7 }, { title: 'x', extra: 1 }]) {
    const result = await call(`/my/decks/${deck.id}/groups`, { method: 'POST', body, status: 400 });
    assert.equal(result.error.code, 'INVALID_REQUEST');
  }
  for (const method of ['PUT', 'DELETE']) {
    const result = await call('/my/groups/missing', { method, ...(method === 'PUT' ? { body: { title: 'x' } } : {}), status: 404 });
    assert.deepEqual(result, { error: { code: 'GROUP_NOT_FOUND', message: 'Group not found' } });
  }
  assert.equal(group.deckId, deck.id);
});

test('B16: manual card requires front and meaning/back and validates fields', async (t) => {
  const call = await start(t);
  const { group } = await makeDeckAndGroup(call);
  for (const body of [{}, { front: '', meaning: 'x' }, { front: 'x' }, { meaning: 'x' },
    { front: 'x', meaning: 'y', wordType: 'made-up' }, { front: 'x', meaning: 'y', extra: true },
    { front: 'x', meaning: 'y', synonyms: ['ok', 1] }]) {
    const result = await call(`/my/groups/${group.id}/cards`, { method: 'POST', body, status: 400 });
    assert.deepEqual(Object.keys(result.error).sort(), ['code', 'message']);
    assert.equal(result.error.code, 'INVALID_REQUEST');
  }
});

test('B16: back satisfies the required meaning when meaning is omitted or blank', async (t) => {
  const call = await start(t);
  const { group } = await makeDeckAndGroup(call);
  for (const body of [
    { front: 'hello', back: 'xin chào' },
    { front: 'goodbye', meaning: ' ', back: 'tạm biệt' },
  ]) {
    const { data: card } = await call(`/my/groups/${group.id}/cards`, { method: 'POST', body });
    assert.equal(card.meaning, body.back);
    assert.equal(card.back, body.back);
  }
});

test('B16: all Contract wordType values and full Card fields are accepted', async (t) => {
  const call = await start(t);
  const { deck, group } = await makeDeckAndGroup(call);
  assert.equal(WORD_TYPES.length, 14);
  for (const [index, wordType] of WORD_TYPES.entries()) {
    const { data: card } = await call(`/my/groups/${group.id}/cards`, {
      method: 'POST',
      body: {
        front: `word${index}`, meaning: `nghĩa ${index}`, phonetic: '/wɜːd/',
        example: `Use word${index} today.`, exampleVi: `Dùng từ ${index} hôm nay.`,
        audioUrl: null, synonyms: ['similar'], antonyms: ['opposite'], wordType,
      },
    });
    assert.deepEqual(Object.keys(card).sort(), [
      'antonyms', 'audioUrl', 'back', 'example', 'exampleVi', 'front', 'groupId',
      'id', 'meaning', 'phonetic', 'setId', 'synonyms', 'wordType',
    ]);
    assert.deepEqual(card, {
      id: card.id, setId: deck.id, front: `word${index}`, back: `nghĩa ${index}`,
      phonetic: '/wɜːd/', example: `Use word${index} today.`, audioUrl: null,
      meaning: `nghĩa ${index}`, exampleVi: `Dùng từ ${index} hôm nay.`,
      synonyms: ['similar'], antonyms: ['opposite'], wordType, groupId: group.id,
    });
  }
});

test('B16: created cards update counts and work with Cards, Quiz, Matching and Progress', async (t) => {
  const call = await start(t);
  const { deck, group } = await makeDeckAndGroup(call);
  const meanings = ['một', 'hai', 'ba', 'bốn'];
  const created = [];
  for (let index = 0; index < meanings.length; index++) {
    const { data: card } = await call(`/my/groups/${group.id}/cards`, {
      method: 'POST', body: { front: `word${index}`, meaning: meanings[index], wordType: 'noun' },
    });
    created.push(card);
  }
  const { data: groupAfter } = await call(`/my/decks/${deck.id}/groups`);
  assert.equal(groupAfter[0].cardCount, 4);
  assert.equal((await call('/my/decks')).data.find((item) => item.id === deck.id).cardCount, 4);
  assert.deepEqual((await call(`/sets/${deck.id}/cards`)).data, created);
  assert.deepEqual((await call(`/sets/${deck.id}`)).data, {
    id: deck.id, title: deck.title, description: '', cardCount: 4, language: 'en-vi',
  });
  const quiz = (await call(`/quiz/${deck.id}`)).data;
  assert.equal(quiz.length, 4);
  for (const question of quiz) {
    const card = created.find((item) => item.id === question.cardId);
    assert.equal(question.options[question.answerIndex], card.meaning);
  }
  assert.equal((await call(`/matching/${deck.id}`)).data.length, 4);
  assert.deepEqual(await call('/progress', {
    method: 'POST', body: { setId: deck.id, cardId: created[0].id, level: 'remembered' },
  }), { data: { cardId: created[0].id, level: 'remembered' } });
  assert.deepEqual(await call(`/progress/${deck.id}`), {
    data: { setId: deck.id, mastered: 1, review: 0, unseen: 3, total: 4 },
  });
});

test('B16/B23: group deletion cascades cards and manual creation exceeds 600 cards', async (t) => {
  const call = await start(t);
  const { deck, group } = await makeDeckAndGroup(call);
  const rows = Array.from({ length: 601 }, (_, index) => ({ front: `word${index}`, meaning: `meaning ${index}` }));
  assert.deepEqual(await call(`/my/groups/${group.id}/import`, { method: 'POST', body: { cards: rows } }), {
    data: { imported: 601, failed: [] },
  });
  await call(`/my/groups/${group.id}/cards`, {
    method: 'POST', body: { front: 'word601', meaning: 'meaning 601' },
  });
  assert.equal((await call('/my/decks')).data.find((item) => item.id === deck.id).cardCount, 602);
  await call(`/my/groups/${group.id}`, { method: 'DELETE' });
  assert.equal((await call('/my/decks')).data.find((item) => item.id === deck.id).cardCount, 0);
  assert.deepEqual((await call(`/sets/${deck.id}/cards`)).data, []);
});
