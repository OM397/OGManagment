// 📁 src/features/history/MultiLineChartPanel.jsx

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { GRAYS } from './constants';
import CustomTooltip from './CustomTooltip';

export default function MultiLineChartPanel({ multiHistory }) {
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

  const syncedHistory = truncateToCommonStart(multiHistory);
  const dates = syncedHistory.length ? syncedHistory[0].history.map(p => p.date) : [];

  const chartData = dates.map((date, i) => {
    const row = { date };
    syncedHistory.forEach(({ id, history }) => {
      row[id] = history[i]?.value;
    });
    return row;
  });

  const cleanName = (name) =>
    name.replace(/\s?\([\w.]+\)/, '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  const euroFormat = (value) => '€ ' + Math.round(value).toLocaleString('de-DE');
  const usableColors = GRAYS.filter((_, i) => i > 1);

  const renderSortedTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;

    const sorted = [...payload].sort((a, b) => b.value - a.value);

    return (
      <div className="bg-white rounded-lg shadow-md px-3 py-2 text-sm text-gray-800 border border-gray-200 max-w-xs">
        <div className="text-xs text-gray-500 mb-1">Fecha: {label}</div>
        {sorted.map((line, i) => (
          <div key={i} className="flex justify-between items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: line.color }} />
            <div className="flex-1">{cleanName(line.name)}</div>
            <div className="font-medium">{euroFormat(line.value)}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="col-span-2 bg-white p-4 rounded shadow-sm">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ResponsiveContainer width="100%" height={600}>
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
            <Tooltip content={renderSortedTooltip} />

            {syncedHistory.map((asset, i) => (
              <Line
                key={asset.id}
                type="monotone"
                dataKey={asset.id}
                stroke={usableColors[i % usableColors.length]}
                strokeWidth={2}
                dot={false}
                name={cleanName(asset.name)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
