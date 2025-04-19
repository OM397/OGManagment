// 📁 src/pages/History.jsx

import React, { useState, useMemo } from 'react';
import { useCategoryGroups } from '../shared/context/CategoryGroupsContext';
import useMarketData from '../features/assets/useMarketData';
import useMarketHistory from '../../hooks/useMarketHistory';
import useCombinedHistory from '../../hooks/useCombinedHistory';
import { formatter } from '../shared/utils';
import { GRAYS } from '../features/history/constants';
import { useUserAssets } from '../features/history/useUserAssets';
import ChartTabs from '../features/history/ChartTabs';
import LineChartPanel from '../features/history/LineChartPanel';
import PieChartPanel from '../features/history/PieChartPanel';
import AssetsSummary from '../features/assets/AssetsSummary';
import MultiLineChartPanel from '../features/history/MultiLineChartPanel';

export default function History() {
  const { categoryGroups } = useCategoryGroups();
  const { exchangeRates, marketData } = useMarketData(categoryGroups);
  const userAssets = useUserAssets(categoryGroups);

  const [selectedId, setSelectedId] = useState('ALL');
  const selected = userAssets.find(a => a.id === selectedId);

  const {
    history: assetHistory,
    loading: loadingSingle,
    convertedInitial: initialSingle
  } = useMarketHistory(
    selected?.id,
    selected?.type,
    selected?.initialQty,
    selected?.initialCost,
    exchangeRates
  );

  const {
    history: combinedHistory,
    loading: loadingAll,
    convertedInitial: initialAll,
    multiHistory
  } = useCombinedHistory(userAssets, exchangeRates);

  const history = selectedId === 'ALL' ? combinedHistory : assetHistory;
  const convertedInitial = selectedId === 'ALL' ? initialAll : initialSingle;
  const loading = selectedId === 'ALL' ? loadingAll : loadingSingle;

  const lastPoint = useMemo(() => {
    if (!history?.length) return null;
    return history[history.length - 1];
  }, [history]);

  const pieDataInitial = userAssets.map((a, i) => ({
    id: a.id,
    name: a.name,
    value: parseFloat((a.initialQty * a.initialCost).toFixed(2)),
    color: GRAYS[i % GRAYS.length]
  }));

  const pieDataMarket = userAssets.map((a, i) => {
    const group = a.type === 'crypto' ? marketData.cryptos : marketData.stocks;
    const price = group?.[a.id?.toLowerCase()]?.eur ?? 0;
    return {
      id: a.id,
      name: a.name,
      value: parseFloat((a.initialQty * price).toFixed(2)),
      color: GRAYS[i % GRAYS.length]
    };
  });

  const totalCurrent = pieDataMarket.reduce((sum, a) => sum + a.value, 0);

  const addPercent = (data, total) =>
    data.map(d => ({
      ...d,
      percent: total ? d.value / total : 0
    }));

  const pieDataInitialWithPercent = addPercent(pieDataInitial, totalCurrent).sort((a, b) => b.value - a.value);
  const pieDataMarketWithPercent = addPercent(pieDataMarket, totalCurrent).sort((a, b) => b.value - a.value);

  const activeIndex =
    selectedId === 'ALL'
      ? -1
      : pieDataInitialWithPercent.findIndex(p => p.id === selected?.id);

  const pieDataTypeMarket = ['crypto', 'stock'].map((type, i) => {
    const group = type === 'crypto' ? marketData.cryptos : marketData.stocks;
    const total = userAssets
      .filter(a => a.type === type)
      .reduce((sum, a) => {
        const price = group?.[a.id?.toLowerCase()]?.eur ?? 0;
        return sum + a.initialQty * price;
      }, 0);

    return {
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: parseFloat(total.toFixed(2)),
      color: GRAYS[i % GRAYS.length]
    };
  });

  const totalByType = pieDataTypeMarket.reduce((s, a) => s + a.value, 0);
  const pieDataTypeWithPercent = addPercent(pieDataTypeMarket, totalByType);

  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <AssetsSummary initialData={categoryGroups} marketData={marketData} onlyInvestments />
      <ChartTabs selectedId={selectedId} userAssets={userAssets} onSelect={setSelectedId} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LineChartPanel
          selectedId={selectedId}
          history={history}
          loading={loading}
          convertedInitial={convertedInitial}
          lastPoint={lastPoint}
        />
        <PieChartPanel
          pieDataInitial={pieDataInitialWithPercent}
          pieDataMarket={pieDataMarketWithPercent}
          totalCurrent={totalCurrent}
          activeIndex={activeIndex}
          onSelect={setSelectedId}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <MultiLineChartPanel multiHistory={multiHistory} />
        <PieChartPanel
          pieDataInitial={pieDataTypeWithPercent}
          pieDataMarket={pieDataTypeWithPercent}
          totalCurrent={totalByType}
          activeIndex={-1}
        />
      </div>
    </div>
  );
}
