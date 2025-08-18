// 📁 backend/controllers/marketSummaryController.js
const redis = require('../redisClient');
const { getCurrentQuotes, fetchPerformanceMetrics, fetchHistory } = require('../services/unifiedMarketDataService');

// Assets to include in summary (keep small to stay within provider limits)
const CRYPTOS = [ 'bitcoin','ethereum','solana','ripple','cardano' ];
const STOCKS  = [ 'AAPL','MSFT','NVDA','QQQ','SPY' ];

// Refresh every 12h (2 veces al día)
const REFRESH_MS = 12 * 60 * 60 * 1000;
const CACHE_KEY = 'marketSummary:v1';
const LAST_GOOD_KEY = 'marketSummary:lastGood';

async function buildSummary(options = {}) {
  const tickers = [
    ...CRYPTOS.map(id => ({ id, type: 'crypto' })),
    ...STOCKS.map(id => ({ id, type: 'stock' }))
  ];
  const quotes = await getCurrentQuotes(tickers);
  console.log('DEBUG marketSummary quotes.cryptos:', quotes.cryptos);
  console.log('DEBUG marketSummary quotes.stocks:', quotes.stocks);

  const assets = [];

  // Helper to push standardized row
  const pushRow = (id, type, label) => {
    const key = id.toLowerCase();
    const priceObj = type === 'crypto' ? quotes.cryptos[key] : quotes.stocks[key];
    const marketCapStockFallback = priceObj?.marketCapEur ?? priceObj?.marketCap ?? null;
    assets.push({
      id,
      label,
      type,
      price: priceObj?.eur ?? null,
      priceMeta: priceObj ? { source: priceObj.source || null, provider: priceObj.provider || null } : null,
      marketCap: type==='crypto' ? (priceObj?.marketCap ?? null) : marketCapStockFallback,
      changes: {}
    });
  };

  const labelMap = {
    bitcoin: 'Bitcoin', ethereum: 'Ethereum', solana: 'Solana', ripple: 'XRP', cardano: 'Cardano',
    AAPL: 'Apple', MSFT: 'Microsoft', NVDA: 'Nvidia', QQQ: 'QQQ ETF', SPY: 'S&P 500 (SPY)'
  };

  CRYPTOS.forEach(id => pushRow(id, 'crypto', labelMap[id]));
  STOCKS.forEach(id => pushRow(id, 'stock', labelMap[id]));

  // Sequential performance fetch (gentle rate usage)
  for (const a of assets) {
    try {
  const perf = await fetchPerformanceMetrics(a.id, a.type, { nocache: !!options.force });
      if (perf?.changes) {
        ['7d','30d','1y'].forEach(k => { if (perf.changes[k] != null) a.changes[k] = perf.changes[k]; });
      }
      // Fallbacks: derive missing intervals using history when providers omit them
      // 7d
      if (a.changes['7d'] == null) {
        try {
          const h = await fetchHistory(a.id.toLowerCase(), a.type, 7);
          const hist = h?.history || [];
          if (hist.length > 3) {
            const first = hist[0].price; const last = hist[hist.length-1].price;
            if (first > 0 && last > 0) a.changes['7d'] = (last/first) - 1;
          }
        } catch {}
      }
      // 30d
      if (a.changes['30d'] == null) {
        try {
          const h30 = await fetchHistory(a.id.toLowerCase(), a.type, 30);
          const hist30 = h30?.history || [];
          if (hist30.length > 3) {
            const f30 = hist30[0].price; const l30 = hist30[hist30.length-1].price;
            if (f30 > 0 && l30 > 0) a.changes['30d'] = (l30/f30) - 1;
          }
        } catch {}
      }
      // 1y (365d)
      if (a.changes['1y'] == null) {
        try {
          const h365 = await fetchHistory(a.id.toLowerCase(), a.type, 365);
          const hist365 = h365?.history || [];
          if (hist365.length > 3) {
            const f365 = hist365[0].price; const l365 = hist365[hist365.length-1].price;
            if (f365 > 0 && l365 > 0) {
              a.changes['1y'] = (l365 / f365) - 1;
            }
          }
        } catch {}
      }
      // Small delay for cryptos to avoid hitting CoinGecko too fast
      if (a.type === 'crypto') await new Promise(r => setTimeout(r, 250));
    } catch (e) {
      a.error = e.message;
    }
  }

  return {
    updatedAt: Date.now(),
    nextUpdate: Date.now() + REFRESH_MS,
    assets
  };
}

exports.getMarketSummary = async (req, res) => {
  const force = req.query.force === '1';
  try {
    let cachedParsed = null;
    // 1) If not forced, try to serve fresh cache immediately
    if (!force) {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        cachedParsed = JSON.parse(cached);
        if (Date.now() < cachedParsed.nextUpdate) {
          res.set('Cache-Control', 'public, max-age=300');
          res.set('X-Data-Source', 'cache');
          return res.json(cachedParsed);
        }
      }
    }

    // 2) Rebuild (forced or stale cache). On success, update cache and last-good, then return
    try {
      const summary = await buildSummary({ force });
      if (!summary?.assets?.length) throw new Error('empty_summary');
      await redis.set(CACHE_KEY, JSON.stringify(summary), 'PX', REFRESH_MS);
      // Keep a durable last-good snapshot without TTL (or you could set a long EX)
      await redis.set(LAST_GOOD_KEY, JSON.stringify(summary));
      res.set('Cache-Control', 'public, max-age=300');
      res.set('X-Data-Source', 'live');
      return res.json(summary);
    } catch (liveErr) {
      // 3) Live rebuild failed → fallback to stale cache or last-good snapshot
      if (cachedParsed) {
        res.set('Cache-Control', 'public, max-age=60');
        res.set('X-Data-Source', 'cache-stale');
        return res.json(cachedParsed);
      }
      const lastGood = await redis.get(LAST_GOOD_KEY);
      if (lastGood) {
        const parsedLast = JSON.parse(lastGood);
        res.set('Cache-Control', 'public, max-age=60');
        res.set('X-Data-Source', 'last-good');
        return res.json(parsedLast);
      }
      throw liveErr;
    }
  } catch (e) {
    console.error('❌ market summary build failed:', e.message);
    res.status(500).json({ error: 'market_summary_failed', message: e.message });
  }
};

// Export buildSummary for internal jobs (weekly email, etc.)
module.exports.buildSummary = buildSummary;

// Precalienta y guarda en caché un Market Summary fresco (force=true)
// Retorna el summary generado o lanza si falla y no existe last-good.
module.exports.prewarmSummary = async function prewarmSummary() {
  // Intenta construir y cachear uno nuevo (force)
  try {
    const summary = await buildSummary({ force: true });
    if (!summary?.assets?.length) throw new Error('empty_summary');
    await redis.set(CACHE_KEY, JSON.stringify(summary), 'PX', REFRESH_MS);
    await redis.set(LAST_GOOD_KEY, JSON.stringify(summary));
    return summary;
  } catch (e) {
    // Fallback a last-good si existe
    const lastGood = await redis.get(LAST_GOOD_KEY);
    if (lastGood) return JSON.parse(lastGood);
    throw e;
  }
};
