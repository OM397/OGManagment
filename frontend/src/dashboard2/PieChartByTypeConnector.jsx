// frontend/src/dashboard2/PieChartByTypeConnector.jsx
import React from 'react';
import PieChartVisual from './PieChartVisual';

const GRAYS = [
  '#6b7280', '#9ca3af', '#d1d5db', '#f3f4f6',
  '#4b5563', '#374151', '#1f2937', '#111827'
];

export default function PieChartByTypeConnector({ assets = [], totalCurrent = 0, onSelect }) {
  const aggregatedData = React.useMemo(() => {
    const types = {
      stock: { id: 'TYPE_STOCK', name: 'Stocks', initialValue: 0, currentValue: 0 },
      crypto: { id: 'TYPE_CRYPTO', name: 'Crypto', initialValue: 0, currentValue: 0 },
      other: { id: 'TYPE_OTHER', name: 'Others', initialValue: 0, currentValue: 0 },
    };

    assets.forEach(asset => {
      const typeKey = ['stock', 'crypto'].includes(asset.type) ? asset.type : 'other';
      types[typeKey].initialValue += asset.initialValue || 0;
      types[typeKey].currentValue += asset.currentValue || 0;
    });

    return Object.values(types)
      .filter(type => type.currentValue > 0)
      .sort((a, b) => b.currentValue - a.currentValue);
  }, [assets]);

  const pieDataInitial = aggregatedData.map((a, i) => ({
    id: a.id,
    name: a.name,
    value: Math.round(a.initialValue),
    color: GRAYS[i % GRAYS.length],
  }));

  const pieDataMarket = aggregatedData.map((a, i) => ({
    id: a.id,
    name: a.name,
    value: Math.round(a.currentValue),
    color: GRAYS[i % GRAYS.length],
  }));

  // El `selectedId` y `onSelect` se pasan pero no se usan para la selección
  // ya que este gráfico es de solo visualización de tipos.
  return (
    <PieChartVisual
      pieDataInitial={pieDataInitial}
      pieDataMarket={pieDataMarket}
      totalCurrent={totalCurrent}
      selectedId={'ALL'} // Siempre 'ALL' para que no haya selección
      onSelect={() => {}} // No hacer nada al seleccionar
    />
  );
}
