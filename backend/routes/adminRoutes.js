
// 📁 backend/routes/adminRoutes.js
const express = require('express');
const User = require('../models/User');
const isAdmin = require('../middleware/isAdmin');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Middleware requerido para todas las rutas
router.use(authMiddleware, isAdmin);

// Helper: intenta encontrar usuario insensible a mayúsculas si no existe en minúsculas (para usuarios legacy)
async function findUserCaseInsensitive(usernameLower) {
  // Primero intento directo (la mayoría de usuarios nuevos están en minúsculas)
  let user = await User.findOne({ username: usernameLower });
  if (user) return user;
  // Fallback: regex exacta insensible a mayúsculas (solo si contiene caracteres no minúscula)
  const needsCI = /[A-Z]/.test(usernameLower) === false; // usernameLower normalizado, pero igual buscamos legacy
  if (!user) {
    // Buscamos documento legacy cuyo username coincide ignorando case
    user = await User.findOne({ username: { $regex: new RegExp(`^${usernameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
  }
  // Si encontramos uno legacy con mayúsculas, lo normalizamos para futuras consultas
  if (user && user.username !== user.username.toLowerCase()) {
    try {
      user.username = user.username.toLowerCase();
      await user.save();
    } catch (_) {}
  }
  return user;
}

// PATCH /admin/users/:username/weekly-email → Cambiar preferencia de recibir mail semanal
router.patch('/admin/users/:username/weekly-email', async (req, res) => {
  let { username } = req.params;
  const { receiveWeeklyEmail } = req.body;
  if (!username) return res.status(400).json({ error: 'username requerido' });
  const usernameLower = username.toLowerCase();
  if (usernameLower === 'admin') return res.status(403).json({ error: 'No se puede modificar el admin.' });
  try {
    const user = await findUserCaseInsensitive(usernameLower);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    user.receiveWeeklyEmail = !!receiveWeeklyEmail;
    await user.save();
    res.status(200).json({ success: true, receiveWeeklyEmail: user.receiveWeeklyEmail });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar preferencia de email.' });
  }
});



// GET /admin-only → Verifica acceso de admin
router.get('/admin-only', async (req, res) => {
  try {
    const user = await User.findOne({ publicId: req.user.uid }).select('username');
    res.json({ uid: req.user.uid, maskedEmail: user?.username ? user.username[0] + '***' : null, message: '👑 Bienvenido admin' });
  } catch (e) {
    res.json({ uid: req.user.uid, message: '👑 Bienvenido admin' });
  }
});

// GET /admin/users → Lista todos los usuarios
router.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, { username: 1, role: 1, approved: 1, createdAt: 1, lastLogin: 1, receiveWeeklyEmail: 1 })
      .lean().sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron cargar los usuarios.' });
  }
});

// PATCH /admin/users/:username/approve → Aprobar usuario
router.patch('/admin/users/:username/approve', async (req, res) => {
  let { username } = req.params;
  if (!username) return res.status(400).json({ error: 'username requerido' });
  const usernameLower = username.toLowerCase();
  if (usernameLower === 'admin') return res.status(403).json({ error: 'No se puede modificar el admin.' });

  try {
    const user = await findUserCaseInsensitive(usernameLower);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (user.approved) return res.status(400).json({ error: 'Este usuario ya fue aprobado.' });

    user.approved = true;
    await user.save();

    res.status(200).json({ success: true, approved: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al aprobar usuario.' });
  }
});

// PATCH /admin/users/:username/role → Cambiar rol
router.patch('/admin/users/:username/role', async (req, res) => {
  let { username } = req.params;
  if (!username) return res.status(400).json({ error: 'username requerido' });
  const usernameLower = username.toLowerCase();
  if (usernameLower === 'admin') return res.status(403).json({ error: 'No se puede cambiar el rol del usuario admin.' });

  try {
    const user = await findUserCaseInsensitive(usernameLower);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    // Permitir rol granular desde el body
    const { role } = req.body;
    const allowedRoles = ['admin', 'user', 'readonly'];
    if (!allowedRoles.includes(role)) return res.status(400).json({ error: 'Rol no permitido.' });
    user.role = role;
    await user.save();

    res.status(200).json({ success: true, role });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando rol.' });
  }
});

// PATCH /admin/users/:username/block → Bloquear/desbloquear usuario
router.patch('/admin/users/:username/block', async (req, res) => {
  let { username } = req.params;
  if (!username) return res.status(400).json({ error: 'username requerido' });
  const usernameLower = username.toLowerCase();
  if (usernameLower === 'admin') return res.status(403).json({ error: 'No se puede bloquear el usuario admin.' });

  try {
    const user = await findUserCaseInsensitive(usernameLower);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    user.blocked = req.body.blocked === true;
    await user.save();
    res.status(200).json({ success: true, blocked: user.blocked });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando estado de bloqueo.' });
  }
});

// DELETE /admin/users/:username → Eliminar usuario
router.delete('/admin/users/:username', async (req, res) => {
  let { username } = req.params;
  if (!username) return res.status(400).json({ error: 'username requerido' });
  const usernameLower = username.toLowerCase();
  if (usernameLower === 'admin') return res.status(403).json({ error: 'No se puede eliminar el usuario admin.' });

  try {
    const user = await findUserCaseInsensitive(usernameLower);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
    await User.deleteOne({ _id: user._id });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando usuario.' });
  }
});


// --- MÉTRICAS DASHBOARD ADMIN --- //
const os = require('os');
const fs = require('fs');
const path = require('path');

// File to persist touch logs sent from clients (one JSON array per POST)
const TOUCH_LOG_PATH = path.join(__dirname, '../logs/touch.log');

// GET /admin/dashboard/active-users
router.get('/admin/dashboard/active-users', async (req, res) => {
  try {
    // Usuarios con lastLogin en los últimos 10 minutos
    const since = new Date(Date.now() - 10 * 60 * 1000);
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: since } });
    res.json({ activeUsers });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo usuarios activos.' });
  }
});

// GET /admin/dashboard/recent-errors
router.get('/admin/dashboard/recent-errors', async (req, res) => {
  try {
    const logPath = path.join(__dirname, '../logs/error.log');
    let errors = [];
    if (fs.existsSync(logPath)) {
      const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
      errors = lines.slice(-10).reverse(); // últimos 10 errores, más recientes primero
    }
    res.json({ errors });
  } catch (err) {
    res.status(500).json({ error: 'Error leyendo error.log.' });
  }
});

// GET /admin/dashboard/resource-usage
router.get('/admin/dashboard/resource-usage', (req, res) => {
  try {
    const usage = {
      memory: process.memoryUsage(),
      cpu: os.loadavg(),
      uptime: process.uptime(),
    };
    res.json({ usage });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo uso de recursos.' });
  }
});

// GET /admin/dashboard/api-calls
router.get('/admin/dashboard/api-calls', (req, res) => {
  try {
    const logPath = path.join(__dirname, '../logs/api.log');
    let calls = [];
    if (fs.existsSync(logPath)) {
      const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
      calls = lines.slice(-10).reverse(); // últimos 10 llamados, más recientes primero
    }
    res.json({ calls });
  } catch (err) {
    res.status(500).json({ error: 'Error leyendo api.log.' });
  }
});

// GET /admin/dashboard/services-status
router.get('/admin/dashboard/services-status', async (req, res) => {
  // Verifica estado de Redis, MongoDB, Mailing
  let redisStatus = 'unknown', mongoStatus = 'unknown', mailingStatus = 'unknown';
  try {
    // Redis
    try {
      const redis = require('../redisClient');
      if (redis && typeof redis.ping === 'function') {
        await redis.ping();
        redisStatus = 'ok';
      } else {
        redisStatus = 'fail';
      }
    } catch { redisStatus = 'fail'; }
    // MongoDB
    try {
      const mongoose = require('mongoose');
      mongoStatus = mongoose.connection.readyState === 1 ? 'ok' : 'fail';
    } catch { mongoStatus = 'fail'; }
    // Mailing (simple: si existe job activo)
    try {
      const { mailingJob } = require('../mailingScheduler');
      mailingStatus = mailingJob ? 'ok' : 'fail';
    } catch { mailingStatus = 'fail'; }
    res.json({ redis: redisStatus, mongo: mongoStatus, mailing: mailingStatus });
  } catch (err) {
    res.status(500).json({ error: 'Error verificando servicios.' });
  }
});


// POST /admin/dashboard/touch-logs -> receive touch logs from clients (admins only)
router.post('/admin/dashboard/touch-logs', async (req, res) => {
  try {
    const { logs } = req.body || {};
    if (!Array.isArray(logs)) return res.status(400).json({ error: 'logs array expected in body' });
    // Ensure logs dir exists
    try { fs.mkdirSync(path.dirname(TOUCH_LOG_PATH), { recursive: true }); } catch (_) {}
    // Append a single JSON line with timestamp and payload
    const payload = { receivedAt: new Date().toISOString(), count: logs.length, logs };
    fs.appendFileSync(TOUCH_LOG_PATH, JSON.stringify(payload) + '\n', 'utf8');
    res.status(200).json({ success: true, received: logs.length });
  } catch (err) {
    res.status(500).json({ error: 'Error saving touch logs.' });
  }
});

// GET /admin/dashboard/touch-logs -> read recent touch logs (admins only)
router.get('/admin/dashboard/touch-logs', async (req, res) => {
  try {
    let entries = [];
    if (fs.existsSync(TOUCH_LOG_PATH)) {
      const lines = fs.readFileSync(TOUCH_LOG_PATH, 'utf8').split('\n').filter(Boolean);
      // Parse last 50 entries
      const last = lines.slice(-50);
      entries = last.map(l => {
        try { return JSON.parse(l); } catch (_) { return { raw: l }; }
      }).reverse();
    }
    res.json({ entries });
  } catch (err) {
    res.status(500).json({ error: 'Error reading touch logs.' });
  }
});

module.exports = router;

// --- ADMIN: INVESTMENTS OVERVIEW ---
// Endpoint: GET /api/admin/investments/overview
// Returns a flat list of all users' investments with current price, data sources, FX info and compact history.
// Note: Protected by authMiddleware + isAdmin via router.use at top of file.
router.get('/admin/investments/overview', async (req, res) => {
  try {
    const users = await User.find({}, { username: 1, data: 1 }).lean();
    const rows = [];
    const { getCurrentQuotes, fetchHistory, getFXRatesWithSource } = require('../services/unifiedMarketDataService');

    // Collect all tickers to batch price fetch
    const tickers = [];
    for (const u of users) {
      const byGroup = u?.data?.Investments || {};
      for (const [groupName, list] of Object.entries(byGroup)) {
        if (!Array.isArray(list)) continue;
        for (const inv of list) {
          if (!inv?.id || !inv?.type) continue;
          tickers.push({ id: String(inv.id), type: inv.type === 'crypto' ? 'crypto' : 'stock' });
        }
      }
    }
    // Deduplicate tickers
    const seen = new Set();
    const unique = [];
    for (const t of tickers) {
      const key = t.type + ':' + t.id.toLowerCase();
      if (!seen.has(key)) { seen.add(key); unique.push({ id: t.id.toLowerCase(), type: t.type }); }
    }

    // Fetch current quotes in one shot
    const quotes = await getCurrentQuotes(unique);

    // Compute needed FX currencies for stocks
    const fxNeeded = new Set();
    Object.values(quotes.stocks || {}).forEach(s => { if (s.currency && s.currency !== 'EUR') fxNeeded.add(s.currency); });
  const fx = fxNeeded.size ? await getFXRatesWithSource([...fxNeeded]) : { rates: {}, source: 'none' };

    // Helper to get price entry by id/type
    const getPrice = (id, type) => {
      const lid = id.toLowerCase();
      return type === 'crypto' ? quotes.cryptos?.[lid] : quotes.stocks?.[lid];
    };

    // Build rows
    for (const u of users) {
      const byGroup = u?.data?.Investments || {};
      for (const [groupName, list] of Object.entries(byGroup)) {
        if (!Array.isArray(list)) continue;
        for (const inv of list) {
          if (!inv?.id || !inv?.type) continue;
          const type = inv.type === 'crypto' ? 'crypto' : 'stock';
          const pr = getPrice(inv.id, type) || null;
          const eurPrice = pr?.eur != null ? pr.eur : (pr?.rawPrice != null ? (pr.currency && pr.currency !== 'EUR' && fx.rates?.[pr.currency] ? +(pr.rawPrice / fx.rates[pr.currency]).toFixed(4) : pr.rawPrice) : null);
          const priceSource = pr?.source || 'unknown';
          const priceProvider = pr?.provider || null;
          const cacheSource = (priceSource && priceSource.startsWith('cache')) ? (pr?.cacheFrom || null) : null;
          const fxRate = type === 'stock' && pr?.currency && pr.currency !== 'EUR' ? fx.rates?.[pr.currency] : null;
          const fxSource = fxRate ? fx.source : null;
          const fxCacheSource = fxRate && fx?.source === 'cache' ? (fx.cacheFrom || null) : null;

          // Market Cap in EUR (if available)
          let marketCapEUR = null;
          if (type === 'stock' && pr?.marketCap != null) {
            if (pr.currency === 'EUR') marketCapEUR = pr.marketCap;
            else if (pr.currency && fx.rates?.[pr.currency]) marketCapEUR = +(pr.marketCap / fx.rates[pr.currency]).toFixed(0);
          } else if (type === 'crypto' && pr?.marketCap != null) {
            // For cryptos from CoinGecko, marketCap is already in EUR
            marketCapEUR = pr.marketCap;
          }

          // Small history sample (7 days) to keep it fast
          let history = null; let historySource = null; let change7dPct = null;
          try {
            const h = await fetchHistory(String(inv.id), type, 7);
            if (h?.history?.length) {
              history = h.history;
              historySource = h.source || 'live';
              // Compute 7d percent change using first vs last
              const first = history[0]?.price;
              const last = history[history.length - 1]?.price;
              if (first != null && last != null && first > 0) {
                change7dPct = +((last / first - 1)).toFixed(4);
              }
            }
          } catch (_) {}

          rows.push({
            user: u.username,
            group: groupName,
            id: String(inv.id),
            type,
            priceEUR: eurPrice,
            currency: pr?.currency || 'EUR',
            priceMeta: { currency: pr?.currency || 'EUR', source: priceSource, provider: priceProvider, fetchedAt: pr?.fetchedAt || null },
            cacheSource: cacheSource,
            fx: fxRate != null ? { rate: fxRate, base: 'EUR', quote: pr?.currency, source: fxSource } : null,
            fxCacheSource: fxCacheSource,
            marketCapEUR: marketCapEUR,
            change7dPct: change7dPct,
            history: history || [],
            historySource: historySource
          });
        }
      }
    }

    res.json({ count: rows.length, rows });
  } catch (err) {
    console.error('❌ Admin overview failed:', err.message);
    res.status(500).json({ error: 'Error construyendo overview de inversiones.' });
  }
});
