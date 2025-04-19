import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';

export function useAssetSearch(assetType, cryptos) {
  const [inputValue, setInputValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);

  const fuse = useMemo(() => {
    return new Fuse(assetType === 'Cryptos' ? cryptos : [], {
      keys: ['name', 'symbol'],
      threshold: 0.3,
      includeScore: false
    });
  }, [assetType, cryptos]);

  const handleInputChange = async (value) => {
    setInputValue(value);
    if (value.length < 2) return setFilteredOptions([]);

    if (assetType === 'Cryptos') {
      const results = fuse.search(value).slice(0, 50);
      setFilteredOptions(results.map(r => ({
        label: `${r.item.name} (${r.item.symbol})`,
        value: r.item.name,
        id: r.item.id || r.item.symbol
      })));
    } else {
      try {
        const res = await fetch(`/api/search-stocks?q=${encodeURIComponent(value)}`);
        if (!res.ok) throw new Error(`Search failed with ${res.status}`);
        const data = await res.json();
        const stocks = data?.result || [];

        setFilteredOptions(stocks.map(stock => ({
          label: `${stock.description} (${stock.symbol})`,
          value: stock.symbol,
          id: stock.symbol
        })));
      } catch (err) {
        console.error('❌ Error searching stocks:', err);
        setFilteredOptions([]);
      }
    }
  };

  return { inputValue, filteredOptions, handleInputChange, setInputValue };
}
