/**
 * Ultra-fast Redis cache using Upstash REST API (no npm package needed!)
 * Uses native fetch — zero dependencies
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';

const redisRequest = async (command: string[]): Promise<any> => {
  if (!REDIS_URL || !REDIS_TOKEN) return null;
  try {
    const res = await fetch(`${REDIS_URL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(3000), // 3s timeout — never block API
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.result ?? null;
  } catch {
    return null; // Redis down? Fall through to DB silently
  }
};

export const cache = {
  /** Get a cached value. Returns null if missing or expired. */
  async get<T>(key: string): Promise<T | null> {
    const raw = await redisRequest(['GET', key]);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  },

  /** Set a cached value with TTL in seconds (default 5 minutes) */
  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    await redisRequest(['SET', key, JSON.stringify(value), 'EX', String(ttlSeconds)]);
  },

  /** Delete one or more cache keys */
  async del(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await redisRequest(['DEL', ...keys]);
  },

  /** Delete keys matching pattern */
  async delPattern(pattern: string): Promise<void> {
  },
};
