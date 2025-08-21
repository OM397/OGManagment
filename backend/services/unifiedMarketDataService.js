// 📁 services/unifiedMarketDataService.js

const yahooFinance = require('yahoo-finance2').default;
const twelveData = require('./twelveDataService');
const finnhubService = require('./finnhubService');
const axios = require('axios');
const redis = require('../redisClient');
const { getIdForApi, resolveCryptoSymbol } = require('../utils/symbolMap');
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
  //    console.log('🌐 Fetching minimal CoinGecko list (cold fallback)...');
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
  //  console.log('🗺️  CoinGecko symbol map ready entries:', Object.keys(CG_SYMBOL_TO_ID).length);
  } catch (e) {
  //  console.warn('⚠️ CoinGecko map build failed:', e.message);
    CG_SYMBOL_TO_ID = {};
  }
  return CG_SYMBOL_TO_ID;
}

const FX_CACHE_KEY = 'fx:rates';
const FX_META_KEY = 'fx:meta';
const FX_TTL = 3600;
// Extended TTL for better caching
const PRICE_TTL = 900; // 15 minutes instead of 5
const HISTORY_TTL = 86400; // 24 hours instead of 12
const FRESH_CACHE_THRESHOLD = 300; // Consider cache "fresh" for 5 minutes

// EXCHANGE RATES
async function getFXRates(currencies = []) {
  // console.log('🌍 Getting FX Rates for:', currencies);
  const requested = Array.from(new Set((currencies || []).map(c => String(c).toUpperCase()).filter(c => c && c !== 'EUR')));
  let cached = null;
  try { const raw = await redis.get(FX_CACHE_KEY); if (raw) cached = JSON.parse(raw); } catch (_) {}
  if (!cached) cached = {};
  const have = new Set(Object.keys(cached));
  const missing = requested.filter(c => !have.has(c));
  if (!missing.length) {
    if (requested.length) //console.log('📦 FX fully from cache');
    return cached;
  }
  try {
    const symbols = missing.join(',');
    if (symbols) {
      const res = await axios.get('https://api.frankfurter.app/latest', { params: { from: 'EUR', to: symbols } });
      const merged = { ...cached, ...(res.data?.rates || {}) };
      await redis.set(FX_CACHE_KEY, JSON.stringify(merged), 'EX', FX_TTL);
      try { await redis.set(FX_META_KEY, JSON.stringify({ provider: 'frankfurter', fetchedAt: new Date().toISOString() }), 'EX', FX_TTL); } catch (_) {}
      return merged;
    }
  } catch (e) {
    console.error('❌ FX fetch/merge failed:', e.message);
  }
  return cached;
}

// Admin/reporting helper: FX with source metadata
async function getFXRatesWithSource(currencies = []) {
  const requested = Array.from(new Set((currencies || []).map(c => String(c).toUpperCase()).filter(c => c && c !== 'EUR')));
  let cached = null; let meta = null;
  try { const raw = await redis.get(FX_CACHE_KEY); if (raw) cached = JSON.parse(raw); const m = await redis.get(FX_META_KEY); if (m) meta = JSON.parse(m); } catch (_) {}
  if (!cached) cached = {};
  const have = new Set(Object.keys(cached));
  const missing = requested.filter(c => !have.has(c));
  if (!missing.length) {
    return { rates: cached, source: 'cache', cacheFrom: meta?.provider || 'frankfurter', fetchedAt: meta?.fetchedAt || null };
  }
  try {
    const symbols = missing.join(',');
    const res = symbols ? await axios.get('https://api.frankfurter.app/latest', { params: { from: 'EUR', to: symbols } }) : { data: { rates: {} } };
    const merged = { ...cached, ...(res.data?.rates || {}) };
    await redis.set(FX_CACHE_KEY, JSON.stringify(merged), 'EX', FX_TTL);
    const newMeta = { provider: 'frankfurter', fetchedAt: new Date().toISOString() };
    try { await redis.set(FX_META_KEY, JSON.stringify(newMeta), 'EX', FX_TTL); } catch (_) {}
    return { rates: merged, source: 'live', cacheFrom: 'frankfurter', fetchedAt: newMeta.fetchedAt };
  } catch (e) {
    console.error('❌ FX fetch (with source) failed:', e.message);
    return { rates: cached, source: 'cache', cacheFrom: meta?.provider || 'frankfurter', fetchedAt: meta?.fetchedAt || null };
  }
}

