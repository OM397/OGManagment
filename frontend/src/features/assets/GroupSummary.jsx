import React from 'react';
import { formatter } from '../../shared/utils';
import { formatCurrency } from '../../shared/formatCurrency';

export default function GroupSummary({ initialTotal, actualTotal }) {
  const diff = actualTotal - initialTotal;
  const percentage = initialTotal > 0 ? (diff / initialTotal) * 100 : 0;

  const changeClass =
    initialTotal === 0
      ? 'text-gray-500'
      : diff > 0
        ? 'text-green-600'
        : diff < 0
          ? 'text-red-600'
          : 'text-gray-500';

  return (
    <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-start sm:items-center gap-2 px-5 py-4 bg-gray-50 shadow-inner text-sm font-medium">
      <div className="text-left sm:text-right">
        <div className="text-sm font-bold">{formatCurrency(actualTotal)}</div>
        <div className="text-xs text-gray-400">vs {formatCurrency(initialTotal)}</div>
      </div>

      <div className="flex flex-col items-end text-xs font-medium ml-0 sm:ml-4">
        <div className={`px-2 py-0.5 mb-0.5 border ${
          diff >= 0
            ? 'bg-green-50 text-green-600 border-green-100'
            : 'bg-red-50 text-red-600 border-red-100'
        }`}>
          {(diff >= 0 ? '+' : '') + formatCurrency(diff)}
        </div>
        <div className={changeClass}>
          {initialTotal === 0 ? '0.00%' : `${percentage.toFixed(2)}%`}
        </div>
      </div>
    </div>
  )
}
