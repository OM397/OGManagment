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
  const { id, type, bypass } = req.query;
  if (!id || !type) return res.status(400).json({ error: 'Missing id or type' });

  //console.log('📅 Historical data request:', { id, type, bypass });

  const fullDateRange = getLastNDates(30);

  try {
    const raw = await marketData.fetchHistory(id, type);
    if (!raw || !raw.history?.length) {
      console.error('🚫 No historical data returned');
      return res.status(500).json({ error: 'No historical data found' });
    }

    const normalized = normalizeHistory(raw.history, fullDateRange);
    const payload = { history: normalized, currency: raw.currency };

    res.json(payload);
  } catch (err) {
    console.error("❌ Historical data fetch failed:", err.message);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
};
