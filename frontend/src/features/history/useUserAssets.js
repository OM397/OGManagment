// 📁 src/features/history/useUserAssets.js
import { useMemo } from 'react';

export function useUserAssets(categoryGroups, options = {}) {
  return useMemo(() => {
    const list = [];

    // ✅ Solo procesar categoría "Investments"
    const groups = categoryGroups?.['Investments'] || {};

    Object.values(groups || {}).forEach((assets) => {
      if (Array.isArray(assets)) {
        assets.forEach((asset) => {
          const {
            id,
            name,
            initialQty,
            initialCost,
            type,
            initialCurrency: assetInitCurrency,
            currency: assetCurrency
          } = asset || {};

          const exists = list.find(a => a.id === id);
          if (!exists) {
            const nameShort = name?.length > 15 ? name.slice(0, 12) : name;
            list.push({
              id,
              name,
              nameShort,
              type,
              initialQty,
              initialCost,
              // Prefer explicit options, then asset fields, else null
              initialCurrency: options.initialCurrency ?? assetInitCurrency ?? null,
              currency: options.currency ?? assetCurrency ?? null
            });
          }
        });
      }
    });

    return list;
  }, [categoryGroups, options.initialCurrency, options.currency]);
}
