//useCategoryGroups.js
import { useState, useEffect, useContext } from 'react';
import { CategoryGroupsContext } from '../../shared/context/CategoryGroupsContext';
import useMarketData from './useMarketData';
import { calculateRealEstateNetValue } from '../../shared/utils';

export default function useCategoryGroups() {
  // ✅ Logs limpiados - versión sin spam
  const { categoryGroups, setCategoryGroups } = useContext(CategoryGroupsContext);
  const { marketData, loading: marketLoading, error: marketError, refreshMarketData } = useMarketData(categoryGroups);

  const [processedCategoryGroups, setProcessedCategoryGroups] = useState(categoryGroups);

  useEffect(() => {
    if (categoryGroups) {
      const updatedCategoryGroups = {};
      for (const categoryName in categoryGroups) {
        if (Object.hasOwnProperty.call(categoryGroups, categoryName)) {
          updatedCategoryGroups[categoryName] = {};
          for (const groupName in categoryGroups[categoryName]) {
            if (Object.hasOwnProperty.call(categoryGroups[categoryName], groupName)) {
              const assetsInGroup = categoryGroups[categoryName][groupName];
              if (Array.isArray(assetsInGroup)) {
                updatedCategoryGroups[categoryName][groupName] = assetsInGroup.map(asset => {
                  let currentPrice = asset.actualCost; // Default to actualCost
                  
                  // Para activos de Real Estate, usar initialCost si actualCost no está disponible
                  if (categoryName === 'Real Estate' && !currentPrice) {
                    currentPrice = asset.initialCost;
                  }
                  
                  // Para Real Estate, convertir valores enteros a decimales naturales
                  if (categoryName === 'Real Estate' && currentPrice && currentPrice % 1 === 0) {
                    currentPrice = currentPrice + 0.00; // Esto mantiene el valor pero lo convierte a decimal
                  }
                  
                  if (asset.type === 'crypto' || asset.type === 'stock') {
                    const data = marketData[asset.id];
                    if (data && data.current_price) {
                      currentPrice = data.current_price;
                    }
                  }

                  let netValue = currentPrice;
                  let remainingMortgage = 0;
                  if (categoryName === 'Real Estate' && asset.mortgageAmount) {
                    const netValueData = calculateRealEstateNetValue(asset, currentPrice);
                    netValue = netValueData.netValue;
                    remainingMortgage = netValueData.remainingMortgage;
                  }

                  return {
                    ...asset,
                    currentPrice,
                    netValue,
                    remainingMortgage,
                  };
                });
              } else {
                // This branch should ideally not be hit if groups always contain arrays of assets
                updatedCategoryGroups[categoryName][groupName] = assetsInGroup;
              }
            }
          }
        }
      }
      setProcessedCategoryGroups(updatedCategoryGroups);
    } else {
      setProcessedCategoryGroups({}); // Ensure it's an empty object if context data is missing
    }
  }, [categoryGroups, marketData]);

  return {
    // ✅ Devolver directamente los categoryGroups del contexto para evitar problemas de sincronización
    categoryGroups: processedCategoryGroups,
    setCategoryGroups,
    loading: marketLoading,
    error: marketError,
    refreshMarketData
  };
}
