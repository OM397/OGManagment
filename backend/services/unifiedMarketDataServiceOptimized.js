// 📁 services/unifiedMarketDataServiceOptimized.js

const yahooFinance = require('yahoo-finance2').default;
const twelveData = require('./twelveDataService');
const finnhubService = require('./finnhubService');
const axios = require('axios');
const redis = require('../redisClient');
const { getIdForApi } = require('../utils/symbolMap');
const {
  normalizePriceResponse,
  normalizeHistoryResponse,
  normalizePerformanceResponse
} = require('../utils/dataAdapter');
const providerManager = require('./rateLimitedProviders');

// Load local CoinGecko tickers list once for symbol->id fallback (large file but cached by require)
let CG_SYMBOL_TO_ID = null;
async function buildCoinGeckoMap(){
  if (CG_SYMBOL_TO_ID) return CG_SYMBOL_TO_ID;
  try {
    const fs = require('fs');
    const path = require('path');
    const localPath = path.join(__dirname, '..', 'coingecko-tickers.json');
    if (fs.existsSync(localPath)) {
      const cgList = JSON.parse(fs.readFileSync(localPath, 'utf8'));
      CG_SYMBOL_TO_ID = cgList.reduce((acc, c) => {
        const sym = c.symbol?.toLowerCase?.();
        const id = c.id?.toLowerCase?.();
        if (sym && id && !acc[sym]) acc[sym] = id;
        return acc;
      }, {});
    } else {
      // Fallback: fetch minimal list for top coins only to avoid large payload on cold start
      console.log('🌐 Fetching minimal CoinGecko list (cold fallback)...');
      const { data } = await axios.get('https://api.coingecko.com/api/v3/coins/list', { timeout: 20000 });
      CG_SYMBOL_TO_ID = data.slice(0, 5000).reduce((acc, c) => {
        const sym = c.symbol?.toLowerCase?.();
        const id = c.id?.toLowerCase?.();
        if (sym && id && !acc[sym]) acc[sym] = id;
        return acc;
      }, {});
    }
    const CANONICAL = { btc: 'bitcoin', eth: 'ethereum', xrp: 'ripple', sol: 'solana', ada: 'cardano', doge: 'dogecoin', trump: 'official-trump' };
    for (const [sym, id] of Object.entries(CANONICAL)) CG_SYMBOL_TO_ID[sym] = id;
    console.log('🗺️  CoinGecko symbol map ready entries:', Object.keys(CG_SYMBOL_TO_ID).length);
  } catch (e) {
    console.warn('⚠️ CoinGecko map build failed:', e.message);
    CG_SYMBOL_TO_ID = {};
  }
  return CG_SYMBOL_TO_ID;
}

const FX_CACHE_KEY = 'fx:rates';
const FX_TTL = 3600;
// Extended TTL for better caching
const PRICE_TTL = 900; // 15 minutes instead of 5
const HISTORY_TTL = 86400; // 24 hours instead of 12
const FRESH_CACHE_THRESHOLD = 180; // Consider cache "fresh" for 3 minutes

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

