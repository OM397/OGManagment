// PortfolioOverview.jsx - Componente visual para el overview del portafolio en Dashboard2
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';

export default function PortfolioOverview({ assets }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [assetColumnWidth, setAssetColumnWidth] = useState(220); // Ancho inicial de la columna Asset
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);

  // Calcula los totales basándose en los assets recibidos (que pueden estar filtrados)
  const totalCurrent = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
  const totalInitial = assets.reduce((sum, a) => sum + (a.initialValue || 0), 0);
  const totalReturn = totalInitial > 0 ? ((totalCurrent - totalInitial) / totalInitial) * 100 : 0;
  const displayAssetsCount = assets.length;
  
  // Calcular el IRR promedio ponderado del portafolio
  // El IRR de cada asset viene en irrValue
  // calculateSimpleIRR (fallback local) devuelve porcentaje (ej: 15.5 para 15.5%)
  // La API del backend devuelve decimal (ej: 0.155 para 15.5%)
  // Como usePortfolioOverview ya normaliza a porcentaje en irrValue, 
  // solo necesitamos dividir entre el peso y retornar
  const portfolioIRR = useMemo(() => {
    let weightedSum = 0;
    let totalWeight = 0;
    
    assets.forEach(asset => {
      if (asset.initialValue > 0 && asset.irrValue != null && !isNaN(asset.irrValue)) {
        // irrValue ya viene normalizado a porcentaje por usePortfolioOverview
        // Lo convertimos a decimal para el cálculo ponderado
        const irrDecimal = asset.irrValue / 100;
        
        weightedSum += irrDecimal * asset.initialValue;
        totalWeight += asset.initialValue;
      }
    });
    
    if (totalWeight > 0) {
      const portfolioIRRDecimal = weightedSum / totalWeight;
      // Retornar como porcentaje para visualización
      return portfolioIRRDecimal * 100;
    }
    
    return 0;
  }, [assets]);

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

  const handleHeaderClick = (e) => {
    // Si el click se originó en el elemento de resize, no hacer nada
    if (resizeRef.current && resizeRef.current.contains(e.target)) {
      return;
    }
    // Solo permitir el click si no estamos resizando
    if (!isResizing) {
      handleSort('name');
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    
    const container = resizeRef.current?.closest('.overflow-x-auto');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newWidth = Math.max(120, Math.min(400, e.clientX - containerRect.left));
    
   // console.log('Resizing to:', newWidth, 'px'); // Debug
    setAssetColumnWidth(newWidth);
  }, [isResizing]);

  const handleResizeMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
   // console.log('Resize started!'); // Debug
    setIsResizing(true);
  }, []);

  const handleMouseUp = useCallback(() => {
   // console.log('Resize ended!'); // Debug
    setIsResizing(false);
  }, []);

  // Event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

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
        case 'thirtyDayChange':
          aValue = a.thirtyDayChange || 0;
          bValue = b.thirtyDayChange || 0;
          break;
        case 'oneYearChange':
          aValue = a.oneYearChange || 0;
          bValue = b.oneYearChange || 0;
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
        <div className="grid grid-cols-3 gap-2 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
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
          <div className="text-center">
            <div className={`text-lg sm:text-xl font-bold ${portfolioIRR >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              {portfolioIRR > 0 ? '+' : ''}{portfolioIRR.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">IRR</div>
          </div>
        </div>
      </div>
      {/* La lista de assets debe llenar el cuadrante y solo mostrar scroll si es necesario */}
      <div
        className="overflow-x-auto min-h-0"
        style={{ paddingBottom: 0 }}
      >
        <div className="flex items-center py-1.5 pr-2 border-b-2 border-gray-200 bg-gray-50 sticky top-0 text-[10px] md:text-[11px] font-semibold text-gray-500 uppercase tracking-wider gap-x-2 w-full">
          <div 
            className="cursor-pointer hover:text-gray-700 flex items-center gap-1"
            style={{ minWidth: `${assetColumnWidth}px`, width: `${assetColumnWidth}px` }}
            onClick={handleHeaderClick}
          >
            Asset {getSortIcon('name')}
          </div>
          {/* Barra de resize separada */}
          <div
            ref={resizeRef}
            className="w-1 cursor-col-resize hover:w-2 transition-all duration-200 flex-shrink-0 group"
            onMouseDown={handleResizeMouseDown}
            style={{ 
              backgroundColor: isResizing ? '#3b82f6' : 'transparent',
              height: '100%',
              zIndex: 9999,
              position: 'relative'
            }}
          >
            {/* Indicador visual central */}
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full transition-all duration-200"
              style={{
                backgroundColor: isResizing ? '#3b82f6' : '#d1d5db',
                opacity: isResizing ? 1 : 0.6
              }}
            />
            {/* Efecto hover */}
            <div 
              className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-200 rounded-sm"
            />
          </div>
          <div 
            className="text-right cursor-pointer hover:text-gray-700 flex items-center justify-end gap-1 w-[75px] flex-shrink-0"
            onClick={() => handleSort('value')}
          >
            Value (€) {getSortIcon('value')}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-gray-700 flex items-center justify-end gap-1 w-[75px] flex-shrink-0"
            onClick={() => handleSort('pnl')}
          >
            P&L (€) {getSortIcon('pnl')}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-gray-700 flex items-center justify-end gap-1 w-[65px] flex-shrink-0"
            onClick={() => handleSort('pnlPercent')}
          >
            P&L (%) {getSortIcon('pnlPercent')}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-gray-700 flex items-center justify-end gap-1 w-[65px] flex-shrink-0"
            onClick={() => handleSort('sevenDayChange')}
          >
            7d (%) {getSortIcon('sevenDayChange')}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-gray-700 flex items-center justify-end gap-1 w-[65px] flex-shrink-0"
            onClick={() => handleSort('thirtyDayChange')}
          >
            30d (%) {getSortIcon('thirtyDayChange')}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-gray-700 flex items-center justify-end gap-1 w-[65px] flex-shrink-0"
            onClick={() => handleSort('oneYearChange')}
          >
            1Y (%) {getSortIcon('oneYearChange')}
          </div>
          <div 
            className="text-right cursor-pointer hover:text-gray-700 flex items-center justify-end gap-1 w-[65px] flex-shrink-0"
            onClick={() => handleSort('irr')}
          >
            IRR (%) {getSortIcon('irr')}
          </div>
        </div>
        <div className="divide-y divide-gray-100 h-full min-h-0 flex flex-col">
          {sortedAssets.map((asset, idx) => (
            <div key={asset.id || idx} className="flex items-center py-1.5 pr-2 text-[11px] md:text-[12px] gap-x-2 w-full">
              <div 
                className="font-medium text-gray-800 pr-1 truncate" 
                style={{ minWidth: `${assetColumnWidth}px`, width: `${assetColumnWidth}px` }}
                title={asset.name}
              >
                {asset.nameShort}
                {asset.initialCurrency && asset.initialCurrency  && (
                  <span className="text-gray-500 font-normal"> - {asset.initialCurrency}</span>
                )}
              </div>
              <div className="text-right font-medium text-gray-800 tabular-nums w-[75px] flex-shrink-0">€ {Math.round(asset.currentValue)}</div>
              <div className={`text-right font-medium tabular-nums w-[75px] flex-shrink-0 ${asset.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{asset.pnl >= 0 ? '+' : ''}€{Math.round(asset.pnl)}</div>
              <div className={`text-right font-medium tabular-nums w-[65px] flex-shrink-0 ${asset.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{asset.pnlPercent >= 0 ? '+' : ''}{asset.pnlPercent.toFixed(1)}%</div>
              <div className={`text-right font-medium tabular-nums w-[65px] flex-shrink-0 ${asset.sevenDayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {asset.sevenDayChange >= 0 ? '+' : ''}{asset.sevenDayChange.toFixed(1)}%
              </div>
              <div className={`text-right font-medium tabular-nums w-[65px] flex-shrink-0 ${(asset.thirtyDayChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(asset.thirtyDayChange || 0) >= 0 ? '+' : ''}{(asset.thirtyDayChange || 0).toFixed(1)}%
              </div>
              <div className={`text-right font-medium tabular-nums w-[65px] flex-shrink-0 ${(asset.oneYearChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(asset.oneYearChange || 0) >= 0 ? '+' : ''}{(asset.oneYearChange || 0).toFixed(1)}%
              </div>
              <div className={`text-right font-medium tabular-nums w-[65px] flex-shrink-0 ${asset.irrValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>{isFinite(asset.irrValue) ? asset.irrValue.toFixed(1) + '%' : '--'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}