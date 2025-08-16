// frontend/src/dashboard2/PieChartVisual.jsx
// **MODO DE EMERGENCIA: INTERACTIVIDAD DESACTIVADA**
// Se han eliminado los listeners de 'onClick', 'onMouseEnter', 'onMouseLeave' y la lógica de 'hover'
// para solucionar un bug de "doble toque" en dispositivos móviles (especialmente iOS).
// El gráfico ahora es una visualización estática.

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function PieChartVisual({ pieDataInitial, pieDataMarket, totalCurrent }) {
  const cleanName = (name) =>
    name
      .replace(/\s?\([\w.]+\)/, '')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());

  const dataInitial = pieDataInitial.map(entry => ({
    ...entry,
    name: cleanName(entry.name)
  }));

  const dataMarket = pieDataMarket.map(entry => ({
    ...entry,
    name: cleanName(entry.name)
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm w-full p-6 sm:p-7 flex flex-col items-center justify-center select-none">
      <div className="relative w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataInitial}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={66}
              outerRadius={84}
              paddingAngle={1}
              isAnimationActive={false} // Desactivar animación para simplicidad
            >
              {dataInitial.map((entry, index) => (
                <Cell
                  key={`initial-${index}`}
                  fill={entry.color}
                  stroke="none"
                />
              ))}
            </Pie>
            <Pie
              data={dataMarket}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={92}
              outerRadius={112}
              paddingAngle={1}
              isAnimationActive={false} // Desactivar animación para simplicidad
            >
              {dataMarket.map((entry, index) => (
                <Cell
                  key={`market-${index}`}
                  fill={entry.color}
                  stroke="none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-sm font-medium text-gray-900">
            € {Number(totalCurrent).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
}