// 📁 src/features/history/MultiLineChartPanel.jsx

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { GRAYS } from './constants';
import { formatter } from '../../shared/utils';
import CustomTooltip from './CustomTooltip';

export default function MultiLineChartPanel({ multiHistory }) {
  const dates = multiHistory.length ? multiHistory[0].history.map(p => p.date) : [];

  const chartData = dates.map((date, i) => {
    const point = { date };
    multiHistory.forEach(({ id, history }) => {
      point[id] = history[i].value;
    });
    return point;
  });

  return (
    <div className="col-span-2 bg-white p-4 rounded shadow-sm">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={v => {
                const d = new Date(v);
                return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            {multiHistory.map((asset, index) => (
              <Line
                key={asset.id}
                type="monotone"
                dataKey={asset.id}
                stroke={GRAYS[index % GRAYS.length]}
                strokeWidth={2}
                dot={false}
                name={asset.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
