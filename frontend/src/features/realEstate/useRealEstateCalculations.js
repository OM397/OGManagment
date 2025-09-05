import { useMemo } from 'react';
import { calculateRealEstateNetValue } from '../../shared/utils';

export function useRealEstateCalculations(assets) {
  
  // Calcular proyecciones futuras para cada activo
  const projectedData = useMemo(() => {
    if (!assets || assets.length === 0) return [];

    return assets.map(asset => {
      if (!asset.mortgageAmount || !asset.monthlyMortgagePayment) {
        return {
          ...asset,
          projections: null
        };
      }

      const projections = [];
      const currentDate = new Date();
      const initialDate = asset.initialDate ? new Date(asset.initialDate) : currentDate;
      const monthlyUpdateDay = asset.monthlyUpdateDay || 5;
      
      // Proyección a 12 meses
      for (let month = 0; month <= 12; month++) {
        const projectionDate = new Date(initialDate);
        projectionDate.setMonth(projectionDate.getMonth() + month);
        
        // Simular valor de mercado (mantener constante por ahora)
        const projectedMarketValue = (asset.currentPrice || asset.actualCost || 0) * (asset.currentQty || asset.initialQty || 0);
        
        // Calcular hipoteca restante
        const monthsElapsed = month;
        const totalPaid = asset.monthlyMortgagePayment * monthsElapsed;
        const remainingMortgage = Math.max(0, asset.mortgageAmount - totalPaid);
        
        // Calcular valor neto
        const netValue = projectedMarketValue - remainingMortgage;
        
        // Calcular cash flow mensual
        const monthlyCashFlow = (asset.monthlyRentalIncome || 0) - asset.monthlyMortgagePayment;
        
        // Calcular ROI mensual
        const initialInvestment = (asset.cost || asset.actualCost || 0) * (asset.initialQty || asset.currentQty || 0);
        const monthlyROI = initialInvestment > 0 ? (monthlyCashFlow / initialInvestment) * 100 : 0;
        
        projections.push({
          month,
          date: projectionDate.toISOString(),
          marketValue: projectedMarketValue,
          remainingMortgage,
          netValue,
          monthlyCashFlow,
          monthlyROI,
          totalPaid,
          equity: projectedMarketValue - remainingMortgage
        });
      }

      return {
        ...asset,
        projections
      };
    });
  }, [assets]);

  // Calcular métricas de rentabilidad
  const profitabilityMetrics = useMemo(() => {
    if (!assets || assets.length === 0) return {};

    const metrics = {
      totalInitialInvestment: 0,
      totalCurrentValue: 0,
      totalNetValue: 0,
      totalMonthlyCashFlow: 0,
      totalAnnualCashFlow: 0,
      averageROI: 0,
      averageMonthlyROI: 0,
      paybackPeriod: 0,
      totalEquity: 0
    };

    let totalInvestment = 0;
    let totalCashFlow = 0;
    let totalEquity = 0;

    assets.forEach(asset => {
      const initialInvestment = (asset.cost || asset.actualCost || 0) * (asset.initialQty || asset.currentQty || 0);
      const currentValue = (asset.currentPrice || asset.actualCost || 0) * (asset.currentQty || asset.initialQty || 0);
      const monthlyCashFlow = (asset.monthlyRentalIncome || 0) - (asset.monthlyMortgagePayment || 0);
      
      totalInvestment += initialInvestment;
      totalCashFlow += monthlyCashFlow;
      
      if (asset.mortgageAmount) {
        const netValueData = calculateRealEstateNetValue(asset, currentValue);
        totalEquity += netValueData.netValue;
      } else {
        totalEquity += currentValue;
      }
    });

    metrics.totalInitialInvestment = totalInvestment;
    metrics.totalCurrentValue = totalEquity;
    metrics.totalNetValue = totalEquity;
    metrics.totalMonthlyCashFlow = totalCashFlow;
    metrics.totalAnnualCashFlow = totalCashFlow * 12;
    metrics.averageROI = totalInvestment > 0 ? (metrics.totalAnnualCashFlow / totalInvestment) * 100 : 0;
    metrics.averageMonthlyROI = totalInvestment > 0 ? (totalCashFlow / totalInvestment) * 100 : 0;
    metrics.paybackPeriod = totalCashFlow > 0 ? totalInvestment / totalCashFlow : 0; // en meses
    metrics.totalEquity = totalEquity;

    return metrics;
  }, [assets]);

  // Calcular análisis por grupos
  const groupAnalysis = useMemo(() => {
    if (!assets || assets.length === 0) return {};

    const groups = {};
    
    assets.forEach(asset => {
      const group = asset.group || 'Sin Grupo';
      if (!groups[group]) {
        groups[group] = {
          count: 0,
          totalValue: 0,
          totalNetValue: 0,
          totalMortgage: 0,
          totalRental: 0,
          totalMonthlyPayment: 0,
          averageROI: 0
        };
      }

      const currentValue = (asset.currentPrice || asset.actualCost || 0) * (asset.currentQty || asset.initialQty || 0);
      const netValueData = asset.mortgageAmount ? calculateRealEstateNetValue(asset, currentValue) : { netValue: currentValue };
      
      groups[group].count++;
      groups[group].totalValue += currentValue;
      groups[group].totalNetValue += netValueData.netValue;
      groups[group].totalMortgage += asset.mortgageAmount || 0;
      groups[group].totalRental += asset.monthlyRentalIncome || 0;
      groups[group].totalMonthlyPayment += asset.monthlyMortgagePayment || 0;
    });

    // Calcular ROI promedio por grupo
    Object.keys(groups).forEach(groupName => {
      const group = groups[groupName];
      const monthlyCashFlow = group.totalRental - group.totalMonthlyPayment;
      const annualCashFlow = monthlyCashFlow * 12;
      group.averageROI = group.totalValue > 0 ? (annualCashFlow / group.totalValue) * 100 : 0;
    });

    return groups;
  }, [assets]);

  // Calcular tendencias temporales
  const temporalAnalysis = useMemo(() => {
    if (!assets || assets.length === 0) return {};

    const analysis = {
      monthlyTrends: [],
      quarterlyTrends: [],
      yearlyTrends: []
    };

    // Agrupar activos por fecha de inicio
    const assetsByDate = assets
      .filter(asset => asset.initialDate)
      .sort((a, b) => new Date(a.initialDate) - new Date(b.initialDate));

    if (assetsByDate.length > 0) {
      const firstDate = new Date(assetsByDate[0].initialDate);
      const lastDate = new Date();
      const monthsDiff = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + (lastDate.getMonth() - firstDate.getMonth());

      // Análisis mensual
      for (let i = 0; i <= Math.min(monthsDiff, 24); i++) {
        const date = new Date(firstDate);
        date.setMonth(date.getMonth() + i);
        
        let monthTotal = 0;
        let monthNetTotal = 0;
        
        assetsByDate.forEach(asset => {
          if (new Date(asset.initialDate) <= date) {
            const currentValue = (asset.currentPrice || asset.actualCost || 0) * (asset.currentQty || asset.initialQty || 0);
            monthTotal += currentValue;
            
            if (asset.mortgageAmount) {
              const monthsElapsed = Math.max(0, (date.getFullYear() - new Date(asset.initialDate).getFullYear()) * 12 +
                (date.getMonth() - new Date(asset.initialDate).getMonth()));
              const remainingMortgage = Math.max(0, asset.mortgageAmount - (asset.monthlyMortgagePayment * monthsElapsed));
              monthNetTotal += (currentValue - remainingMortgage);
            } else {
              monthNetTotal += currentValue;
            }
          }
        });

        analysis.monthlyTrends.push({
          month: i,
          date: date.toISOString(),
          totalValue: monthTotal,
          totalNetValue: monthNetTotal
        });
      }
    }

    return analysis;
  }, [assets]);

  return {
    projectedData,
    profitabilityMetrics,
    groupAnalysis,
    temporalAnalysis,
    
    // Funciones de utilidad
    getAssetProjection: (assetId, months) => {
      const asset = projectedData.find(a => a.id === assetId);
      if (!asset || !asset.projections) return null;
      return asset.projections.find(p => p.month === months) || asset.projections[asset.projections.length - 1];
    },
    
    getTotalProjectedValue: (months) => {
      return projectedData.reduce((total, asset) => {
        if (asset.projections && asset.projections[months]) {
          return total + asset.projections[months].netValue;
        }
        return total;
      }, 0);
    }
  };
}
