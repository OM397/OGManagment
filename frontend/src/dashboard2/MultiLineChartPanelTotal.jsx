// MultiLineChartPanelTotal.jsx - Gráfico de suma total de todos los assets
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function MultiLineChartPanelTotal({ data, height = 320 }) {
  const containerRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const hoverTimeout = useRef(null);
  if (!data || data.length === 0) {
    return <span className="text-gray-400">Sin datos históricos para mostrar.</span>;
  }
  const color = '#64748b'; // Usar un gris medio del mismo palette
  const euroFormat = (value) => '€ ' + Math.round(value).toLocaleString('de-DE');
  const renderTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload;
    return (
      <div className="bg-white rounded-md shadow px-2.5 py-1.5 text-xs text-gray-800 border border-gray-200">
        <div className="font-semibold mb-0.5">Total</div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
          <span>{euroFormat(row.total)}</span>
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
      </div>
    );
  };
  const formatDate = (v) => {
    const d = new Date(v);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
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
            <Tooltip content={renderTooltip} />
            <Line
              type="monotone"
              dataKey="total"
              stroke={color}
              strokeWidth={hovered ? 4 : 2}
              dot={false}
              name="Total"
              isAnimationActive={false}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => {
                if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
                hoverTimeout.current = setTimeout(() => setHovered(false), 140);
              }}
              activeDot={false}
              style={{ cursor: 'pointer' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
