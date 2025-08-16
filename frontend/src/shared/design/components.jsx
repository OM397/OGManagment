// 🧱 Base UI Components - Consistent building blocks
import React from 'react';
import tokens from './tokens.js';

// 🔲 Button Component
export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  disabled = false,
  loading = false,
  className = '',
  ...props 
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg 
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variants = {
    primary: `
      bg-gray-900 text-white hover:bg-black 
      focus:ring-gray-500
    `,
    secondary: `
      bg-gray-100 text-gray-900 hover:bg-gray-200 
      focus:ring-gray-500
    `,
    outline: `
      bg-transparent text-gray-700 border border-gray-300 
      hover:bg-gray-50 focus:ring-gray-500
    `,
    ghost: `
      bg-transparent text-gray-700 hover:bg-gray-100 
      focus:ring-gray-500
    `,
    danger: `
      bg-red-600 text-white hover:bg-red-700 
      focus:ring-red-500
    `
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};

// 💳 Card Component
export const Card = ({ 
  padding = 'md',
  shadow = 'sm',
  children,
  className = '',
  ...props 
}) => {
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 
        ${paddings[padding]} ${shadows[shadow]} ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

// 💰 Financial Value Component
export const FinancialValue = ({ 
  value, 
  currency = 'EUR',
  showChange = false,
  initialValue = null,
  size = 'md',
  className = ''
}) => {
  const change = showChange && initialValue !== null ? value - initialValue : null;
  const changePercent = change && initialValue !== 0 ? (change / initialValue) * 100 : 0;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const getChangeStyle = (val) => {
    if (val > 0) return 'text-green-600 bg-green-50 border-green-200';
    if (val < 0) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className={`font-semibold text-gray-900 ${sizes[size]} tabular-nums`}>
        {formatCurrency(value)}
      </div>
      {showChange && change !== null && (
        <div className="flex items-center gap-2 mt-1">
          <span className={`
            inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
            ${getChangeStyle(change)}
          `}>
            {change >= 0 ? '+' : ''}{formatCurrency(change)}
          </span>
          <span className={`text-xs ${change >= 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {change >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
};

// 📝 Input Component
export const Input = ({
  label,
  error,
  helper,
  size = 'md',
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={`
          w-full border border-gray-300 rounded-md shadow-sm
          focus:ring-2 focus:ring-gray-500 focus:border-gray-500
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
          ${sizes[size]}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
};

// 🏷️ Badge Component
export const Badge = ({ 
  variant = 'gray',
  size = 'md',
  children,
  className = ''
}) => {
  const variants = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${variants[variant]} ${sizes[size]} ${className}
    `}>
      {children}
    </span>
  );
};

// 📊 Loading Spinner
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 ${sizes[size]} ${className}`} />
  );
};

// 🔖 Tab Navigation Component
export const TabNav = ({ tabs, activeTab, onTabChange, totals = {}, className = '' }) => {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="flex space-x-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          const total = totals[tab] || 0;
          
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`
                pb-3 px-3 sm:px-4 min-w-[120px] sm:min-w-[150px] flex-1 
                transition-all duration-200 flex flex-col items-center text-center rounded-t-lg
                ${isActive
                  ? 'text-gray-900 border-b-2 border-gray-900 font-semibold bg-gray-50'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <span className="text-sm font-medium">{tab}</span>
              {typeof total === 'number' && (
                <FinancialValue 
                  value={total} 
                  size="sm" 
                  className={isActive ? 'text-gray-700' : 'text-gray-400'} 
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default {
  Button,
  Card,
  FinancialValue,
  Input,
  Badge,
  LoadingSpinner,
  TabNav
};
