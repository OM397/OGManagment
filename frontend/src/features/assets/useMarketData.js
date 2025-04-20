// 📁 frontend/src/features/assets/useMarketData.js
import { useEffect, useState, useMemo } from 'react';
import { API_BASE } from '../../shared/config';

const LOCAL_STORAGE_KEY = 'lastSuccessfulMarketData';

export default function useMarketData(categoryGroups, reloadTrigger = 0) {
  const [marketData, setMarketData] = useState(() => {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    return cached ? JSON.parse(cached) : { cryptos: {}, stocks: {} };
  });
  const [tickersData, setTickersData] = useState({ cryptos: [], stocks: [] });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/tickers`)
      .then(res => res.json())
      .then(data => setTickersData(data));
  }, []);

  useEffect(() => {
    if (!tickersData.cryptos.length && !tickersData.stocks.length) return;

    const symbolToId = Object.fromEntries(tickersData.cryptos.map(t => [t.symbol.toLowerCase(), t.id]));
    const nameToId = Object.fromEntries(tickersData.cryptos.map(t => [t.name.toLowerCase(), t.id]));

    const collectTickers = () => {
      const groups = categoryGroups?.['Investments'] || {};
      const tickerSet = new Map();

      Object.entries(groups).forEach(([_, assetList]) => {
        assetList.forEach(asset => {
          const name = asset.name?.toLowerCase();
          const symbol = asset.symbol?.toLowerCase();
          const rawId = asset.id || symbolToId[name] || nameToId[name];
          if (!rawId) return;

          const id = rawId.toLowerCase().trim();
          const isCrypto = symbolToId[name] || nameToId[name];
          const type = asset.type || (isCrypto ? 'crypto' : 'stock');

          tickerSet.set(id, { id, type });
        });
      });

      return Array.from(tickerSet.values());
    };

    const fetchMarketData = async (tickerList) => {
      try {
        setError(null);
        const response = await fetch(`${API_BASE}/market-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(tickerList)
        });

        if (!response.ok) throw new Error(`Status ${response.status}`);

        const data = await response.json();

        const missing = tickerList.some(({ id, type }) => {
          const group = type === 'crypto' ? data.cryptos : data.stocks;
          return !group?.[id];
        });

        setMarketData(data);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));

        if (missing) {
          console.warn('⚠️ Algunos tickers no tienen datos. Se muestran los restantes.');
          setError('Algunos precios no están disponibles. Datos parciales mostrados.');
        }

      } catch (err) {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          setMarketData(JSON.parse(cached));
          setError('No se pudieron obtener los precios. Mostrando datos anteriores.');
        } else {
          setError('No se pudieron obtener precios y no hay datos anteriores.');
        }
      }
    };

    const tickers = collectTickers();
    fetchMarketData(tickers);

    const interval = setInterval(() => fetchMarketData(collectTickers()), 90000);
    return () => clearInterval(interval);
  }, [categoryGroups, reloadTrigger, tickersData]);

  const exchangeRates = useMemo(() => {
    const rates = {};
    Object.entries(marketData?.stocks || {}).forEach(([id, data]) => {
      if (data.currency && data.currency !== 'EUR') {
        rates[id.toLowerCase()] = { currency: data.currency, rate: data.eur / data.rawPrice };
        rates[data.currency] = data.eur / data.rawPrice;
      }
    });
    return rates;
  }, [marketData]);

  return { marketData, exchangeRates, error };
}
