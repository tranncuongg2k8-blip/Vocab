import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';

export function loadConfig({
  env = process.env,
  envPath = new URL('../.env', import.meta.url),
} = {}) {
  let fileEnv = {};
  try {
    fileEnv = parseEnv(readFileSync(envPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const value = env.PORT ?? fileEnv.PORT ?? '8000';
  if (!/^\d+$/.test(value) || Number(value) > 65535) {
    throw new Error('PORT must be an integer between 0 and 65535');
  }
  const sqlitePath = env.SQLITE_PATH ?? fileEnv.SQLITE_PATH ?? fileURLToPath(new URL('../data/vocab.sqlite', import.meta.url));
  const backendDir = dirname(fileURLToPath(new URL('../.env', import.meta.url)));
  return {
    port: Number(value),
    sqlitePath: sqlitePath === ':memory:' ? sqlitePath : isAbsolute(sqlitePath) ? sqlitePath : resolve(backendDir, sqlitePath),
  };
}
