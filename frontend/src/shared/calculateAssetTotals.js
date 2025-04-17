// 📁 frontend/src/shared/calculateAssetTotals.js

export function calculateTotals(initialData, marketData, onlyInvestments = false) {
    let totalInitial = 0;
    let totalActual = 0;
  
    const categories = onlyInvestments
      ? { Investments: initialData?.Investments || {} }
      : initialData;
  
    Object.values(categories || {}).forEach(category => {
      Object.values(category).forEach(group => {
        if (Array.isArray(group)) {
          group.forEach(asset => {
            const { initialQty = 0, initialCost = 0, id, actualCost, manualValue, type } = asset;
  
            const actualPrice =
              type === 'manual'
                ? manualValue ?? 0
                : actualCost ?? marketData?.cryptos?.[id]?.eur ?? marketData?.stocks?.[id]?.eur ?? 0;
  
            const actualValue = initialQty * actualPrice;
  
            totalInitial += initialQty * initialCost;
            totalActual += actualValue;
          });
        }
      });
    });
  
    return {
      totalInitial: parseFloat(totalInitial.toFixed(2)),
      totalActual: parseFloat(totalActual.toFixed(2))
    };
  }
  