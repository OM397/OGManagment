// 📁 frontend/src/features/assets/useMarketData.js
import { useEffect, useState } from 'react';
import { API_BASE } from '../../shared/config';

const STORAGE_KEY = 'lastValidMarketData';

export default function useMarketData(categoryGroups, reloadTrigger = 0) {
  const [marketData, setMarketData] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : { cryptos: {}, stocks: {} };
    } catch {
      return { cryptos: {}, stocks: {} };
    }
  });

  const [tickersData, setTickersData] = useState({ cryptos: [], stocks: [] });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/tickers`)
      .then(res => res.json())
      .then(data => setTickersData(data))
      .catch(err => console.error('❌ Error loading tickers', err));
  }, []);

  useEffect(() => {
    if (!tickersData.cryptos.length && !tickersData.stocks.length) return;

    const symbolToId = Object.fromEntries(tickersData.cryptos.map(t => [t.symbol.toLowerCase(), t.id]));
    const nameToId = Object.fromEntries(tickersData.cryptos.map(t => [t.name.toLowerCase(), t.id]));

    const collectTickers = () => {
      const groups = categoryGroups['Investments'] || {};
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

        if (!response.ok) throw new Error(`Status ${response.status}: ${response.statusText}`);

        const data = await response.json();
        setMarketData(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.error('❌ Error fetching market data:', err.message);
        setError('No se pudieron obtener los precios actualizados. Mostrando últimos datos disponibles.');
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) setMarketData(JSON.parse(cached));
        } catch {
          setMarketData({ cryptos: {}, stocks: {} });
        }
      }
    };

    const tickers = collectTickers();
    fetchMarketData(tickers);
    const interval = setInterval(() => fetchMarketData(collectTickers()), 90000);
    return () => clearInterval(interval);
  }, [categoryGroups, reloadTrigger, tickersData]);

  return { marketData, error };
}
