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
// ...existing code...
Object.values(categoriesToUse || {}).forEach(category => {
  Object.values(category || {}).forEach(group => {
    if (!Array.isArray(group)) return;

    group.forEach(asset => {
      const {
        initialQty = 0,
        initialCost = 0,
        id,
        actualCost,
        manualValue,
        type
      } = asset;
  const rawKey = id?.toLowerCase?.() ?? '';
  const mapped = asset.type === 'crypto' ? marketData?.idMap?.[rawKey] : undefined;
  const key = mapped && (marketData?.cryptos?.[mapped] || marketData?.stocks?.[mapped]) ? mapped : rawKey;

      const qty = Number(initialQty) || 0;
      const cost = Number(initialCost) || 0;

      const actualPrice =
        type === 'manual'
          ? Number(manualValue ?? 0)
          : Number(actualCost ??
              marketData?.cryptos?.[key]?.eur ??
              marketData?.stocks?.[key]?.eur ??
              0);

      const actualValue = qty * actualPrice;

      totalInitial += qty * cost;
      totalActual += actualValue;
    });
  });
});

return {
  totalInitial: Number(totalInitial.toFixed(2)),
  totalActual: Number(totalActual.toFixed(2))
};}