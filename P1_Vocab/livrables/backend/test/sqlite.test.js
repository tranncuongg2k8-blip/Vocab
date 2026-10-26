import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createApp } from '../src/app.js';

function temporaryDatabase() {
  const dir = mkdtempSync(join(tmpdir(), 'vocab-sqlite-'));
  return { dir, path: join(dir, 'vocab.sqlite'), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

async function start(t, sqlitePath) {
  const server = createApp({ sqlitePath });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  let closed = false;
  t.after(async () => {
    if (!closed) {
      server.closeAllConnections();
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
  return {
    server,
    async stop() {
      if (closed) return;
      server.closeAllConnections();
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      closed = true;
    },
    async call(path, { method = 'GET', body, status = 200 } = {}) {
      const response = await fetch(`${baseUrl}${path}`, body === undefined ? { method } : {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      assert.equal(response.status, status);
      return {
        contentType: response.headers.get('content-type'),
        body: response.headers.get('content-type')?.startsWith('application/json') ? await response.json() : await response.text(),
      };
    },
  };
}

test('B20/B21: empty file database initializes the schema without altering seed sets', async (t) => {
  const dbFile = temporaryDatabase();
  const api = await start(t, dbFile.path);
  t.after(dbFile.cleanup);
  const tables = new DatabaseSync(dbFile.path, { readOnly: true });
  const names = tables.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name);
  tables.close();
  assert.deepEqual(names.sort(), ['decks', 'groups', 'progress', 'user_cards']);
  assert.deepEqual((await api.call('/my/decks')).body, { data: [] });
  assert.equal((await api.call('/sets')).body.data.length, 3);
  const integrityDb = new DatabaseSync(dbFile.path, { readOnly: true });
  const integrity = integrityDb.prepare('PRAGMA quick_check').get();
  integrityDb.close();
  assert.equal(Object.values(integrity)[0], 'ok');
  await api.stop();
});

test('B20: SQLite check script validates a database selected through SQLITE_PATH', async (t) => {
  const dbFile = temporaryDatabase();
  const api = await start(t, dbFile.path);
  t.after(dbFile.cleanup);
  await api.stop();
  const result = spawnSync(process.execPath, ['scripts/check-sqlite.mjs'], {
    cwd: new URL('../../../', import.meta.url),
    env: { ...process.env, SQLITE_PATH: dbFile.path },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /SQLite OK:/);
  assert.match(result.stdout, /"decks":0/);
});

test('B21: Deck, Group, Card, published state and progress survive a server restart', async (t) => {
  const dbFile = temporaryDatabase();
  const first = await start(t, dbFile.path);
  t.after(dbFile.cleanup);
  const { data: deck } = (await first.call('/my/decks', { method: 'POST', body: { title: 'Persistent' } })).body;
  const { data: group } = (await first.call(`/my/decks/${deck.id}/groups`, {
    method: 'POST', body: { title: 'Saved words' },
  })).body;
  const { data: card } = (await first.call(`/my/groups/${group.id}/cards`, {
    method: 'POST', body: { front: 'persist', meaning: 'bền vững' },
  })).body;
  await first.call('/progress', {
    method: 'POST', body: { setId: deck.id, cardId: card.id, level: 'remembered' },
  });
  await first.call(`/my/decks/${deck.id}/publish`, { method: 'PUT' });
  assert.equal((await first.call(`/shared/${deck.id}`)).body.data.deck.status, 'published');
  await first.call(`/my/decks/${deck.id}/unpublish`, { method: 'POST' });
  assert.deepEqual((await first.call(`/shared/${deck.id}`, { status: 404 })).body, {
    error: { code: 'DECK_NOT_FOUND', message: 'Deck not found' },
  });
  await first.call(`/my/decks/${deck.id}/publish`, { method: 'PUT' });
  await first.stop();

  const second = await start(t, dbFile.path);
  assert.deepEqual((await second.call('/my/decks')).body.data[0], {
    ...deck, status: 'published', groupCount: 1, cardCount: 1,
  });
  assert.deepEqual((await second.call(`/my/decks/${deck.id}/groups`)).body, {
    data: [{ ...group, cardCount: 1 }],
  });
  assert.deepEqual((await second.call(`/sets/${deck.id}/cards`)).body, { data: [card], total: 1 });
  assert.deepEqual((await second.call(`/progress/${deck.id}`)).body, {
    data: { setId: deck.id, mastered: 1, review: 0, unseen: 0, total: 1 },
  });
  assert.deepEqual((await second.call(`/shared/${deck.id}`)).body.data.cards, [card]);
  await second.stop();
});

test('B21: file database supports Deck and Group CRUD with cascading Card and progress deletion', async (t) => {
  const dbFile = temporaryDatabase();
  const api = await start(t, dbFile.path);
  t.after(dbFile.cleanup);
  const { data: deck } = (await api.call('/my/decks', {
    method: 'POST', body: { title: 'CRUD deck' },
  })).body;
  const renamedDeck = (await api.call(`/my/decks/${deck.id}`, {
    method: 'PUT', body: { title: 'Renamed deck' },
  })).body.data;
  assert.equal(renamedDeck.title, 'Renamed deck');
  const { data: group } = (await api.call(`/my/decks/${deck.id}/groups`, {
    method: 'POST', body: { title: 'CRUD group' },
  })).body;
  const renamedGroup = (await api.call(`/my/groups/${group.id}`, {
    method: 'PUT', body: { title: 'Renamed group' },
  })).body.data;
  assert.equal(renamedGroup.title, 'Renamed group');
  const { data: card } = (await api.call(`/my/groups/${group.id}/cards`, {
    method: 'POST', body: { front: 'cascade', meaning: 'chuỗi' },
  })).body;
  await api.call('/progress', {
    method: 'POST', body: { setId: deck.id, cardId: card.id, level: 'forgot' },
  });
  await api.call(`/my/groups/${group.id}`, { method: 'DELETE' });
  assert.deepEqual((await api.call(`/sets/${deck.id}/cards`)).body, { data: [], total: 0 });
  assert.deepEqual((await api.call(`/progress/${deck.id}`)).body, {
    data: { setId: deck.id, mastered: 0, review: 0, unseen: 0, total: 0 },
  });
  const replacementGroup = (await api.call(`/my/decks/${deck.id}/groups`, {
    method: 'POST', body: { title: 'Replacement group' },
  })).body.data;
  const replacementCard = (await api.call(`/my/groups/${replacementGroup.id}/cards`, {
    method: 'POST', body: { front: 'delete deck', meaning: 'xóa bộ' },
  })).body.data;
  await api.call('/progress', {
    method: 'POST', body: { setId: deck.id, cardId: replacementCard.id, level: 'mastered' },
  });
  await api.call(`/my/decks/${deck.id}`, { method: 'DELETE' });
  assert.deepEqual((await api.call('/my/decks')).body, { data: [] });
  assert.deepEqual((await api.call(`/sets/${deck.id}/cards`, { status: 404 })).body, {
    error: { code: 'SET_NOT_FOUND', message: 'Set not found' },
  });
  await api.stop();
});

test('B21: an SQLite failure never truncates or replaces the existing database file', (t) => {
  const dbFile = temporaryDatabase();
  t.after(dbFile.cleanup);
  const original = Buffer.from('keep this invalid database intact\n');
  writeFileSync(dbFile.path, original);
  assert.throws(() => createApp({ sqlitePath: dbFile.path }));
  assert.deepEqual(readFileSync(dbFile.path), original);
});

test('B21: failed import rolls back rows already inserted in the same transaction', async (t) => {
  t.mock.method(console, 'error', () => {});
  const dbFile = temporaryDatabase();
  const first = await start(t, dbFile.path);
  t.after(dbFile.cleanup);
  const { data: deck } = (await first.call('/my/decks', { method: 'POST', body: { title: 'Atomic import' } })).body;
  const { data: group } = (await first.call(`/my/decks/${deck.id}/groups`, {
    method: 'POST', body: { title: 'Rows' },
  })).body;
  await first.stop();
  const triggerDb = new DatabaseSync(dbFile.path);
  triggerDb.exec(`CREATE TRIGGER reject_test_card BEFORE INSERT ON user_cards
    WHEN NEW.front = 'explode' BEGIN SELECT RAISE(ABORT, 'forced test failure'); END`);
  triggerDb.close();

  const second = await start(t, dbFile.path);
  const result = await second.call(`/my/groups/${group.id}/import`, {
    method: 'POST', status: 500,
    body: { cards: [
      { front: 'inserted-first', meaning: 'should roll back' },
      { front: 'explode', meaning: 'force SQL error' },
    ] },
  });
  assert.deepEqual(result.body, { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } });
  assert.deepEqual((await second.call(`/sets/${deck.id}/cards`)).body, { data: [], total: 0 });
  await second.stop();
});

test('B21: separate connections safely upsert the same seed progress key concurrently', async (t) => {
  const dbFile = temporaryDatabase();
  const first = await start(t, dbFile.path);
  t.after(dbFile.cleanup);
  const second = await start(t, dbFile.path);
  const results = await Promise.all([
    first.call('/progress', { method: 'POST', body: { setId: '1', cardId: '1', level: 'forgot' } }),
    second.call('/progress', { method: 'POST', body: { setId: '1', cardId: '1', level: 'mastered' } }),
  ]);
  assert.deepEqual(results.map((result) => result.body).sort((a, b) => a.data.level.localeCompare(b.data.level)), [
    { data: { cardId: '1', level: 'forgot' } },
    { data: { cardId: '1', level: 'mastered' } },
  ]);
  const stats = (await first.call('/progress/1')).body.data;
  assert.equal(stats.total, 10);
  assert.equal(stats.mastered + stats.review + stats.unseen, 10);
  assert.equal(stats.mastered + stats.review, 1);
  assert.ok(stats.mastered === 1 || stats.review === 1);
  await first.stop();
  await second.stop();
});

test('B21/B23: unlimited Deck and Card counts persist in SQLite', async (t) => {
  const dbFile = temporaryDatabase();
  const api = await start(t, dbFile.path);
  t.after(dbFile.cleanup);
  for (let index = 0; index < 5; index++) {
    assert.equal((await api.call('/my/decks', { method: 'POST', body: { title: `Deck ${index}` } })).body.data.status, 'draft');
  }
  const { data: deck } = (await api.call('/my/decks')).body;
  const selected = deck.find((item) => item.title === 'Deck 0');
  const { data: group } = (await api.call(`/my/decks/${selected.id}/groups`, {
    method: 'POST', body: { title: 'Unlimited cards' },
  })).body;
  const rows = Array.from({ length: 601 }, (_, index) => ({ front: `word${index}`, meaning: `meaning ${index}` }));
  assert.equal((await api.call(`/my/groups/${group.id}/import`, { method: 'POST', body: { cards: rows } })).body.data.imported, 601);
  assert.equal((await api.call(`/sets/${selected.id}/cards`)).body.total, 601);
  await api.stop();
});
