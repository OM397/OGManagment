import React from 'react';
import { useRealEstateData } from '../features/realEstate/useRealEstateData';
import { formatCurrency } from '../shared/formatCurrency';

export default function RealEstateDashboard() {
  const {
    realEstateAssets,
    loading,
    error,
    totalGrossValue = 0,
    totalNetValue = 0,
    totalMortgage = 0,
    totalMonthlyRental = 0,
    totalMonthlyMortgagePayment = 0,
    averageROI = 0,
    totalProperties = 0,
    propertiesWithMortgage = 0,
    propertiesWithRental = 0,
    monthlyCashFlow = 0,
    annualCashFlow = 0,
    totalRemainingMortgage = 0,
    getAssetsByGroup,
    hasData
  } = useRealEstateData();

  if (loading) return <div className="flex justify-center items-center h-64">Cargando...</div>;
  
  // Solo mostrar error si no hay datos disponibles
  if (error && !hasData) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  // Para Real Estate no mostramos advertencias de precios stale ya que las propiedades no tienen precios en tiempo real
  const showStaleWarning = false;

  // Asegurar que todos los valores sean números válidos
  const safeValues = {
    totalGrossValue: Number(totalGrossValue) || 0,
    totalNetValue: Number(totalNetValue) || 0,
    totalMortgage: Number(totalMortgage) || 0,
    totalMonthlyRental: Number(totalMonthlyRental) || 0,
    totalMonthlyMortgagePayment: Number(totalMonthlyMortgagePayment) || 0,
    averageROI: Number(averageROI) || 0,
    totalProperties: Number(totalProperties) || 0,
    propertiesWithMortgage: Number(propertiesWithMortgage) || 0,
    propertiesWithRental: Number(propertiesWithRental) || 0,
    monthlyCashFlow: Number(monthlyCashFlow) || 0,
    annualCashFlow: Number(annualCashFlow) || 0,
    totalRemainingMortgage: Number(totalRemainingMortgage) || 0
  };

  return (
    <div className="px-2 sm:px-4 py-3 sm:py-5 w-full max-w-none">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Real Estate Dashboard
          </h1>
          <p className="text-gray-600">
            Análisis detallado de tus inversiones inmobiliarias
          </p>
        </div>

        {/* Advertencia de precios stale */}
        {showStaleWarning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Valor Total Bruto</h3>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(safeValues.totalGrossValue.toFixed(2))}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Valor Total Neto</h3>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(safeValues.totalNetValue.toFixed(2))}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Hipoteca Total</h3>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(safeValues.totalMortgage.toFixed(2))}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Hipoteca Restante</h3>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(safeValues.totalRemainingMortgage.toFixed(2))}</p>
          </div>
        </div>

        {/* Métricas de rentabilidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Renta Mensual Total</h3>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(safeValues.totalMonthlyRental.toFixed(2))}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Hipoteca Mensual Total</h3>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(safeValues.totalMonthlyMortgagePayment.toFixed(2))}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Cash Flow Mensual</h3>
            <p className={`text-2xl font-bold ${safeValues.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(safeValues.monthlyCashFlow.toFixed(2))}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Propiedades</h3>
            <p className="text-2xl font-bold text-gray-900">{safeValues.totalProperties}</p>
            <p className="text-sm text-gray-500">
              {safeValues.propertiesWithMortgage} con hipoteca • {safeValues.propertiesWithRental} con renta
            </p>
          </div>
        </div>

        {/* Análisis por grupos */}
        {getAssetsByGroup && Object.keys(getAssetsByGroup).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Análisis por Grupos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(getAssetsByGroup).map(([groupName, assets]) => {
                // Calcular métricas para cada grupo
                const groupTotalValue = assets.reduce((sum, asset) => {
                  const currentValue = (asset.currentPrice || asset.actualCost || 0) * (asset.currentQty || asset.initialQty || 0);
                  return sum + currentValue;
                }, 0);
                
                const groupNetValue = assets.reduce((sum, asset) => {
                  const currentValue = (asset.currentPrice || asset.actualCost || 0) * (asset.currentQty || asset.initialQty || 0);
                  if (asset.mortgageAmount) {
                    const monthsElapsed = asset.initialDate ? 
                      Math.max(0, (new Date().getFullYear() - new Date(asset.initialDate).getFullYear()) * 12 +
                      (new Date().getMonth() - new Date(asset.initialDate).getMonth())) : 0;
                    const remainingMortgage = Math.max(0, asset.mortgageAmount - (asset.monthlyMortgagePayment * monthsElapsed));
                    return sum + (currentValue - remainingMortgage);
                  }
                  return sum + currentValue;
                }, 0);
                
                const groupMonthlyRental = assets.reduce((sum, asset) => sum + (asset.monthlyRentalIncome || 0), 0);
                const groupMonthlyMortgage = assets.reduce((sum, asset) => sum + (asset.monthlyMortgagePayment || 0), 0);
                const groupMonthlyCashFlow = groupMonthlyRental - groupMonthlyMortgage;
                const groupAnnualCashFlow = groupMonthlyCashFlow * 12;
                const groupTotalInvestment = assets.reduce((sum, asset) => sum + (asset.initialCost || 0), 0);
                const groupROI = groupTotalInvestment > 0 ? ((groupAnnualCashFlow / groupTotalInvestment) * 100) : 0;
                
                return (
                  <div key={groupName} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{groupName}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Propiedades:</span>
                        <span className="font-medium">{assets.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Valor Total:</span>
                        <span className="font-medium">{formatCurrency(groupTotalValue.toFixed(2))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Valor Neto:</span>
                        <span className="font-medium">{formatCurrency(groupNetValue.toFixed(2))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">ROI:</span>
                        <span className={`font-medium ${groupROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {groupROI.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lista de activos */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Activos Inmobiliarios</h2>
          </div>
          <div className="p-6">
            {!hasData ? (
              <p className="text-gray-500 text-center py-8">No hay activos inmobiliarios registrados</p>
            ) : (
              <div className="space-y-4">
                {realEstateAssets.map((asset, index) => {
                  const currentValue = (asset.currentPrice || asset.actualCost || 0) * (asset.currentQty || asset.initialQty || 0);
                  const netValue = asset.mortgageAmount ? 
                    currentValue - Math.max(0, asset.mortgageAmount - (asset.monthlyMortgagePayment * 
                    (asset.initialDate ? Math.max(0, (new Date().getFullYear() - new Date(asset.initialDate).getFullYear()) * 12 +
                    (new Date().getMonth() - new Date(asset.initialDate).getMonth())) : 0))) : currentValue;
                  
                  const monthlyCashFlow = (asset.monthlyRentalIncome || 0) - (asset.monthlyMortgagePayment || 0);
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                          <p className="text-sm text-gray-500">{asset.group}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(currentValue.toFixed(2))}
                          </p>
                          <p className="text-sm text-blue-600">
                            Neto: {formatCurrency(netValue.toFixed(2))}
                          </p>
                          <p className={`text-sm ${monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Cash Flow: {formatCurrency(monthlyCashFlow.toFixed(2))}/mes
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Hipoteca:</span>
                          <p className="font-medium">{formatCurrency((asset.mortgageAmount || 0).toFixed(2))}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Pago Mensual:</span>
                          <p className="font-medium">{formatCurrency((asset.monthlyMortgagePayment || 0).toFixed(2))}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Renta Mensual:</span>
                          <p className="font-medium">{formatCurrency((asset.monthlyRentalIncome || 0).toFixed(2))}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Fecha Inicial:</span>
                          <p className="font-medium">{asset.initialDate ? new Date(asset.initialDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}