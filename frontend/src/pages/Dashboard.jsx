// 📊 Investment Dashboard - Overview and Metrics
import React, { useState, useMemo } from 'react';
import AssetsSummary from '../features/assets/AssetsSummary';
import PieChartPanel from '../features/history/PieChartPanel';
import MultiLineChartPanel from '../features/history/MultiLineChartPanel';
import LineChartPanel from '../features/history/LineChartPanel';
import ChartTabs from '../features/history/ChartTabs';
import useInvestmentsIRR from '../features/assets/useInvestmentsIRR';
import useCombinedHistory from '../../hooks/useCombinedHistory';
import { GRAYS } from '../features/history/constants';

export default function Dashboard({ 
  categoryGroups, 
  marketData, 
  setCategoryGroups,
  exchangeRates,
  reloadMarketData 
}) {
  const [selectedId, setSelectedId] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ key: 'value', direction: 'desc' });

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Extract all investment assets for charts
  const userAssets = useMemo(() => {
    const assets = [];
    Object.values(categoryGroups?.Investments || {}).forEach(group => {
      if (Array.isArray(group)) {
        group.forEach(asset => {
          if (asset?.id && asset?.name) {
            assets.push({
              ...asset,
              nameShort: asset.name.split(' ')[0] // Short name for tabs
            });
          }
        });
      }
    });
    return assets;
  }, [categoryGroups]);

  // Calculate simple IRR approximation for each asset
  const calculateSimpleIRR = (asset) => {
    const initialValue = (asset.initialCost || 0) * (asset.initialQty || 0);
    const group = asset.type === 'crypto' ? marketData.cryptos : marketData.stocks;
    const currentPrice = group?.[asset.id?.toLowerCase()]?.eur ?? 0;
    const currentValue = (asset.initialQty || 0) * currentPrice;
    
    if (initialValue <= 0 || !asset.initialDate) return 0;
    
    const startDate = new Date(asset.initialDate);
    const today = new Date();
    const yearsHeld = (today - startDate) / (365.25 * 24 * 60 * 60 * 1000);
    
    if (yearsHeld <= 0) return 0;
    
    // Simple annualized return calculation
    const totalReturn = currentValue / initialValue;
    const annualizedReturn = (Math.pow(totalReturn, 1/yearsHeld) - 1) * 100;
    
    return isFinite(annualizedReturn) ? annualizedReturn : 0;
  };

  const { irr: irrData, loading: loadingIRR } = useInvestmentsIRR();

  // Find selected asset first, before using it in hooks
  const selected = userAssets.find(a => a.id === selectedId);

  const {
    history: historyAll,
    loading: loadingAll,
    multiHistory
  } = useCombinedHistory(userAssets, exchangeRates);

  const {
    history: historySingle,
    loading: loadingSingle
  } = useCombinedHistory(selectedId === 'ALL' ? [] : [selected].filter(Boolean), exchangeRates);

  const history = selectedId === 'ALL' ? historyAll : historySingle;
  const loading = selectedId === 'ALL' ? loadingAll : loadingSingle;

  const convertedInitialSingle = selected 
    ? (selected.initialCost || 0) * (selected.initialQty || 0) 
    : 0;
  const convertedInitialAll = userAssets.reduce((sum, a) => 
    sum + (a.initialCost || 0) * (a.initialQty || 0), 0
  );
  const convertedInitial = selectedId === 'ALL' ? convertedInitialAll : convertedInitialSingle;

  const lastPoint = useMemo(() => {
    if (!history?.length) return null;
    return history[history.length - 1];
  }, [history]);

  // Prepare pie chart data
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

  const pieDataInitialWithPercent = addPercent(pieDataInitial, totalCurrent);
  const pieDataMarketWithPercent = addPercent(pieDataMarket, totalCurrent);

  // Sort both initial and market together by initial values
  const sorted = pieDataInitialWithPercent
    .map((entry, i) => ({
      ...entry,
      marketValue: pieDataMarketWithPercent[i].value
    }))
    .sort((a, b) => b.value - a.value);

  const syncedPieDataInitial = sorted.map(({ marketValue, ...initial }) => initial);
  const syncedPieDataMarket = sorted.map(({ id }) =>
    pieDataMarketWithPercent.find(d => d.id === id)
  );

  return (
    <div className="p-3 sm:p-6 max-w-screen-xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Investment Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage and track your investment portfolio</p>
      </div>

      {/* Portfolio Summary */}
      <AssetsSummary 
        initialData={categoryGroups} 
        marketData={marketData} 
        activeTab="Investments"
      />

      {/* Chart Selection Tabs */}
      <ChartTabs 
        selectedId={selectedId} 
        userAssets={userAssets} 
        onSelect={setSelectedId} 
      />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <LineChartPanel
          selectedId={selectedId}
          history={history}
          loading={loading}
          convertedInitial={convertedInitial}
          lastPoint={lastPoint}
        />
        <PieChartPanel
          pieDataInitial={syncedPieDataInitial}
          pieDataMarket={syncedPieDataMarket}
          totalCurrent={totalCurrent}
          selectedId={selectedId}
          onSelect={setSelectedId}
          irrData={irrData}
          loadingIRR={loadingIRR}
        />
      </div>

      {/* Bottom Section: Multi-Chart and Right Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mt-4 lg:mt-6">
        {/* Multi-Asset Chart - Left side (2 columns) */}
        <div className="lg:col-span-2">
          <MultiLineChartPanel multiHistory={multiHistory} />
        </div>
        
        {/* Right Panel - Unified Portfolio Overview */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 h-auto lg:h-[600px] flex flex-col">
          {/* Header with Quick Stats */}
          <div className="mb-3 sm:mb-4 flex-shrink-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Portfolio Overview</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-green-600">{userAssets.length}</div>
                <div className="text-xs text-gray-500">Total Assets</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl font-bold text-blue-600">
                  {totalCurrent > convertedInitial ? '+' : ''}
                  {convertedInitial > 0 ? ((totalCurrent - convertedInitial) / convertedInitial * 100).toFixed(1) : '0.0'}%
                </div>
                <div className="text-xs text-gray-500">Total Return</div>
              </div>
            </div>
          </div>
          
          {/* Assets Table - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th 
                    className="px-1 sm:px-2 py-2 text-left font-medium text-gray-600 w-[30%] cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Asset
                      {sortConfig.key === 'name' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'desc' ? '↓' : '↑'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-1 sm:px-2 py-2 text-right font-medium text-gray-600 w-[18%] cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('value')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Value
                      {sortConfig.key === 'value' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'desc' ? '↓' : '↑'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-1 sm:px-2 py-2 text-right font-medium text-gray-600 w-[17%] cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('pnl')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      P&L
                      {sortConfig.key === 'pnl' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'desc' ? '↓' : '↑'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-1 sm:px-2 py-2 text-right font-medium text-gray-600 w-[17%] cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('percent')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      %
                      {sortConfig.key === 'percent' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'desc' ? '↓' : '↑'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-1 sm:px-2 py-2 text-right font-medium text-gray-600 w-[18%] cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('irr')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      IRR
                      {sortConfig.key === 'irr' && (
                        <span className="text-xs">
                          {sortConfig.direction === 'desc' ? '↓' : '↑'}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userAssets
                  .map((asset, originalIndex) => {
                    const group = asset.type === 'crypto' ? marketData.cryptos : marketData.stocks;
                    const currentPrice = group?.[asset.id?.toLowerCase()]?.eur ?? 0;
                    const currentValue = (asset.initialQty || 0) * currentPrice;
                    const initialValue = (asset.initialQty || 0) * (asset.initialCost || 0);
                    const pnl = currentValue - initialValue;
                    const pnlPercent = initialValue > 0 ? (pnl / initialValue) * 100 : 0;
                    const assetIRR = irrData[asset.id];
                    const irrFromAPI = (typeof assetIRR === 'number' && !isNaN(assetIRR)) ? assetIRR : null;
                    // Use API IRR if available, otherwise calculate locally
                    const irrValue = irrFromAPI !== null ? irrFromAPI : calculateSimpleIRR(asset);
                    
                    return { 
                      ...asset, 
                      currentValue, 
                      pnl, 
                      pnlPercent, 
                      irrValue, 
                      originalIndex 
                    };
                  })
                  .sort((a, b) => {
                    let aValue, bValue;
                    
                    switch (sortConfig.key) {
                      case 'name':
                        aValue = a.name?.toLowerCase() || '';
                        bValue = b.name?.toLowerCase() || '';
                        break;
                      case 'value':
                        aValue = a.currentValue;
                        bValue = b.currentValue;
                        break;
                      case 'pnl':
                        aValue = a.pnl;
                        bValue = b.pnl;
                        break;
                      case 'percent':
                        aValue = a.pnlPercent;
                        bValue = b.pnlPercent;
                        break;
                      case 'irr':
                        aValue = a.irrValue;
                        bValue = b.irrValue;
                        break;
                      default:
                        aValue = a.currentValue;
                        bValue = b.currentValue;
                    }
                    
                    if (sortConfig.direction === 'asc') {
                      if (typeof aValue === 'string') {
                        return aValue.localeCompare(bValue);
                      }
                      return aValue - bValue;
                    } else {
                      if (typeof aValue === 'string') {
                        return bValue.localeCompare(aValue);
                      }
                      return bValue - aValue;
                    }
                  })
                  .map((asset, index) => {
                  // Use pre-calculated values
                  const currentValue = asset.currentValue;
                  const pnl = asset.pnl;
                  const pnlPercent = asset.pnlPercent;
                  const irrValue = asset.irrValue;
                  
                  // Create smart abbreviation - Ultra compact
                  const getAbbreviation = (name) => {
                    if (!name) return 'N/A';
                    
                    // Ultra compact abbreviations for known assets
                    const abbreviations = {
                      'vanguard global stock index fund': 'VG Global',
                      'vanguard global bond index fund': 'VG Bond',
                      'vanguard u.s.': 'VG U.S.',
                      'vanguard us': 'VG U.S.',
                      'vanguard european': 'VG EU',
                      'vanguard emerging': 'VG EM',
                      'bitcoin': 'Bitcoin',
                      'ishares physical metals': 'iSh Metals',
                      'ishares metals': 'iSh Metals',
                      'vaneck ucits': 'VanEck',
                      'vaneck': 'VanEck',
                      'ishares eur corp bond': 'iSh EUR',
                      'ishares eur': 'iSh EUR',
                      'invesco eqqq nasdaq': 'Inv EQQQ',
                      'invesco eqqq': 'Inv EQQQ',
                      'ark invest': 'ARK',
                      'ishares iv plc': 'iSh IV',
                      'lithium argentina': 'Li ARG'
                    };
                    
                    const lowerName = name.toLowerCase();
                    
                    // Check for known abbreviations first
                    for (const [key, abbrev] of Object.entries(abbreviations)) {
                      if (lowerName.includes(key)) {
                        return abbrev;
                      }
                    }
                    
                    // Fallback: smart truncation for 8 characters max
                    const words = name.split(' ');
                    if (words.length >= 2) {
                      const first = words[0].substring(0, 4);
                      const second = words[1].substring(0, 3);
                      return `${first} ${second}`;
                    }
                    
                    return name.length > 8 ? name.substring(0, 8) : name;
                  };
                  
                  return (
                    <tr key={asset.id || index} className="hover:bg-gray-50">
                      <td className="px-1 sm:px-2 py-2 w-[30%]">
                        <div className="font-medium text-gray-900 truncate text-xs leading-tight">
                          {getAbbreviation(asset.name)}
                        </div>
                      </td>
                      <td className="px-1 sm:px-2 py-2 text-right font-medium w-[18%] text-xs">
                        €{currentValue.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className={`px-1 sm:px-2 py-2 text-right font-medium w-[17%] text-xs ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pnl >= 0 ? '+' : ''}€{Math.abs(pnl).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </td>
                      <td className={`px-1 sm:px-2 py-2 text-right font-medium w-[17%] text-xs ${pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
                      </td>
                      <td className={`px-1 sm:px-2 py-2 text-right font-medium w-[18%] text-xs ${irrValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {irrValue >= 0 ? '+' : ''}{irrValue.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
