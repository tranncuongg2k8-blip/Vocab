import { createApp } from './app.js';
import { loadConfig } from './config.js';

try {
  const { port, sqlitePath } = loadConfig();
  const server = createApp({ sqlitePath });
  server.on('error', (error) => {
    console.error(`Unable to start vocabulary API: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, () => {
    console.log(`Vocabulary API listening at http://localhost:${server.address().port}/api/v1`);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close());
  }
} catch (error) {
  console.error(`Unable to start vocabulary API: ${error.message}`);
  process.exitCode = 1;
}
