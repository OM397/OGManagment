// 📁 frontend/src/shared/calculateAssetTotals.js

export function calculateTotals(categoryGroups = {}, marketData = {}, filter = null) {
  let totalInitial = 0;
  let totalActual = 0;

  let categoriesToUse;

  if (filter === true) {
    // old use case: onlyInvestments = true
    categoriesToUse = { Investments: categoryGroups?.Investments || {} };
  } else if (filter === false || filter === null || filter === undefined) {
    // old use case: all categories
    categoriesToUse = categoryGroups;
  } else if (typeof filter === 'string') {
    // new use case: exact category name
    categoriesToUse = { [filter]: categoryGroups?.[filter] || {} };
  }

  Object.values(categoriesToUse || {}).forEach(category => {
    Object.values(category || {}).forEach(group => {
      if (!Array.isArray(group)) return;

                group.forEach(asset => {
              const { initialQty = 0, initialCost = 0, id, actualCost, manualValue, type } = asset;
                // normalizamos el id a minúsculas para buscar en marketData
                const key = id?.toLowerCase?.() ?? '';

                const actualPrice =
                type === 'manual'
                    ? (manualValue ?? 0)
                    : actualCost ??
                      marketData?.cryptos?.[key]?.eur ??
                      marketData?.stocks?.[key]?.eur ??
                      0;

        const actualValue = initialQty * actualPrice;

        totalInitial += initialQty * initialCost;
        totalActual += actualValue;
      });
    });
  });

  return {
    totalInitial: parseFloat(totalInitial.toFixed(2)),
    totalActual: parseFloat(totalActual.toFixed(2))
  };
}
