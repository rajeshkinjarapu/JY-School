/**
 * Global Data Cache Service — JY School ERP
 * ──────────────────────────────────────────
 * Cache-first pattern: returns cached data INSTANTLY, refreshes in background.
 * All pages share this single layer → no duplicate API calls, instant navigation.
 *
 * Usage:
 *   import { DataCache } from '../services/dataCache';
 *   const students = await DataCache.get('students');
 *   DataCache.prefetch(['students', 'classes', 'exams']); // on app boot
 */
import api from '../api/axios';

// TTL per key (milliseconds)
const TTL: Record<string, number> = {
  students: 5 * 60 * 1000,   // 5 min
  classes:  3 * 60 * 1000,   // 3 min
  exams:    5 * 60 * 1000,   // 5 min
  teachers: 5 * 60 * 1000,   // 5 min
  subjects: 10 * 60 * 1000,  // 10 min
  payments: 2 * 60 * 1000,   // 2 min
};

// API endpoints per key
const ENDPOINTS: Record<string, string> = {
  students: '/api/students?limit=200&page=1',
  classes:  '/api/classes?limit=500',
  exams:    '/api/exams?limit=500',
  teachers: '/api/teachers?limit=500',
  subjects: '/api/subjects?limit=500',
  payments: '/api/fees/payments?limit=500&page=1',
};

// In-memory store (zero parse overhead — fastest possible)
const memCache: Record<string, { data: any[]; ts: number }> = {};

// Ongoing fetches (dedup parallel requests for same key)
const inflight: Record<string, Promise<any[]>> = {};

function lsKey(name: string) { return `jy_dc_${name}`; }

function readLocal(name: string): any[] | null {
  try {
    const raw = localStorage.getItem(lsKey(name));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < TTL[name] && Array.isArray(data) && data.length > 0) return data;
  } catch (_) {}
  return null;
}

function writeLocal(name: string, data: any[]) {
  try { localStorage.setItem(lsKey(name), JSON.stringify({ data, ts: Date.now() })); } catch (_) {}
}

async function fetchFromAPI(name: string): Promise<any[]> {
  // Deduplicate: if already fetching, return same promise
  if (inflight[name]) return inflight[name];

  const endpoint = ENDPOINTS[name];
  if (!endpoint) return [];

  inflight[name] = (async () => {
    try {
      const res: any = await api.get(endpoint);
      let data = res?.data?.data || res?.data || res;
      if (!Array.isArray(data)) data = [];
      memCache[name] = { data, ts: Date.now() };
      writeLocal(name, data);
      return data;
    } catch {
      return memCache[name]?.data || [];
    } finally {
      delete inflight[name];
    }
  })();

  return inflight[name];
}

export const DataCache = {
  /**
   * Get data — serves cache INSTANTLY, then refreshes silently in background.
   */
  async get(name: string, forceRefresh = false): Promise<any[]> {
    if (!forceRefresh) {
      // 1. Memory cache (instant, no I/O)
      const mem = memCache[name];
      if (mem && Date.now() - mem.ts < TTL[name]) {
        // Trigger background refresh if data is >50% through TTL
        if (Date.now() - mem.ts > TTL[name] * 0.5) {
          fetchFromAPI(name).catch(() => {});
        }
        return mem.data;
      }

      // 2. localStorage cache (fast, one parse)
      const local = readLocal(name);
      if (local) {
        memCache[name] = { data: local, ts: Date.now() };
        fetchFromAPI(name).catch(() => {}); // background refresh
        return local;
      }
    }

    // 3. Cold start — fetch from API
    return fetchFromAPI(name);
  },

  /**
   * Prefetch keys in parallel on app boot (non-blocking).
   */
  prefetch(names: string[]) {
    names.forEach(name => {
      if (!memCache[name] && !readLocal(name)) {
        fetchFromAPI(name).catch(() => {});
      }
    });
  },

  /** Invalidate a key — next .get() will fetch fresh */
  invalidate(name: string) {
    delete memCache[name];
    try { localStorage.removeItem(lsKey(name)); } catch (_) {}
  },

  /** Invalidate all keys */
  invalidateAll() {
    Object.keys(ENDPOINTS).forEach(name => {
      delete memCache[name];
      try { localStorage.removeItem(lsKey(name)); } catch (_) {}
    });
  },

  /** Manually set data (after create/edit/delete to keep cache fresh) */
  set(name: string, data: any[]) {
    memCache[name] = { data, ts: Date.now() };
    writeLocal(name, data);
  },

  /** Append a new item to cached list */
  append(name: string, item: any) {
    const existing = memCache[name]?.data || [];
    DataCache.set(name, [...existing, item]);
  },

  /** Remove an item from cached list by id */
  remove(name: string, id: string) {
    const existing = memCache[name]?.data || [];
    DataCache.set(name, existing.filter((i: any) => i.id !== id));
  },
};
