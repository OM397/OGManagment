// AssetsSummary.jsx
import React from 'react';
import { formatter } from '../../shared/utils';

export default function AssetsSummary({ initialData, marketData }) {
  let totalInitial = 0;
  let totalActual = 0;

  Object.values(initialData).forEach(category => {
    Object.values(category).forEach(group => {
      if (Array.isArray(group)) {
        group.forEach(asset => {
          const { initialQty = 0, initialCost = 0, id, actualCost } = asset;

          const initialValue = initialQty * initialCost;
          const actualPrice = actualCost ??
            marketData?.cryptos?.[id]?.eur ??
            marketData?.stocks?.[id]?.eur ?? 0;

          const actualValue = initialQty * actualPrice;

          totalInitial += initialValue;
          totalActual += actualValue;
        });
      }
    });
  });

  const changeAbs = totalActual - totalInitial;
  const changePct = totalInitial > 0 ? (changeAbs / totalInitial) * 100 : 0;
  const isPositive = changePct > 0;
  const changeColor =
    isPositive ? 'text-green-600' : changePct < 0 ? 'text-red-600' : 'text-gray-500';

  return (
    <div className="mb-8 p-6 bg-white dark:bg-muted rounded-2xl shadow-sm">
      <div className="flex items-end gap-6 flex-wrap">
        {/* Net Worth */}
        <div className="text-4xl font-bold text-gray-900 dark:text-white leading-none">
          {formatter.format(totalActual)}
        </div>

        {/* ABS and % Variations aligned */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">
              ABS.
            </div>
            <div className={`text-xs ${changeColor}`}>
              {formatter.format(changeAbs)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-1">
              %
            </div>
            <div className={`text-xs ${changeColor}`}>
              {changePct.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
