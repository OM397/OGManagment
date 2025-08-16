// Resumen visual de assets: total, diferencia absoluta y porcentaje
import React from 'react';

export default function AssetsSummary({ totalCurrent, totalInitial }) {
  const absDiff = totalCurrent - totalInitial;
  const percentDiff = totalInitial > 0 ? (absDiff / totalInitial) * 100 : 0;
  return (
  <div className="bg-white rounded-xl shadow-sm px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full">
      <div className="flex flex-col">
        <span className="text-3xl font-bold text-gray-900">
          {totalCurrent.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
        </span>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span>ABS.</span>
          <span>{absDiff >= 0 ? '+' : ''}{absDiff.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
          <span>%</span>
          <span className={percentDiff >= 0 ? 'text-green-600' : 'text-red-600'}>
            {percentDiff >= 0 ? '+' : ''}{percentDiff.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
          </span>
        </div>
      </div>
    </div>
  );
}
