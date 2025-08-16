// Agrupa el histórico de assets por grupo, sumando el valor total de cada grupo en cada fecha
import { useMemo } from 'react';

export default function useCombinedHistoryByGroupDashboard2({ assets, exchangeRates, days = 30, API_BASE, cryptoAliases = {} }) {
  // Espera que cada asset tenga groupName y history (array de {date, value})
  return useMemo(() => {
    if (!assets || assets.length === 0) return [];
    // Agrupar assets por grupo
    const groups = {};
    assets.forEach(asset => {
      const group = asset.groupName || 'Sin grupo';
      if (!groups[group]) groups[group] = [];
      groups[group].push(asset);
    });
    // Para cada grupo, sumar el valor total por fecha
    const result = [];
    // Asume que todos los assets tienen el mismo rango de fechas en history
    const dates = assets[0]?.history?.map(h => h.date) || [];
    dates.forEach((date, idx) => {
      const entry = { date };
      Object.keys(groups).forEach(group => {
        // Suma el valor de todos los assets del grupo en esa fecha
        entry[group] = groups[group].reduce((sum, asset) => {
          const h = asset.history?.[idx];
          return sum + (h?.value || 0);
        }, 0);
      });
      result.push(entry);
    });
    return { data: result, groupNames: Object.keys(groups) };
  }, [JSON.stringify(assets)]);
}
