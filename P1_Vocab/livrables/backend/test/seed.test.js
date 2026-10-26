import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { createApp } from '../src/app.js';

async function start(t) {
  const server = createApp({ sqlitePath: ':memory:' });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  return async (path, expectedStatus = 200, body) => {
    const response = await fetch(`${baseUrl}${path}`, body === undefined ? {} : {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    assert.equal(response.status, expectedStatus);
    assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
    return response.json();
  };
}

test('B11: three unique sets expose at least ten complete cards each without extra fields', async (t) => {
  const call = await start(t);
  const listing = await call('/sets');
  assert.deepEqual(Object.keys(listing), ['data']);
  assert.deepEqual(listing.data.map((set) => set.id).sort(), ['1', '2', '3']);
  const cardIds = new Set();
  let totalCards = 0;
  for (const set of listing.data) {
    assert.deepEqual(Object.keys(set).sort(), ['cardCount', 'description', 'id', 'language', 'title']);
    for (const key of ['id', 'title', 'description']) {
      assert.equal(typeof set[key], 'string');
      assert.ok(set[key].trim());
    }
    assert.equal(set.language, 'en-vi');
    assert.deepEqual(await call(`/sets/${set.id}`), { data: set });
    const result = await call(`/sets/${set.id}/cards`);
    assert.deepEqual(Object.keys(result).sort(), ['data', 'total']);
    assert.ok(result.data.length >= 10);
    assert.equal(set.cardCount, result.data.length);
    assert.equal(result.total, result.data.length);
    totalCards += result.total;
    for (const card of result.data) {
      assert.deepEqual(Object.keys(card).sort(), [
        'antonyms', 'audioUrl', 'back', 'example', 'exampleVi', 'front', 'id',
        'meaning', 'phonetic', 'setId', 'synonyms', 'wordType',
      ]);
      assert.equal(card.setId, set.id);
      assert.ok(!cardIds.has(card.id), 'Card IDs must be globally unique');
      cardIds.add(card.id);
      for (const key of ['id', 'setId', 'front', 'back', 'meaning', 'phonetic', 'example', 'exampleVi', 'wordType']) {
        assert.equal(typeof card[key], 'string');
        assert.ok(card[key].trim(), `${key} must be populated`);
      }
      assert.equal(card.meaning, card.back);
      assert.equal(card.audioUrl, null);
      assert.ok(Array.isArray(card.synonyms) && card.synonyms.length > 0);
      assert.ok(Array.isArray(card.antonyms));
      for (const word of [...card.synonyms, ...card.antonyms]) {
        assert.equal(typeof word, 'string');
        assert.ok(word.trim());
      }
      assert.ok(card.example.toLowerCase().includes(card.front.toLowerCase()));
    }
  }
  assert.equal(cardIds.size, totalCards);
});

for (const setId of ['1', '2', '3']) {
  test(`B12: set ${setId} preserves totals through cards pagination, Quiz and Matching`, async (t) => {
    const call = await start(t);
    const { data: set } = await call(`/sets/${setId}`);
    const { data: cards, total } = await call(`/sets/${setId}/cards`);
    assert.equal(total, set.cardCount);
    const pages = [];
    for (let offset = 0; offset < total; offset += 3) {
      const page = await call(`/sets/${setId}/cards?limit=3&offset=${offset}`);
      assert.equal(page.total, total);
      pages.push(...page.data);
    }
    assert.deepEqual(pages, cards);
    assert.deepEqual(await call(`/sets/${setId}/cards?offset=${total}`), { data: [], total });
    const byId = new Map(cards.map((card) => [card.id, card]));
    const meanings = new Set(cards.map((card) => card.meaning));
    assert.ok(meanings.size >= 4, 'Each seeded set must support four distinct quiz options');
    for (const [query, size] of [['', total], ['?count=3', 3], ['?count=100', total]]) {
      const quiz = await call(`/quiz/${setId}${query}`);
      assert.deepEqual(Object.keys(quiz).sort(), ['data', 'total']);
      assert.equal(quiz.total, total);
      assert.equal(quiz.data.length, size);
      assert.equal(new Set(quiz.data.map((question) => question.cardId)).size, size);
      for (const question of quiz.data) {
        assert.deepEqual(Object.keys(question).sort(), ['answerIndex', 'cardId', 'options', 'prompt']);
        const card = byId.get(question.cardId);
        assert.ok(card);
        assert.equal(question.prompt, card.front);
        assert.equal(question.options.length, 4);
        assert.equal(new Set(question.options).size, 4);
        assert.ok(Number.isInteger(question.answerIndex) && question.answerIndex >= 0 && question.answerIndex < 4);
        assert.equal(question.options[question.answerIndex], card.meaning);
        question.options.forEach((option) => assert.ok(meanings.has(option)));
      }
    }
    for (const [query, size] of [['', 6], ['?count=3', 3], ['?count=100', total]]) {
      const matching = await call(`/matching/${setId}${query}`);
      assert.deepEqual(Object.keys(matching).sort(), ['data', 'total']);
      assert.equal(matching.total, total);
      assert.equal(matching.data.length, size);
      assert.equal(new Set(matching.data.map((pair) => pair.cardId)).size, size);
      for (const pair of matching.data) {
        const card = byId.get(pair.cardId);
        assert.ok(card);
        assert.deepEqual(pair, { cardId: card.id, term: card.front, definition: card.meaning });
      }
    }
    assert.deepEqual(await call(`/sets/${setId}/cards`), { data: cards, total });
    assert.deepEqual(await call(`/progress/${setId}`), {
      data: { setId, mastered: 0, review: 0, unseen: total, total },
    });
  });
}

test('B12: ratings across all seeded sets remain isolated with consistent totals', async (t) => {
  const call = await start(t);
  const { data: sets } = await call('/sets');
  const cardsBySet = new Map();
  const expected = new Map();
  for (const set of sets) {
    const { data: cards } = await call(`/sets/${set.id}/cards`);
    cardsBySet.set(set.id, cards);
    expected.set(set.id, { setId: set.id, mastered: 0, review: 0, unseen: cards.length, total: cards.length });
  }
  for (const set of sets) {
    const cards = cardsBySet.get(set.id);
    for (const [index, level] of ['forgot', 'vague', 'remembered', 'mastered'].entries()) {
      assert.deepEqual(await call('/progress', 200, { setId: set.id, cardId: cards[index].id, level }), {
        data: { cardId: cards[index].id, level },
      });
    }
    Object.assign(expected.get(set.id), { mastered: 2, review: 2, unseen: cards.length - 4 });
    // Re-rating moves one card between groups without changing the assessed count.
    await call('/progress', 200, { setId: set.id, cardId: cards[0].id, level: 'mastered' });
    Object.assign(expected.get(set.id), { mastered: 3, review: 1 });
    const other = sets.find((item) => item.id !== set.id);
    assert.deepEqual(await call('/progress', 404, {
      setId: set.id, cardId: cardsBySet.get(other.id)[0].id, level: 'forgot',
    }), { error: { code: 'CARD_NOT_FOUND', message: 'Card not found' } });
    for (const item of sets) {
      assert.deepEqual(await call(`/progress/${item.id}`), { data: expected.get(item.id) });
    }
  }
});

test('B24: existing mode APIs keep their contracted shapes for single-mode consumers', async (t) => {
  const call = await start(t);
  const { data: cards } = await call('/sets/1/cards');
  const quiz = await call('/quiz/1?count=1');
  const matching = await call('/matching/1?count=1');
  assert.deepEqual(Object.keys(quiz).sort(), ['data', 'total']);
  assert.deepEqual(Object.keys(quiz.data[0]).sort(), ['answerIndex', 'cardId', 'options', 'prompt']);
  assert.deepEqual(Object.keys(matching).sort(), ['data', 'total']);
  assert.deepEqual(Object.keys(matching.data[0]).sort(), ['cardId', 'definition', 'term']);
  assert.equal(quiz.data[0].prompt, cards.find((card) => card.id === quiz.data[0].cardId).front);
  assert.equal(matching.data[0].term, cards.find((card) => card.id === matching.data[0].cardId).front);
  assert.deepEqual(Object.keys((await call('/progress/1')).data).sort(), ['mastered', 'review', 'setId', 'total', 'unseen']);
  const unsupported = await call('/sets/1/cards/single-mode', 404);
  assert.deepEqual(unsupported, { error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' } });
});
