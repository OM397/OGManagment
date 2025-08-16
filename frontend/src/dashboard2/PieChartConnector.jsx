// PieChartConnector.jsx
// Componente conector para obtener y formatear los datos de assets y pasarlos al visual

import React from 'react';
import PieChartVisual from './PieChartVisual';

// Escala de grises igual al original
const GRAYS = [
  '#f3f4f6', '#d1d5db', '#9ca3af', '#6b7280',
  '#4b5563', '#374151', '#1f2937', '#111827'
];

export default function PieChartConnector({ assets = [], totalCurrent = 0, selectedId = 'ALL', onAssetSelect }) {
  // Ordenar assets de mayor a menor valor inicial
  const sortedAssets = [...assets]
    .filter(a => a.initialValue > 0)
    .sort((a, b) => b.initialValue - a.initialValue);

  const pieDataInitial = sortedAssets.map((a, i) => ({
    id: a.id,
    name: a.nameShort || a.name,
    value: Math.round(a.initialValue),
    color: GRAYS[i % GRAYS.length],
    irrValue: a.irrValue
  }));

  const pieDataMarket = sortedAssets.map((a, i) => ({
    id: a.id,
    name: a.nameShort || a.name,
    value: Math.round(a.currentValue),
    color: GRAYS[i % GRAYS.length],
    irrValue: a.irrValue
  }));

  return (
    <PieChartVisual
      pieDataInitial={pieDataInitial}
      pieDataMarket={pieDataMarket}
      totalCurrent={totalCurrent}
      selectedId={selectedId}
      onSelect={onAssetSelect}
    />
  );
}
