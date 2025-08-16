// 📁 backend/controllers/performanceController.js
const { fetchPerformanceMetrics } = require('../services/unifiedMarketDataService');

// GET /api/performance?id=btc&type=crypto
exports.getPerformance = async (req, res) => {
  const id = (req.query.id||'').toLowerCase();
  const rawType = (req.query.type||'').toLowerCase();
  const type = rawType === 'crypto' ? 'crypto' : rawType === 'stock' ? 'stock' : null;
  if (!id || !['crypto','stock'].includes(type)) {
    return res.status(400).json({ error: 'Invalid id or type' });
  }
  // Experimental multi support: id may be comma-separated for cryptos
  if (type==='crypto' && req.query.multi === '1' && id.includes(',')) {
    const ids = id.split(',').map(s=>s.trim()).filter(Boolean).slice(0,25);
    const nocache = req.query.nocache === '1' || req.query.nocache === 'true';
    const out = [];
    for (const cid of ids) {
      try {
        const perf = await fetchPerformanceMetrics(cid, type, { nocache });
        out.push(perf);
      } catch (e) {
        out.push({ id: cid, type, error: e.message });
      }
      // small inter-request delay to stay gentle on provider
      await new Promise(r=>setTimeout(r, 120));
    }
    return res.json(out);
  }
  try {
    const nocache = req.query.nocache === '1' || req.query.nocache === 'true';
    const perf = await fetchPerformanceMetrics(id, type, { nocache });
    res.set('Cache-Control', 'public, max-age=120');
    res.json({
      data: perf,
      source: 'live',
      fetchedAt: new Date().toISOString(),
      meta: { provider: 'unifiedMarketDataService' }
    });
  } catch (e) {
    console.error('❌ Performance fetch failed for', { id, type, message: e.message });
    res.status(500).json({ error: 'perf_fetch_failed', message: e.message });
  }
};
