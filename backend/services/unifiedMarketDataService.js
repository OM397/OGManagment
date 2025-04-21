// 📁 services/unifiedMarketDataService.js

const yahooFinance = require('yahoo-finance2').default;
const twelveData = require('./twelveDataService');
const finnhubService = require('./finnhubService');
const axios = require('axios');
const redis = require('../redisClient');
const { getIdForApi } = require('../utils/symbolMap');

const FX_CACHE_KEY = 'fx:rates';
const FX_TTL = 3600;
const PRICE_TTL = 60;
const HISTORY_TTL = 43200;

// EXCHANGE RATES

async function getFXRates(currencies) {
  console.log('🌍 Getting FX Rates for:', currencies);
  const cache = await redis.get(FX_CACHE_KEY);
  if (cache) {
    console.log('📦 FX Rates from cache');
    return JSON.parse(cache);
  }

  const symbols = currencies.filter(c => c !== 'EUR').join(',');
  const res = await axios.get('https://api.frankfurter.app/latest', {
    params: { from: 'EUR', to: symbols }
  });

  console.log('📈 FX Rates API response:', res.data);
  await redis.set(FX_CACHE_KEY, JSON.stringify(res.data?.rates), 'EX', FX_TTL);
  return res.data?.rates;
}

// ACTUAL PRICES

async function fetchPrice(id, type) {
  console.log('💸 Fetching price for:', id, '| Type:', type);
  const cacheKey = `price:${type}:${id.toLowerCase()}`;
  let quote, currency = 'EUR';

  // 1 Try Yahoo Finance
  try {
    const symbol = getIdForApi(id, type, 'yahoo') || id;
    const res = await yahooFinance.quote(symbol);
    if (res?.regularMarketPrice) {
      quote = { price: res.regularMarketPrice, currency: res.currency?.toUpperCase() || 'EUR' };
      console.log('✅ Yahoo Finance quote:', quote);
    }
  } catch (e) {
    console.warn('❌ Yahoo failed:', e.message);
  }

  // 2 Try Finnhub
  if (!quote) {
    try {
      const symbol = getIdForApi(id, type, 'finnhub') || id;
      quote = await finnhubService.getQuote(symbol);
      console.log('✅ Finnhub quote:', quote);
    } catch (e) {
      console.warn('❌ Finnhub failed:', e.message);
    }
  }

  // 3 Try TwelveData
  if (!quote) {
    try {
      const symbol = getIdForApi(id, type, 'twelve') || id;
      quote = await twelveData.fetchQuote(symbol);
      console.log('✅ TwelveData quote:', quote);
    } catch (e) {
      console.warn('❌ TwelveData failed:', e.message);
    }
  }

  // 4 Fallback to cache if all providers fail
  if (!quote?.price) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log('📦 Price from cache (fallback) for', id);
        return JSON.parse(cached);
      }
    } catch (err) {
      console.warn('⚠️ Redis cache fallback failed:', err.message);
    }

    console.error('🚫 No quote found for:', id);
    return null;
  }

  if (quote.currency === 'GBX') {
    quote.price /= 100;
    quote.currency = 'GBP';
  }
  if (quote.currency === 'GBP' && quote.price > 1000) {
    quote.price /= 100;
  }

  await redis.set(cacheKey, JSON.stringify(quote), 'EX', PRICE_TTL);
  return quote;
}

// HISTORICAL DATA (refactored: live-first, cache-fallback)

