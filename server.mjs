import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { getDb, ensureSeedData } from './database/db.mjs';
import { handleApiRequest } from './api/routes.mjs';
import { attachMultiplayerWsServer } from './game-server/wsServer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.join(__dirname, 'web');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

export function createAiArenaServer(customDbPath = null) {
  const db = getDb(customDbPath);
  ensureSeedData(db);

  let wsBroadcaster = null;

  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname.startsWith('/api/')) {
      await handleApiRequest(req, res, db, wsBroadcaster);
      return;
    }

    let filePath = url.pathname === '/' ? path.join(webDir, 'index.html') : path.join(webDir, url.pathname);
    if (!filePath.startsWith(webDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(webDir, 'index.html');
    }

    try {
      const ext = path.extname(filePath);
      const rawContent = fs.readFileSync(filePath);
      const acceptEncoding = String(req.headers['accept-encoding'] || '');
      const headers = {
        'Content-Type': MIME_TYPES[ext] || 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache'
      };
      if (acceptEncoding.includes('gzip') && rawContent.length > 512) {
        const compressed = zlib.gzipSync(rawContent);
        headers['Content-Encoding'] = 'gzip';
        headers['Content-Length'] = String(compressed.length);
        res.writeHead(200, headers);
        res.end(compressed);
      } else {
        headers['Content-Length'] = String(rawContent.length);
        res.writeHead(200, headers);
        res.end(rawContent);
      }
    } catch (err) {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });

  wsBroadcaster = attachMultiplayerWsServer(server, db);

  return { server, db, wsBroadcaster };
}

// Start server if executed directly
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const port = Number(process.env.PORT || 3300);
  const host = process.env.HOST || '0.0.0.0';
  const { server } = createAiArenaServer();
  server.listen(port, host, () => {
    console.log(`================================================================`);
    console.log(`🚀 ĐẤU TRƯỜNG AI - AI ARENA 3.0 SERVER ONLINE`);
    console.log(`🌐 Web 3D & HUD Client : http://localhost:${port}`);
    console.log(`🔌 Multiplayer WS      : ws://localhost:${port}`);
    console.log(`🛡️ Mode                : Server-Authoritative + ACID SQLite Ledger`);
    console.log(`================================================================`);
  });
}
