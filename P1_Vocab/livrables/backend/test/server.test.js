import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

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
