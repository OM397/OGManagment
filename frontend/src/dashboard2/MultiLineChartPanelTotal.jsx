// MultiLineChartPanelTotal.jsx - Gráfico de suma total de todos los assets
// Atención móvil (iOS) — historial de bug de doble toque:
// Para evitar el problema de "doble toque" con Tooltip/hover en Recharts, este gráfico
// mantiene la interactividad DESACTIVADA (sin Tooltip, sin listeners de hover).
// Si se reactivan estas funciones, verificar manualmente en iOS.

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function MultiLineChartPanelTotal({ data, height = 320 }) {
  if (!data || data.length === 0) {
    return <span className="text-gray-400">Sin datos históricos para mostrar.</span>;
  }
  const color = '#64748b'; // Usar un gris medio del mismo palette
  const containerRef = useRef(null);
  const [hovered, setHovered] = useState(true); // solo una línea, mantener resaltado
  
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
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0];
                return (
                  <div className="bg-white rounded-md shadow px-2.5 py-1.5 text-xs text-gray-800 border border-gray-200">
                    <div className="font-semibold mb-0.5">Total</div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                      <span>{'€ ' + Math.round(Number(p.value || 0)).toLocaleString('de-DE')}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
                  </div>
                );
              }}
              cursor={{ stroke: '#d1d5db', strokeWidth: 1, strokeDasharray: '3 3' }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke={color}
              strokeWidth={hovered ? 3.5 : 1.5}
              dot={false}
              name="Total"
              isAnimationActive={false}
            />
            {/* Overlay transparente para facilitar el tap/hover */}
            <Line
              type="monotone"
              dataKey="total"
              stroke="rgba(0,0,0,0)"
              strokeWidth={18}
              dot={false}
              name="Total"
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(true)}
              isAnimationActive={false}
              activeDot={false}
              style={{ cursor: 'pointer' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
