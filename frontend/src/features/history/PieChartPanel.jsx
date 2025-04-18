// 📁 src/features/history/PieChartPanel.jsx
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, Tooltip } from 'recharts';
import { useState } from 'react';
import CustomTooltip from './CustomTooltip';

export default function PieChartPanel({ pieDataInitial, pieDataMarket, totalCurrent, activeIndex }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const fadedColor = '#e5e7eb';

  const renderActiveShape = ({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill }) => (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 4}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );

  return (
    <div className="bg-white p-4 rounded shadow-sm flex flex-col items-center justify-center">
      <div className="relative w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
          <Tooltip
  content={<CustomTooltip />}
  wrapperStyle={{ zIndex: 50 }} // ⬅️ asegura que esté por encima del label central
/>

            <Pie
              data={pieDataInitial}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={76}
              paddingAngle={1}
              isAnimationActive
              animationDuration={300}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {pieDataInitial.map((entry, index) => {
                const isActive = activeIndex === index || hoveredIndex === index || activeIndex === -1;
                return (
                  <Cell
                    key={`initial-${index}`}
                    fill={isActive ? entry.color : fadedColor}
                    onMouseEnter={() => setHoveredIndex(index)}
                  />
                );
              })}
            </Pie>

            <Pie
              data={pieDataMarket}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={84}
              outerRadius={100}
              paddingAngle={1}
              isAnimationActive
              animationDuration={300}
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {pieDataMarket.map((entry, index) => {
                const isActive = activeIndex === index || hoveredIndex === index || activeIndex === -1;
                return (
                  <Cell
                    key={`market-${index}`}
                    fill={isActive ? entry.color : fadedColor}
                    onMouseEnter={() => setHoveredIndex(index)}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-sm font-medium text-gray-900">
            € {(totalCurrent / 1000).toFixed(1)}k
          </div>
        </div>
      </div>
    </div>
  );
}
