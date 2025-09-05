import { useState, useEffect, useMemo } from 'react';
import useCategoryGroups from '../assets/useCategoryGroups';

export function useRealEstateData(categoryGroupsParam = null) {
  // ✅ Usar el parámetro si se pasa, sino usar el hook interno
  const { categoryGroups: internalCategoryGroups, loading, error } = useCategoryGroups();
  
  // Usar el parámetro pasado o el interno
  const categoryGroups = categoryGroupsParam || internalCategoryGroups;
  
  const [realEstateAssets, setRealEstateAssets] = useState([]);
  const [processedData, setProcessedData] = useState({
    totalGrossValue: 0,
    totalNetValue: 0,
    totalMortgage: 0,
    totalMonthlyRental: 0,
    totalMonthlyMortgagePayment: 0,
    averageROI: 0,
    totalProperties: 0,
    propertiesWithMortgage: 0,
    propertiesWithRental: 0,
    totalRemainingMortgage: 0
  });

  // Función para identificar si un activo es de Real Estate
  const isRealEstateAsset = (asset) => {
    // Verificar si tiene campos específicos de Real Estate
    const hasRealEstateFields = asset.mortgageAmount || 
                               asset.monthlyMortgagePayment || 
                               asset.monthlyRentalIncome || 
                               asset.monthlyUpdateDay;
    
    // También considerar activos que estén explícitamente en la categoría Real Estate
    const isInRealEstateCategory = asset.category === 'Real Estate' || 
                                  asset.group === 'Real Estate';
    
    return hasRealEstateFields || isInRealEstateCategory;
  };

  // Obtener todos los activos de Real Estate (por categoría y por campos)
  useEffect(() => {
    // Solo procesar si categoryGroups tiene datos reales (no objetos vacíos)
    if (!categoryGroups || Object.keys(categoryGroups).length === 0) {
      setRealEstateAssets([]);
      return;
    }

    // Verificar si hay datos reales en Real Estate
    const realEstateData = categoryGroups['Real Estate'];
    if (!realEstateData || Object.keys(realEstateData).length === 0) {
      setRealEstateAssets([]);
      return;
    }

    let allRealEstateAssets = [];

    // 1. Buscar en la categoría específica 'Real Estate' y sus grupos anidados
    // Navegar por los grupos anidados dentro de Real Estate
    Object.entries(realEstateData).forEach(([groupName, groupAssets]) => {
      if (Array.isArray(groupAssets) && groupAssets.length > 0) {
        // Asignar el nombre del grupo a cada activo
        const assetsWithGroup = groupAssets.map(asset => ({
          ...asset,
          group: groupName
        }));
        allRealEstateAssets.push(...assetsWithGroup);
      }
    });

    // 2. Buscar en todas las categorías activos "Manual" con campos de Real Estate
    Object.entries(categoryGroups).forEach(([categoryName, categoryData]) => {
      // Navegar por los grupos anidados dentro de cada categoría
      if (categoryData && typeof categoryData === 'object') {
        Object.entries(categoryData).forEach(([groupName, groupAssets]) => {
          if (Array.isArray(groupAssets)) {
            groupAssets.forEach((asset) => {
              // Si el activo no está ya incluido y tiene campos de Real Estate
              if (!allRealEstateAssets.find(existing => existing.id === asset.id) && 
                  isRealEstateAsset(asset)) {
                // Asignar el nombre del grupo al activo
                const assetWithGroup = {
                  ...asset,
                  group: groupName
                };
                allRealEstateAssets.push(assetWithGroup);
              }
            });
          }
        });
      }
    });

    // 3. Filtrar duplicados por ID
    const uniqueAssets = allRealEstateAssets.filter((asset, index, self) => 
      index === self.findIndex(a => a.id === asset.id)
    );

    setRealEstateAssets(uniqueAssets);
  }, [categoryGroups]);

  // Procesar y calcular métricas
  const processedMetrics = useMemo(() => {
    // Asegurar que realEstateAssets sea un array
    if (!Array.isArray(realEstateAssets) || realEstateAssets.length === 0) {
      return {
        totalGrossValue: 0,
        totalNetValue: 0,
        totalMortgage: 0,
        totalMonthlyRental: 0,
        totalMonthlyMortgagePayment: 0,
        averageROI: 0,
        totalProperties: 0,
        propertiesWithMortgage: 0,
        propertiesWithRental: 0,
        monthlyCashFlow: 0,
        annualCashFlow: 0,
        totalRemainingMortgage: 0
      };
    }

    let gross = 0;
    let net = 0;
    let mortgage = 0;
    let rental = 0;
    let monthlyPayment = 0;
    let totalInvestment = 0;
    let propertiesWithMortgage = 0;
    let propertiesWithRental = 0;
    let totalRemainingMortgage = 0;

    realEstateAssets.forEach(asset => {
      // Para Real Estate, usar currentPrice (que ya fue establecido a actualCost en useCategoryGroups)
      // o fallback a actualCost si currentPrice no está disponible.
      const currentValue = asset.currentPrice || asset.actualCost || 0;
      const initialValue = asset.initialCost || asset.actualCost || 0;
      
      gross += currentValue;
      totalInvestment += initialValue;

      if (asset.mortgageAmount) {
        mortgage += asset.mortgageAmount;
        monthlyPayment += asset.monthlyMortgagePayment || 0;
        propertiesWithMortgage++;

        // Calcular valor neto (bruto - hipoteca restante)
        const monthsElapsed = asset.initialDate ? 
          Math.max(0, (new Date().getFullYear() - new Date(asset.initialDate).getFullYear()) * 12 +
          (new Date().getMonth() - new Date(asset.initialDate).getMonth())) : 0;
        const remainingMortgage = Math.max(0, asset.mortgageAmount - (asset.monthlyMortgagePayment * monthsElapsed));
        totalRemainingMortgage += remainingMortgage;
        net += (currentValue - remainingMortgage);
      } else {
        net += currentValue;
      }

      if (asset.monthlyRentalIncome) {
        rental += asset.monthlyRentalIncome;
        propertiesWithRental++;
      }
    });

    const monthlyCashFlow = rental - monthlyPayment;
    const annualCashFlow = monthlyCashFlow * 12;
    const averageROI = totalInvestment > 0 ? ((annualCashFlow / totalInvestment) * 100) : 0;

    return {
      totalGrossValue: gross,
      totalNetValue: net,
      totalMortgage: mortgage,
      totalMonthlyRental: rental,
      totalMonthlyMortgagePayment: monthlyPayment,
      averageROI: averageROI,
      totalProperties: realEstateAssets.length,
      propertiesWithMortgage,
      propertiesWithRental,
      monthlyCashFlow,
      annualCashFlow,
      totalRemainingMortgage
    };
  }, [realEstateAssets]);

  // Actualizar estado cuando cambien las métricas procesadas
  useEffect(() => {
    setProcessedData(processedMetrics);
  }, [processedMetrics]);

  // Función para obtener activos por grupo
  const getAssetsByGroup = useMemo(() => {
    if (!Array.isArray(realEstateAssets)) return {};
    
    const grouped = {};
    realEstateAssets.forEach(asset => {
      const group = asset.group || 'Sin Grupo';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(asset);
    });
    return grouped;
  }, [realEstateAssets]);

  // Función para obtener activos con hipoteca
  const getAssetsWithMortgage = useMemo(() => {
    if (!Array.isArray(realEstateAssets)) return [];
    return realEstateAssets.filter(asset => asset.mortgageAmount && asset.mortgageAmount > 0);
  }, [realEstateAssets]);

  // Función para obtener activos con renta
  const getAssetsWithRental = useMemo(() => {
    if (!Array.isArray(realEstateAssets)) return [];
    return realEstateAssets.filter(asset => asset.monthlyRentalIncome && asset.monthlyRentalIncome > 0);
  }, [realEstateAssets]);

  return {
    // Datos básicos
    realEstateAssets: Array.isArray(realEstateAssets) ? realEstateAssets : [],
    loading,
    error,
    
    // Métricas procesadas
    ...processedData,
    
    // Funciones de filtrado
    getAssetsByGroup,
    getAssetsWithMortgage,
    getAssetsWithRental,
    
    // Estado de carga
    hasData: Array.isArray(realEstateAssets) && realEstateAssets.length > 0,
    totalAssets: Array.isArray(realEstateAssets) ? realEstateAssets.length : 0
  };
}