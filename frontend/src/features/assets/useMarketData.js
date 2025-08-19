// 📁 frontend/src/features/assets/useMarketData.js
import { useEffect, useState, useRef } from 'react';
import { API_BASE } from '../../shared/config';
import { CRYPTO_ID_ALIASES } from '../../shared/cryptoIdAliases';

const LOCAL_STORAGE_KEY = 'lastSuccessfulMarketData';
const FX_LOCAL_STORAGE_KEY = 'lastSuccessfulFX_v2';

export default function useMarketData(categoryGroups, reloadTrigger = 0, options = {}) {
  const {
    enableInterval = true,            // permite desactivar interval
    intervalMs,                        // DEPRECATED: usar currentPriceIntervalMs
    currentPriceIntervalMs = 120000,   // cadencia de precios actuales
    fxThrottleMs = 120000,             // cada cuánto publicar FX derivados
  fxPollMs = 0,                      // polling real a /fx (0 = desactivado)
    startupBurstCount = 0,             // 0 = sin burst; si >0, nº de actualizaciones al inicio
    startupBurstSpacingMs = 40000      // separación entre bursts
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
  const [exchangeRates, setExchangeRates] = useState({});
  // Track last time we published FX to avoid spamming updates
  const lastFxUpdateRef = useRef(0);
  // Anti-race: track request/apply sequence to avoid older responses overwriting newer state
  const lastRequestSeqRef = useRef(0);
  const lastAppliedSeqRef = useRef(0);
  const [error, setError] = useState(null);
  // Track if we've performed the first real fetch (after tickers resolved) so user sees fresh prices immediately on session start
  const [didInitialFetch, setDidInitialFetch] = useState(false);
  // Ensure we fetch FX once on session start from backend (authoritative), then rely on throttle
  const didInitialFxFetchRef = useRef(false);
  // Track last set of requested tickers to fetch immediately on portfolio changes
  const lastTickersSigRef = useRef('');

  // Seed FX from localStorage immediately on mount (fast UI) while waiting for live /fx
  useEffect(() => {
    try {
      const cached = localStorage.getItem(FX_LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Object.keys(parsed).length) {
          setExchangeRates(prev => ({ ...parsed, ...prev }));
        }
      }
    } catch {}
  }, []);

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
      return { tickers: tickersArr, idMap };
    };

  const fetchMarketData = async ({ tickers: tickerList, idMap }) => {
      try {
        setError(null);
        const seq = ++lastRequestSeqRef.current;
        const response = await fetch(`${API_BASE}/market-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(tickerList)
        });

        if (!response.ok) throw new Error(`Status ${response.status}`);

        const apiResponse = await response.json();
        const data = apiResponse.data || {};

        // Only apply if this response is not older than what we've already applied
        if (seq <= lastAppliedSeqRef.current) {
          return; // a newer response already applied state
        }

        // Build desired ID sets to merge per-id and mark stale entries when not updated
        const desiredCryptoIds = new Set(
          tickerList.filter(t => t.type === 'crypto').map(t => t.id.toLowerCase())
        );
        const desiredStockIds = new Set(
          tickerList.filter(t => t.type === 'stock').map(t => t.id.toLowerCase())
        );

        const now = Date.now();
        const responseCryptos = data.cryptos || {};
        const responseStocks = data.stocks || {};

        // Compute missing based solely on the response payload (for messaging)
        const missing = tickerList.some(({ id, type }) => {
          const group = type === 'crypto' ? responseCryptos : responseStocks;
          return !group?.[id];
        });

        setMarketData(prev => {
          const prevCryptos = prev?.cryptos || {};
          const prevStocks = prev?.stocks || {};

          // Conservative merge: start from previous snapshot to avoid dropping entries on partial responses
          const mergedCryptos = { ...prevCryptos };
          desiredCryptoIds.forEach(id => {
            const incoming = responseCryptos[id];
            if (incoming) {
              mergedCryptos[id] = { ...incoming, _stale: false, _updatedAt: now };
            } else if (mergedCryptos[id]) {
              mergedCryptos[id] = { ...mergedCryptos[id], _stale: true };
            }
          });

          const mergedStocks = { ...prevStocks };
          desiredStockIds.forEach(id => {
            const incoming = responseStocks[id];
            if (incoming) {
              mergedStocks[id] = { ...incoming, _stale: false, _updatedAt: now };
            } else if (mergedStocks[id]) {
              mergedStocks[id] = { ...mergedStocks[id], _stale: true };
            }
          });

          // Merge idMap conservatively: never delete here to avoid dropping mappings on partial responses
          const mergedIdMap = { ...(prev.idMap || {}), ...(idMap || {}) };

          const next = {
            cryptos: mergedCryptos,
            stocks: mergedStocks,
            idMap: mergedIdMap,
            _meta: data._meta || prev._meta || [],
            _appliedAt: now,
            _seq: seq
          };
          try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next)); } catch {}
          return next;
        });

        lastAppliedSeqRef.current = seq;

        if (missing) {
          console.warn('⚠️ Algunos tickers no tienen datos. Se mantienen valores anteriores marcados como “stale”.');
          setError('Algunos precios no están disponibles. Mostrando valores previos (stale) temporalmente.');
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
  const currentSig = payload.tickers.map(t => `${t.type}:${t.id}`).sort().join('|');
  // Initial fetch when tickers become available
  if (!didInitialFetch && payload.tickers.length) {
    fetchMarketData(payload);
    setDidInitialFetch(true);
    lastTickersSigRef.current = currentSig;
  } else if (didInitialFetch && payload.tickers.length) {
    // If the set of tickers changed (e.g., user added/removed an investment), fetch immediately
    if (currentSig !== lastTickersSigRef.current) {
      lastTickersSigRef.current = currentSig;
      fetchMarketData(payload);
    }
  }

  // Refresh current prices on a configurable cadence (default 120000 ms)
  let currentIntervalMs = typeof intervalMs === 'number' ? intervalMs : currentPriceIntervalMs;
  const doRefresh = () => {
    const p = collectTickers();
    if (p.tickers.length) fetchMarketData(p);
  };
  
  if (enableInterval) {
    const schedule = () => setInterval(doRefresh, currentIntervalMs);
    let intervalHandle = schedule();
    // Startup burst: dispara N actualizaciones adicionales separadas por startupBurstSpacingMs
    let burstTimers = [];
    if (startupBurstCount && startupBurstCount > 0) {
      // Evitar doble llamada en 0ms: empezar en +startupBurstSpacingMs
      for (let i = 1; i <= startupBurstCount; i++) {
        const t = setTimeout(() => doRefresh(), i * startupBurstSpacingMs);
        burstTimers.push(t);
      }
    }
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
    return () => {
      clearInterval(intervalHandle);
      burstTimers.forEach(clearTimeout);
      window.removeEventListener('assetListIntervalChange', handler);
    };
  } else {
    // Sin interval, no cleanup necesario
    return () => {};
  }
  }, [categoryGroups, reloadTrigger, tickersData]);

  // Throttle publication of FX derived from latest marketData
  useEffect(() => {
    // FX polling desde backend (autoritativo)
    if (fxPollMs && fxPollMs > 0) {
      let aborted = false;
      const computeCurrencies = () => {
        const currencies = new Set();
        Object.values(marketData?.stocks || {}).forEach(d => {
          if (d?.currency && d.currency !== 'EUR') currencies.add(d.currency);
        });
        return Array.from(currencies);
      };
      const fetchFx = () => {
        const list = computeCurrencies();
        if (!list.length) return;
        fetch(`${API_BASE}/fx?currencies=${list.join(',')}`, { credentials: 'include' })
          .then(r => r.ok ? r.json() : Promise.reject(new Error('fx http error ' + r.status)))
          .then(json => {
            if (aborted) return;
            const serverRates = json?.rates || {};
            if (serverRates && Object.keys(serverRates).length) {
              // Normalize Frankfurter (XXX per EUR) => XXX/EUR multiplier expected by UI (EUR per XXX)
              const normalized = Object.fromEntries(Object.entries(serverRates).map(([k, v]) => {
                const num = Number(v);
                return [k, (isFinite(num) && num > 0) ? +(1 / num) : v];
              }));
              setExchangeRates(prev => ({ ...prev, ...normalized }));
              try { localStorage.setItem(FX_LOCAL_STORAGE_KEY, JSON.stringify(normalized)); } catch {}
              didInitialFxFetchRef.current = true;
            }
          })
          .catch(() => {
            // fallback: use last successful FX from localStorage if present
            try {
              const cached = localStorage.getItem(FX_LOCAL_STORAGE_KEY);
              if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && Object.keys(parsed).length) {
                  setExchangeRates(prev => ({ ...prev, ...parsed }));
                }
              }
            } catch {}
          });
      };
      fetchFx();
      const h = setInterval(fetchFx, fxPollMs);
      return () => { aborted = true; clearInterval(h); };
    }

    // One-time FX fetch from backend when we have any non-EUR currencies in the snapshot
    if (!didInitialFxFetchRef.current) {
      const currencies = new Set();
      Object.values(marketData?.stocks || {}).forEach(d => { if (d.currency && d.currency !== 'EUR') currencies.add(d.currency); });
      if (currencies.size > 0) {
        fetch(`${API_BASE}/fx?currencies=${Array.from(currencies).join(',')}`, { credentials: 'include' })
          .then(r => r.ok ? r.json() : Promise.reject(new Error('fx http error ' + r.status)))
          .then(json => {
            const serverRates = json?.rates || {};
            if (serverRates && Object.keys(serverRates).length) {
              const normalized = Object.fromEntries(Object.entries(serverRates).map(([k, v]) => {
                const num = Number(v);
                return [k, (isFinite(num) && num > 0) ? +(1 / num) : v];
              }));
              setExchangeRates(prev => ({ ...prev, ...normalized }));
              try { localStorage.setItem(FX_LOCAL_STORAGE_KEY, JSON.stringify(normalized)); } catch {}
              didInitialFxFetchRef.current = true;
            }
          })
          .catch(() => {
            // fallback: last successful FX from localStorage
            try {
              const cached = localStorage.getItem(FX_LOCAL_STORAGE_KEY);
              if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && Object.keys(parsed).length) {
                  setExchangeRates(prev => ({ ...prev, ...parsed }));
                }
              }
            } catch {}
            /* then fallback to derived FX below */
          });
      }
    }

    const now = Date.now();
    const shouldUpdate = (now - (lastFxUpdateRef.current || 0)) >= fxThrottleMs || lastFxUpdateRef.current === 0;
    if (!shouldUpdate) return;
    const rates = {};
    Object.values(marketData?.stocks || {}).forEach((data) => {
      if (data.currency && data.currency !== 'EUR' && typeof data.rawPrice === 'number' && typeof data.eur === 'number') {
        // Derive XXX/EUR as eur/rawPrice (EUR per unit of XXX)
        const rateRaw = +(data.eur / data.rawPrice).toFixed(8);
        // Keep highest-confidence value; do not overwrite server-provided code if present
        if (rateRaw > 0 && !isNaN(rateRaw) && typeof rates[data.currency] !== 'number') {
          rates[data.currency] = rateRaw;
        }
      }
    });
    // Merge normalized rates without clobbering server values when both exist
    setExchangeRates(prev => ({ ...rates, ...prev }));
    lastFxUpdateRef.current = now;
  }, [marketData, fxThrottleMs, fxPollMs]);

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
