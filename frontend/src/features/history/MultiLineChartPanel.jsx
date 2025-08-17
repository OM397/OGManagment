// 📁 src/features/history/MultiLineChartPanel.jsx
import { GRAYS } from './constants';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

// Alineado con el comportamiento de GitHub: tooltip enfocado en una sola línea,
// datos extendidos por activo y overlay para mejorar el hover/selección.
export default function MultiLineChartPanel({ multiHistory = [], selectedId = 'ALL', onSelect, height = 320, exchangeRates = {} }) {
  // Nota importante sobre móviles (iOS):
  // Históricamente tuvimos un bug de "doble toque" con Recharts cuando el Tooltip/hover
  // estaba activo: el primer tap activaba el área interactiva y el segundo mostraba datos.
  // Para mitigarlo, este gráfico implementa:
  //  - Tooltip enfocado a UNA sola línea (la que está en hover/tap), evitando listar todas.
  //  - Un overlay transparente ancho por línea que captura taps con precisión.
  //  - Grosor dinámico en hover/selección y toggle por tap para feedback claro.
  // Si reintroduces listeners globales o cambias a un Tooltip multi‑serie, verifica en iOS.
  const containerRef = useRef(null);
  const hoverTimeout = useRef(null);
  const [hoveredLine, setHoveredLine] = useState(null);

  const retainHover = (id) => {
    setHoveredLine(id);
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
  };
  const clearHoverDelayed = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setHoveredLine(null), 140);
  };

  // Recorta los históricos para comenzar cuando todos tienen datos.
  const truncateToCommonStart = (items) => {
    if (!Array.isArray(items) || items.length === 0) return [];
    const minLength = Math.min(...items.map(a => a.history.length));
    let firstValidIndex = 0;
    for (let i = 0; i < minLength; i++) {
      const allHave = items.every(a => a.history[i]?.value != null);
      if (allHave) { firstValidIndex = i; break; }
    }
    return items.map(a => ({ ...a, history: a.history.slice(firstValidIndex) }));
  };

  // Detectar móvil una vez (no responde a resize para simplicidad).
  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 768, []);

  // Limitar en móvil: top 5 por valor actual y últimos 7 días.
  const syncedHistory = useMemo(() => {
    let items = truncateToCommonStart(multiHistory);
    if (isMobile) {
      items = [...items]
        .sort((a, b) => (b.history?.[b.history.length - 1]?.value || 0) - (a.history?.[a.history.length - 1]?.value || 0))
        .slice(0, 5)
        .map(a => ({ ...a, history: a.history.slice(-7) }));
    }
    return items;
  }, [multiHistory, isMobile]);

  // Fechas base del gráfico
  const dates = useMemo(() => (syncedHistory.length ? syncedHistory[0].history.map(p => p.date) : []), [syncedHistory]);

  // Construir chartData con campos extendidos por activo (precio, qty, moneda, FX, etc.)
  const chartData = useMemo(() => {
    return dates.map((date, i) => {
      const row = { date };
      syncedHistory.forEach(({ id, history, initialCurrency, type }) => {
        const h = history[i];
        if (!h) return;
        const assetCurrency = h.currency || initialCurrency || 'EUR';
        let price = h.price != null ? h.price : null;
        let qty = h.qty != null ? h.qty : 0;
        let rate = 1;
        let convertedPrice = null;
        let convertedValue = null;

        // Para el último punto, usar precio actual en EUR si existe en window.marketDataGlobal
        if (i === dates.length - 1 && typeof window !== 'undefined' && window.marketDataGlobal) {
          const marketData = window.marketDataGlobal;
          const rawKey = id?.toLowerCase?.();
          const mappedKey = type === 'crypto' ? marketData?.idMap?.[rawKey] : undefined;
          const key = mappedKey && (marketData?.cryptos?.[mappedKey] || marketData?.stocks?.[mappedKey]) ? mappedKey : rawKey;
          if (type === 'crypto') {
            price = marketData?.cryptos?.[key]?.eur ?? price;
          } else if (type === 'stock') {
            price = marketData?.stocks?.[key]?.eur ?? price;
          }
          // Precio ya en EUR
          rate = 1;
          convertedPrice = price != null ? price : null;
        } else {
          // Histórico normal: convertir a EUR si es necesario
          if (assetCurrency !== 'EUR') {
            const fx = typeof exchangeRates?.[assetCurrency] === 'number' ? exchangeRates[assetCurrency] : 1;
            rate = fx || 1;
          }
          if (price != null) {
            convertedPrice = price * rate;
          }
        }

        if (convertedPrice != null) {
          convertedValue = (qty || 0) * convertedPrice;
        }

        // Valor de la línea (ya se supone en EUR)
        if (h.value != null) row[id] = h.value;

        // Campos extendidos para tooltip por activo
        row[`${id}_price`] = price;
        row[`${id}_currency`] = assetCurrency;
        row[`${id}_qty`] = qty;
        row[`${id}_conversionRate`] = rate;
        row[`${id}_convertedPrice`] = convertedPrice;
        row[`${id}_convertedValue`] = convertedValue;
      });
      return row;
    });
  }, [dates, syncedHistory, exchangeRates]);

  const cleanName = (name) => name.replace(/\s?\([\w.]+\)/, '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  const euroFormat = (value) => {
    if (value == null || isNaN(value)) return '€ –';
    return '€ ' + Math.round(Number(value)).toLocaleString('de-DE');
  };
  const usableColors = GRAYS.filter((_, i) => i > 1);

  // Tooltip de una sola línea (la actualmente en hover)
  const renderSingleTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const line = hoveredLine ? payload.find(p => p.dataKey === hoveredLine) : null;
    if (!line) return null;
    const row = payload?.[0]?.payload;
    const id = line?.dataKey;
    const price = row?.[`${id}_price`] ?? null;
    const qtyRaw = row?.[`${id}_qty`] ?? 0;
    const qty = Number(qtyRaw) % 1 === 0 ? Number(qtyRaw) : Number(qtyRaw).toFixed(4);
    const assetCurrency = row?.[`${id}_currency`] || 'EUR';
    const rate = row?.[`${id}_conversionRate`] ?? 1;
    const rateDisplay = Number(rate).toFixed(4);
    const convertedPrice = row?.[`${id}_convertedPrice`] ?? null;
    const convertedValue = row?.[`${id}_convertedValue`] ?? null;

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
            <div>Precio histórico: <b>{price != null ? Number(price).toFixed(2) : '–'}</b> {assetCurrency}</div>
            <div>Cantidad: <b>{qty}</b></div>
            <div>Tipo de cambio: <b>{rateDisplay}</b></div>
            <div>Precio convertido: <b>{convertedPrice != null ? Number(convertedPrice).toFixed(2) : '–'} €</b></div>
            <div>Valor convertido: <b>{convertedValue != null ? Number(convertedValue).toFixed(2) : '–'} €</b></div>
          </div>
        )}
      </div>
    );
  };

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget && selectedId !== 'ALL' && typeof onSelect === 'function') {
      onSelect('ALL');
    }
  };

  return (
    <div ref={containerRef} className="col-span-2 bg-white p-4 rounded-lg shadow-sm" onClick={handleBackgroundClick}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="w-full" style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <Tooltip content={renderSingleTooltip} cursor={{ stroke: '#d1d5db', strokeWidth: 1, strokeDasharray: '3 3' }} isAnimationActive={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(tick) => {
                  if (!tick) return '';
                  const d = new Date(tick);
                  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
                }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={["dataMin", "dataMax"]} />

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
                      strokeWidth={isSelected ? 4.5 : isHovered ? 3.5 : 1.5}
                      strokeOpacity={hoveredLine && !isHovered && !isSelected ? 0.22 : 1}
                      dot={false}
                      name={cleanName(asset.name)}
                      isAnimationActive={false}
                    />
                    {/* Overlay transparente para mejorar hover/click */}
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
                        retainHover(asset.id);
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
        </div>
      </motion.div>
    </div>
  );
}