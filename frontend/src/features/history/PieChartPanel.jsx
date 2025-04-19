// 📁 src/features/history/PieChartPanel.jsx
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, Tooltip } from 'recharts';
import { useState } from 'react';
import CustomTooltip from './CustomTooltip';

export default function PieChartPanel({
  pieDataInitial,
  pieDataMarket,
  totalCurrent,
  onSelect,
  selectedId
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const fadedColor = '#e5e7eb';

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

  const activeIndex = selectedId
    ? dataInitial.findIndex(d => d.id === selectedId)
    : -1;

  const renderActiveShape = ({
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill
  }) => (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 4}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="none"
    />
  );

  const handleClick = (data) => {
    if (data?.payload?.id && typeof onSelect === 'function') {
      onSelect(data.payload.id);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow-sm flex flex-col items-center justify-center">
      <div className="relative w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 50 }} />

            <Pie
              data={dataInitial}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={76}
              paddingAngle={1}
              isAnimationActive
              animationDuration={300}
              activeIndex={hoveredIndex ?? activeIndex}
              activeShape={renderActiveShape}
              onClick={handleClick}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {dataInitial.map((entry, index) => (
                <Cell
                  key={`initial-${index}`}
                  fill={(hoveredIndex ?? activeIndex) === index ? entry.color : fadedColor}
                  onMouseEnter={() => setHoveredIndex(index)}
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
              innerRadius={84}
              outerRadius={100}
              paddingAngle={1}
              isAnimationActive
              animationDuration={300}
              activeIndex={hoveredIndex ?? activeIndex}
              activeShape={renderActiveShape}
              onClick={handleClick}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {dataMarket.map((entry, index) => (
                <Cell
                  key={`market-${index}`}
                  fill={(hoveredIndex ?? activeIndex) === index ? entry.color : fadedColor}
                  onMouseEnter={() => setHoveredIndex(index)}
                  stroke="none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-sm font-medium text-gray-900">
            € {(totalCurrent).toLocaleString('de-DE', { minimumFractionDigits: 0 })}
          </div>
        </div>
      </div>
    </div>
  );
}
