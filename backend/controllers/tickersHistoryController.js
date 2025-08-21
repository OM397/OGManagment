// 📁 backend/controllers/tickersHistoryController.js

const marketData = require('../services/unifiedMarketDataService');

function getLastNDates(days) {
  const dates = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function normalizeHistory(history, fullDateRange) {
  const map = Object.fromEntries(history.map(p => [p.date, p.price]));
  const result = [];
  let last = null;
  for (const date of fullDateRange) {
    if (map[date] != null) last = map[date];
    if (last != null) {
      result.push({ date, price: last });
    }
  }
  return result;
}

exports.getHistoricalData = async (req, res) => {
  const { id, type, bypass, days } = req.query;
  if (process.env.NODE_ENV !== 'production') {
   // console.log('[history] incoming', { path: req.path, originalUrl: req.originalUrl, id, type, bypass, hasAuthHeader: !!req.headers.authorization, cookies: Object.keys(req.cookies||{}) });
  }
  if (!id || !type) return res.status(400).json({ error: 'Missing id or type' });

  //console.log('📅 Historical data request:', { id, type, bypass });

  const fullDateRange = getLastNDates(30);

  try {
  const raw = await marketData.fetchHistory(id, type, days);
    if (raw && Array.isArray(raw.history) && raw.history.length) {
      const normalized = normalizeHistory(raw.history, fullDateRange);
      const payload = {
        history: normalized,
        currency: raw.currency,
        source: raw.source || 'live',
        fetchedAt: new Date().toISOString(),
        meta: { provider: 'unifiedMarketDataService' }
      };
      return res.json(payload);
    }

    // 🔁 Graceful fallback: if no history, build a flat series from current price
    try {
      const quote = await marketData.fetchPrice(id, type);
      if (quote?.price) {
        const flat = fullDateRange.map(date => ({ date, price: quote.price }));
        return res.json({ history: flat, currency: quote.currency || 'EUR' });
      }
    } catch (e) {
      console.warn('⚠️ Fallback price failed for history:', e.message);
    }

    console.error('🚫 No historical data or price available');
    return res.status(500).json({ error: 'No historical data found' });
  } catch (err) {
    console.error("❌ Historical data fetch failed:", err.message);
    // Last-chance: return a zeroed flat series to avoid blank charts
    const zeros = fullDateRange.map(date => ({ date, price: 0 }));
    return res.json({ history: zeros, currency: 'EUR' });
  }
};
