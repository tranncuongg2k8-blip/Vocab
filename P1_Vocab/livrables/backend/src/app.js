import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cards, sets } from './data.js';
import { InvalidRequest, readJson } from './request-body.js';
import { createQuiz } from './quiz.js';
import { createMyDecks, DEFAULT_SQLITE_PATH, IMPORT_TEMPLATE } from './my-decks.js';

const basePath = '/api/v1';
const frontendOrigin = 'http://localhost:3000';
const ratingLevels = new Set(['forgot', 'vague', 'remembered', 'mastered']);
const defaultFrontendPath = fileURLToPath(new URL('../../frontend/', import.meta.url));
const contentTypes = {
  '.css': 'text/css; charset=utf-8', '.gif': 'image/gif', '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

function json(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function failure(response, status, code, message) {
  json(response, status, { error: { code, message } });
}

function paginationValue(searchParams, key, fallback) {
  if (!searchParams.has(key)) return fallback;
  const value = searchParams.get(key);
  if (searchParams.getAll(key).length !== 1 || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

async function serveFrontend(request, response, pathname, frontendPath) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return false; }
  const root = resolve(frontendPath);
  let filePath = decoded === '/' || /^\/shared\/[^/]+\/?$/.test(decoded)
    ? resolve(root, 'index.html')
    : resolve(root, `.${decoded}`);
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) return false;
  try {
    if ((await stat(filePath)).isDirectory()) filePath = resolve(filePath, 'index.html');
    if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) return false;
    let body = await readFile(filePath);
    if (/^\/shared\/[^/]+\/?$/.test(decoded)) {
      body = Buffer.from(body.toString('utf8').replace('<head>', '<head><base href="/">'));
    }
    if (filePath === resolve(root, 'js/api.js')) {
      body = Buffer.from(body.toString('utf8').replace(
        "const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1';",
        "const DEFAULT_API_BASE_URL = '/api/v1';",
      ));
    }
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return false;
    throw error;
  }
  return true;
}

