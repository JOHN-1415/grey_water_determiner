import { Readable } from 'node:stream';

export function createClient(app) {
  return async function request(method, path, options = {}) {
    const headers = { ...(options.headers || {}) };
    let bodyStream;

    if (options.body !== undefined && options.body !== null) {
      const payloadStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      headers['content-type'] = headers['content-type'] || 'application/json';
      headers['content-length'] = Buffer.byteLength(payloadStr);
      bodyStream = Readable.from([payloadStr]);
    } else {
      bodyStream = Readable.from([]);
    }

    const req = Object.assign(bodyStream, {
      method: method.toUpperCase(),
      url: path,
      headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])),
      connection: { remoteAddress: '127.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' }
    });

    return new Promise((resolve, reject) => {
      let responseStatusCode = 200;
      const responseHeaders = {};
      let responseBody = '';

      const res = {
        statusCode: 200,
        headersSent: false,
        setHeader(key, value) {
          responseHeaders[key.toLowerCase()] = value;
        },
        getHeader(key) {
          return responseHeaders[key.toLowerCase()];
        },
        status(code) {
          this.statusCode = code;
          responseStatusCode = code;
          return this;
        },
        json(data) {
          this.setHeader('content-type', 'application/json');
          this.end(JSON.stringify(data));
        },
        send(data) {
          this.end(data);
        },
        end(chunk) {
          if (chunk) {
            responseBody += chunk.toString();
          }
          this.headersSent = true;
          let parsedJson = null;
          try {
            parsedJson = JSON.parse(responseBody);
          } catch {
            parsedJson = null;
          }

          resolve({
            status: responseStatusCode,
            headers: responseHeaders,
            text: async () => responseBody,
            json: async () => parsedJson || responseBody
          });
        }
      };

      try {
        app.handle(req, res, (err) => {
          if (err) reject(err);
          else res.status(404).json({ error: 'NOT_FOUND' });
        });
      } catch (err) {
        reject(err);
      }
    });
  };
}

