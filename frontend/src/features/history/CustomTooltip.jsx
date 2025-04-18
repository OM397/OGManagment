// 📁 frontend/src/features/history/CustomTooltip.jsx
import { formatter } from '../../shared/utils';

export default function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const isPie = typeof label !== 'string'; // PieChart doesn't use string labels
  const data = payload[0].payload;

  return (
    <div className="bg-white rounded-lg shadow-md px-3 py-2 text-sm text-gray-800 border border-gray-200 max-w-xs">
      {isPie ? (
        <>
          <div className="font-semibold">{data.name}</div>
          <div>
            <span className="text-gray-500">{(data.percent * 100).toFixed(1)}%</span> —{' '}
            <span className="font-medium">{formatter.format(data.value)}</span>
          </div>
        </>
      ) : (
        <>
          <div className="text-xs text-gray-500 mb-1">Fecha: {label}</div>
          {payload.map((line, i) => (
            <div key={i} className="flex justify-between items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: line.color }} />
              <div className="flex-1">{line.name}</div>
              <div className="font-medium">{formatter.format(line.value)}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
