// PortfolioOverview.jsx - Componente visual para el overview del portafolio en Dashboard2
import React, { useState, useMemo } from 'react';

export default function PortfolioOverview({ assets }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Calcula los totales basándose en los assets recibidos (que pueden estar filtrados)
  const totalCurrent = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
  const totalInitial = assets.reduce((sum, a) => sum + (a.initialValue || 0), 0);
  const totalReturn = totalInitial > 0 ? ((totalCurrent - totalInitial) / totalInitial) * 100 : 0;
  const displayAssetsCount = assets.length;

  // Función para manejar el ordenamiento
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Función para obtener el ícono de ordenamiento
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return ''; // Sin ordenar
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Assets ordenados
  const sortedAssets = useMemo(() => {
    if (!sortConfig.key) return assets;

    return [...assets].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'name':
          aValue = a.nameShort || a.name || '';
          bValue = b.nameShort || b.name || '';
          break;
        case 'value':
          aValue = a.currentValue || 0;
          bValue = b.currentValue || 0;
          break;
        case 'sevenDayChange':
          aValue = a.sevenDayChange || 0;
          bValue = b.sevenDayChange || 0;
          break;
        case 'pnl':
          aValue = a.pnl || 0;
          bValue = b.pnl || 0;
          break;
        case 'pnlPercent':
          aValue = a.pnlPercent || 0;
          bValue = b.pnlPercent || 0;
          break;
        case 'irr':
          aValue = isFinite(a.irrValue) ? a.irrValue : -Infinity;
          bValue = isFinite(b.irrValue) ? b.irrValue : -Infinity;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [assets, sortConfig]);

  return (
    <div className="bg-white rounded-lg shadow-sm w-full p-4 sm:p-7 min-h-[300px] flex flex-col">
      <div className="mb-3 sm:mb-4 flex-shrink-0">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-green-600">{displayAssetsCount}</div>
            <div className="text-xs text-gray-500">Total Assets</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-blue-600">
              {totalReturn > 0 ? '+' : ''}{totalReturn.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">Total Return</div>
          </div>
        </div>
      </div>
      {/* La lista de assets debe llenar el cuadrante y solo mostrar scroll si es necesario */}
      <div
        className="overflow-x-auto min-h-0"
        style={{ paddingBottom: 0 }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-6 items-center py-1.5 pr-2 border-b-2 border-gray-200 bg-gray-50 sticky top-0 text-[10px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider gap-x-2 w-full">
          <div 
            className="cursor-pointer hover:text-gray-700 flex items-center gap-1 min-w-[120px]"
            onClick={() => handleSort('name')}
          >
            Asset {getSortIcon('name')}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-gray-700 flex items-center justify-end gap-1 min-w-[80px]"
            onClick={() => handleSort('value')}
          >
            Value (€) {getSortIcon('value')}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-gray-700 flex items-center justify-end gap-1 min-w-[70px]"
            onClick={() => handleSort('sevenDayChange')}
          >
            7d (%) {getSortIcon('sevenDayChange')}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-gray-700 flex items-center justify-end gap-1 min-w-[80px]"
            onClick={() => handleSort('pnl')}
          >
            P&L (€) {getSortIcon('pnl')}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-gray-700 flex items-center justify-end gap-1 min-w-[70px]"
            onClick={() => handleSort('pnlPercent')}
          >
            P&L (%) {getSortIcon('pnlPercent')}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-gray-700 flex items-center justify-end gap-1 min-w-[70px]"
            onClick={() => handleSort('irr')}
          >
            IRR (%) {getSortIcon('irr')}
          </div>
        </div>
        <div className="divide-y divide-gray-100 h-full min-h-0 flex flex-col">
          {sortedAssets.map((asset, idx) => (
            <div key={asset.id || idx} className="grid grid-cols-2 sm:grid-cols-6 items-center py-1.5 pr-2 text-[11px] md:text-[12px] gap-x-2 w-full">
              <div className="font-medium text-gray-800 pr-1 truncate min-w-[120px]" title={asset.name}>
                {asset.nameShort}
                {asset.initialCurrency && asset.initialCurrency !== 'EUR' && (
                  <span className="text-gray-500 font-normal"> - {asset.initialCurrency}</span>
                )}
              </div>
              <div className="text-right font-medium text-gray-800 tabular-nums min-w-[80px]">€ {Math.round(asset.currentValue)}</div>
              <div className={`text-right font-medium tabular-nums min-w-[70px] ${asset.sevenDayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {asset.sevenDayChange >= 0 ? '+' : ''}{asset.sevenDayChange.toFixed(1)}%
              </div>
              <div className={`text-right font-medium tabular-nums min-w-[80px] ${asset.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{asset.pnl >= 0 ? '+' : ''}€{Math.round(asset.pnl)}</div>
              <div className={`text-right font-medium tabular-nums min-w-[70px] ${asset.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{asset.pnlPercent >= 0 ? '+' : ''}{asset.pnlPercent.toFixed(1)}%</div>
              <div className={`text-right font-medium tabular-nums min-w-[70px] ${asset.irrValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>{isFinite(asset.irrValue) ? asset.irrValue.toFixed(1) + '%' : '--'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}