// MultiLineChartPanelByGroup.jsx - Gráfico multilinea agrupado por grupo
// **MODO DE EMERGENCIA: INTERACTIVIDAD DESACTIVADA**
// Se han eliminado los listeners de 'onMouseEnter', 'onMouseLeave' y el Tooltip
// para solucionar un bug de "doble toque" en dispositivos móviles (especialmente iOS).
// El gráfico ahora es una visualización estática.

import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Legend, ResponsiveContainer } from 'recharts';

export default function MultiLineChartPanelByGroup({ data, groupNames, height = 320 }) {
  if (!data || data.length === 0 || !groupNames || groupNames.length === 0) {
    return <span className="text-gray-400">Sin datos históricos para mostrar.</span>;
  }
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

  return (
    <div className="col-span-2 bg-white p-4 rounded shadow-sm">
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
            {/* <Tooltip content={renderSingleTooltip} /> */}
            <Legend
              wrapperStyle={{
                paddingTop: 4,
                fontSize: 11,
                fontWeight: 400,
                textAlign: 'center',
                lineHeight: 1.1,
                letterSpacing: '0.01em',
              }}
              iconType="circle"
              align="center"
              layout="horizontal"
            />
            {groupNames.map((group, i) => {
              const color = usableColors[i % usableColors.length];
              return (
                <Line
                  key={group + '-' + i}
                  type="monotone"
                  dataKey={group}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  name={group}
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
