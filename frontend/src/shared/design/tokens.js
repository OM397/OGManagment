// 🎨 Design System Tokens - Kubera Financial App
// Tokens centralizados para consistencia visual

export const tokens = {
  // 🎨 Color System
  colors: {
    // Financial colors - for profit/loss indicators
    financial: {
      profit: '#059669',      // green-600 - professional green
      profitBg: '#ECFDF5',    // green-50 - subtle profit background
      profitBorder: '#BBF7D0', // green-200 - profit border
      loss: '#DC2626',        // red-600 - professional red
      lossBg: '#FEF2F2',      // red-50 - subtle loss background
      lossBorder: '#FECACA',  // red-200 - loss border
      neutral: '#6B7280',     // gray-500 - neutral values
    },
    
    // UI colors - main interface
    ui: {
      primary: '#111827',     // gray-900 - primary text/buttons
      primaryHover: '#000000', // black - hover state
      secondary: '#F9FAFB',   // gray-50 - subtle backgrounds
      accent: '#374151',      // gray-700 - secondary text
      border: '#E5E7EB',      // gray-200 - borders
      borderLight: '#F3F4F6', // gray-100 - light borders
    },
    
    // Semantic colors - states and feedback
    semantic: {
      success: '#059669',     // green-600
      successBg: '#ECFDF5',   // green-50
      warning: '#D97706',     // amber-600
      warningBg: '#FFFBEB',   // amber-50
      error: '#DC2626',       // red-600
      errorBg: '#FEF2F2',     // red-50
      info: '#2563EB',        // blue-600
      infoBg: '#EFF6FF',      // blue-50
    },
    
    // Text colors
    text: {
      primary: '#111827',     // gray-900 - main text
      secondary: '#6B7280',   // gray-500 - secondary text
      tertiary: '#9CA3AF',    // gray-400 - placeholder/disabled
      inverse: '#FFFFFF',     // white - text on dark backgrounds
    }
  },

  // 📏 Spacing System (8px base grid)
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    '3xl': '3rem',    // 48px
    '4xl': '4rem',    // 64px
  },
  
  // 📐 Component spacing (specific use cases)
  component: {
    padding: {
      sm: '0.75rem',    // 12px - small components
      md: '1rem',       // 16px - standard padding
      lg: '1.5rem',     // 24px - large components
      xl: '2rem',       // 32px - containers
    },
    margin: {
      sm: '0.5rem',     // 8px
      md: '1rem',       // 16px
      lg: '1.5rem',     // 24px
      xl: '2rem',       // 32px
    },
    gap: {
      sm: '0.5rem',     // 8px - tight spacing
      md: '0.75rem',    // 12px - standard gap
      lg: '1rem',       // 16px - comfortable gap
      xl: '1.5rem',     // 24px - loose spacing
    }
  },

  // 📝 Typography System
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    }
  },

  // 🔲 Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    full: '9999px',   // pill shape
  },

  // 🎭 Shadows
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // ⏱️ Animation
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  },

  // 📱 Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
};

// 🎯 Financial-specific utilities
export const financialUtils = {
  // Helper for profit/loss styling
  getProfitLossStyle: (value, amount = false) => {
    if (value > 0) {
      return {
        color: tokens.colors.financial.profit,
        backgroundColor: amount ? tokens.colors.financial.profitBg : 'transparent',
        borderColor: amount ? tokens.colors.financial.profitBorder : 'transparent',
      };
    } else if (value < 0) {
      return {
        color: tokens.colors.financial.loss,
        backgroundColor: amount ? tokens.colors.financial.lossBg : 'transparent',
        borderColor: amount ? tokens.colors.financial.lossBorder : 'transparent',
      };
    } else {
      return {
        color: tokens.colors.financial.neutral,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      };
    }
  },

  // Format currency with consistent styling
  formatCurrency: (value, currency = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  },

  // Format percentage with styling
  formatPercentage: (value, decimals = 2) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
  }
};

export default tokens;
