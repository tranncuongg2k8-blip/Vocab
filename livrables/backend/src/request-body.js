export class InvalidRequest extends Error {}

// Bound memory usage while draining oversized requests without closing the socket.
export async function readJson(request, maxBytes = 16 * 1024) {
  const raw = await new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        chunks.length = 0;
        reject(new InvalidRequest(`Request body must not exceed ${maxBytes} bytes`));
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', () => reject(new InvalidRequest('Unable to read request body')));
    request.on('aborted', () => reject(new InvalidRequest('Request body was interrupted')));
  });
  try {
    const body = JSON.parse(raw);
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw new InvalidRequest('Request body must be a JSON object');
    }
    return body;
  } catch (error) {
    if (error instanceof InvalidRequest) throw error;
    throw new InvalidRequest('Request body must be valid JSON');
  }
}
