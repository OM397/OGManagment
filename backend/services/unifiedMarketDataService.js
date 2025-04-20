// 📁 services/marketDataService.js

const yahooFinance = require('yahoo-finance2').default;
const twelveData = require('./twelveDataService');
const finnhubService = require('./finnhubService');
const axios = require('axios');
const redis = require('../redisClient');

const FX_CACHE_KEY = 'fx:rates';
const FX_TTL = 3600; // 1 hour
const PRICE_TTL = 60; // 1 min
const HISTORY_TTL = 43200; // 12h

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

async function fetchPrice(id, type) {
  console.log('💸 Fetching price for:', id, '| Type:', type);
  const cacheKey = `price:${type}:${id.toLowerCase()}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log('📦 Price from cache for', id);
    return JSON.parse(cached);
  }

  let quote, currency = 'EUR';
  const cleanId = id.toUpperCase().split('.')[0];

  try {
    const res = await yahooFinance.quote(id.toUpperCase());
    if (res?.regularMarketPrice) {
      quote = { price: res.regularMarketPrice, currency: res.currency?.toUpperCase() || 'EUR' };
      console.log('✅ Yahoo Finance quote:', quote);
    }
  } catch (e) {
    console.warn('❌ Yahoo failed:', e.message);
  }

  if (!quote) {
    try {
      quote = await finnhubService.getQuote(id.toUpperCase());
      console.log('✅ Finnhub quote:', quote);
    } catch (e) {
      console.warn('❌ Finnhub failed:', e.message);
    }
  }

  if (!quote) {
    try {
      quote = await twelveData.fetchQuote(cleanId);
      console.log('✅ TwelveData quote:', quote);
    } catch (e) {
      console.warn('❌ TwelveData failed:', e.message);
    }
  }

  if (!quote?.price) {
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

async function fetchHistory(id, type) {
  console.log('📉 Fetching history for:', id, '| Type:', type);
  const cacheKey = `history:${type}:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log('📦 History from cache for', id);
    return JSON.parse(cached);
  }

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

  try {
    const td = await twelveData.fetchTimeSeries(id, { interval: '1d', period1: new Date(Date.now() - 30 * 86400000) });
    if (td?.quotes?.length) {
      currency = td.meta?.currency || 'EUR';
      history = td.quotes.map(p => ({ date: new Date(p.date).toISOString().split('T')[0], price: +p.close.toFixed(2) }));
      console.log('✅ TwelveData history:', history.length, 'items');
    }
  } catch (e) {
    console.warn('❌ TwelveData history failed:', e.message);
  }

  if (!history.length) {
    try {
      const yf = await yahooFinance.historical(id, { interval: '1d', period1: new Date(Date.now() - 30 * 86400000) });
      history = yf.map(p => ({ date: p.date.toISOString().split('T')[0], price: +p.close.toFixed(2) }));
      currency = yf[0]?.currency || 'EUR';
      console.log('✅ Yahoo Finance history:', history.length, 'items');
    } catch (e) {
      console.warn('❌ Yahoo history failed:', e.message);
    }
  }

  if (!history.length) {
    try {
      history = await finnhubService.getHistory(id.toUpperCase());
      currency = 'USD';
      console.log('✅ Finnhub history:', history.length, 'items');
    } catch (e) {
      console.error('❌ All history sources failed for:', id);
      return null;
    }
  }

  const result = { history: normalize(history), currency };
  await redis.set(cacheKey, JSON.stringify(result), 'EX', HISTORY_TTL);
  return result;
}


async function getCurrentQuotes(tickers) {
  console.log('📥 Market data request received:', tickers);
  const result = { cryptos: {}, stocks: {} };
  const currencies = new Set();

  for (const { id, type } of tickers) {
    if (!id || !type) continue;

    if (type === 'crypto') {
      let cryptoPrice = null;

      // 1️⃣ Try CoinGecko
      try {
        const cgRes = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
          params: { ids: id.toLowerCase(), vs_currencies: 'eur' }
        });

        if (cgRes.data[id]) {
          cryptoPrice = { eur: cgRes.data[id].eur };
          console.log(`✅ Crypto price from CoinGecko: ${id} = €${cryptoPrice.eur}`);
        }
      } catch (err) {
        console.error(`❌ CoinGecko error for ${id}:`, err.message);
      }

      // 2️⃣ Fallback to Yahoo Finance
      if (!cryptoPrice) {
        try {
          const yf = await yahooFinance.quote(`${id}-EUR`);
          if (yf?.regularMarketPrice) {
            cryptoPrice = { eur: yf.regularMarketPrice };
            console.log(`✅ Crypto price from Yahoo: ${id} = €${cryptoPrice.eur}`);
          }
        } catch (err) {
          console.error(`❌ Yahoo fallback failed for crypto ${id}:`, err.message);
        }
      }

      if (cryptoPrice) {
        result.cryptos[id.toLowerCase()] = cryptoPrice;
      } else {
        console.warn(`🚫 No price found for crypto: ${id}`);
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
  getCurrentQuotes, // 🧩 required export!
};
