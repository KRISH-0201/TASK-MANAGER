/**
 * Shared In-Memory Cache Module (Practical 9: node-cache)
 * Features standard TTL (60s), hit/miss counters, and fallback handling.
 */

let NodeCache;
let nodeCacheInstance = null;

try {
  NodeCache = require('node-cache');
  nodeCacheInstance = new NodeCache({ stdTTL: 60, checkperiod: 120 });
  console.log('[Cache] node-cache initialized with 60s default TTL');
} catch (err) {
  console.warn('[Cache] node-cache package not installed yet, using resilient fallback cache');
}

// Global stats counters
const stats = {
  hits: 0,
  misses: 0,
};

// Fallback in-memory map cache if node-cache is pending install
const fallbackMap = new Map();

const cache = {
  get: (key) => {
    if (nodeCacheInstance) {
      const val = nodeCacheInstance.get(key);
      if (val !== undefined) {
        stats.hits += 1;
        return val;
      }
      stats.misses += 1;
      return undefined;
    }

    // Fallback implementation
    const item = fallbackMap.get(key);
    if (!item) {
      stats.misses += 1;
      return undefined;
    }
    if (Date.now() > item.expiresAt) {
      fallbackMap.delete(key);
      stats.misses += 1;
      return undefined;
    }
    stats.hits += 1;
    return item.value;
  },

  set: (key, value, ttl = 60) => {
    if (nodeCacheInstance) {
      return nodeCacheInstance.set(key, value, ttl);
    }
    fallbackMap.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
    return true;
  },

  del: (key) => {
    if (nodeCacheInstance) {
      return nodeCacheInstance.del(key);
    }
    return fallbackMap.delete(key);
  },

  flush: () => {
    stats.hits = 0;
    stats.misses = 0;
    if (nodeCacheInstance) {
      nodeCacheInstance.flushAll();
    } else {
      fallbackMap.clear();
    }
    return true;
  },

  getStats: () => {
    const total = stats.hits + stats.misses;
    const hitRatio = total > 0 ? ((stats.hits / total) * 100).toFixed(1) + '%' : '0%';
    const keysCount = nodeCacheInstance ? nodeCacheInstance.keys().length : fallbackMap.size;
    const keysList = nodeCacheInstance ? nodeCacheInstance.keys() : Array.from(fallbackMap.keys());

    return {
      hits: stats.hits,
      misses: stats.misses,
      totalRequests: total,
      hitRatio,
      keysCount,
      activeKeys: keysList,
      defaultTTL: 60,
      engine: nodeCacheInstance ? 'node-cache' : 'in-memory-fallback',
    };
  },
};

module.exports = cache;
