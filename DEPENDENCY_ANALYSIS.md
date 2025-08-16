# ANÁLISIS DE DEPENDENCIAS - ANTES DE ELIMINAR

## ✅ ARCHIVOS SEGUROS PARA ELIMINAR

### 1. `refresh-tickers.js` 
- **Estado**: ❌ NO SE USA en ningún lugar
- **Dependencias**: NINGUNA (no hay imports/requires)
- **package.json**: NO referenciado
- **Función**: Duplica exactamente `update-coingecko.js`
- **Decisión**: ✅ SAFE TO DELETE

### 2. `utils/priceCache.js`
- **Estado**: ❌ ARCHIVO VACÍO 
- **Dependencias**: NINGUNA (no hay imports/requires)
- **Decisión**: ✅ SAFE TO DELETE

## ⚠️ ARCHIVOS QUE REQUIEREN ANÁLISIS ANTES DE CAMBIOS

### 3. `useMarketHistory.js`
- **Estado**: ❌ LEGACY - NO SE USA EN COMPONENTES ACTIVOS
- **Dependencias**: 
  - `frontend/hooks/__tests__/useMarketHistory.test.js` (archivo de test legacy)
- **Función**: Hook legacy para históricos individuales, reemplazado por `useCombinedHistory.js`
- **Nota**: `useCombinedHistory.js` es el que se usa actualmente en la aplicación
- **Decisión**: ✅ SAFE TO DELETE (incluir el test)

### 4. `useMarketDataDashboard2.js`
- **Estado**: ✅ EN USO ACTIVO
- **Dependencias**: 
  - `frontend/src/pages/Dashboard2.jsx` (línea 10, 52)
- **Función**: Hook específico para Dashboard2
- **Decisión**: ❌ NO ELIMINAR - consolidar con useMarketData.js

### 5. `twelveDataService.js`
- **Estado**: ✅ EN USO MÚLTIPLE
- **Dependencias**:
  - `unifiedMarketDataService.js` (precios + históricos)
  - `tickersController.js` (búsqueda de stocks)
- **Función**: Proveedor secundario importante
- **Decisión**: ❌ NO ELIMINAR - es fallback crítico

## 📋 ARCHIVOS CON DEPENDENCIAS CRÍTICAS

### 6. `coingecko-tickers.json`
- **Dependencias críticas**:
  - `unifiedMarketDataService.js` (fallback map)
  - `scripts/pushUserAssetsViaAPI.js` (crypto name lookup)
- **Generadores**:
  - `scripts/update-coingecko.js` ✅ (mantener)
  - `refresh-tickers.js` ❌ (eliminar)
- **Decisión**: ✅ ARCHIVO ESENCIAL - mantener generación

## 🎯 PLAN DE ACCIÓN SEGURO

### FASE 1: ELIMINACIONES SEGURAS (0 riesgo)
```bash
# Estos archivos no tienen dependencias o son legacy no usado
rm backend/refresh-tickers.js
rm backend/utils/priceCache.js
rm frontend/hooks/useMarketHistory.js
rm frontend/hooks/__tests__/useMarketHistory.test.js
```

### FASE 2: CONSOLIDACIÓN DE HOOKS (riesgo bajo)
```javascript
// Objetivo: Unificar useMarketData.js y useMarketDataDashboard2.js
// Mantener funcionalidad de Dashboard2 pero con hook unificado
```

### FASE 3: OPTIMIZACIÓN DE PROVIDERS (riesgo medio)
```javascript
// Cambiar orden en unifiedMarketDataService.js:
// Cache -> Yahoo -> Finnhub -> TwelveData (solo históricos)
// CoinGecko solo para crypto batch
```

## 🚨 NO TOCAR (RIESGO ALTO)

1. **`scripts/update-coingecko.js`** - referenciado en package.json
2. **`coingecko-tickers.json`** - usado por 2+ servicios críticos  
3. **`twelveDataService.js`** - proveedor fallback esencial
4. **`useMarketDataDashboard2.js`** - usado activamente (consolidar después)

## 🔍 NECESITA INVESTIGACIÓN

1. **Multiple intervals** - ¿Cuántos intervalos simultáneos se están ejecutando?
2. **Cache strategy** - ¿Redis y localStorage están sincronizados?
3. **CoinGecko rate limiting** - ¿Se están alcanzando los límites de 429 errors?

## ✅ CONFIRMADO PARA ELIMINAR

- `useMarketHistory.js` - Legacy, reemplazado por `useCombinedHistory.js`
- Archivo de test correspondiente - No testea funcionalidad activa
