import crypto from 'node:crypto';

const JWT_SECRET = process.env.AI_ARENA_JWT_SECRET || 'ai_arena_3_quantum_hmac_secret_2026';

function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = String(str).replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Issue a signed HMAC-SHA256 JWT token using native node:crypto
 */
export function signJwt(payload, expiresInSec = 86400) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const nowSec = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: nowSec,
    exp: nowSec + expiresInSec
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signingInput)
    .digest();

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

/**
 * Verify an HMAC-SHA256 JWT token and return decoded claims or throw an error
 */
export function verifyJwt(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('JWT_MISSING');
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('JWT_MALFORMED');
  }

  const [encodedHeader, encodedPayload, encodedSig] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSig = base64UrlEncode(
    crypto.createHmac('sha256', JWT_SECRET).update(signingInput).digest()
  );

  const sigBufA = Buffer.from(encodedSig, 'utf8');
  const sigBufB = Buffer.from(expectedSig, 'utf8');
  if (sigBufA.length !== sigBufB.length || !crypto.timingSafeEqual(sigBufA, sigBufB)) {
    throw new Error('JWT_INVALID_SIGNATURE');
  }

  const claims = JSON.parse(base64UrlDecode(encodedPayload));
  const nowSec = Math.floor(Date.now() / 1000);
  if (claims.exp && nowSec > claims.exp) {
    throw new Error('JWT_EXPIRED');
  }

  return claims;
}

/**
 * In-memory Token Bucket Rate Limiter (Read vs Write endpoints)
 */
const buckets = new Map();

export function checkRateLimit(clientKey, isWrite = false) {
  const now = Date.now();
  const capacity = isWrite ? 60 : 240;
  const refillPerMs = capacity / 60000;
  const key = `${clientKey}:${isWrite ? 'W' : 'R'}`;

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: capacity - 1, lastRefill: now };
    buckets.set(key, bucket);
    return { allowed: true, remaining: Math.floor(bucket.tokens) };
  }

  const elapsed = Math.max(0, now - bucket.lastRefill);
  bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillPerMs);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    return { allowed: false, remaining: 0 };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: Math.floor(bucket.tokens) };
}
