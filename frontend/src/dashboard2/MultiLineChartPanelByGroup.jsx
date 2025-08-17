// MultiLineChartPanelByGroup.jsx - Gráfico multilinea agrupado por grupo
// Nota móvil (iOS):
// Para mitigar el histórico bug de "doble toque" con Recharts, usamos un tooltip enfocado
// a una sola línea (grupo) y un overlay transparente ancho que mejora el tap/hover.
// Si cambias a tooltip multi-serie o quitas el overlay, verifica en iOS.

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Legend, ResponsiveContainer, Tooltip } from 'recharts';

export default function MultiLineChartPanelByGroup({ data, groupNames, height = 320 }) {
  if (!data || data.length === 0 || !groupNames || groupNames.length === 0) {
    return <span className="text-gray-400">Sin datos históricos para mostrar.</span>;
  }
  const containerRef = useRef(null);
  const [hoveredLine, setHoveredLine] = useState(null);
  const hoverTimeout = useRef(null);
  const retainHover = (id) => {
    setHoveredLine(id);
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
  };
  const clearHoverDelayed = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setHoveredLine(null), 140);
  };
  // Use the same color palette as asset chart
  const GRAYS = [
    '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827',
    '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#f1f5f9'
  ];
  const usableColors = GRAYS.filter((_, i) => i > 1);
  
  // Date format identical to asset chart
  const formatDate = (v) => {
    const d = new Date(v);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const euroFormat = (value) => {
    if (value == null || isNaN(value)) return '€ –';
    return '€ ' + Math.round(Number(value)).toLocaleString('de-DE');
  };

  // Tooltip enfocado a una sola línea (grupo)
  const renderSingleTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const line = hoveredLine ? payload.find(p => p.dataKey === hoveredLine) : null;
    // Si no tenemos hoveredLine (p.ej., primer tap), usar la primera entrada como fallback
    const use = line || payload[0];
    if (!use) return null;
    return (
      <div className="bg-white rounded-md shadow px-2.5 py-1.5 text-xs text-gray-800 border border-gray-200">
        <div className="font-semibold mb-0.5">{use.name}</div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: use.color }} />
          <span>{euroFormat(use.value)}</span>
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
      </div>
    );
  };

  // Renderizador de leyenda personalizado para un look más limpio
  const renderCustomLegend = (props) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mt-4">
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center space-x-2 text-xs text-gray-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="col-span-2 bg-white p-4 rounded shadow-sm">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ResponsiveContainer width="100%" height={typeof height === 'number' ? height : 300}>
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={formatDate}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={renderSingleTooltip} cursor={{ stroke: '#d1d5db', strokeWidth: 1, strokeDasharray: '3 3' }} isAnimationActive={false} />
            <Legend content={renderCustomLegend} />
            {groupNames.map((group, i) => {
              const color = usableColors[i % usableColors.length];
              const isHovered = hoveredLine === group;
              return (
                <React.Fragment key={group + '-' + i}>
                  <Line
                    type="monotone"
                    dataKey={group}
                    stroke={color}
                    strokeWidth={isHovered ? 3.5 : 1.5}
                    strokeOpacity={hoveredLine && !isHovered ? 0.22 : 1}
                    dot={false}
                    name={group}
                    isAnimationActive={false}
                  />
                  {/* Overlay transparente para mejorar hover/tap */}
                  <Line
                    type="monotone"
                    dataKey={group}
                    stroke="rgba(0,0,0,0)"
                    strokeWidth={18}
                    dot={false}
                    name={group}
                    onMouseEnter={() => retainHover(group)}
                    onMouseLeave={clearHoverDelayed}
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
