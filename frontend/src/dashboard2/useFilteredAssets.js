// Hook para filtrar los assets según el filtro seleccionado en Dashboard2
import { useMemo } from 'react';

export default function useFilteredAssets(assets, selectedId) {
  return useMemo(() => {
    if (selectedId === 'ALL') return assets;
    if (selectedId.startsWith('GROUP:')) {
      const groupName = selectedId.slice(6);
      return assets.filter(a => a.groupName === groupName);
    }
    // Filtro por asset individual
    return assets.filter(a => a.id === selectedId);
  }, [assets, selectedId]);
}
