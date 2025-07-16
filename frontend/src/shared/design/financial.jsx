// 💰 Financial Components - Specialized for investment data
import React from 'react';
import { Badge } from './components';
import { financialUtils } from './tokens';

// 💱 Currency Display Component
export const CurrencyDisplay = ({ 
  value, 
  currency = 'EUR', 
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl font-semibold',
    '2xl': 'text-2xl font-bold'
  };

  return (
    <span className={`tabular-nums text-gray-900 ${sizes[size]} ${className}`}>
      {financialUtils.formatCurrency(value, currency)}
    </span>
  );
};

// 📊 Profit/Loss Indicator
export const ProfitLossIndicator = ({ 
  currentValue, 
  initialValue, 
  showPercentage = true,
  showAmount = true,
  size = 'md' 
}) => {
  const change = currentValue - initialValue;
  const changePercent = initialValue !== 0 ? (change / initialValue) * 100 : 0;
  
  const style = financialUtils.getProfitLossStyle(change, true);
  
  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  return (
    <div className="flex items-center gap-2">
      {showAmount && (
        <span 
          className={`inline-flex items-center rounded-full font-medium border ${sizes[size]}`}
          style={style}
        >
          {change >= 0 ? '+' : ''}{financialUtils.formatCurrency(change)}
        </span>
      )}
      {showPercentage && (
        <span className={`text-xs ${change >= 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
          {financialUtils.formatPercentage(changePercent)}
        </span>
      )}
    </div>
  );
};

// 💼 Asset Summary Card
export const AssetSummaryCard = ({ 
  name, 
  currentValue, 
  initialValue, 
  quantity,
  currency = 'EUR',
  isHighlighted = false,
  onClick,
  className = ''
}) => {
  const change = currentValue - initialValue;
  
  return (
    <div 
      className={`
        bg-white border border-gray-200 rounded-lg p-4 transition-all duration-200
        hover:shadow-md cursor-pointer
        ${isHighlighted ? 'ring-2 ring-gray-900 bg-gray-50' : 'hover:bg-gray-50'}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-gray-900 capitalize">{name}</h3>
        <div className="text-right">
          <CurrencyDisplay value={currentValue} currency={currency} size="lg" />
          <div className="text-xs text-gray-500 mt-1">
            Qty: {quantity}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          vs {financialUtils.formatCurrency(initialValue, currency)}
        </div>
        <ProfitLossIndicator 
          currentValue={currentValue} 
          initialValue={initialValue} 
          size="sm"
        />
      </div>
    </div>
  );
};

// 📈 Portfolio Summary
export const PortfolioSummary = ({ 
  totalValue, 
  totalInitial, 
  currency = 'EUR',
  title = 'Total Portfolio',
  className = ''
}) => {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-700 mb-2">{title}</h2>
        <CurrencyDisplay value={totalValue} currency={currency} size="2xl" />
        <div className="mt-4">
          <ProfitLossIndicator 
            currentValue={totalValue} 
            initialValue={totalInitial}
            size="lg"
          />
        </div>
      </div>
    </div>
  );
};

// 🏷️ Asset Status Badge
export const AssetStatusBadge = ({ status }) => {
  const statusConfig = {
    active: { variant: 'green', text: 'Active' },
    pending: { variant: 'yellow', text: 'Pending' },
    sold: { variant: 'gray', text: 'Sold' },
    error: { variant: 'red', text: 'Error' }
  };
  
  const config = statusConfig[status] || statusConfig.error;
  
  return (
    <Badge variant={config.variant} size="sm">
      {config.text}
    </Badge>
  );
};

export default {
  CurrencyDisplay,
  ProfitLossIndicator,
  AssetSummaryCard,
  PortfolioSummary,
  AssetStatusBadge
};
