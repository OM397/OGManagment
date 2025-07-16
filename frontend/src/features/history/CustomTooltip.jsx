// 📁 src/features/history/CustomTooltip.jsx

export default function CustomTooltip({ active, payload, label, irrData = {}, loadingIRR = false }) {
  if (!active || !payload || !payload.length) return null;

  const isPie = typeof label !== 'string';
  const data = payload[0].payload;

  const formatEuro = (value) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);

  // Mostrar IRR si está disponible y es un gráfico de pastel
  let irr = null;
  if (isPie && data?.id && irrData[data.id]) {
    irr = irrData[data.id]?.irr;
  }

  return (
    <div className="bg-white rounded-lg shadow-md px-3 py-2 text-sm text-gray-800 border border-gray-200 max-w-xs">
      {isPie ? (
        <>
          <div className="font-semibold">{data.name}</div>
          <div>
            <span className="text-gray-500">{(data.percent * 100).toFixed(1)}%</span>{' '}
            — <span className="font-medium">{formatEuro(data.value)}</span>
          </div>
          {loadingIRR ? (
            <div className="text-xs text-gray-400 mt-1">Calculando TIR...</div>
          ) : irr !== null ? (
            <div className="text-xs mt-1">
              <span className="font-semibold">TIR:</span>{' '}
              <span className={irr > 0 ? 'text-green-600' : irr < 0 ? 'text-red-600' : 'text-gray-600'}>
                {(irr * 100).toFixed(2)}%
              </span>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="text-xs text-gray-500 mb-1">Fecha: {label}</div>
          {payload.map((line, i) => (
            <div key={i} className="flex justify-between items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: line.color }} />
              <div className="flex-1">{line.name}</div>
              <div className="font-medium">{formatEuro(line.value)}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