// OPTIMIZED PRICE FETCHING WITH RATE LIMITING
async function fetchPrice(id, type) {
  console.log('💸 Fetching price for:', id, '| Type:', type);
  const cacheKey = `price:${type}:${id.toLowerCase()}`;
  let quote, currency = 'EUR';

  // Check cache first (with extended TTL)
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      // Use cached data if less than FRESH_CACHE_THRESHOLD seconds old
      if (parsedCache?.fetchedAt && Date.now() - new Date(parsedCache.fetchedAt).getTime() < FRESH_CACHE_THRESHOLD * 1000) {
        console.log('📦 Using fresh cache for:', id);
        return parsedCache;
      }
    }
  } catch (e) {
    console.warn('⚠️ Cache read error:', e.message);
  }

  // 1 Try Yahoo Finance with rate limiting
  if (providerManager.isProviderAvailable('yahoo')) {
    try {
      const symbol = getIdForApi(id, type, 'yahoo') || id;
      const res = await providerManager.executeWithRateLimit('yahoo', async () => {
        return await yahooFinance.quote(symbol);
      });
      
      if (res?.regularMarketPrice) {
        quote = { price: res.regularMarketPrice, currency: res.currency?.toUpperCase() || 'EUR' };
        if (res.marketCap) quote.marketCap = res.marketCap;
        console.log('✅ Yahoo Finance quote:', quote);
      }
    } catch (e) {
      console.warn('❌ Yahoo failed:', e.message);
    }
  }

  // 2 Try Finnhub with rate limiting
  if (!quote && providerManager.isProviderAvailable('finnhub')) {
    try {
      const symbol = getIdForApi(id, type, 'finnhub') || id;
      quote = await providerManager.executeWithRateLimit('finnhub', async () => {
        return await finnhubService.getQuote(symbol);
      });
      console.log('✅ Finnhub quote:', quote);
    } catch (e) {
      console.warn('❌ Finnhub failed:', e.message);
    }
  }

  // 3 Try TwelveData with rate limiting
  if (!quote && providerManager.isProviderAvailable('twelvedata')) {
    try {
      const symbol = getIdForApi(id, type, 'twelve') || id;
      quote = await providerManager.executeWithRateLimit('twelvedata', async () => {
        return await twelveData.fetchQuote(symbol);
      });
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
        console.log('📦 Price from stale cache (fallback) for', id);
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

  const result = normalizePriceResponse({
    price: quote.price,
    currency: quote.currency,
    date: new Date(),
    marketCap: quote.marketCap,
    source: quote.source || 'live',
    provider: quote.provider || null,
    fetchedAt: new Date().toISOString()
  });

  await redis.set(cacheKey, JSON.stringify(result), 'EX', PRICE_TTL);
  return result;
}

// OPTIMIZED CURRENT QUOTES WITH BATCHED COINGECKO
async function getCurrentQuotes(tickers) {
  const map = await buildCoinGeckoMap();
  console.log('📥 Market data request received:', tickers);
  const result = { cryptos: {}, stocks: {}, _meta: [] };
  const currencies = new Set();
  const cryptoStockFallbackBuffer = [];
  const cryptoContexts = [];

  // Helper: normalize obviously synthetic / derived tickers to real underlying symbols
  const normalizeTicker = (id, type) => {
    let normalized = id;
    let note = null;
    if (type === 'stock') {
      const upper = id.toUpperCase();
      if (/twin-asset-token-.*nvda.*-long/i.test(id)) {
        normalized = 'NVDA';
        note = 'normalized:twin-asset->NVDA';
      } else if (/^qqq\d+$/i.test(id)) {
        normalized = 'QQQ';
        note = 'normalized:qqqdigits->QQQ';
      }
    }
    return { normalized, note };
  };

  for (const { id, type } of tickers) {
    if (!id || !type) continue;

    const { normalized, note: normalizationNote } = normalizeTicker(id, type);
    const effectiveId = normalized;

    if (type === 'crypto') {
      const lowerId = id.toLowerCase();
      const aliasMap = { xrp: 'ripple', trump: 'official-trump', officialtrump: 'official-trump' };
      const meta = { id, type: 'crypto', attempts: [], success: false };
      let priceObj = null;
      let resolvedId = lowerId;
      let usedCache = false;

      // Step 0: fresh cache (<180s)
      try {
        const cachedRaw = await redis.get(`price:crypto:${lowerId}`);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (parsed?.eur != null && parsed?.fetchedAt && Date.now() - new Date(parsed.fetchedAt).getTime() < FRESH_CACHE_THRESHOLD * 1000) {
            priceObj = { eur: parsed.eur, from: 'cache-fresh' };
            result.cryptos[lowerId] = priceObj;
            const canonical = CG_SYMBOL_TO_ID[lowerId];
            if (canonical && canonical !== lowerId) {
              result.cryptos[canonical] = priceObj;
              resolvedId = canonical;
            }
            usedCache = true;
            meta.attempts.push('cache:fresh');
          }
        }
      } catch {}
      
      cryptoContexts.push({ id, lowerId, alias: aliasMap[lowerId], mappedId: map[lowerId], meta, priceObj, resolvedId, usedCache });
      continue;
    }

    if (type === 'stock') {
      const meta = { id, type: 'stock', attempts: [], success: false };
      if (normalizationNote) meta.normalized = normalizationNote;
      try {
        meta.attempts.push('fetchPrice');
        const quote = await fetchPrice(effectiveId, type);
        if (!quote) continue;

        let price = quote.price;
        let currency = quote.currency;
        const marketCap = quote.marketCap;

        if (currency !== 'EUR') currencies.add(currency);
        result.stocks[id.toLowerCase()] = { rawPrice: price, currency, marketCap };
        if (effectiveId !== id) {
          result.stocks[effectiveId.toLowerCase()] = { rawPrice: price, currency, marketCap };
        }
        meta.success = true;
        meta.currency = currency;
        if (effectiveId !== id) meta.effectiveId = effectiveId;
        result._meta.push(meta);
      } catch (err) {
        console.error(`❌ Price error for stock ${id}:`, err.message);
        meta.success = false;
        meta.message = err.message;
        result._meta.push(meta);
      }
    }
  }

  // OPTIMIZED CRYPTO PROCESSING WITH BATCHED COINGECKO
  if (cryptoContexts.length) {
    const needLive = cryptoContexts.filter(c => !c.priceObj);
    if (needLive.length && providerManager.isProviderAvailable('coingecko')) {
      // Collect all IDs for batch request
      const allIds = [...new Set([
        ...needLive.map(c => c.lowerId),
        ...needLive.filter(c => c.alias).map(c => c.alias),
        ...needLive.filter(c => c.mappedId).map(c => c.mappedId)
      ])];

      try {
        console.log(`🔄 Batched CoinGecko request for ${allIds.length} unique IDs`);
        const batchData = await providerManager.batchCoinGeckoRequest(allIds);
        
        // Attach results to contexts
        for (const c of needLive) {
          if (!c.priceObj) {
            const lookups = [c.lowerId];
            if (c.alias) lookups.push(c.alias);
            if (c.mappedId) lookups.push(c.mappedId);
            
            for (const key of lookups) {
              if (batchData[key]) {
                c.priceObj = { eur: batchData[key].eur, marketCap: batchData[key].eur_market_cap };
                c.meta.attempts.push(`coingecko:batch:${key}`);
                if (key !== c.lowerId) c.resolvedId = key;
                break;
              }
            }
          }
        }
      } catch (error) {
        console.warn('❌ Batched CoinGecko failed:', error.message);
      }
    }

    // Individual fallbacks for remaining cryptos
    for (const c of cryptoContexts) {
      const { id, lowerId } = c;
      if (!c.priceObj && providerManager.isProviderAvailable('yahoo')) {
        c.meta.attempts.push('yahoo:crypto-suffix');
        try {
          const yf = await providerManager.executeWithRateLimit('yahoo', async () => {
            return await yahooFinance.quote(`${id.toUpperCase()}-EUR`);
          });
          if (yf?.regularMarketPrice && yf.regularMarketPrice > 0) {
            c.priceObj = { eur: yf.regularMarketPrice };
            c.meta.attempts.push('yahoo:success');
          }
        } catch (e) {
          c.meta.attempts.push('yahoo:fail');
        }
      }

      // Final processing
      if (c.priceObj) {
        result.cryptos[lowerId] = c.priceObj;
        if (c.resolvedId && c.resolvedId !== lowerId) {
          result.cryptos[c.resolvedId] = c.priceObj;
        }
        c.meta.success = true;
        
        // Cache the result
        const cacheKey = `price:crypto:${lowerId}`;
        const cacheData = { eur: c.priceObj.eur, fetchedAt: new Date().toISOString() };
        await redis.set(cacheKey, JSON.stringify(cacheData), 'EX', PRICE_TTL);
      }
      result._meta.push(c.meta);
    }
  }

  // FX conversion
  if (currencies.size) {
    try {
      const fxRates = await getFXRates([...currencies]);
      for (const [ticker, data] of Object.entries(result.stocks)) {
        if (data.currency && data.currency !== 'EUR' && fxRates[data.currency]) {
          data.eur = +(data.rawPrice / fxRates[data.currency]).toFixed(4);
        } else if (data.currency === 'EUR') {
          data.eur = data.rawPrice;
        }
      }
    } catch (err) {
      console.error('❌ FX conversion failed:', err.message);
    }
  }

  // Add provider statistics
  result._providerStats = providerManager.getStats();
  return result;
}

// Export functions
module.exports = {
  buildCoinGeckoMap,
  getFXRates,
  fetchPrice,
  getCurrentQuotes,
  // Add placeholder for fetchHistory and other functions that need similar optimization
  fetchHistory: async (id, type, days = 30) => {
    // TODO: Implement optimized history fetching
    return null;
  }
};
