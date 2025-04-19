// 📁 src/features/history/LineChartPanel.jsx

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceDot
} from 'recharts'
import { AnimatePresence, motion } from 'framer-motion'
import CustomTooltip from './CustomTooltip'
import { formatter } from '../../shared/utils'

export default function LineChartPanel({ history, loading, convertedInitial, lastPoint, selectedId }) {
  const values = history.map(h => h.value)
  const minY = Math.min(...values, convertedInitial || Infinity)
  const maxY = Math.max(...values, convertedInitial || 0)

  return (
    <div className="col-span-2 bg-white p-4 rounded shadow-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {loading ? (
            <div className="text-sm text-gray-500">Cargando datos...</div>
          ) : history.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={history}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                  tickFormatter={v => {
                    const d = new Date(v)
                    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis domain={[minY * 0.95, maxY * 1.05]} hide />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#111"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                />
                {convertedInitial > 0 && (
                  <ReferenceLine
                    y={convertedInitial}
                    stroke="red"
                    strokeDasharray="3 3"
                    label={{
                      value: formatter.format(convertedInitial),
                      position: 'insideBottomRight',
                      fill: 'red',
                      fontSize: 10
                    }}
                  />
                )}
                {lastPoint && (
                  <ReferenceDot
                    x={lastPoint.date}
                    y={lastPoint.value}
                    r={3}
                    stroke="black"
                    fill="black"
                    label={{
                      value: formatter.format(lastPoint.value),
                      position: 'right',
                      fill: '#111',
                      fontSize: 10
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-gray-500">Sin datos históricos para mostrar.</div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
