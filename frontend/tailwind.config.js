export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'mobile-lg': '425px',
        'tablet': '768px',
        'desktop': '1024px',
        'wide': '1280px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      fontSize: {
        'financial': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'data': ['0.875rem', { lineHeight: '1.3', fontWeight: '500' }],
      },
      colors: {
        financial: {
          profit: '#059669',
          loss: '#DC2626',
          neutral: '#6B7280',
          highlight: '#F59E0B',
        },
        ui: {
          primary: '#1F2937',
          secondary: '#F9FAFB',
          accent: '#3B82F6',
        }
      }
    },
  },
  plugins: [],
}
