import assert from 'node:assert/strict';
import { sep } from 'node:path';
import { test } from 'node:test';
import { loadConfig } from '../src/config.js';

const envPath = new URL('./fixtures/.env.test', import.meta.url);

test('configuration reads PORT from an env file', () => {
  const config = loadConfig({ env: {}, envPath });
  assert.equal(config.port, 8123);
  assert.equal(config.sqlitePath.endsWith(`livrables${sep}backend${sep}test.sqlite`), true);
});

test('process environment takes precedence over env file', () => {
  assert.equal(loadConfig({ env: { PORT: '9000' }, envPath }).port, 9000);
});

test('missing env file defaults to port 8000', () => {
  const config = loadConfig({ env: {}, envPath: new URL('./fixtures/missing.env', import.meta.url) });
  assert.equal(config.port, 8000);
  assert.equal(config.sqlitePath.endsWith(`data${sep}vocab.sqlite`), true);
});

test('SQLITE_PATH supports memory and custom paths with process env precedence', () => {
  assert.equal(loadConfig({ env: { SQLITE_PATH: ':memory:' }, envPath }).sqlitePath, ':memory:');
  assert.equal(loadConfig({ env: { SQLITE_PATH: 'custom.sqlite' }, envPath }).sqlitePath.endsWith('custom.sqlite'), true);
});

test('port boundaries are accepted', () => {
  for (const value of ['0', '65535']) {
    assert.equal(loadConfig({ env: { PORT: value }, envPath }).port, Number(value));
  }
});

test('invalid ports fail with a useful error', () => {
  for (const PORT of ['', '-1', '65536', '3.5', 'abc', '8000abc', 'Infinity']) {
    assert.throws(() => loadConfig({ env: { PORT }, envPath }), /PORT must be an integer between 0 and 65535/);
  }
});

test('env file read errors other than missing file are not swallowed', () => {
  assert.throws(() => loadConfig({ env: {}, envPath: new URL('./fixtures/', import.meta.url) }));
});
