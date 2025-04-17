// 📁 src/features/history/useUserAssets.js
import { useMemo } from 'react';

export function useUserAssets(categoryGroups) {
  return useMemo(() => {
    const list = [];

    // ✅ Solo procesar categoría "Investments"
    const groups = categoryGroups?.['Investments'] || {};

    Object.values(groups || {}).forEach((assets) => {
      if (Array.isArray(assets)) {
        assets.forEach(({ id, name, initialQty, initialCost }) => {
          const exists = list.find(a => a.id === id);
          if (!exists) {
            const type = id.includes('.') ? 'stock' : 'crypto';
            const nameShort = name?.length > 15 ? name.slice(0, 12) : name;
            list.push({ id, name, nameShort, type, initialQty, initialCost });
          }
        });
      }
    });

    return list;
  }, [categoryGroups]);
}
