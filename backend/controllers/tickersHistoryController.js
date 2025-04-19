// 📁 backend/controllers/tickersHistoryController.js
const redis = require('../redisClient');
const twelveData = require('../services/twelveDataService');
const yahooFinance = require('yahoo-finance2').default;
const axios = require('axios');

exports.getHistoricalData = async (req, res) => {
  const { id, type, bypass } = req.query;
  if (!id || !type) return res.status(400).json({ error: 'Missing id or type' });

  const cacheKey = `history:${type}:${id}`;

  try {
    if (bypass !== 'true') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.history?.length) {
          console.log(`⚡ Cache HIT for ${cacheKey}`);
          return res.json(parsed);
        }
        console.warn(`⚠️ Cache HIT but EMPTY for ${cacheKey}, ignoring...`);
      }
    }

    console.log(`🐢 Cache MISS for ${cacheKey}`);
    let history = [];
    let currency = 'EUR';

    if (type === 'crypto') {
      const { data } = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart`, {
        params: { vs_currency: 'eur', days: 30, interval: 'daily' }
      });

      if (!data?.prices?.length) throw new Error('No crypto data');

      history = data.prices.map(([ts, price]) => ({
        date: new Date(ts).toISOString().split('T')[0],
        price: parseFloat(price.toFixed(2))
      }));
    } else {
      try {
        const result = await twelveData.fetchTimeSeries(id, {
          period1: new Date(Date.now() - 30 * 86400000),
          interval: '1d'
        });

        if (!result?.quotes?.length) throw new Error('Empty from Twelve');

        currency = result.meta?.currency || 'EUR';
        history = result.quotes.filter(p => p.close != null).map(p => ({
          date: new Date(p.date).toISOString().split('T')[0],
          price: parseFloat(p.close.toFixed(2))
        }));
      } catch (err) {
        console.warn(`🛟 TwelveData failed for ${id}, fallback Yahoo`);

        const yahooResult = await yahooFinance.historical(id, {
          period1: new Date(Date.now() - 30 * 86400000),
          interval: '1d'
        });

        history = yahooResult.map(entry => ({
          date: entry.date.toISOString().split('T')[0],
          price: parseFloat(entry.close.toFixed(2))
        }));

        currency = yahooResult[0]?.currency || 'EUR';
      }
    }

    const payload = { history, currency };

    if (history.length > 0) {
      await redis.set(cacheKey, JSON.stringify(payload), 'EX', 43200);
      console.log(`📦 Cached ${cacheKey} for 12h`);
    } else {
      console.warn(`🚫 Not caching empty result for ${cacheKey}`);
    }

    res.json(payload);
  } catch (err) {
    console.error(`❌ Error histórico (${type}:${id}):`, err.message);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
};
