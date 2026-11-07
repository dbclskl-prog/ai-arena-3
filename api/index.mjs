import { getDb, ensureSeedData } from '../database/db.mjs';
import { handleApiRequest } from './routes.mjs';

let seeded = false;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const db = getDb();
  if (!seeded) {
    ensureSeedData(db);
    seeded = true;
  }

  await handleApiRequest(req, res, db, null);
}
