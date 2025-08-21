// Hook para obtener la información del Portfolio Overview para Dashboard2
import { useMemo, useState, useEffect } from 'react';
import useInvestmentsIRR from '../shared/hooks/useInvestmentsIRR';
import { getCurrentPrice } from '../../shared/getCurrentPrice';

export default function usePortfolioOverview(categoryGroups, marketData) {
  const [sevenDayData, setSevenDayData] = useState({});
  const [thirtyDayData, setThirtyDayData] = useState({});
  const [oneYearData, setOneYearData] = useState({});
  const [loading7d, setLoading7d] = useState(true);
  const [loading30d, setLoading30d] = useState(true);
  const [loading1y, setLoading1y] = useState(true);

  // --- IRR logic (migrated from usePortfolioIRR) ---
  const { irr: irrData } = useInvestmentsIRR();
  
  // Función para obtener datos históricos de 7 días
  const fetchSevenDayData = async (asset) => {
    try {
      const response = await fetch(`/api/history?id=${asset.id}&type=${asset.type}&days=7`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.history;
    } catch (error) {
      console.error('Error fetching 7-day data:', error);
      return null;
    }
  };

  // Función para obtener datos históricos de 30 días
  const fetchThirtyDayData = async (asset) => {
    try {
      const response = await fetch(`/api/history?id=${asset.id}&type=${asset.type}&days=30`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.history;
    } catch (error) {
      console.error('Error fetching 30-day data:', error);
      return null;
    }
  };

  // Función para obtener datos históricos de 1 año
  const fetchOneYearData = async (asset) => {
    try {
      const response = await fetch(`/api/history?id=${asset.id}&type=${asset.type}&days=365`, {
        credentials: 'include'
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.history;
    } catch (error) {
      console.error('Error fetching 1-year data:', error);
      return null;
    }
  };

  // Obtener datos de 7 días para todos los assets
  useEffect(() => {
    const fetchAllSevenDayData = async () => {
      setLoading7d(true);
      const assets = [];
      Object.entries(categoryGroups?.Investments || {}).forEach(([groupName, groupAssets]) => {
        if (Array.isArray(groupAssets)) {
          groupAssets.forEach(asset => {
            if (asset?.id && asset?.name && (asset.type === 'stock' || asset.type === 'crypto')) {
              assets.push(asset);
            }
          });
        }
      });

      const sevenDayResults = {};
      await Promise.all(
        assets.map(async (asset) => {
          const history = await fetchSevenDayData(asset);
          if (history && history.length >= 2) {
            const currentPrice = history[history.length - 1]?.price || 0;
            const sevenDaysAgoPrice = history[0]?.price || 0;
            const changePercent = sevenDaysAgoPrice > 0 ? ((currentPrice - sevenDaysAgoPrice) / sevenDaysAgoPrice) * 100 : 0;
            sevenDayResults[asset.id] = changePercent;
          } else {
            sevenDayResults[asset.id] = 0;
          }
        })
      );
      
      setSevenDayData(sevenDayResults);
      setLoading7d(false);
    };

    if (categoryGroups?.Investments) {
      fetchAllSevenDayData();
    }
  }, [categoryGroups]);

  // Obtener datos de 30 días para todos los assets
  useEffect(() => {
    const fetchAllThirtyDayData = async () => {
      setLoading30d(true);
      const assets = [];
      Object.entries(categoryGroups?.Investments || {}).forEach(([groupName, groupAssets]) => {
        if (Array.isArray(groupAssets)) {
          groupAssets.forEach(asset => {
            if (asset?.id && asset?.name && (asset.type === 'stock' || asset.type === 'crypto')) {
              assets.push(asset);
            }
          });
        }
      });

      const thirtyDayResults = {};
      await Promise.all(
        assets.map(async (asset) => {
          const history = await fetchThirtyDayData(asset);
          if (history && history.length >= 2) {
            const currentPrice = history[history.length - 1]?.price || 0;
            const thirtyDaysAgoPrice = history[0]?.price || 0;
            const changePercent = thirtyDaysAgoPrice > 0 ? ((currentPrice - thirtyDaysAgoPrice) / thirtyDaysAgoPrice) * 100 : 0;
            thirtyDayResults[asset.id] = changePercent;
          } else {
            thirtyDayResults[asset.id] = 0;
          }
        })
      );
      
      setThirtyDayData(thirtyDayResults);
      setLoading30d(false);
    };

    if (categoryGroups?.Investments) {
      fetchAllThirtyDayData();
    }
  }, [categoryGroups]);

  // Obtener datos de 1 año para todos los assets
  useEffect(() => {
    const fetchAllOneYearData = async () => {
      setLoading1y(true);
      const assets = [];
      Object.entries(categoryGroups?.Investments || {}).forEach(([groupName, groupAssets]) => {
        if (Array.isArray(groupAssets)) {
          groupAssets.forEach(asset => {
            if (asset?.id && asset?.name && (asset.type === 'stock' || asset.type === 'crypto')) {
              assets.push(asset);
            }
          });
        }
      });

      const oneYearResults = {};
      await Promise.all(
        assets.map(async (asset) => {
          const history = await fetchOneYearData(asset);
          if (history && history.length >= 2) {
            const currentPrice = history[history.length - 1]?.price || 0;
            const oneYearAgoPrice = history[0]?.price || 0;
            const changePercent = oneYearAgoPrice > 0 ? ((currentPrice - oneYearAgoPrice) / oneYearAgoPrice) * 100 : 0;
            oneYearResults[asset.id] = changePercent;
          } else {
            oneYearResults[asset.id] = 0;
          }
        })
      );
      
      setOneYearData(oneYearResults);
      setLoading1y(false);
    };

    if (categoryGroups?.Investments) {
      fetchAllOneYearData();
    }
  }, [categoryGroups]);

  // Extraer los activos de inversiones
  const userAssets = useMemo(() => {
    const assets = [];
    Object.entries(categoryGroups?.Investments || {}).forEach(([groupName, groupAssets]) => {
      if (Array.isArray(groupAssets)) {
        groupAssets.forEach(asset => {
          if (asset?.id && asset?.name && (asset.type === 'stock' || asset.type === 'crypto')) {
            assets.push({
              ...asset,
              nameShort: asset.name
                .replace(/\b(ETF|UCITS|Acc|Dist|Ins|PI|USD|AG|Trust|Edge|ETC)\b/g, '')
                .replace(/€/g, 'Euro')
                .replace(/\s*\([^)]*\)/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .split(' ')
                .slice(0, 4)
                .join(' '),
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
    const sevenDayChange = sevenDayData[asset.id] || 0;
    const thirtyDayChange = thirtyDayData[asset.id] || 0;
    const oneYearChange = oneYearData[asset.id] || 0;
    
    return {
      ...asset,
      currentValue,
      initialValue,
      pnl: currentValue - initialValue,
      pnlPercent: initialValue > 0 ? ((currentValue - initialValue) / initialValue) * 100 : 0,
      irrValue,
      sevenDayChange,
      thirtyDayChange,
      oneYearChange
    };
  });

  return {
    assets: assetsWithValues,
    totalCurrent: assetsWithValues.reduce((sum, a) => sum + a.currentValue, 0),
    totalInitial: assetsWithValues.reduce((sum, a) => sum + a.initialValue, 0),
    loading7d,
    loading30d,
    loading1y
  };
}
