// 📁 backend/middleware/rateLimiter.js
const { rateLimit } = require('express-rate-limit');
// Import compatible con CJS para rate-limit-redis v4 (named export)
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('../redisClient');

const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV !== 'production' && !isTest;

// Crea el almacén de rate-limit en Redis solo si hay un cliente real (ioredis)
// y así evitamos errores en local cuando usamos el shim en memoria.
let store;
const isIoredis = typeof redisClient?.call === 'function';
const isReady = isIoredis && (redisClient?.status === 'ready' || redisClient?.status === 'connect' || redisClient?.status === 'connecting');
const useRedis = !!process.env.REDIS_URL && isIoredis && isReady;
if (useRedis) {
  store = new RedisStore({
    // ioredis expone `.call(command, ...args)` para comandos crudos
    sendCommand: (...args) => redisClient.call(...args),
    // Prefijo para evitar colisiones de claves
    prefix: 'rl:',
  });
}

// Limitador general y permisivo para toda la API
const apiLimiter = rateLimit({
  store: isTest ? undefined : store, // Redis si está disponible y no es test; si no, memoria
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDev ? 5000 : 1500, // Límite alto para uso normal
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta más tarde.' },
});

// Limitador más estricto para rutas de autenticación sensibles
const authLimiter = rateLimit({
  store: isTest ? undefined : store,
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDev ? 100 : 50, // Límite más bajo pero razonable (50 intentos)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación. Intenta más tarde.' },
});

// Limitador para la ruta de refresco de token
const refreshLimiter = rateLimit({
  store: isTest ? undefined : store,
  windowMs: 60 * 1000, // 1 minuto
  max: isDev ? 120 : 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de renovación.' },
});

module.exports = { apiLimiter, authLimiter, refreshLimiter };