export function createApp({ sets: appSets = sets, cards: appCards = cards, quizRandomInt, sqlitePath = DEFAULT_SQLITE_PATH, frontendPath = defaultFrontendPath } = {}) {
  const myDecks = createMyDecks(sqlitePath);
  const server = createServer(async (request, response) => {
    response.setHeader('Vary', 'Origin');
    if (request.headers.origin === frontendOrigin) {
      response.setHeader('Access-Control-Allow-Origin', frontendOrigin);
    }

    try {
      const url = new URL(request.url, 'http://localhost');
      const match = url.pathname.match(/^\/api\/v1\/sets\/([^/]+)(\/cards)?$/);
      const progressMatch = url.pathname.match(/^\/api\/v1\/progress\/([^/]+)$/);
      const quizMatch = url.pathname.match(/^\/api\/v1\/quiz\/([^/]+)$/);
      const matchingMatch = url.pathname.match(/^\/api\/v1\/matching\/([^/]+)$/);
      const isProgressPost = url.pathname === `${basePath}/progress`;
      const myDecksCollection = url.pathname === `${basePath}/my/decks`;
      const myDeckPublish = url.pathname.match(/^\/api\/v1\/my\/decks\/([^/]+)\/publish$/);
      const myDeckUnpublish = url.pathname.match(/^\/api\/v1\/my\/decks\/([^/]+)\/unpublish$/);
      const myDeckGroups = url.pathname.match(/^\/api\/v1\/my\/decks\/([^/]+)\/groups$/);
      const myDeckItem = url.pathname.match(/^\/api\/v1\/my\/decks\/([^/]+)$/);
      const myGroupAction = url.pathname.match(/^\/api\/v1\/my\/groups\/([^/]+)(?:\/(cards|import))?$/);
      const myTemplate = url.pathname === `${basePath}/my/import/template`;
      const sharedDeck = url.pathname.match(/^\/api\/v1\/shared\/([^/]+)$/);
      const myRoutes = myDecksCollection || myDeckPublish || myDeckUnpublish || myDeckGroups || myDeckItem || myGroupAction || myTemplate;
      const knownRoute = url.pathname === `${basePath}/health`
        || url.pathname === `${basePath}/sets` || match || progressMatch || quizMatch || matchingMatch || isProgressPost || myRoutes || sharedDeck;
      let allowedMethods = 'GET';
      if (myDecksCollection) allowedMethods = 'GET, POST';
      else if (myDeckGroups) allowedMethods = 'GET, POST';
      else if (myDeckPublish) allowedMethods = 'PUT';
      else if (myDeckUnpublish) allowedMethods = 'POST';
      else if (myDeckItem || (myGroupAction && !myGroupAction[2])) allowedMethods = 'PUT, DELETE';
      else if (myGroupAction) allowedMethods = 'POST';
      else if (isProgressPost) allowedMethods = 'POST';

      if (request.method === 'OPTIONS' && knownRoute) {
        response.writeHead(204, {
          'Access-Control-Allow-Methods': `${allowedMethods}, OPTIONS`,
          'Access-Control-Allow-Headers': 'Content-Type',
        });
        response.end();
        return;
      }

      if (!knownRoute || !allowedMethods.split(', ').includes(request.method)) {
        const apiPath = url.pathname === basePath || url.pathname.startsWith(`${basePath}/`);
        if (!apiPath && await serveFrontend(request, response, url.pathname, frontendPath)) return;
        failure(response, 404, 'ROUTE_NOT_FOUND', 'Route not found');
        return;
      }

      if (myRoutes) {
        if (myTemplate) {
          response.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8' });
          response.end(IMPORT_TEMPLATE);
          return;
        }
        if (myDecksCollection) {
          if (request.method === 'GET') {
            json(response, 200, { data: myDecks.decks() });
            return;
          }
          const body = await readJson(request);
          if (Object.keys(body).some((key) => key !== 'title')) throw new InvalidRequest('Only title is accepted');
          json(response, 200, { data: myDecks.createDeck(body.title) });
          return;
        }
        if (myDeckPublish) {
          let id;
          try { id = decodeURIComponent(myDeckPublish[1]); } catch { throw new InvalidRequest('Invalid deck ID encoding'); }
          json(response, 200, { data: myDecks.publishDeck(id) });
          return;
        }
        if (myDeckUnpublish) {
          let id;
          try { id = decodeURIComponent(myDeckUnpublish[1]); } catch { throw new InvalidRequest('Invalid deck ID encoding'); }
          json(response, 200, { data: myDecks.unpublishDeck(id) });
          return;
        }
        if (myDeckItem) {
          let id;
          try { id = decodeURIComponent(myDeckItem[1]); } catch { throw new InvalidRequest('Invalid deck ID encoding'); }
          if (request.method === 'PUT') {
            const body = await readJson(request);
            if (Object.keys(body).some((key) => key !== 'title')) throw new InvalidRequest('Only title is accepted');
            json(response, 200, { data: myDecks.updateDeck(id, body.title) });
          } else {
            myDecks.deleteDeck(id);
            json(response, 200, { data: { id } });
          }
          return;
        }
        if (myDeckGroups) {
          let deckId;
          try { deckId = decodeURIComponent(myDeckGroups[1]); } catch { throw new InvalidRequest('Invalid deck ID encoding'); }
          if (request.method === 'GET') {
            json(response, 200, { data: myDecks.groups(deckId) });
          } else {
            const body = await readJson(request);
            if (Object.keys(body).some((key) => key !== 'title')) throw new InvalidRequest('Only title is accepted');
            json(response, 200, { data: myDecks.createGroup(deckId, body.title) });
          }
          return;
        }
        let groupId;
        try { groupId = decodeURIComponent(myGroupAction[1]); } catch { throw new InvalidRequest('Invalid group ID encoding'); }
        if (myGroupAction[2] === 'cards') {
          json(response, 200, { data: myDecks.createCard(groupId, await readJson(request)) });
        } else if (myGroupAction[2] === 'import') {
          const body = await readJson(request, 2 * 1024 * 1024);
          if (Object.keys(body).some((key) => key !== 'cards')) throw new InvalidRequest('Only cards is accepted');
          json(response, 200, { data: myDecks.importCards(groupId, body.cards) });
        } else if (request.method === 'PUT') {
          const body = await readJson(request);
          if (Object.keys(body).some((key) => key !== 'title')) throw new InvalidRequest('Only title is accepted');
          json(response, 200, { data: myDecks.updateGroup(groupId, body.title) });
        } else {
          json(response, 200, { data: myDecks.deleteGroup(groupId) });
        }
        return;
      }

      if (sharedDeck) {
        let shareId;
        try { shareId = decodeURIComponent(sharedDeck[1]); } catch { shareId = ''; }
        const deck = myDecks.sharedDeck(shareId);
        if (!deck) {
          failure(response, 404, 'DECK_NOT_FOUND', 'Deck not found');
          return;
        }
        json(response, 200, { data: deck });
        return;
      }

      if (isProgressPost) {
        const body = await readJson(request);
        if (!ratingLevels.has(body.level)) {
          failure(response, 400, 'INVALID_LEVEL', 'Invalid rating level');
          return;
        }
        if (typeof body.setId !== 'string' || typeof body.cardId !== 'string'
          || Object.keys(body).some((key) => !['setId', 'cardId', 'level'].includes(key))) {
          throw new InvalidRequest('Expected only string setId, cardId and level');
        }
        const { setId, cardId, level } = body;
        if (!appSets.some((set) => set.id === setId) && !myDecks.setDeck(setId)) {
          failure(response, 404, 'SET_NOT_FOUND', 'Set not found');
          return;
        }
        if (![...appCards, ...myDecks.allCards()].some((card) => card.id === cardId && card.setId === setId)) {
          failure(response, 404, 'CARD_NOT_FOUND', 'Card not found');
          return;
        }
        myDecks.setProgress(setId, cardId, level);
        json(response, 200, { data: { cardId, level } });
        return;
      }

      if (url.pathname === `${basePath}/health`) {
        json(response, 200, { status: 'ok' });
        return;
      }
      if (url.pathname === `${basePath}/sets`) {
        json(response, 200, { data: [
          ...appSets,
          ...myDecks.decks().map(({ id, title, cardCount, language }) => ({
            id, title, description: '', cardCount, language,
          })),
        ] });
        return;
      }

      let id;
      try {
        id = decodeURIComponent((matchingMatch || quizMatch || progressMatch || match)[1]);
      } catch {
        failure(response, 400, 'INVALID_REQUEST', 'Invalid set ID encoding');
        return;
      }
      const builtInSet = appSets.find((item) => item.id === id);
      const ownedDeck = myDecks.setDeck(id);
      const set = builtInSet ?? (ownedDeck && {
        id: ownedDeck.id, title: ownedDeck.title, description: '',
        cardCount: ownedDeck.cardCount, language: ownedDeck.language,
      });
      if (!set) {
        failure(response, 404, 'SET_NOT_FOUND', 'Set not found');
        return;
      }
      if (matchingMatch) {
        const setCards = [...appCards.filter((card) => card.setId === id), ...myDecks.cardsForSet(id)];
        const count = paginationValue(url.searchParams, 'count', 6);
        if (count === null || count === 0) {
          failure(response, 400, 'INVALID_PAGINATION', 'count must be a positive safe integer');
          return;
        }
        json(response, 200, {
          data: setCards.slice(0, Math.min(count, setCards.length)).map((card) => ({
            cardId: card.id, term: card.front, definition: card.meaning ?? card.back,
          })),
          total: setCards.length,
        });
        return;
      }
      if (quizMatch) {
        const setCards = [...appCards.filter((card) => card.setId === id), ...myDecks.cardsForSet(id)];
        const count = paginationValue(url.searchParams, 'count', setCards.length);
        if (count === null || (url.searchParams.has('count') && count === 0)) {
          failure(response, 400, 'INVALID_PAGINATION', 'count must be a positive safe integer');
          return;
        }
        json(response, 200, {
          data: createQuiz(setCards, [...appCards, ...myDecks.allCards()], Math.min(count, setCards.length), quizRandomInt),
          total: setCards.length,
        });
        return;
      }
      if (progressMatch) {
        const setCards = [...appCards.filter((card) => card.setId === id), ...myDecks.cardsForSet(id)];
        json(response, 200, { data: myDecks.progressForSet(id, setCards) });
        return;
      }
      if (!match[2]) {
        json(response, 200, { data: set });
        return;
      }

      const setCards = [...appCards.filter((card) => card.setId === id), ...myDecks.cardsForSet(id)];
      const limit = paginationValue(url.searchParams, 'limit', setCards.length);
      const offset = paginationValue(url.searchParams, 'offset', 0);
      if (limit === null || offset === null) {
        failure(response, 400, 'INVALID_PAGINATION', 'limit and offset must be non-negative safe integers');
        return;
      }
      json(response, 200, {
        data: setCards.slice(offset, offset + Math.min(limit, setCards.length)),
        total: setCards.length,
      });
    } catch (error) {
      if (response.destroyed) return;
      if (error instanceof InvalidRequest) {
        failure(response, 400, 'INVALID_REQUEST', error.message);
        return;
      }
      if (error.status && error.code) {
        failure(response, error.status, error.code, error.message);
        return;
      }
      console.error('Request failed:', error);
      failure(response, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
    }
  });
  server.once('close', () => myDecks.close());
  return server;
}
