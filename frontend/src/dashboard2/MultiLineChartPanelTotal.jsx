// MultiLineChartPanelTotal.jsx - Gráfico de suma total de todos los assets
// **MODO DE EMERGENCIA: INTERACTIVIDAD DESACTIVADA**
// Se han eliminado los listeners de 'onMouseEnter', 'onMouseLeave' y el Tooltip
// para solucionar un bug de "doble toque" en dispositivos móviles (especialmente iOS).
// El gráfico ahora es una visualización estática.

import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

export default function MultiLineChartPanelTotal({ data, height = 320 }) {
  if (!data || data.length === 0) {
    return <span className="text-gray-400">Sin datos históricos para mostrar.</span>;
  }
  const color = '#64748b'; // Usar un gris medio del mismo palette
  
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
            {/* <Tooltip content={renderTooltip} /> */}
            <Line
              type="monotone"
              dataKey="total"
              stroke={color}
              strokeWidth={2}
              dot={false}
              name="Total"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
