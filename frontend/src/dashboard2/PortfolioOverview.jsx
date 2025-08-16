// PortfolioOverview.jsx - Componente visual para el overview del portafolio en Dashboard2
import React from 'react';

export default function PortfolioOverview({ assets, totalCurrent, totalInitial }) {
  const totalReturn = totalInitial > 0 ? ((totalCurrent - totalInitial) / totalInitial) * 100 : 0;
  return (
  <div className="bg-white rounded-lg shadow-sm w-full p-4 sm:p-7 min-h-[300px] flex flex-col">
      <div className="mb-3 sm:mb-4 flex-shrink-0">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Portfolio Overview</h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg sm:text-xl font-bold text-green-600">{assets.length}</div>
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
        <div className="grid grid-cols-2 sm:grid-cols-5 items-center py-1.5 pr-2 border-b-2 border-gray-200 bg-gray-50 sticky top-0 text-[10px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider gap-x-2 w-full">
          <div>Asset</div>
          <div className="text-right">Value</div>
          <div className="text-right">P&L (€)</div>
          <div className="text-right">P&L (%)</div>
          <div className="text-right">IRR (%)</div>
        </div>
        <div className="divide-y divide-gray-100 h-full min-h-0 flex flex-col">
          {assets.map((asset, idx) => (
            <div key={asset.id || idx} className="grid grid-cols-2 sm:grid-cols-5 items-center py-1.5 pr-2 text-[11px] md:text-[12px] gap-x-2 w-full">
              <div className="font-medium text-gray-800 pr-1 truncate" title={asset.name}>{asset.nameShort}</div>
              <div className="text-right font-medium text-gray-800 tabular-nums">€{Math.round(asset.currentValue)}</div>
              <div className={`text-right font-medium tabular-nums ${asset.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{asset.pnl >= 0 ? '+' : ''}€{Math.round(asset.pnl)}</div>
              <div className={`text-right font-medium tabular-nums ${asset.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{asset.pnlPercent >= 0 ? '+' : ''}{asset.pnlPercent.toFixed(1)}%</div>
              <div className={`text-right font-medium tabular-nums ${asset.irrValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>{isFinite(asset.irrValue) ? asset.irrValue.toFixed(1) + '%' : '--'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
