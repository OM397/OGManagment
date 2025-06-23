// 📁 frontend/features/assets/AssetsSummary.jsx
import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { formatter } from '../../shared/utils';
import { calculateTotals } from '../../shared/calculateAssetTotals';

function AnimatedNumber({ value }) {
  const { number } = useSpring({
    from: { number: 0 },
    to:   { number: value },
    config: { mass: 1, tension: 140, friction: 20 }
  });

  return (
    <animated.span>
      {number.to(n => formatter.format(Math.round(n)))}
    </animated.span>
  );
}

/**
 * Muestra la cifra sólo de la categoría activa (p.ej. 'Investments').
 *
 * Props:
 * - initialData: el objeto completo de categoryGroups
 * - marketData:  los precios que vienen del hook useMarketData
 * - activeTab:   el nombre de la categoría activa ('Investments', 'Real Estate', 'Others', etc.)
 */
export default function AssetsSummary({ initialData, marketData, activeTab }) {
  // Usamos calculateTotals para filtrar sólo la categoría activeTab
  const { totalInitial, totalActual } = calculateTotals(
    initialData,
    marketData,
    activeTab
  );

  const changeAbs = totalActual - totalInitial;
  const changePct = totalInitial > 0 ? (changeAbs / totalInitial) * 100 : 0;
  const changeColor =
    changePct > 0
      ? 'text-green-600'
      : changePct < 0
        ? 'text-red-600'
        : 'text-gray-500';

  return (
    <div className="w-full mb-6 p-4 sm:p-6 bg-white rounded-2xl shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 flex-wrap">
        {/* Total Actual */}
        <div className="text-3xl sm:text-4xl font-bold text-gray-900 leading-none">
          <AnimatedNumber value={totalActual} />
        </div>

        {/* ABS y % */}
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
