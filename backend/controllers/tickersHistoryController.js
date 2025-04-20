const redis = require('../redisClient');
const twelveData = require('../services/twelveDataService');
const yahooFinance = require('yahoo-finance2').default;
const finnhubService = require('../services/finnhubService');
const axios = require('axios');

exports.getHistoricalData = async (req, res) => {
  const { id, type, bypass } = req.query;
  console.log("📥 Incoming request:", { id, type, bypass });

  if (!id || !type) return res.status(400).json({ error: 'Missing id or type' });

  const cacheKey = `history:${type}:${id}`;

  try {
    if (bypass !== 'true') {
      const cached = await redis.get(cacheKey);
      console.log("📦 Redis cache hit?", !!cached);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.history?.length) {
          console.log("✅ Serving from Redis cache.");
          return res.json(parsed);
        }
      }
    }

    let history = [];
    let currency = 'EUR';

    if (type === 'crypto') {
      const coingeckoURL = `https://api.coingecko.com/api/v3/coins/${id}/market_chart`;
      console.log("🔗 Using CoinGecko:", coingeckoURL);

      try {
        const { data } = await axios.get(coingeckoURL, {
          params: { vs_currency: 'eur', days: 30, interval: 'daily' }
        });

        if (!data?.prices?.length) throw new Error('No crypto data');

        history = data.prices.map(([ts, price]) => ({
          date: new Date(ts).toISOString().split('T')[0],
          price: parseFloat(price.toFixed(2))
        }));
        console.log("✅ CoinGecko returned:", history.length);
      } catch (err) {
        if (err.response) {
          console.error("❌ CoinGecko API Error:", {
            status: err.response.status,
            data: err.response.data
          });
        } else {
          console.error("❌ CoinGecko Error:", err.message);
        }
        throw err;
      }

    } else {
      try {
        const tdParams = {
          period1: new Date(Date.now() - 30 * 86400000),
          interval: '1d'
        };
        console.log("🔗 Trying TwelveData:", { id, params: tdParams });

        const result = await twelveData.fetchTimeSeries(id, tdParams);

        if (!result?.quotes?.length) throw new Error('Empty from Twelve');

        currency = result.meta?.currency || 'EUR';
        history = result.quotes.filter(p => p.close != null).map(p => ({
          date: new Date(p.date).toISOString().split('T')[0],
          price: parseFloat(p.close.toFixed(2))
        }));
        console.log("✅ TwelveData returned:", history.length);
      } catch (err) {
        if (err.response) {
          console.warn("❌ TwelveData API Error:", {
            status: err.response.status,
            data: err.response.data
          });
        } else {
          console.warn("❌ TwelveData Error:", err.message);
        }

        try {
          console.log("🔗 Trying Yahoo Finance:", { id });
          const yahooResult = await yahooFinance.historical(id, {
            period1: new Date(Date.now() - 30 * 86400000),
            interval: '1d'
          });

          history = yahooResult.map(entry => ({
            date: entry.date.toISOString().split('T')[0],
            price: parseFloat(entry.close.toFixed(2))
          }));

          currency = yahooResult[0]?.currency || 'EUR';
          console.log("✅ Yahoo returned:", history.length);
        } catch (yfErr) {
          console.warn("❌ Yahoo Error:", yfErr.message);

          try {
            console.log("🔗 Trying Finnhub:", { id: id.toUpperCase() });
            history = await finnhubService.getHistory(id.toUpperCase());
            currency = 'USD';
            console.log("✅ Finnhub returned:", history.length);
          } catch (finnhubErr) {
            if (finnhubErr.response) {
              console.error("❌ Finnhub API Error:", {
                status: finnhubErr.response.status,
                data: finnhubErr.response.data
              });
            } else {
              console.error("❌ Finnhub Error:", finnhubErr.message);
            }

            return res.status(500).json({ error: 'All providers failed.' });
          }
        }
      }
    }

    const payload = { history, currency };
    if (history.length > 0) {
      console.log("💾 Caching response to Redis:", cacheKey);
      await redis.set(cacheKey, JSON.stringify(payload), 'EX', 43200);
    }

    res.json(payload);
  } catch (err) {
    console.error("💥 Unexpected error:", err.message);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
};