async function fetchHistory(id, type) {
  console.log('📉 Fetching history for:', id, '| Type:', type);
  const cacheKey = `history:${type}:${id}`;

  const fullDateRange = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const normalize = (data) => {
    const map = Object.fromEntries(data.map(p => [p.date, p.price]));
    let last = null;
    return fullDateRange.map(date => {
      if (map[date] != null) last = map[date];
      return last ? { date, price: last } : null;
    }).filter(Boolean);
  };

  let history = [];
  let currency = 'EUR';

  // 1 Try TwelveData
  try {
    const symbol = getIdForApi(id, type, 'twelve') || id;
    const td = await twelveData.fetchTimeSeries(symbol, {
      interval: '1d',
      period1: new Date(Date.now() - 30 * 86400000)
    });
    if (td?.quotes?.length) {
      currency = td.meta?.currency || 'EUR';
      history = td.quotes.map(p => ({
        date: new Date(p.date).toISOString().split('T')[0],
        price: +p.close.toFixed(2)
      }));
      console.log('✅ TwelveData history:', history.length, 'items');
    }
  } catch (e) {
    console.warn('❌ TwelveData history failed:', e.message);
  }

  // 2 Yahoo fallback
  if (!history.length) {
    try {
      const symbol = getIdForApi(id, type, 'yahoo') || id;
      const yf = await yahooFinance.historical(symbol, {
        interval: '1d',
        period1: new Date(Date.now() - 30 * 86400000)
      });
      history = yf.map(p => ({
        date: p.date.toISOString().split('T')[0],
        price: +p.close.toFixed(2)
      }));
      currency = yf[0]?.currency || 'EUR';
      console.log('✅ Yahoo Finance history:', history.length, 'items');
    } catch (e) {
      console.warn('❌ Yahoo history failed:', e.message);
    }
  }

  // 3 Finnhub fallback
  if (!history.length) {
    try {
      const symbol = getIdForApi(id, type, 'finnhub') || id;
      history = await finnhubService.getHistory(symbol);
      currency = 'USD';
      console.log('✅ Finnhub history:', history.length, 'items');
    } catch (e) {
      console.warn('❌ Finnhub history failed:', e.message);
    }
  }

  // 4 Final fallback: Redis cache
  if (!history.length) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log('📦 History from cache (fallback) for', id);
        return JSON.parse(cached);
      }
    } catch (err) {
      console.warn('⚠️ Redis history fallback failed:', err.message);
    }

    console.error('🚫 No historical data found for:', id);
    return null;
  }

  const result = { history: normalize(history), currency };
  await redis.set(cacheKey, JSON.stringify(result), 'EX', HISTORY_TTL);
  return result;
}


// CURRENT QUOTES (unchanged)

async function getCurrentQuotes(tickers) {
  console.log('📥 Market data request received:', tickers);
  const result = { cryptos: {}, stocks: {} };
  const currencies = new Set();

  for (const { id, type } of tickers) {
    if (!id || !type) continue;

    if (type === 'crypto') {
      let cryptoPrice = null;
      let coinGeckoFailed = false;
      let yahooFailed = false;

      try {
        const cgRes = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
          params: { ids: id.toLowerCase(), vs_currencies: 'eur' }
        });
        if (cgRes.data[id]) {
          cryptoPrice = { eur: cgRes.data[id].eur };
          console.log(`✅ Crypto price from CoinGecko: ${id} = €${cryptoPrice.eur}`);
        } else {
          coinGeckoFailed = true;
        }
      } catch (err) {
        coinGeckoFailed = true;
        console.error(`❌ CoinGecko error for ${id}:`, err.message);
      }

      if (!cryptoPrice) {
        try {
          const yf = await yahooFinance.quote(`${id.toUpperCase()}-EUR`);
          if (yf?.regularMarketPrice) {
            cryptoPrice = { eur: yf.regularMarketPrice };
            console.log(`✅ Crypto price from Yahoo: ${id} = €${cryptoPrice.eur}`);
          } else {
            yahooFailed = true;
          }
        } catch (err) {
          yahooFailed = true;
          console.error(`❌ Yahoo fallback failed for crypto ${id}:`, err.message);
        }
      }

      if (cryptoPrice) {
        result.cryptos[id.toLowerCase()] = cryptoPrice;
      } else {
        console.warn(`🚫 No price found for crypto: ${id} (CoinGecko failed: ${coinGeckoFailed}, Yahoo failed: ${yahooFailed})`);
      }

      continue;
    }

    if (type === 'stock') {
      try {
        const quote = await fetchPrice(id, type);
        if (!quote) continue;

        let price = quote.price;
        let currency = quote.currency;

        if (currency !== 'EUR') currencies.add(currency);
        result.stocks[id.toLowerCase()] = { rawPrice: price, currency };
      } catch (err) {
        console.error(`❌ Price error for stock ${id}:`, err.message);
      }
    }
  }

  let fxRates = {};
  if (currencies.size > 0) {
    try {
      fxRates = await getFXRates(Array.from(currencies));
    } catch (e) {
      console.warn('⚠️ Could not fetch FX rates:', e.message);
    }
  }

  for (const [id, data] of Object.entries(result.stocks)) {
    const rate = data.currency !== 'EUR' ? fxRates[data.currency] || 1 : 1;
    result.stocks[id].eur = Math.round((data.rawPrice / rate) * 1000) / 1000;
    result.stocks[id].conversionRate = rate;
  }

  return result;
}


module.exports = {
  fetchPrice,
  fetchHistory,
  getFXRates,
  getCurrentQuotes,
};
