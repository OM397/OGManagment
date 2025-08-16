// Suma el histórico de todos los assets en una sola línea total
import { useMemo } from 'react';

export default function useCombinedHistoryTotalDashboard2({ assets }) {
  return useMemo(() => {
    if (!assets || assets.length === 0) return [];
    const dates = assets[0]?.history?.map(h => h.date) || [];
    return dates.map((date, idx) => {
      // Suma el valor de todos los assets en esa fecha
      const total = assets.reduce((sum, asset) => {
        const h = asset.history?.[idx];
        return sum + (h?.value || 0);
      }, 0);
      return { date, total };
    });
  }, [JSON.stringify(assets)]);
}
