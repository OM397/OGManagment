// 📁 frontend/features/assets/AssetsSummary.jsx
import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { formatter } from '../../shared/utils';

function AnimatedNumber({ value }) {
  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    config: { mass: 1, tension: 140, friction: 20 }
  });

  return (
    <animated.span>
      {number.to(val =>
        formatter.format(Number(val.toFixed(0)))
      )}
    </animated.span>
  );
}

export default function AssetsSummary({ initialData, marketData }) {
  let totalInitial = 0;
  let totalActual = 0;

  Object.values(initialData).forEach(category => {
    Object.values(category).forEach(group => {
      if (Array.isArray(group)) {
        group.forEach(asset => {
          const { initialQty = 0, initialCost = 0, id, actualCost } = asset;

          const initialValue = initialQty * initialCost;
          const actualPrice =
            actualCost ?? marketData?.cryptos?.[id]?.eur ?? marketData?.stocks?.[id]?.eur ?? 0;

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
    <div className="w-full mb-6 p-4 sm:p-6 bg-white rounded-2xl shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 flex-wrap">
        {/* Net Worth Animated */}
        <div className="text-3xl sm:text-4xl font-bold text-gray-900 leading-none">
          <AnimatedNumber value={totalActual} />
        </div>

        {/* ABS and % */}
        <div className="grid grid-cols-2 gap-4 text-center sm:text-left">
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