// OPTIMIZED PRICE FETCHING WITH RATE LIMITING
async function fetchPrice(id, type) {
 // console.log('💸 Fetching price for:', id, '| Type:', type);
  const cacheKey = `price:${type}:${id.toLowerCase()}`;
  let quote, currency = null;

  // Check cache first (with extended TTL)
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      // Use cached data if less than FRESH_CACHE_THRESHOLD seconds old
      if (parsedCache?.fetchedAt && Date.now() - new Date(parsedCache.fetchedAt).getTime() < FRESH_CACHE_THRESHOLD * 1000) {
       // console.log('📦 Using fresh cache for:', id);
        return parsedCache;
      }
    }
  } catch (e) {
  //  console.warn('⚠️ Cache read error:', e.message);
  }

  // 1 Try Yahoo Finance with rate limiting
  if (providerManager.isProviderAvailable('yahoo')) {
    try {
      const symbol = getIdForApi(id, type, 'yahoo') || id;
      const res = await providerManager.executeWithRateLimit('yahoo', async () => {
        return await yahooFinance.quote(symbol);
      });
      
      if (res?.regularMarketPrice) {
        quote = { price: res.regularMarketPrice, currency: res.currency?.toUpperCase() || null, provider: 'yahoo' };
        if (res.marketCap) quote.marketCap = res.marketCap;
       // console.log('✅ Yahoo Finance quote:', quote);
      }
    } catch (e) {
    //  console.warn('❌ Yahoo failed:', e.message);
    }
  }

  // 2 Try Finnhub with rate limiting
  if (!quote && providerManager.isProviderAvailable('finnhub')) {
    try {
      const symbol = getIdForApi(id, type, 'finnhub') || id;
      quote = await providerManager.executeWithRateLimit('finnhub', async () => {
        return await finnhubService.getQuote(symbol);
      });
      if (quote) quote.provider = 'finnhub';
  //    console.log('✅ Finnhub quote:', quote);
    } catch (e) {
    //  console.warn('❌ Finnhub failed:', e.message);
    }
  }

  // 3 Try TwelveData with rate limiting
  if (!quote && providerManager.isProviderAvailable('twelvedata')) {
    try {
      const symbol = getIdForApi(id, type, 'twelve') || id;
      quote = await providerManager.executeWithRateLimit('twelvedata', async () => {
        return await twelveData.fetchQuote(symbol);
      });
      if (quote) quote.provider = 'twelvedata';
  //    console.log('✅ TwelveData quote:', quote);
    } catch (e) {
    //  console.warn('❌ TwelveData failed:', e.message);
    }
  }

  // If we have price but currency was not returned by main provider, try resolving currency via TwelveData
  if (quote?.price != null && (!quote.currency || typeof quote.currency !== 'string')) {
    try {
      if (providerManager.isProviderAvailable('twelvedata')) {
        const tdSymbol = getIdForApi(id, type, 'twelve') || id;
        const td = await providerManager.executeWithRateLimit('twelvedata', async () => {
          return await twelveData.fetchQuote(tdSymbol);
        });
        if (td?.currency) {
          quote.currency = td.currency.toUpperCase();
        }
      }
    } catch (e) {
      // ignore currency resolve errors
    }
  }

  // 4 Fallback to cache if all providers fail
  if (!quote?.price) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
       // console.log('📦 Price from stale cache (fallback) for', id);
        return JSON.parse(cached);
      }
    } catch (err) {
    //  console.warn('⚠️ Redis cache fallback failed:', err.message);
    }

  //  console.error('🚫 No quote found for:', id);
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
    currency: (quote.currency && typeof quote.currency === 'string') ? quote.currency : 'EUR',
    date: new Date(),
    marketCap: quote.marketCap,
    source: quote.source || 'live',
    provider: quote.provider || null,
    fetchedAt: new Date().toISOString()
  });

  await redis.set(cacheKey, JSON.stringify(result), 'EX', PRICE_TTL);
  return result;
}

