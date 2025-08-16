// 📁 frontend/src/features/assets/useMarketData.js
import { useEffect, useState, useMemo } from 'react';
import { API_BASE } from '../../shared/config';
import { CRYPTO_ID_ALIASES } from '../../shared/cryptoIdAliases';

const LOCAL_STORAGE_KEY = 'lastSuccessfulMarketData';

export default function useMarketData(categoryGroups, reloadTrigger = 0, options = {}) {
  const { 
    enableInterval = true,    // Nuevo: permite desactivar interval
    intervalMs = 120000       // Nuevo: configurable interval
  } = options;
  const [marketData, setMarketData] = useState(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { cryptos: {}, stocks: {}, idMap: {}, _meta: [], ...parsed };
    }
    return { cryptos: {}, stocks: {}, idMap: {}, _meta: [] };
  });
  const [tickersData, setTickersData] = useState({ cryptos: [], stocks: [] });
  const [error, setError] = useState(null);
  // Track if we've performed the first real fetch (after tickers resolved) so user sees fresh prices immediately on session start
  const [didInitialFetch, setDidInitialFetch] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/tickers`)
      .then(res => res.json())
      .then(data => setTickersData(data));
  }, []);

  useEffect(() => {
  const symbolToId = Object.fromEntries((tickersData.cryptos || []).map(t => [t.symbol?.toLowerCase?.() || '', t.id]));
  const nameToId = Object.fromEntries((tickersData.cryptos || []).map(t => [t.name?.toLowerCase?.() || '', t.id]));

    const collectTickers = () => {
  const groups = categoryGroups?.['Investments'] || {};
  const meta = marketData?._meta || [];
      const tickerSet = new Map();
      const idMap = {}; // map raw asset.id (lower) -> resolved id

  Object.entries(groups).forEach(([_, assetList]) => {
        assetList.forEach(asset => {
          const nameRaw = asset.name?.toLowerCase?.() || '';
          // Try to parse trailing symbol in parentheses, e.g. "Official Trump (TRUMP)"
          const parenMatch = nameRaw.match(/\(([a-z0-9\-]+)\)\s*$/i);
          const parsedSymbol = parenMatch?.[1]?.toLowerCase?.();
          const cleanedName = nameRaw.replace(/\s*\([^\)]*\)\s*$/, '').trim();

          const symbol = (asset.symbol?.toLowerCase?.() || parsedSymbol || '').trim();
          const name   = cleanedName || nameRaw;
          const rawAssetId = asset.id?.toLowerCase?.();
          const aliasId = symbol ? CRYPTO_ID_ALIASES[symbol] : null;
          const resolvedCryptoId = aliasId || (symbol ? symbolToId[symbol] : null) || (name ? nameToId[name] : null);
          const rawId = resolvedCryptoId || asset.id;
          if (!rawId) return;

          const id = rawId.toLowerCase().trim();
          let isCrypto = (symbol && symbolToId[symbol]) || (name && nameToId[name]);
          // If backend previously resolved this id to a crypto (has meta with type crypto + resolvedId), mark as crypto
          if (!isCrypto) {
            const metaEntry = meta.find(m => m.id?.toLowerCase() === rawAssetId && m.type === 'crypto');
            if (metaEntry) isCrypto = true;
          }
          const type = asset.type || (isCrypto ? 'crypto' : 'stock');
          if (isCrypto && rawAssetId && resolvedCryptoId) {
            idMap[rawAssetId] = resolvedCryptoId.toLowerCase();
          }
          tickerSet.set(id, { id, type });
          // If crypto and we have a resolved canonical id different from current, add it too
          if (isCrypto) {
            const canonical = CRYPTO_ID_ALIASES[symbol];
            if (canonical && canonical !== id) {
              tickerSet.set(canonical, { id: canonical, type: 'crypto' });
            }
          }
        });
      });

      const tickersArr = Array.from(tickerSet.values());
      // TEMP DEBUG: log when we have TRUMP in tickers/mapping
      try {
        const dbgHasTrump = tickersArr.some(t => t.id?.includes?.('trump')) ||
          Object.values(idMap).some(v => v?.includes?.('trump'));
        if (dbgHasTrump) {
          console.debug('[DBG] collectTickers', { tickers: tickersArr, idMap });
        }
      } catch {}
      return { tickers: tickersArr, idMap };
    };

  const fetchMarketData = async ({ tickers: tickerList, idMap }) => {
      try {
        setError(null);
        const response = await fetch(`${API_BASE}/market-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(tickerList)
        });

        if (!response.ok) throw new Error(`Status ${response.status}`);

        const apiResponse = await response.json();
        const data = apiResponse.data || {};

        const missing = tickerList.some(({ id, type }) => {
          const group = type === 'crypto' ? data.cryptos : data.stocks;
          return !group?.[id];
        });

        // Sanitize idMap: remove mappings whose target id not present but original id has data
        const cleanedIdMap = { ...idMap };
        Object.entries(cleanedIdMap).forEach(([orig, mapped]) => {
          const hasMapped = data.cryptos?.[mapped] || data.stocks?.[mapped];
          const hasOrig = data.cryptos?.[orig] || data.stocks?.[orig];
          if (!hasMapped && hasOrig) {
            delete cleanedIdMap[orig];
          }
        });
        const augmented = { ...data, idMap: cleanedIdMap, _meta: data._meta || [] };
        setMarketData(augmented);
        // TEMP DEBUG: log TRUMP entry presence
        try {
          const trumpId = Object.values(cleanedIdMap).find(v => v?.includes?.('trump')) ||
            (Array.isArray(tickerList) ? tickerList.map(t => t.id).find(id => id?.includes?.('trump')) : null);
          if (trumpId) {
            console.debug('[DBG] market-data trump', {
              id: trumpId,
              crypto: data?.cryptos?.[trumpId],
              stock: data?.stocks?.[trumpId]
            });
          }
        } catch {}
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(augmented));

        if (missing) {
          console.warn('⚠️ Algunos tickers no tienen datos. Se muestran los restantes.');
          setError('Algunos precios no están disponibles. Datos parciales mostrados.');
        }

      } catch (err) {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Merge any newly computed idMap if present so UI can resolve symbols
          const merged = { cryptos: {}, stocks: {}, idMap: {}, _meta: [], ...parsed };
          setMarketData(merged);
          setError('No se pudieron obtener los precios. Mostrando datos anteriores.');
        } else {
          setError('No se pudieron obtener precios y no hay datos anteriores.');
        }
      }
    };

  const payload = collectTickers();
  // Perform the very first fetch only once when we actually have tickers (avoid empty initial call).
  if (!didInitialFetch && payload.tickers.length) {
    fetchMarketData(payload);
    setDidInitialFetch(true);
  }

  // Refresh current prices on a configurable cadence (default 120000 ms)
  let currentIntervalMs = intervalMs;
  const doRefresh = () => {
    const p = collectTickers();
    if (p.tickers.length) fetchMarketData(p);
  };
  
  if (enableInterval) {
    const schedule = () => setInterval(doRefresh, currentIntervalMs);
    let intervalHandle = schedule();
    // Listener to adjust interval dynamically from Admin Panel
    const handler = (e) => {
      const newVal = Number(e.detail);
      if (!isNaN(newVal) && newVal >= 15000 && newVal <= 30 * 60 * 1000) { // guardrails 15s - 30m
        currentIntervalMs = newVal;
        clearInterval(intervalHandle);
        intervalHandle = schedule();
      }
    };
    window.addEventListener('assetListIntervalChange', handler);
    return () => { clearInterval(intervalHandle); window.removeEventListener('assetListIntervalChange', handler); };
  } else {
    // Sin interval, no cleanup necesario
    return () => {};
  }
  }, [categoryGroups, reloadTrigger, tickersData]);

  const exchangeRates = useMemo(() => {
    const rates = {};
    Object.entries(marketData?.stocks || {}).forEach(([id, data]) => {
      if (data.currency && data.currency !== 'EUR') {
        const rateRaw = Number(data.eur / data.rawPrice).toFixed(8) * 1;
        rates[id.toLowerCase()] = { currency: data.currency, rate: rateRaw };
        rates[data.currency] = rateRaw;
      }
    });
    return rates;
  }, [marketData]);

  // Proactively compute/merge idMap whenever categoryGroups or tickers change
  useEffect(() => {
    const symbolToId = Object.fromEntries((tickersData.cryptos || []).map(t => [t.symbol?.toLowerCase?.() || '', t.id]));
    const nameToId = Object.fromEntries((tickersData.cryptos || []).map(t => [t.name?.toLowerCase?.() || '', t.id]));

    const groups = categoryGroups?.['Investments'] || {};
    const idMap = {};
    Object.values(groups).forEach(assetList => {
      (assetList || []).forEach(asset => {
        const nameRaw = asset.name?.toLowerCase?.() || '';
        const parenMatch = nameRaw.match(/\(([a-z0-9\-]+)\)\s*$/i);
        const parsedSymbol = parenMatch?.[1]?.toLowerCase?.();
        const cleanedName = nameRaw.replace(/\s*\([^\)]*\)\s*$/, '').trim();

        const symbol = (asset.symbol?.toLowerCase?.() || parsedSymbol || '').trim();
        const name   = cleanedName || nameRaw;
        const rawAssetId = asset.id?.toLowerCase?.();
        const aliasId = symbol ? CRYPTO_ID_ALIASES[symbol] : null;
        const resolvedCryptoId = aliasId || (symbol ? symbolToId[symbol] : null) || (name ? nameToId[name] : null);
        if (rawAssetId && resolvedCryptoId) {
          idMap[rawAssetId] = resolvedCryptoId.toLowerCase();
        }
      });
    });

    if (Object.keys(idMap).length) {
      setMarketData(prev => ({ ...prev, idMap: { ...(prev.idMap || {}), ...idMap } }));
    }
  }, [categoryGroups, tickersData]);

  return { marketData, exchangeRates, error };
}
