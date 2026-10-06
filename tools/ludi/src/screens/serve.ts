import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, relative, resolve, sep } from 'node:path';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.ico': 'image/x-icon',
};

export type StaticServer = {
  url: string;
  close: () => Promise<void>;
};

function safeFile(root: string, urlPath: string): string | null {
  const clean = urlPath.split('?')[0] ?? '/';
  const decoded = decodeURIComponent(clean);
  const target = resolve(root, `.${decoded}`);
  const rel = relative(root, target);
  if (rel.startsWith('..') || rel.includes(`..${sep}`)) return null;
  return target;
}

export function serveExport(root: string, port: number): Promise<StaticServer> {
  const index = join(root, 'index.html');
  return new Promise((resolveServer, reject) => {
    const server: Server = createServer((req, res) => {
      const file = safeFile(root, req.url ?? '/');
      const tryFile = file && existsSync(file) && statSync(file).isFile() ? file : null;
      const fallback = !tryFile && existsSync(index) ? index : null;
      const send = tryFile ?? fallback;
      if (!send) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      const type = MIME[extname(send).toLowerCase()] ?? 'application/octet-stream';
      res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
      createReadStream(send).pipe(res);
    });
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      resolveServer({
        url: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise((resClose, rej) => {
            server.close((err) => (err ? rej(err) : resClose()));
          }),
      });
    });
  });
}