// OPTIMIZED HISTORY FETCHING WITH RATE LIMITING
async function fetchHistory(id, type, days = 30) {
  // Clamp days to sane bounds (allow 1 day minimum for 1d change calculations)
  const originalDays = days;
  days = Math.min(Math.max(parseInt(days, 10) || 30, 1), 365);
 // console.log('📉 Fetching history for:', id, '| Type:', type, '| Days:', days, '(requested:', originalDays, ')');
  const cacheKey = `history:${type}:${id}:${days}`;

  // Check cache first (with extended TTL)
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      // Use cached data if less than 6 hours old for history
      if (parsedCache?.fetchedAt && Date.now() - new Date(parsedCache.fetchedAt).getTime() < 21600000) {
       // console.log('📦 Using cached history for:', id);
        return parsedCache;
      }
    }
  } catch (e) {
   // console.warn('⚠️ History cache read error:', e.message);
  }

  const fullDateRange = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - ((days - 1) - i));
    return d.toISOString().split('T')[0];
  });

  const normalize = (data) => {
    const map = Object.fromEntries(data.map(p => [p.date, p.price]));
    let last = null;
    const series = fullDateRange.map(date => {
      if (map[date] != null) last = map[date];
      return last ? { date, price: last } : null;
    });
    // If early nulls (insufficient history), pad them with first non-null to preserve full timescale
    const firstIdx = series.findIndex(p => p !== null);
    if (firstIdx > 0) {
      const firstPrice = series[firstIdx].price;
      for (let i = 0; i < firstIdx; i++) {
        series[i] = { date: fullDateRange[i], price: firstPrice };
      }
    }
    return series.filter(Boolean);
  };

  let history = [];
  let currency = 'EUR';
  let providerName = null;

  // 1 Try TwelveData with rate limiting (good for short ranges)
  if (days <= 60 && providerManager.isProviderAvailable('twelvedata')) {
    try {
      const symbol = getIdForApi(id, type, 'twelve') || id;
      const td = await providerManager.executeWithRateLimit('twelvedata', async () => {
        return await twelveData.fetchTimeSeries(symbol, { interval: '1day', outputsize: days });
      });
      if (td?.quotes?.length) {
        console.log('TwelveData raw data sample:', td.meta); // Debug log
        console.log('TwelveData currency field:', td.meta?.currency); // Debug log
        currency = td.meta?.currency || 'EUR';
        console.log('TwelveData final currency:', currency); // Debug log
        history = td.quotes.map(p => ({
          date: new Date(p.date).toISOString().split('T')[0],
          price: +Number(p.close).toFixed(2)
        }));
   //     console.log('✅ TwelveData history:', history.length, 'items');
        providerName = 'twelvedata';
      }
    } catch (e) {
    //  console.warn('❌ TwelveData history failed:', e.message);
    }
  } else {
   // console.log('⏭️ Skipping TwelveData for long range', days, 'preferring Yahoo');
  }

  // 2 Yahoo fallback with rate limiting
  if (!history.length || (days > 60 && history.length < days * 0.5)) {
    if (history.length && days > 60) {
   //   console.log(`ℹ️ Discarding short TwelveData series (${history.length}) for long range ${days}, trying Yahoo`);
      history = [];
    }
    if (providerManager.isProviderAvailable('yahoo')) {
      try {
        const symbol = getIdForApi(id, type, 'yahoo') || id;
        const yf = await providerManager.executeWithRateLimit('yahoo', async () => {
          return await yahooFinance.historical(symbol, {
            interval: '1d',
            period1: new Date(Date.now() - days * 86400000)
          });
        });
    history = yf.map(p => ({
          date: p.date.toISOString().split('T')[0],
          price: +p.close.toFixed(2)
        }));
        console.log('Yahoo Finance raw data sample:', yf[0]); // Debug log
        console.log('Yahoo Finance currency field:', yf[0]?.currency); // Debug log
        
        // Si Yahoo Finance no proporciona currency, intentar detectarla basándose en el símbolo
        if (!yf[0]?.currency) {
          const symbol = getIdForApi(id, type, 'yahoo') || id;
          
          if (type === 'stock') {
            if (!symbol.includes('-') && !symbol.includes('.')) {
              // Stock estadounidense sin sufijo (NYSE, NASDAQ)
              currency = 'USD';
              console.log('Yahoo Finance: Detected USD for US stock symbol:', symbol);
            } else if (symbol.includes('.AS') || symbol.includes('.DE') || symbol.includes('.CO') || 
                       symbol.includes('.VI') || symbol.includes('.MI') || symbol.includes('.PA')) {
              // Stock europeo con sufijo de bolsa (Amsterdam, Deutsche, Copenhagen, Vienna, Milan, Paris)
              currency = 'EUR';
              console.log('Yahoo Finance: Detected EUR for European stock symbol:', symbol);
            } else if (symbol.includes('.L') || symbol.includes('.SW')) {
              // Stock británico o suizo
              currency = symbol.includes('.L') ? 'GBP' : 'CHF';
              console.log('Yahoo Finance: Detected', currency, 'for stock symbol:', symbol);
            } else {
              // Fallback para otros stocks
              currency = 'USD';
              console.log('Yahoo Finance: Using USD fallback for stock symbol:', symbol);
            }
          } else if (type === 'crypto') {
            if (symbol.includes('-EUR')) {
              currency = 'EUR';
              console.log('Yahoo Finance: Detected EUR for crypto symbol:', symbol);
            } else if (symbol.includes('-USD')) {
              currency = 'USD';
              console.log('Yahoo Finance: Detected USD for crypto symbol:', symbol);
            } else if (symbol.includes('-GBP')) {
              currency = 'GBP';
              console.log('Yahoo Finance: Detected GBP for crypto symbol:', symbol);
            } else {
              // Fallback para cryptos sin sufijo de moneda
              currency = 'EUR';
              console.log('Yahoo Finance: Using EUR fallback for crypto symbol:', symbol);
            }
          } else {
            // Fallback general para otros tipos
            currency = 'EUR';
            console.log('Yahoo Finance: Using EUR fallback for symbol:', symbol);
          }
        } else {
          currency = yf[0].currency;
        }
        
        console.log('Yahoo Finance final currency:', currency); // Debug log
    providerName = 'yahoo';
   //     console.log('✅ Yahoo Finance history:', history.length, 'items');
      } catch (e) {
    //    console.warn('❌ Yahoo history failed:', e.message);
        // Additional crypto Yahoo suffix fallback
        if (type === 'crypto' && providerManager.isProviderAvailable('yahoo')) {
          try {
            const alt = `${id.toUpperCase()}-EUR`;
            const yf2 = await providerManager.executeWithRateLimit('yahoo', async () => {
              return await yahooFinance.historical(alt, {
                interval: '1d',
                period1: new Date(Date.now() - days * 86400000)
              });
            });
            history = yf2.map(p => ({
              date: p.date.toISOString().split('T')[0],
              price: +p.close.toFixed(2)
            }));
            
            // Si Yahoo Finance no proporciona currency, intentar detectarla basándose en el símbolo
            if (!yf2[0]?.currency) {
              const symbol = `${id.toUpperCase()}-EUR`;
              
              if (symbol.includes('-EUR')) {
                currency = 'EUR';
                console.log('Yahoo Finance (crypto): Detected EUR for crypto symbol:', symbol);
              } else if (symbol.includes('-USD')) {
                currency = 'USD';
                console.log('Yahoo Finance (crypto): Detected USD for crypto symbol:', symbol);
              } else if (symbol.includes('-GBP')) {
                currency = 'GBP';
                console.log('Yahoo Finance (crypto): Detected GBP for crypto symbol:', symbol);
              } else {
                // Fallback para cryptos sin sufijo de moneda
                currency = 'EUR';
                console.log('Yahoo Finance (crypto): Using EUR fallback for crypto symbol:', symbol);
              }
            } else {
              currency = yf2[0].currency;
            }
            
            providerName = 'yahoo';
        //    console.log('✅ Yahoo (crypto suffix) history:', history.length, 'items');
          } catch (e2) {
         //   console.warn('❌ Yahoo crypto suffix history failed:', e2.message);
          }
        }
      }
    }
  }

  // 3 Finnhub fallback with rate limiting
  if (!history.length && providerManager.isProviderAvailable('finnhub')) {
    try {
      const symbol = getIdForApi(id, type, 'finnhub') || id;
  history = await providerManager.executeWithRateLimit('finnhub', async () => {
        return await finnhubService.getHistory(symbol);
      });
      currency = 'USD';
  providerName = 'finnhub';
    //  console.log('✅ Finnhub history:', history.length, 'items');
    } catch (e) {
    //  console.warn('❌ Finnhub history failed:', e.message);
    }
  }

  // 4 Final fallback: Redis cache
  if (!history.length) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
       // console.log('📦 History from stale cache (fallback) for', id);
        return JSON.parse(cached);
      }
    } catch (err) {
     // console.warn('⚠️ Redis history fallback failed:', err.message);
    }

  //  console.error('🚫 No historical data found for:', id);
    return null;
  }

  const result = normalizeHistoryResponse({
    history: normalize(history),
    currency,
    source: providerName ? `live/${providerName}` : 'live',
    fetchedAt: new Date().toISOString(),
    provider: providerName
  });
  
  await redis.set(cacheKey, JSON.stringify(result), 'EX', HISTORY_TTL);
  return result;
}

