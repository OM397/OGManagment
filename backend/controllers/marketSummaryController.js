// 📁 backend/controllers/marketSummaryController.js
const redis = require('../redisClient');
const { getCurrentQuotes, fetchPerformanceMetrics, fetchHistory } = require('../services/unifiedMarketDataService');

// Assets to include in summary (keep small to stay within provider limits)
const CRYPTOS = [ 'bitcoin','ethereum','solana','ripple','cardano' ];
const STOCKS  = [ 'AAPL','MSFT','NVDA','QQQ','SPY' ];

// Refresh every 12h (2 veces al día)
const REFRESH_MS = 12 * 60 * 60 * 1000;
const CACHE_KEY = 'marketSummary:v1';

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
      // Fallback: derive 7d if missing using history (added because some assets lacked 7d change from provider)
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
    if (!force) {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Serve cache if still fresh
        if (Date.now() < parsed.nextUpdate) {
          res.set('Cache-Control', 'public, max-age=300');
          return res.json(parsed);
        }
      }
    }

  const summary = await buildSummary({ force });
    await redis.set(CACHE_KEY, JSON.stringify(summary), 'PX', REFRESH_MS);
    res.set('Cache-Control', 'public, max-age=300');
    res.json(summary);
  } catch (e) {
    console.error('❌ market summary build failed:', e.message);
    res.status(500).json({ error: 'market_summary_failed', message: e.message });
  }
};

// Export buildSummary for internal jobs (weekly email, etc.)
module.exports.buildSummary = buildSummary;
