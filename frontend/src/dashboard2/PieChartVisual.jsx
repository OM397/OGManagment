// frontend/src/dashboard2/PieChartVisual.jsx

import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { useState, useRef, useCallback, useEffect } from 'react';

export default function PieChartVisual({ pieDataInitial, pieDataMarket, totalCurrent, onSelect, selectedId, selectionSource }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const rafRef = useRef(null);
  const containerRef = useRef(null);
  const fadedColor = '#e5e7eb';

  // Throttled hover
  const scheduleHover = useCallback((i) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setHoveredIndex(i);
    });
  }, []);

  // Limpiar hover al salir del área - optimizado para móvil
  useEffect(() => {
    const handleDocMove = (e) => {
      // Skip hover logic on touch devices to avoid conflicts
      if (e.type === 'touchmove') return;
      
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (
        e.clientX < rect.left - 2 ||
        e.clientX > rect.right + 2 ||
        e.clientY < rect.top - 2 ||
        e.clientY > rect.bottom + 2
      ) {
        if (hoveredIndex !== null) setHoveredIndex(null);
      }
    };

    // Only add mousemove on non-touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) {
      document.addEventListener('mousemove', handleDocMove, { passive: true });
    }

    return () => {
      document.removeEventListener('mousemove', handleDocMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [hoveredIndex]);

  // --- BLOQUE ELIMINADO ---
  // El useEffect que añadía un event listener global al 'document' ha sido eliminado.
  // Esta era la causa del problema del "doble touch" en tu móvil.

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

  const renderActiveShape = ({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill }) => (
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

  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget && typeof onSelect === 'function') {
      onSelect('ALL');
    }
  };

  // Tarjeta de información al hacer hover
  const hoveredAsset = hoveredIndex !== null ? dataInitial[hoveredIndex] : null;

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-lg shadow-sm w-full p-6 sm:p-7 flex flex-col items-center justify-center select-none"
      onMouseLeave={() => setHoveredIndex(null)}
      onClick={handleBackgroundClick}
    >
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
                  fill={
                    hoveredIndex === null && activeIndex === -1
                      ? entry.color
                      : (hoveredIndex ?? activeIndex) === index
                        ? entry.color
                        : fadedColor
                  }
                  onMouseEnter={() => scheduleHover(index)}
                  stroke="none"
                  style={{ transition: 'fill 120ms ease-out' }}
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
                  fill={
                    hoveredIndex === null && activeIndex === -1
                      ? entry.color
                      : (hoveredIndex ?? activeIndex) === index
                        ? entry.color
                        : fadedColor
                  }
                  onMouseEnter={() => scheduleHover(index)}
                  stroke="none"
                  style={{ transition: 'fill 120ms ease-out' }}
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
        {/* Tarjeta de información */}
        {hoveredAsset && (
          <div className="absolute left-1/2 top-2 -translate-x-1/2 bg-white border border-gray-200 rounded shadow-lg px-4 py-2 z-50 text-xs text-gray-800 min-w-[120px] text-center pointer-events-none">
            <div className="font-semibold mb-1">{hoveredAsset.name}</div>
            <div>Valor inicial: €{hoveredAsset.value.toLocaleString('de-DE')}</div>
            <div>Valor actual: €{dataMarket[hoveredIndex]?.value?.toLocaleString('de-DE')}</div>
            <div>IRR: {typeof hoveredAsset.irrValue === 'number' && isFinite(hoveredAsset.irrValue) ? hoveredAsset.irrValue.toFixed(1) + '%' : '--'}</div>
          </div>
        )}
      </div>
    </div>
  );
}