// OPTIMIZED CURRENT QUOTES WITH BATCHED COINGECKO
async function getCurrentQuotes(tickers) {
  const map = await buildCoinGeckoMap();
 // console.log('📥 Market data request received:', tickers);
  const result = { cryptos: {}, stocks: {}, _meta: [] };
  const currencies = new Set();
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
    const cacheFrom = parsed.provider || parsed.source || null;
    priceObj = { eur: parsed.eur, source: 'cache', provider: 'redis', fetchedAt: parsed.fetchedAt, cacheFrom };
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
        result.stocks[id.toLowerCase()] = { rawPrice: price, currency, marketCap, source: quote.source || 'live', provider: quote?.meta?.provider || null, fetchedAt: quote.fetchedAt };
        if (effectiveId !== id) {
          result.stocks[effectiveId.toLowerCase()] = { rawPrice: price, currency, marketCap, source: quote.source || 'live', provider: quote?.meta?.provider || null, fetchedAt: quote.fetchedAt };
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
   //     console.log(`🔄 Batched CoinGecko request for ${allIds.length} unique IDs`);
        const batchData = await providerManager.batchCoinGeckoRequest(allIds);
        
        // Attach results to contexts
        for (const c of needLive) {
          if (!c.priceObj) {
            const lookups = [c.lowerId];
            if (c.alias) lookups.push(c.alias);
            if (c.mappedId) lookups.push(c.mappedId);
            
            for (const key of lookups) {
              if (batchData[key]) {
                c.priceObj = { eur: batchData[key].eur, marketCap: batchData[key].eur_market_cap, source: 'coingecko', provider: 'coingecko', fetchedAt: new Date().toISOString() };
                c.meta.attempts.push(`coingecko:batch:${key}`);
                if (key !== c.lowerId) c.resolvedId = key;
                break;
              }
            }
          }
        }
      } catch (error) {
     //   console.warn('❌ Batched CoinGecko failed:', error.message);
      }
    }

    // Individual fallbacks for remaining cryptos
    for (const c of cryptoContexts) {
      const { id, lowerId } = c;
      if (!c.priceObj && providerManager.isProviderAvailable('yahoo')) {
        // Try Yahoo with proper symbol mapping to EUR first
        const yahooEur = getIdForApi(id, 'crypto', 'yahoo'); // e.g., ETH-EUR
        c.meta.attempts.push(`yahoo:symbol:${yahooEur}`);
        try {
          const yf = await providerManager.executeWithRateLimit('yahoo', async () => yahooFinance.quote(yahooEur));
          if (yf?.regularMarketPrice && yf.regularMarketPrice > 0) {
            c.priceObj = { eur: yf.regularMarketPrice, source: 'yahoo', provider: 'yahoo', fetchedAt: new Date().toISOString() };
            c.meta.attempts.push('yahoo:eur:success');
          } else {
            c.meta.attempts.push('yahoo:eur:empty');
          }
        } catch (e) {
          c.meta.attempts.push('yahoo:eur:fail');
        }

        // If EUR failed, try USD and convert via FX
        if (!c.priceObj) {
          const sym = resolveCryptoSymbol(id) || id.toUpperCase();
          const yahooUsd = `${sym}-USD`;
          c.meta.attempts.push(`yahoo:symbol:${yahooUsd}`);
          try {
            const yf2 = await providerManager.executeWithRateLimit('yahoo', async () => yahooFinance.quote(yahooUsd));
            if (yf2?.regularMarketPrice && yf2.regularMarketPrice > 0) {
              try {
                const rates = await getFXRates(['USD']);
                const usdPerEur = rates?.USD; // Frankfurter: USD per 1 EUR
                if (usdPerEur && usdPerEur > 0) {
                  const eur = +(yf2.regularMarketPrice / usdPerEur).toFixed(4);
                  c.priceObj = { eur, source: 'yahoo+fx', provider: 'yahoo', fetchedAt: new Date().toISOString() };
                  c.meta.attempts.push('yahoo:usd+fx:success');
                } else {
                  c.meta.attempts.push('yahoo:usd+fx:rates-missing');
                }
              } catch (fxErr) {
                c.meta.attempts.push('yahoo:usd+fx:fail');
              }
            } else {
              c.meta.attempts.push('yahoo:usd:empty');
            }
          } catch (e2) {
            c.meta.attempts.push('yahoo:usd:fail');
          }
        }
      }

      // Additional fallback: TwelveData USD quote + FX
      if (!c.priceObj && providerManager.isProviderAvailable('twelvedata')) {
        try {
          const tdSymbol = getIdForApi(id, 'crypto', 'twelve'); // e.g., ETH/USD
          c.meta.attempts.push(`twelvedata:quote:${tdSymbol}`);
          const tdq = await providerManager.executeWithRateLimit('twelvedata', async () => twelveData.fetchQuote(tdSymbol));
          if (tdq?.price && tdq.price > 0) {
            if ((tdq.currency || 'USD') === 'EUR') {
              c.priceObj = { eur: +tdq.price.toFixed(4), source: 'twelvedata', provider: 'twelvedata', fetchedAt: new Date().toISOString() };
              c.meta.attempts.push('twelvedata:eur:success');
            } else {
              try {
                const rates = await getFXRates(['USD']);
                const usdPerEur = rates?.USD;
                if (usdPerEur && usdPerEur > 0) {
                  const eur = +(tdq.price / usdPerEur).toFixed(4);
                  c.priceObj = { eur, source: 'twelvedata+fx', provider: 'twelvedata', fetchedAt: new Date().toISOString() };
                  c.meta.attempts.push('twelvedata:usd+fx:success');
                } else {
                  c.meta.attempts.push('twelvedata:usd+fx:rates-missing');
                }
              } catch (_) {
                c.meta.attempts.push('twelvedata:usd+fx:fail');
              }
            }
          } else {
            c.meta.attempts.push('twelvedata:empty');
          }
        } catch (e) {
          c.meta.attempts.push('twelvedata:fail');
        }
      }

      // Additional fallback: Finnhub BINANCE:SYMBOLUSDT + FX
      if (!c.priceObj && providerManager.isProviderAvailable('finnhub')) {
        try {
          const fhSymbol = getIdForApi(id, 'crypto', 'finnhub'); // e.g., BINANCE:ETHUSDT
          c.meta.attempts.push(`finnhub:quote:${fhSymbol}`);
          const fh = await providerManager.executeWithRateLimit('finnhub', async () => finnhubService.getQuote(fhSymbol));
          if (fh?.price && fh.price > 0) {
            if ((fh.currency || 'USD') === 'EUR') {
              c.priceObj = { eur: +fh.price.toFixed(4), source: 'finnhub', provider: 'finnhub', fetchedAt: new Date().toISOString() };
              c.meta.attempts.push('finnhub:eur:success');
            } else {
              try {
                const rates = await getFXRates(['USD']);
                const usdPerEur = rates?.USD;
                if (usdPerEur && usdPerEur > 0) {
                  const eur = +(fh.price / usdPerEur).toFixed(4);
                  c.priceObj = { eur, source: 'finnhub+fx', provider: 'finnhub', fetchedAt: new Date().toISOString() };
                  c.meta.attempts.push('finnhub:usd+fx:success');
                } else {
                  c.meta.attempts.push('finnhub:usd+fx:rates-missing');
                }
              } catch (_) {
                c.meta.attempts.push('finnhub:usd+fx:fail');
              }
            }
          } else {
            c.meta.attempts.push('finnhub:empty');
          }
        } catch (e) {
          c.meta.attempts.push('finnhub:fail');
        }
      }

  // Final local fallback: use stale cache if available to avoid unknown
      if (!c.priceObj) {
        try {
          const cacheKey = `price:crypto:${lowerId}`;
          const cachedRaw = await redis.get(cacheKey);
          if (cachedRaw) {
            const parsed = JSON.parse(cachedRaw);
            if (parsed?.eur != null) {
      const cacheFrom = parsed.provider || parsed.source || null;
      c.priceObj = { eur: parsed.eur, source: 'cache-stale', provider: 'redis', fetchedAt: parsed.fetchedAt || new Date().toISOString(), cacheFrom };
              c.meta.attempts.push('cache:stale');
            }
          }
        } catch (_) {}
      }

      // Final processing
      if (c.priceObj) {
        result.cryptos[lowerId] = c.priceObj;
        if (c.resolvedId && c.resolvedId !== lowerId) {
          result.cryptos[c.resolvedId] = c.priceObj;
        }
        c.meta.success = true;

        // Cache the result only if it's from a live provider (avoid writing cache-as-origin)
        if (c.priceObj.source !== 'cache' && c.priceObj.source !== 'cache-stale') {
          const cacheKey = `price:crypto:${lowerId}`;
          const cacheData = {
            eur: c.priceObj.eur,
            fetchedAt: new Date().toISOString(),
            provider: c.priceObj.provider || null,
            source: c.priceObj.source || 'live'
          };
          await redis.set(cacheKey, JSON.stringify(cacheData), 'EX', PRICE_TTL);
        }
      }
      result._meta.push(c.meta);
    }
  }

  // FX conversion
  try {
    const fxRates = currencies.size ? await getFXRates([...currencies]) : {};
    for (const [ticker, data] of Object.entries(result.stocks)) {
      if (data.currency === 'EUR') {
        // Always set EUR directly even if no FX requested
        data.eur = data.rawPrice;
        if (data.marketCap != null && !isNaN(data.marketCap)) {
          data.marketCapEur = data.marketCap;
        }
        continue;
      }
      if (data.currency && fxRates[data.currency]) {
        const rate = fxRates[data.currency];
        data.eur = +(data.rawPrice / rate).toFixed(4);
        if (data.marketCap != null && !isNaN(data.marketCap)) {
          data.marketCapEur = +(data.marketCap / rate).toFixed(0);
        }
      }
    }
  } catch (err) {
    console.error('❌ FX conversion failed:', err.message);
  }

  // Add provider statistics
  result._providerStats = providerManager.getStats();
  return result;
}

