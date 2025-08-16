// Hook para obtener la información del Portfolio Overview para Dashboard2
import { useMemo } from 'react';
import useInvestmentsIRR from '../shared/hooks/useInvestmentsIRR';
import { getCurrentPrice } from '../../shared/getCurrentPrice';

export default function usePortfolioOverview(categoryGroups, marketData) {
  // --- IRR logic (migrated from usePortfolioIRR) ---
  const { irr: irrData } = useInvestmentsIRR();
  // Extraer los activos de inversiones
  const userAssets = useMemo(() => {
    const assets = [];
    Object.entries(categoryGroups?.Investments || {}).forEach(([groupName, groupAssets]) => {
      if (Array.isArray(groupAssets)) {
        groupAssets.forEach(asset => {
          if (asset?.id && asset?.name && (asset.type === 'stock' || asset.type === 'crypto')) {
            assets.push({
              ...asset,
              nameShort: asset.name.split(' ')[0],
              groupName
            });
          }
        });
      }
    });
    return assets;
  }, [categoryGroups]);

  // Calcular valor actual y valor inicial
  // Usar función compartida para obtener el precio actual

  const calculateSimpleIRR = (asset) => {
    const initialValue = (asset.initialCost || 0) * (asset.initialQty || 0);
  const currentPrice = getCurrentPrice(asset, marketData);
    const currentValue = (asset.initialQty || 0) * currentPrice;
    if (initialValue <= 0 || !asset.initialDate) return 0;
    const startDate = new Date(asset.initialDate);
    const today = new Date();
    const yearsHeld = (today - startDate) / (365.25 * 24 * 60 * 60 * 1000);
    if (yearsHeld <= 0) return 0;
    const totalReturn = currentValue / initialValue;
    const annualizedReturn = (Math.pow(totalReturn, 1/yearsHeld) - 1) * 100;
    return isFinite(annualizedReturn) ? annualizedReturn : 0;
  };

  const assetsWithValues = userAssets.map(asset => {
    const currentPrice = getCurrentPrice(asset, marketData);
    const currentValue = (asset.initialQty || 0) * currentPrice;
    const initialValue = (asset.initialQty || 0) * (asset.initialCost || 0);
    const assetIRR = irrData?.[asset.id];
    const irrFromAPI = (typeof assetIRR === 'number' && !isNaN(assetIRR)) ? assetIRR : null;
    const irrValue = irrFromAPI !== null ? irrFromAPI : calculateSimpleIRR(asset);
    return {
      ...asset,
      currentValue,
      initialValue,
      pnl: currentValue - initialValue,
      pnlPercent: initialValue > 0 ? ((currentValue - initialValue) / initialValue) * 100 : 0,
      irrValue
    };
  });

  return {
    assets: assetsWithValues,
    totalCurrent: assetsWithValues.reduce((sum, a) => sum + a.currentValue, 0),
    totalInitial: assetsWithValues.reduce((sum, a) => sum + a.initialValue, 0)
  };
}
