import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { InvalidRequest } from './request-body.js';

export const DEFAULT_SQLITE_PATH = fileURLToPath(new URL('../data/vocab.sqlite', import.meta.url));

export const WORD_TYPES = [
  'noun', 'verb', 'adjective', 'adverb', 'preposition', 'pronoun', 'conjunction',
  'determiner', 'interjection', 'phrasal verb', 'idiom', 'phrase', 'collocation', 'modal verb',
];

const cardFields = new Set(['front', 'back', 'phonetic', 'example', 'audioUrl', 'meaning', 'exampleVi', 'synonyms', 'antonyms', 'wordType']);

function requiredString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateCard(input, { importRow = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'Card must be an object';
  const allowedFields = importRow
    ? new Set(['front', 'phonetic', 'wordType', 'meaning', 'example', 'exampleVi'])
    : cardFields;
  if (Object.keys(input).some((key) => !allowedFields.has(key))) return 'Card contains unsupported fields';
  if (!requiredString(input.front)) return 'front is required';
  if (!requiredString(input.meaning) && !requiredString(input.back)) return 'meaning or back is required';
  if (input.back !== undefined && input.back !== null && typeof input.back !== 'string') return 'back must be a string';
  for (const field of ['phonetic', 'example']) {
    if (input[field] !== undefined && input[field] !== null && typeof input[field] !== 'string') return `${field} must be a string`;
  }
  for (const field of ['exampleVi', 'audioUrl']) {
    if (input[field] !== undefined && input[field] !== null && typeof input[field] !== 'string') return `${field} must be a string or null`;
  }
  if (input.wordType !== undefined && input.wordType !== null && !WORD_TYPES.includes(input.wordType)) return 'wordType is invalid';
  for (const field of ['synonyms', 'antonyms']) {
    if (input[field] !== undefined && (!Array.isArray(input[field]) || input[field].some((item) => typeof item !== 'string'))) {
      return `${field} must be an array of strings`;
    }
  }
  return null;
}

export function makeUserCard(input, group) {
  const meaning = requiredString(input.meaning) ? input.meaning.trim() : input.back.trim();
  return {
    id: randomUUID(),
    setId: group.deckId,
    front: input.front.trim(),
    back: requiredString(input.back) ? input.back.trim() : meaning,
    phonetic: input.phonetic ?? '',
    example: input.example ?? '',
    audioUrl: input.audioUrl ?? null,
    meaning,
    exampleVi: input.exampleVi ?? null,
    synonyms: input.synonyms ?? [],
    antonyms: input.antonyms ?? [],
    wordType: input.wordType ?? null,
    groupId: group.id,
  };
}

export function createMyDecks(sqlitePath = DEFAULT_SQLITE_PATH) {
  if (sqlitePath !== ':memory:') mkdirSync(dirname(sqlitePath), { recursive: true });
  const db = new DatabaseSync(sqlitePath);
  try {
    db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;
      BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS decks (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('draft', 'published'))
      );
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY, deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE, title TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS user_cards (
        id TEXT PRIMARY KEY,
        set_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
        group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        front TEXT NOT NULL, back TEXT NOT NULL, phonetic TEXT NOT NULL, example TEXT NOT NULL,
        audio_url TEXT, meaning TEXT NOT NULL, example_vi TEXT, synonyms TEXT NOT NULL,
        antonyms TEXT NOT NULL, word_type TEXT
      );
      CREATE TABLE IF NOT EXISTS progress (
        set_id TEXT NOT NULL, card_id TEXT NOT NULL, level TEXT NOT NULL,
        PRIMARY KEY (set_id, card_id)
      );
      COMMIT;
    `);
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch {}
    db.close();
    throw error;
  }

  const transaction = (callback) => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = callback();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };
  const json = (value) => JSON.stringify(value);
  const fromCard = (row) => ({
    id: row.id, setId: row.set_id, groupId: row.group_id, front: row.front, back: row.back,
    phonetic: row.phonetic, example: row.example, audioUrl: row.audio_url,
    meaning: row.meaning, exampleVi: row.example_vi,
    synonyms: JSON.parse(row.synonyms), antonyms: JSON.parse(row.antonyms), wordType: row.word_type,
  });
  const cardRows = db.prepare('SELECT * FROM user_cards WHERE set_id = ? ORDER BY rowid');
  const deckCards = (deckId) => cardRows.all(deckId).map(fromCard);
  const groupsForDeck = db.prepare('SELECT * FROM groups WHERE deck_id = ? ORDER BY rowid');
  const deckView = (deck) => ({
    id: deck.id, title: deck.title, status: deck.status,
    cardCount: db.prepare('SELECT count(*) AS count FROM user_cards WHERE set_id = ?').get(deck.id).count,
    groupCount: db.prepare('SELECT count(*) AS count FROM groups WHERE deck_id = ?').get(deck.id).count,
    language: 'en-vi',
  });
  const groupView = (group) => ({
    id: group.id, deckId: group.deck_id, title: group.title,
    cardCount: db.prepare('SELECT count(*) AS count FROM user_cards WHERE group_id = ?').get(group.id).count,
  });
  const requireDeck = (id) => {
    const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(id);
    if (!deck) throw Object.assign(new Error('Deck not found'), { status: 404, code: 'DECK_NOT_FOUND' });
    return deck;
  };
  const requireGroup = (id) => {
    const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
    if (!group) throw Object.assign(new Error('Group not found'), { status: 404, code: 'GROUP_NOT_FOUND' });
    return group;
  };
  const insertCard = db.prepare(`INSERT INTO user_cards
    (id, set_id, group_id, front, back, phonetic, example, audio_url, meaning, example_vi, synonyms, antonyms, word_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertUserCard = (input, group) => {
    const card = makeUserCard(input, { id: group.id, deckId: group.deck_id });
    insertCard.run(card.id, card.setId, card.groupId, card.front, card.back, card.phonetic, card.example,
      card.audioUrl, card.meaning, card.exampleVi, json(card.synonyms), json(card.antonyms), card.wordType);
    return card;
  };

  return {
    close: () => db.close(),
    decks: () => db.prepare('SELECT * FROM decks ORDER BY rowid').all().map(deckView),
    createDeck(title) {
      if (!requiredString(title)) throw new InvalidRequest('title is required');
      return transaction(() => {
        const deck = { id: randomUUID(), title: title.trim(), status: 'draft' };
        db.prepare('INSERT INTO decks (id, title, status) VALUES (?, ?, ?)').run(deck.id, deck.title, deck.status);
        return deckView(deck);
      });
    },
    updateDeck(id, title) {
      if (!requiredString(title)) throw new InvalidRequest('title is required');
      return transaction(() => {
        const deck = requireDeck(id);
        db.prepare('UPDATE decks SET title = ? WHERE id = ?').run(title.trim(), id);
        return deckView({ ...deck, title: title.trim() });
      });
    },
    publishDeck(id) {
      return transaction(() => {
        requireDeck(id);
        db.prepare("UPDATE decks SET status = 'published' WHERE id = ?").run(id);
        return deckView(requireDeck(id));
      });
    },
    unpublishDeck(id) {
      return transaction(() => {
        requireDeck(id);
        db.prepare("UPDATE decks SET status = 'draft' WHERE id = ?").run(id);
        return deckView(requireDeck(id));
      });
    },
    sharedDeck(shareId) {
      const deck = db.prepare("SELECT * FROM decks WHERE id = ? AND status = 'published'").get(shareId);
      if (!deck) return null;
      const deckCardsForShare = deckCards(deck.id);
      return {
        deck: deckView(deck),
        groups: groupsForDeck.all(deck.id).map(groupView),
        cards: deckCardsForShare,
        total: deckCardsForShare.length,
      };
    },
    deleteDeck(id) {
      transaction(() => {
        requireDeck(id);
        db.prepare('DELETE FROM progress WHERE set_id = ?').run(id);
        db.prepare('DELETE FROM decks WHERE id = ?').run(id);
      });
    },
    groups(deckId) {
      requireDeck(deckId);
      return groupsForDeck.all(deckId).map(groupView);
    },
    createGroup(deckId, title) {
      if (!requiredString(title)) throw new InvalidRequest('title is required');
      return transaction(() => {
        requireDeck(deckId);
        const group = { id: randomUUID(), deck_id: deckId, title: title.trim() };
        db.prepare('INSERT INTO groups (id, deck_id, title) VALUES (?, ?, ?)').run(group.id, group.deck_id, group.title);
        return groupView(group);
      });
    },
    updateGroup(id, title) {
      if (!requiredString(title)) throw new InvalidRequest('title is required');
      return transaction(() => {
        requireGroup(id);
        db.prepare('UPDATE groups SET title = ? WHERE id = ?').run(title.trim(), id);
        return groupView(requireGroup(id));
      });
    },
    deleteGroup(id) {
      return transaction(() => {
        requireGroup(id);
        const cardIds = db.prepare('SELECT id FROM user_cards WHERE group_id = ?').all(id).map((row) => row.id);
        const removeProgress = db.prepare('DELETE FROM progress WHERE card_id = ?');
        cardIds.forEach((cardId) => removeProgress.run(cardId));
        db.prepare('DELETE FROM groups WHERE id = ?').run(id);
        return { id };
      });
    },
    createCard(groupId, input) {
      const error = validateCard(input);
      if (error) throw new InvalidRequest(error);
      return transaction(() => {
        const group = requireGroup(groupId);
        return insertUserCard(input, group);
      });
    },
    importCards(groupId, inputs) {
      if (!Array.isArray(inputs)) throw new InvalidRequest('cards must be an array');
      const valid = [];
      const failed = [];
      inputs.forEach((input, index) => {
        const error = validateCard(input, { importRow: true });
        if (error) failed.push({ line: index + 1, error });
        else valid.push(input);
      });
      return transaction(() => {
        const group = requireGroup(groupId);
        valid.forEach((input) => insertUserCard(input, group));
        return { imported: valid.length, failed };
      });
    },
    setDeck(deckId) {
      const deck = db.prepare('SELECT * FROM decks WHERE id = ?').get(deckId);
      return deck ? deckView(deck) : null;
    },
    cardsForSet(deckId) {
      return deckCards(deckId);
    },
    allCards() {
      return db.prepare('SELECT * FROM user_cards ORDER BY rowid').all().map(fromCard);
    },
    setProgress(setId, cardId, level) {
      db.prepare(`INSERT INTO progress (set_id, card_id, level) VALUES (?, ?, ?)
        ON CONFLICT(set_id, card_id) DO UPDATE SET level = excluded.level`).run(setId, cardId, level);
    },
    progressForSet(setId, setCards) {
      const levels = new Map(db.prepare('SELECT card_id, level FROM progress WHERE set_id = ?').all(setId)
        .map((row) => [row.card_id, row.level]));
      let mastered = 0;
      let review = 0;
      for (const card of setCards) {
        const level = levels.get(card.id);
        if (level === 'remembered' || level === 'mastered') mastered++;
        if (level === 'forgot' || level === 'vague') review++;
      }
      return { setId, mastered, review, unseen: setCards.length - mastered - review, total: setCards.length };
    },
  };
}

export const IMPORT_TEMPLATE = 'word,IPA,wordType,meaning,example,exampleVi,notes\r\n';