// PERFORMANCE METRICS
async function fetchPerformanceMetrics(id, type, options = {}) {
//  console.log('📊 Fetching performance metrics for:', id, '| Type:', type);
  const cacheKey = `perf:${type}:${id}`;
  
  if (!options.nocache) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
  //      console.log('📦 Using cached performance for:', id);
        return JSON.parse(cached);
      }
    } catch (e) {
    //  console.warn('⚠️ Performance cache read error:', e.message);
    }
  }

  try {
    // Get history for different periods to calculate performance (fractional returns)
    const history30 = await fetchHistory(id, type, 30);
    const history7 = await fetchHistory(id, type, 7);
    const history2 = await fetchHistory(id, type, 2); // for 1d we need at least 2 data points
    const history365 = await fetchHistory(id, type, 365);

    if (!history30?.history?.length) {
      return null;
    }

    const last = arr => (arr && arr.length ? arr[arr.length - 1] : null);
    const first = arr => (arr && arr.length ? arr[0] : null);
    const calc = (past, now) => (past != null && now != null && past !== 0) ? ((now - past) / past) : null;

    const last30 = last(history30.history)?.price;
    const first30 = first(history30.history)?.price;

    const last7 = last(history7?.history || [])?.price;
    const first7 = first(history7?.history || [])?.price;

    const h2 = history2?.history || [];
    const prev1 = h2.length >= 2 ? h2[h2.length - 2].price : first(h2)?.price;
    const curr1 = last(h2)?.price ?? last30;

    const last365 = last(history365?.history || [])?.price ?? last30;
    const first365 = first(history365?.history || [])?.price ?? first30;

    const changes = {
      '1d': calc(prev1, curr1),
      '7d': calc(first7, last7 ?? last30),
      '30d': calc(first30, last30),
      '1y': calc(first365, last365)
    };

    const result = normalizePerformanceResponse({
      changes,
      sources: { '1d': 'history', '7d': 'history', '30d': 'history', '1y': 'history' },
      fetchedAt: new Date().toISOString(),
      provider: 'calculated'
    });

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600); // 1 hour cache
    return result;
  } catch (error) {
    console.error('❌ Performance metrics failed:', error.message);
    return null;
  }
}

// Export functions
module.exports = {
  buildCoinGeckoMap,
  getFXRates,
  getFXRatesWithSource,
  fetchPrice,
  getCurrentQuotes,
  fetchHistory,
  fetchPerformanceMetrics
};
