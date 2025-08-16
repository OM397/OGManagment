import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';

export function useAssetSearch(assetType, cryptos) {
  const [inputValue, setInputValue] = useState(''); // still expose for placeholder hint only
  const [filteredOptions, setFilteredOptions] = useState([]);
  // ...existing code...
  const [loading, setLoading] = useState(false);

  const fuse = useMemo(() => new Fuse(assetType === 'Cryptos' ? cryptos : [], {
    keys: ['name', 'symbol'],
    threshold: 0.3,
    includeScore: false
  }), [assetType, cryptos]);

  const handleInputChange = async (value) => {
  // ...existing code...
  setInputValue(value); // for hint only
  // fetch / filter only after 2 chars
  if (!value || value.length < 2) { setFilteredOptions([]); return value; }
    if (assetType === 'Cryptos') {
      const results = fuse.search(value).slice(0, 40);
      setFilteredOptions(results.map(r => {
        const symbol = r.item.symbol?.toUpperCase?.() || '';
        return { label: `${r.item.name} (${symbol})`, value: r.item.id, id: r.item.id, symbol, name: r.item.name };
      }));
  // ...existing code...
    } else {
      try {
        setLoading(true);
        const res = await fetch(`/api/search-stocks?q=${encodeURIComponent(value)}`);
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        const stocks = data?.result || [];
        setFilteredOptions(stocks.map(stock => ({
          label: `${stock.name || stock.description || stock.symbol} (${stock.symbol})`, value: stock.symbol, id: stock.symbol, symbol: stock.symbol, name: stock.name || stock.description || stock.symbol
        })));
      } catch (e) {
        console.error('❌ Stock search error', e);
        setFilteredOptions([]);
      } finally { setLoading(false); }
    }
  };

  return { inputValue, filteredOptions, handleInputChange, setInputValue, loading };
}
