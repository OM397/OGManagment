// 📁 backend/redisClient.js
const Redis = require('ioredis');

function createMemoryRedisShim() {
    // Minimal in-memory shim for get/set/keys/hmset/hgetall/expire/del used in the app
    const store = new Map();
    const hashStore = new Map();
    const timers = new Map();
    const setWithTTL = (key, ttlSec, delFn) => {
        if (timers.has(key)) clearTimeout(timers.get(key));
        if (ttlSec) {
            timers.set(key, setTimeout(() => delFn(key), ttlSec * 1000));
        }
    };
    return {
        get: async (key) => store.get(key) || null,
        set: async (key, val, mode, ttl) => {
            store.set(key, val);
            if (mode === 'EX' && typeof ttl === 'number') setWithTTL(key, ttl, store.delete.bind(store));
            return 'OK';
        },
        keys: async (pattern) => {
            const regex = new RegExp('^' + pattern.replace(/[.*+?^${}()|[\]\\]/g, r => `\\${r}`).replace(/\\\*/g, '.*') + '$');
            return [...hashStore.keys()].concat([...store.keys()]).filter(k => regex.test(k));
        },
        del: async (keys) => {
            const arr = Array.isArray(keys) ? keys : [keys];
            let count = 0;
            for (const k of arr) {
                if (store.delete(k)) count++;
                if (hashStore.delete(k)) count++;
                if (timers.has(k)) { clearTimeout(timers.get(k)); timers.delete(k); }
            }
            return count;
        },
        hmset: async (key, obj) => { hashStore.set(key, { ...(hashStore.get(key) || {}), ...obj }); return 'OK'; },
        hset: async (key, field, value) => { hashStore.set(key, { ...(hashStore.get(key) || {}), [field]: value }); return 1; },
        hgetall: async (key) => hashStore.get(key) || {},
        expire: async (key, ttl) => { setWithTTL(key, ttl, (k) => { hashStore.delete(k); }); return 1; },
        on: () => {},
        // Add sendCommand for rate-limit-redis compatibility
        sendCommand: async (args) => {
            const [command, ...rest] = args;
            const cmd = command.toLowerCase();
            if (cmd === 'get') return this.get(rest[0]);
            if (cmd === 'set') return this.set(rest[0], rest[1], rest[2], rest[3]);
            // Add other commands if needed by the limiter
            return null;
        }
    };
}

let client;
try {
    // Prioritize REDIS_URL from environment variables (for production)
    if (process.env.REDIS_URL) {
        client = new Redis(process.env.REDIS_URL, {
            // Recommended options for cloud providers like Railway
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
        });
        client.on('connect', () => console.log('🔌 Connected to Redis via URL'));
        client.on('error', err => console.error('❌ Redis connection error:', err));
    } else {
        console.warn('⚠️ REDIS_URL not set. Using in-memory cache for development.');
        client = createMemoryRedisShim();
    }
} catch (e) {
    console.error('⚠️ Redis initialization failed. Falling back to in-memory cache:', e.message);
    client = createMemoryRedisShim();
}

module.exports = client;