# PLAN DE ELIMINACIÓN DE DUPLICACIONES - KUBERA MVP

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. MULTIPLE LLAMADAS A COINGECKO API
- **tickersController.js**: Fetch cada 1 hora
- **unifiedMarketDataService.js**: Fallback fetch si no hay archivo local
- **refresh-tickers.js**: Script manual (DUPLICADO)
- **update-coingecko.js**: Script manual (DUPLICADO)

### 2. PROVEEDORES MÚLTIPLES INNECESARIOS
- Yahoo → Finnhub → TwelveData → CoinGecko (secuencial)
- Debería ser: Cache → Proveedor Principal → Fallback único

### 3. FRONTEND FETCHING DUPLICADO
- useMarketData.js, useMarketDataDashboard2.js, useMarketHistory.js
- Múltiples intervalos de refresco simultáneos
- Cache localStorage + Redis backend duplicado

## 🛠️ ACCIONES INMEDIATAS (ORDEN DE PRIORIDAD)

### PASO 1: ELIMINAR SCRIPTS DUPLICADOS
- ❌ Eliminar refresh-tickers.js (mantener update-coingecko.js)
- ✅ Usar solo update-coingecko.js para updates manuales

### PASO 2: CONSOLIDAR FETCHING DE COINGECKO
- ✅ Una sola llamada a CoinGecko por sesión de servidor
- ✅ Cache Redis con TTL de 24 horas
- ❌ Eliminar fetch duplicado en tickersController

### PASO 3: OPTIMIZAR PROVEEDORES API
- ✅ Cache-first strategy (5 min TTL para precios)
- ✅ Yahoo como proveedor principal
- ✅ Finnhub solo como fallback para stocks
- ❌ Eliminar TwelveData para precios actuales (solo historiales)

### PASO 4: UNIFICAR HOOKS FRONTEND
- ✅ Un solo hook global para market data
- ✅ Context API para compartir estado
- ❌ Eliminar intervalos múltiples

### PASO 5: OPTIMIZAR CACHE STRATEGY
- ✅ Redis como single source of truth
- ❌ Eliminar localStorage cache duplicado
- ✅ Batch requests para múltiples activos

## 📊 IMPACTO ESPERADO

### REDUCCIÓN DE LLAMADAS API:
- **CoinGecko**: 90% reducción (de ~100/día a ~1/día)
- **Yahoo/Finnhub**: 60% reducción (cache-first)
- **Frontend**: 80% reducción (consolidación de hooks)

### MEJORA DE PERFORMANCE:
- **Loading time**: 40% más rápido
- **Bandwidth**: 70% reducción
- **Rate limiting**: Eliminación de 429 errors

## 🎯 IMPLEMENTATION ROADMAP

1. **Day 1**: Eliminar scripts duplicados y consolidar CoinGecko
2. **Day 2**: Implementar cache-first strategy 
3. **Day 3**: Refactor hooks frontend
4. **Day 4**: Testing y optimización
5. **Day 5**: Monitoring y métricas

## ⚠️ RIESGOS Y CONSIDERACIONES

- **Rollback plan**: Mantener archivos originales por 1 semana
- **Testing**: Verificar todos los endpoints funcionan correctamente
- **Monitoring**: Alertas si tasa de error sube >5%
- **Graceful degradation**: Fallbacks si falla cache principal
