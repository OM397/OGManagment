// MultiLineChartPanelByGroup.jsx - Gráfico multilinea agrupado por grupo
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MultiLineChartPanelByGroup({ data, groupNames, height = 320 }) {
  const containerRef = useRef(null);
  const [hoveredLine, setHoveredLine] = useState(null);
  const hoverTimeout = useRef(null);
  if (!data || data.length === 0 || !groupNames || groupNames.length === 0) {
    return <span className="text-gray-400">Sin datos históricos para mostrar.</span>;
  }
  // Use the same color palette as asset chart
  const GRAYS = [
    '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827',
    '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#f1f5f9'
  ];
  const usableColors = GRAYS.filter((_, i) => i > 1);
  const euroFormat = (value) => '€ ' + Math.round(value).toLocaleString('de-DE');
  // Tooltip: only for hovered line
  const renderSingleTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const line = hoveredLine
      ? payload.find(p => p.dataKey === hoveredLine)
      : null;
    if (!line) return null;
    const row = payload?.[0]?.payload;
    const id = line?.dataKey;
    const price = row?.[id] || 0;
    return (
      <div className="bg-white rounded-md shadow px-2.5 py-1.5 text-xs text-gray-800 border border-gray-200">
        <div className="font-semibold mb-0.5">{line.name || id}</div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: line.color }} />
          <span>{euroFormat(line.value)}</span>
        </div>
        <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
      </div>
    );
  };
  // Date format identical to asset chart
  const formatDate = (v) => {
    const d = new Date(v);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };
  // Hover logic
  const retainHover = (id) => {
    setHoveredLine(id);
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
  };
  const clearHoverDelayed = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setHoveredLine(null), 140);
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
            <Tooltip content={renderSingleTooltip} />
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
              const isHovered = hoveredLine === group;
              return (
                <React.Fragment key={group + '-frag-' + i}>
                  <Line
                    key={group + '-' + i}
                    type="monotone"
                    dataKey={group}
                    stroke={color}
                    strokeWidth={isHovered ? 4 : 2}
                    strokeOpacity={hoveredLine && !isHovered ? 0.22 : 1}
                    dot={false}
                    name={group}
                    isAnimationActive={false}
                  />
                  {/* Interaction overlay: wide transparent stroke for easier hover */}
                  <Line
                    key={group + '-hover-' + i}
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
