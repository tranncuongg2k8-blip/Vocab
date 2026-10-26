import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { loadConfig } from '../livrables/backend/src/config.js';

let db;
try {
  const { sqlitePath } = loadConfig();
  if (!existsSync(sqlitePath)) throw new Error(`SQLite database does not exist: ${sqlitePath}`);
  db = new DatabaseSync(sqlitePath, { readOnly: true });
  const check = db.prepare('PRAGMA quick_check').get();
  if (Object.values(check)[0] !== 'ok') throw new Error(`SQLite integrity check failed: ${JSON.stringify(check)}`);
  const tables = new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name));
  for (const name of ['decks', 'groups', 'user_cards', 'progress']) {
    if (!tables.has(name)) throw new Error(`SQLite schema is missing table: ${name}`);
  }
  const counts = Object.fromEntries(['decks', 'groups', 'user_cards', 'progress'].map((name) => [
    name, db.prepare(`SELECT count(*) AS count FROM ${name}`).get().count,
  ]));
  process.stdout.write(`SQLite OK: ${sqlitePath}\n${JSON.stringify(counts)}\n`);
} catch (error) {
  process.stderr.write(`SQLite check failed: ${error.message}\n`);
  process.exitCode = 1;
} finally {
  db?.close();
}
