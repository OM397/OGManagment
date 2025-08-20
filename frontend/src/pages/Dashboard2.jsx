import React, { Suspense } from 'react';
const MultiLineChartPanel = React.lazy(() => import('../features/history/MultiLineChartPanel'));
const MultiLineChartPanelByGroup = React.lazy(() => import('../dashboard2/MultiLineChartPanelByGroup'));
import useCombinedHistoryByGroupDashboard2 from '../dashboard2/useCombinedHistoryByGroupDashboard2';
import useCombinedHistoryTotalDashboard2 from '../dashboard2/useCombinedHistoryTotalDashboard2';
const MultiLineChartPanelTotal = React.lazy(() => import('../dashboard2/MultiLineChartPanelTotal'));
// 📊 Dashboard2 - Nueva página de gráficos
import { useCategoryGroups } from '../shared/context/CategoryGroupsContext';
import usePortfolioOverview from '../dashboard2/usePortfolioOverview';
import useFilteredAssets from '../dashboard2/useFilteredAssets';
import ChartTabs from '../features/history/ChartTabs';
import AssetsSummary from '../features/assets/AssetsSummary';

import useCombinedHistoryDashboard2 from '../dashboard2/useCombinedHistoryDashboard2';


import PortfolioOverview from '../dashboard2/PortfolioOverview';
import PieChartConnector from '../dashboard2/PieChartConnector';
const PieChartByTypeConnector = React.lazy(() => import('../dashboard2/PieChartByTypeConnector'));



