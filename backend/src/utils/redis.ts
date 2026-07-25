import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

// Create Redis instance conditionally
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('✅ Connected to Upstash Redis (Cloud)');
  } catch (error) {
    console.error('❌ Failed to connect to Upstash Redis:', error);
  }
} else {
  console.warn('⚠️ Upstash Redis variables not found. Falling back to direct DB queries.');
}

export { redis };
