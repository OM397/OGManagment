// ...existing code...
// 📁 src/features/history/MultiLineChartPanel.jsx
import { GRAYS } from './constants';
import AssetCurrencyCard from './AssetCurrencyCard';
import React, { useRef, useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
// ...importar otros componentes y constantes necesarios...

export default function MultiLineChartPanel({ multiHistory, selectedId, onSelect, height, exchangeRates }) {
  // DEBUG VISUAL: Confirmar render y datos recibidos
 // console.log('MultiLineChartPanel - render:', { multiHistory, selectedId, height, exchangeRates });
  const containerRef = useRef(null);
  const [hoveredLine, setHoveredLine] = useState(null);
  const hoverTimeout = useRef(null);
  // Restaurar función de hover
  const retainHover = (id) => {
    setHoveredLine(id);
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
  };
  // ...existing code...
// ...existing code...
  const clearHoverDelayed = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setHoveredLine(null), 140);
  };
  const truncateToCommonStart = (multiHistory) => {
    if (!multiHistory.length) return [];

    const minLength = Math.min(...multiHistory.map(asset => asset.history.length));
    let firstValidIndex = 0;

    // Find the first index where all assets have defined values
    for (let i = 0; i < minLength; i++) {
      const allHaveData = multiHistory.every(asset => asset.history[i]?.value != null);
      if (allHaveData) {
        firstValidIndex = i;
        break;
      }
    }

    return multiHistory.map(asset => ({
      ...asset,
      history: asset.history.slice(firstValidIndex)
    }));
  };

  // Detectar móvil
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  // Limitar assets y puntos históricos en móvil
  let limitedHistory = truncateToCommonStart(multiHistory);
  if (isMobile) {
    // Limitar a los 5 assets con mayor valor actual
    limitedHistory = [...limitedHistory]
      .sort((a, b) => (b.history?.[b.history.length-1]?.value || 0) - (a.history?.[a.history.length-1]?.value || 0))
      .slice(0, 5);
    // Limitar puntos históricos a los últimos 7 días
    limitedHistory = limitedHistory.map(asset => ({
      ...asset,
      history: asset.history.slice(-7)
    }));
  }
  const syncedHistory = limitedHistory;
  // Exponer los datos NVDA del gráfico en window
  useEffect(() => {
    if (Array.isArray(syncedHistory)) {
      const nvda = syncedHistory.find(a => a.id === 'NVDA');
      if (nvda && Array.isArray(nvda.history)) {
        // Reconstruir la historia con los datos originales y conversiones reales
        const initialCurrency = nvda.initialCurrency || 'EUR';
        const history = nvda.history.map((h, i) => {
          let price = h.price;
          let currency = h.currency || initialCurrency;
          let currentRate = 1;
          // Usar el tipo de cambio real de la moneda del punto histórico
          if (currency !== 'EUR' && exchangeRates) {
            currentRate = +(exchangeRates[currency] || 1);
          }
          // Para el último punto, usar precio actual en EUR si existe en marketDataGlobal
          if (i === nvda.history.length - 1 && window.marketDataGlobal) {
            const marketData = window.marketDataGlobal;
            const rawKey = nvda.id?.toLowerCase?.();
            const mappedKey = nvda.type === 'crypto' ? marketData?.idMap?.[rawKey] : undefined;
            const key = mappedKey && (marketData?.cryptos?.[mappedKey] || marketData?.stocks?.[mappedKey]) ? mappedKey : rawKey;
            if (nvda.type === 'crypto') {
              price = marketData?.cryptos?.[key]?.eur ?? h.price;
              currency = 'EUR';
              currentRate = 1;
            } else if (nvda.type === 'stock') {
              price = marketData?.stocks?.[key]?.eur ?? h.price;
              currency = 'EUR';
              currentRate = 1;
            }
          }
          // El tipo de cambio debe ser el mismo que se usa en el gráfico y tooltip
          return {
            date: h.date,
            currency,
            priceOriginal: h.price,
            rate: currentRate,
            convertedPrice: (price / currentRate)
          };
        });
        window.NVDA_CHART_DATA = { ...nvda, history };
      } else {
        window.NVDA_CHART_DATA = null;
      }
    }
  }, [syncedHistory, exchangeRates]);
  const dates = syncedHistory.length ? syncedHistory[0].history.map(p => p.date) : [];

  // chartData solo por activo
  const chartData = dates.map((date, i) => {
    const row = { date };
    syncedHistory.forEach(({ id, history, initialCurrency, name, type }, assetIdx) => {
      const h = history[i];
      let convertedValue = 0, convertedPrice = 0, currentRate = 1, price = 0, currency = initialCurrency;
      if (h) {
        // Para el último punto, usar precio actual en EUR desde marketData si existe
        if (i === dates.length - 1 && window.marketDataGlobal) {
          // Buscar el precio actual en EUR igual que AssetCard
          const marketData = window.marketDataGlobal;
          const rawKey = id?.toLowerCase?.();
          const mappedKey = type === 'crypto' ? marketData?.idMap?.[rawKey] : undefined;
          const key = mappedKey && (marketData?.cryptos?.[mappedKey] || marketData?.stocks?.[mappedKey]) ? mappedKey : rawKey;
          if (type === 'crypto') {
            price = marketData?.cryptos?.[key]?.eur ?? h.price;
            currency = 'EUR';
          } else if (type === 'stock') {
            price = marketData?.stocks?.[key]?.eur ?? h.price;
            currency = 'EUR';
          } else {
            price = h.price;
          }
          convertedPrice = price;
          convertedValue = h.qty * convertedPrice;
          currentRate = 1;
        } else {
          // Histórico: conversión normal
          price = h.price;
          if (initialCurrency && initialCurrency !== 'EUR' && exchangeRates) {
            currentRate = exchangeRates[initialCurrency] || 1;
          }
          convertedPrice = price * currentRate;
          convertedValue = h.qty * convertedPrice;
        }
        row[id] = convertedValue;
        row[`${id}_price`] = price;
        row[`${id}_currency`] = currency;
        row[`${id}_qty`] = h.qty;
        row[`${id}_conversionRate`] = currentRate;
        row[`${id}_convertedPrice`] = convertedPrice;
        row[`${id}_convertedValue`] = convertedValue;
      }
    });
    return row;
  });

  const cleanName = (name) =>
    name.replace(/\s?\([\w.]+\)/, '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  // DEBUG VISUAL: Mostrar chartData justo antes del render
//  console.log('MultiLineChartPanel - chartData:', chartData);

  const euroFormat = (value) => '€ ' + Math.round(value).toLocaleString('de-DE');
  const usableColors = GRAYS.filter((_, i) => i > 1);

  // Tooltip: solo por activo
  const renderSingleTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const line = hoveredLine
      ? payload.find(p => p.dataKey === hoveredLine)
      : null;
    if (!line) return null;
    const row = payload?.[0]?.payload;
    const id = line?.dataKey;
    const assetInfo = multiHistory?.find(a => a.id === id);
    const assetCurrency = assetInfo?.initialCurrency || assetInfo?.currency || 'EUR';
  const price = row?.[`${id}_price`] || 0;
  let qty = row?.[`${id}_qty`] || 0;
  // Cantidad con hasta 4 decimales si es necesario
  qty = Number(qty) % 1 === 0 ? Number(qty) : Number(qty).toFixed(4);
  let currentRate = row?.[`${id}_conversionRate`] || 1;
  // Mostrar tipo de cambio con 4 decimales
  const currentRateDisplay = Number(currentRate).toFixed(4);
  // Precio convertido con 2 decimales
  const convertedPrice = Number(row?.[`${id}_convertedPrice`] || (price * currentRate)).toFixed(2);
  // Valor convertido con 2 decimales
  const convertedValue = Number(row?.[`${id}_convertedValue`] || (qty * convertedPrice)).toFixed(2);
    return (
      <div className="bg-white rounded-md shadow px-2.5 py-1.5 text-xs text-gray-800 border border-gray-200">
        <div className="font-semibold mb-0.5">{cleanName(line.name)}</div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: line.color }} />
          <span>{euroFormat(line.value)}</span>
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
        {row && (
          <div className="mt-2 text-[11px] text-gray-700">
            <div>Precio histórico: <b>{price}</b> {assetCurrency}</div>
            <div>Cantidad: <b>{qty}</b></div>
            <div>Tipo de cambio: <b>{currentRateDisplay}</b></div>
            <div>Precio convertido: <b>{convertedPrice} €</b></div>
            <div>Valor convertido: <b>{convertedValue} €</b></div>
          </div>
        )}
      </div>
    );
  };

  // Eliminado para prevenir problemas de doble toque en móvil.
  // La funcionalidad de clic exterior para resetear el filtro queda desactivada.

  const handleBackgroundClick = (e) => {
    // Click blank chart area (not a line) -> reset
    if (e.target === e.currentTarget && selectedId !== 'ALL' && typeof onSelect === 'function') {
      onSelect('ALL');
    }
  };

  return (
    <div ref={containerRef} className="col-span-2 bg-white p-4 rounded shadow-sm" onClick={handleBackgroundClick}>
      {/* Tarjeta de moneda y conversión */}
      {selectedId !== 'ALL' && multiHistory && multiHistory.length > 0 && (() => {
        const asset = multiHistory.find(a => a.id === selectedId);
        return (
          <div>
            <AssetCurrencyCard asset={asset} />
            <div className="text-xs text-gray-500 mt-1">
              <span>Moneda original en MongoDB: <b>{asset?.initialCurrency || asset?.currency || 'EUR'}</b></span>
            </div>
          </div>
        );
      })()}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
  <ResponsiveContainer width="100%" height={typeof height === 'number' ? height : 300}>
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
                  .toString()
                  .padStart(2, '0')}`;
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={renderSingleTooltip} />

            {/* Visible lines: solo por activo */}
            {syncedHistory.map((asset, i) => {
              const color = usableColors[i % usableColors.length];
              const isHovered = hoveredLine === asset.id;
              const isSelected = selectedId === asset.id;
              return (
                <React.Fragment key={asset.id}>
                  <Line
                    type="monotone"
                    dataKey={asset.id}
                    stroke={color}
                    strokeWidth={isSelected ? 5 : isHovered ? 4 : 2}
                    strokeOpacity={hoveredLine && !isHovered && !isSelected ? 0.22 : 1}
                    dot={false}
                    name={cleanName(asset.name)}
                    isAnimationActive={false}
                  />
                  {/* Interaction overlay: wide transparent stroke for easier hover */}
                  <Line
                    type="monotone"
                    dataKey={asset.id}
                    stroke="rgba(0,0,0,0)"
                    strokeWidth={18}
                    dot={false}
                    name={cleanName(asset.name)}
                    onMouseEnter={() => retainHover(asset.id)}
                    onMouseLeave={clearHoverDelayed}
                    onClick={() => {
                      if (typeof onSelect === 'function') {
                        onSelect(selectedId === asset.id ? 'ALL' : asset.id);
                      }
                    }}
                    isAnimationActive={false}
                    activeDot={false}
                    style={{ cursor: 'pointer' }}
                  />
                </React.Fragment>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