export default function Dashboard2({ categoryGroups: categoryGroupsProp, marketData: marketDataProp, exchangeRates: exchangeRatesProp }) {
  // Nota de mantenimiento (móvil iOS):
  // Tuvimos un bug de "doble toque" con Recharts al usar Tooltip/hover. Para depurar,
  // habilita logs de touch con ?touchdebug=1. En Total/Grupos se desactivó interactividad;
  // en el chart por Activo se usa overlay y tooltip de línea única.
  // Si cambias la interactividad, verifica en dispositivos iOS reales.
  // Debug touch/click events when URL param touchdebug=1 is present
  const enableTouchDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('touchdebug');
  React.useEffect(() => {
    if (!enableTouchDebug) return;
    window.__touchLogs__ = window.__touchLogs__ || [];
    const pushLog = (e) => {
      try {
        const path = (e.composedPath && e.composedPath()) || (e.path || [e.target]);
        const short = path.slice(0,5).map(el => el && el.tagName ? `${el.tagName.toLowerCase()}${el.className?'.'+el.className.split(' ').slice(0,2).join('.') : ''}` : String(el)).join(' > ');
        const entry = { t: Date.now(), type: e.type, target: (e.target && e.target.tagName) || 'unknown', path: short };
        window.__touchLogs__.push(entry);
        // keep only last 200
        if (window.__touchLogs__.length > 200) window.__touchLogs__.shift();
      } catch (_) {}
    };
    const events = ['touchstart','touchend','pointerdown','mousedown','click'];
    events.forEach(ev => document.addEventListener(ev, pushLog, { capture: true, passive: true }));
    return () => events.forEach(ev => document.removeEventListener(ev, pushLog, { capture: true }));
  }, []);

  // Traer datos del usuario y mercado
  const { categoryGroups: categoryGroupsCtx } = useCategoryGroups();
  const categoryGroups = categoryGroupsProp || categoryGroupsCtx;
  // Configuración API_BASE y aliases si es necesario
  const API_BASE = '/api';
  const cryptoAliases = {};
  // Usar marketData y exchangeRates provistos por InnerApp (con auto-refresh global)
  const marketData = marketDataProp;
  const exchangeRates = exchangeRatesProp;
  const { assets, totalCurrent, totalInitial } = usePortfolioOverview(categoryGroups, marketData);


  // Tabs para grupos y assets, usando solo los datos de assets (dashboard2)
  const groupNames = React.useMemo(() => {
    const names = new Set();
    assets.forEach(a => {
      if (a.groupName) names.add(a.groupName);
    });
    return Array.from(names);
  }, [assets]);

  // Estado de selección
  const [selectedId, setSelectedId] = React.useState('ALL');
  const [selectionSource, setSelectionSource] = React.useState('tabs');
  const [evolutionView, setEvolutionView] = React.useState('total'); // 'total' o 'groups'

  // Filtrado de assets según selección (usa hook nuevo)
  const filteredAssets = useFilteredAssets(assets, selectedId);

  // Hook para histórico multi-línea por activo
  const { multiHistory, loading: loadingMultiHistory } = useCombinedHistoryDashboard2({
    assets: filteredAssets,
    exchangeRates,
    days: 30,
    API_BASE,
  cryptoAliases,
  pollMs: 200000,
  startupBurstCount: 2,
  startupBurstSpacingMs: 20000
  });
  // Hook para histórico multi-línea por grupo
  // Pass multiHistory (with history arrays) so the chart is a pure summatory by group and date
  const { data: multiHistoryByGroup, groupNames: groupNamesByChart } = useCombinedHistoryByGroupDashboard2({
    assets: multiHistory,
    exchangeRates,
    days: 30,
    API_BASE,
    cryptoAliases
  });

  // Hook para histórico total (una sola línea)
  const multiHistoryTotal = useCombinedHistoryTotalDashboard2({ assets: multiHistory });
  // Usar el mismo tab que Assets (por defecto 'Investments')
  const activeTab = 'Investments';

  return (
    <div className="px-2 sm:px-4 py-3 sm:py-5 w-full max-w-none">
      {enableTouchDebug && (
        <div style={{position:'fixed',right:12,bottom:12,zIndex:9999,maxWidth:320}}>
          <div className="bg-black text-white p-2 rounded shadow text-xs">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <strong>Touch logs</strong>
              <div>
                <button onClick={() => { window.__touchLogs__ = []; }} className="ml-2 text-white/80">Clear</button>
              </div>
            </div>
            <div style={{maxHeight:200,overflowY:'auto',marginTop:6}}>
              {(window.__touchLogs__||[]).slice().reverse().map((l,i) => (
                <div key={i} style={{padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  <div style={{opacity:0.9}}>{new Date(l.t).toLocaleTimeString()} — {l.type} — {l.target}</div>
                  <div style={{opacity:0.6,fontSize:11}}>{l.path}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button
                onClick={async () => {
                  try {
                    const logs = (window.__touchLogs__ || []).slice();
                    if (!logs.length) return alert('No logs to send');
                    const res = await fetch('/api/admin/dashboard/touch-logs', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ logs })
                    });
                    if (!res.ok) throw new Error('failed');
                    alert('Logs sent to admin panel');
                  } catch (e) {
                    alert('Error sending logs to server');
                  }
                }}
                className="px-2 py-1 bg-indigo-600 rounded text-white text-xs"
              >Send to admin</button>
              <button
                onClick={() => {
                  try { navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(window.__touchLogs__||[])); alert('Copied to clipboard'); } catch { alert('Copy failed'); }
                }}
                className="px-2 py-1 bg-gray-700 rounded text-white text-xs"
              >Copy</button>
            </div>
          </div>
        </div>
      )}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Dashboard de Gráficos</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-2">Visualiza y analiza tu portafolio de inversiones</p>
        <AssetsSummary initialData={categoryGroups} marketData={marketData} activeTab={activeTab} />
      </div>

      {/* Filtros Globales */}
      <div className="mb-4 lg:mb-6">
        <ChartTabs
          selectedId={selectedId}
          userAssets={assets}
          groupNames={groupNames}
          onSelect={setSelectedId}
        />
      </div>

      {/* Fila 1: La Gran Foto - Resumen General y Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-4 lg:mb-6">
        
     
     
     
        {/* Card: Resumen del Portafolio */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4 lg:p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-2">Resumen del Portafolio</h2>
          <PortfolioOverview assets={filteredAssets} />
        </div>

     
     
     
     
     
        {/* Columna Derecha: Gráficos de Distribución */}
        <div className="lg:col-span-1 flex flex-col gap-4 lg:gap-6">
          {/* Card: Distribución por Tipo */}
          <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col h-full">
            <h4 className="text-base font-semibold text-gray-700 mb-2">Distribución por Tipo</h4>
            <div className="flex-grow flex justify-center items-center min-h-[200px]">
              <Suspense fallback={<div className="text-gray-400">Cargando...</div>}>
                <PieChartByTypeConnector
                  assets={assets}
                  totalCurrent={totalCurrent}
                />
              </Suspense>
            </div>
          </div>
          {/* Card: Distribución por Grupos */}
          <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col h-full">
            <h4 className="text-base font-semibold text-gray-700 mb-2">Distribución por Asset</h4>
            <div className="flex-grow flex justify-center items-center min-h-[200px]">
              <PieChartConnector
                onAssetSelect={id => {
                  setSelectedId(id);
                  setSelectionSource('chart');
                }}
                selectedId={selectedId}
                assets={filteredAssets}
                totalCurrent={filteredAssets.reduce((sum, a) => sum + (a.currentValue || 0), 0)}
                selectionSource={selectionSource}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fila 2: Evolución del Portafolio (Unificado) */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 lg:mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-base font-semibold text-gray-700 mb-2">Evolución del Portafolio y Grupos</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEvolutionView('total')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                evolutionView === 'total'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              Visión Total
            </button>
            <button
              onClick={() => setEvolutionView('groups')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                evolutionView === 'groups'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              Por Grupos
            </button>
          </div>
        </div>
        <div className="min-h-[320px] justify-center items-center">
          {evolutionView === 'total' ? (
            <>
              {multiHistoryTotal && multiHistoryTotal.length > 0 ? (
                <Suspense fallback={<div className="text-gray-400">Cargando gráfico...</div>}>
                  <MultiLineChartPanelTotal data={multiHistoryTotal} height={320} />
                </Suspense>
              ) : (
                <span className="text-gray-400">Sin datos históricos para mostrar.</span>
              )}
            </>
          ) : (
            <>
              {multiHistoryByGroup && groupNamesByChart && groupNamesByChart.length > 0 ? (
                <Suspense fallback={<div className="text-gray-400">Cargando gráfico...</div>}>
                  <MultiLineChartPanelByGroup
                    data={multiHistoryByGroup}
                    groupNames={groupNamesByChart}
                    height={320}
                  />
                </Suspense>
              ) : (
                <span className="text-gray-400">Sin datos históricos para mostrar.</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Filtros secundarios (duplicados) antes de Análisis por Activo */}
      <div className="mb-4 lg:mb-6">
        <ChartTabs
          selectedId={selectedId}
          userAssets={assets}
          groupNames={groupNames}
          onSelect={setSelectedId}
        />
      </div>

      {/* Fila 3: Análisis por Activo */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h4 className="text-base font-semibold text-gray-700 mb-2">Análisis por Activo</h4>
        <div className="min-h-[300px]">
          {multiHistory && multiHistory.length > 0 ? (
            <Suspense fallback={<div className="text-gray-400">Cargando gráfico...</div>}>
              <MultiLineChartPanel
                multiHistory={multiHistory}
                selectedId={selectedId}
                onSelect={setSelectedId}
                height={320}
                exchangeRates={exchangeRates}
              />
            </Suspense>
          ) : (
            <span className="text-gray-400">Sin datos históricos para mostrar.</span>
          )}
        </div>
      </div>
    </div>
  );
}