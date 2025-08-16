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
	};
}

let client;
try {
	if (process.env.REDIS_URL) {
		client = new Redis(process.env.REDIS_URL);
		client.on('connect', () => console.log('🔌 Connected to Redis'));
		client.on('error', err => console.error('❌ Redis error:', err));
	} else {
		console.warn('⚠️ REDIS_URL not set. Using in-memory cache.');
		client = createMemoryRedisShim();
	}
} catch (e) {
	console.warn('⚠️ Redis init failed. Falling back to in-memory cache:', e.message);
	client = createMemoryRedisShim();
}

module.exports = client;
