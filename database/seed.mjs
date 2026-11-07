import { getDb, ensureSeedData } from './db.mjs';

const db = getDb();
ensureSeedData(db);
console.log('[AI Arena 3.0] Database schema migrated and initial seed data verified successfully.');
