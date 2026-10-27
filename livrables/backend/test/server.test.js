import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { createApp } from '../src/app.js';

function launch(port) {
  return spawn(process.execPath, [fileURLToPath(new URL('../src/server.js', import.meta.url))], {
    cwd: fileURLToPath(new URL('./fixtures/', import.meta.url)),
    env: { ...process.env, PORT: port, SQLITE_PATH: ':memory:' },
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('server entry point starts from a different working directory and serves HTTP', { timeout: 10000 }, async (t) => {
  const child = launch('0');
  const closed = once(child, 'close');
  let output = '';
  let errors = '';
  child.stderr.on('data', (chunk) => { errors += chunk; });
  t.after(async () => {
    if (child.exitCode === null) child.kill();
    await closed;
  });
  const address = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => reject(new Error(`Server exited ${code}: ${errors}`)));
    child.stdout.on('data', (chunk) => {
      output += chunk;
      const match = output.match(/http:\/\/localhost:(\d+)\/api\/v1/);
      if (match) resolve(`http://localhost:${match[1]}/api/v1`);
    });
  });
  const response = await fetch(`${address}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('server entry point exits nonzero for invalid PORT', { timeout: 10000 }, async () => {
  const child = launch('invalid');
  let errors = '';
  child.stderr.on('data', (chunk) => { errors += chunk; });
  const [code] = await once(child, 'close');
  assert.equal(code, 1);
  assert.match(errors, /PORT must be an integer between 0 and 65535/);
});

test('B26: same service serves the current frontend, shared SPA route and unchanged API', async (t) => {
  const server = createApp({ sqlitePath: ':memory:' });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const home = await fetch(baseUrl);
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type'), /^text\/html; charset=utf-8$/);
  const html = await home.text();
  assert.match(html, /id="view-sets"/);
  assert.match(html, /id="view-shared-deck"/);

  const stylesheet = await fetch(`${baseUrl}/css/main.css`);
  assert.equal(stylesheet.status, 200);
  assert.match(stylesheet.headers.get('content-type'), /^text\/css; charset=utf-8$/);
  assert.ok((await stylesheet.text()).length > 0);

  const apiClient = await fetch(`${baseUrl}/js/api.js`);
  assert.equal(apiClient.status, 200);
  assert.match(await apiClient.text(), /DEFAULT_API_BASE_URL = '\/api\/v1'/);

  const sharedPage = await fetch(`${baseUrl}/shared/test-share-id`);
  assert.equal(sharedPage.status, 200);
  assert.match(sharedPage.headers.get('content-type'), /^text\/html; charset=utf-8$/);
  assert.match(await sharedPage.text(), /<base href="\/">/);

  const health = await fetch(`${baseUrl}/api/v1/health`);
  assert.equal(health.status, 200);
  assert.equal(health.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.deepEqual(await health.json(), { status: 'ok' });

  const unknownApi = await fetch(`${baseUrl}/api/v1/not-a-contract-route`);
  assert.equal(unknownApi.status, 404);
  assert.deepEqual(await unknownApi.json(), {
    error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found' },
  });
});
