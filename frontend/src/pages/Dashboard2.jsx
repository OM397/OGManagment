import React, { Suspense } from 'react';
const MultiLineChartPanel = React.lazy(() => import('../features/history/MultiLineChartPanel'));
const MultiLineChartPanelByGroup = React.lazy(() => import('../dashboard2/MultiLineChartPanelByGroup'));
import useCombinedHistoryByGroupDashboard2 from '../dashboard2/useCombinedHistoryByGroupDashboard2';
import useCombinedHistoryTotalDashboard2 from '../dashboard2/useCombinedHistoryTotalDashboard2';
const MultiLineChartPanelTotal = React.lazy(() => import('../dashboard2/MultiLineChartPanelTotal'));
import useCombinedHistory from '../../hooks/useCombinedHistory';
// 📊 Dashboard2 - Nueva página de gráficos
import { useCategoryGroups } from '../shared/context/CategoryGroupsContext';
import useMarketData from '../features/assets/useMarketData';
import usePortfolioOverview from '../dashboard2/usePortfolioOverview';
import useFilteredAssets from '../dashboard2/useFilteredAssets';
import ChartTabs from '../features/history/ChartTabs';
import AssetsSummary from '../features/assets/AssetsSummary';

//import MultiLineChartPanelDashboard2 from '../dashboard2/MultiLineChartPanelDashboard2';
import useCombinedHistoryDashboard2 from '../dashboard2/useCombinedHistoryDashboard2';
//import { GRAYS } from '../dashboard2/constantsDashboard2';


import PortfolioOverview from '../dashboard2/PortfolioOverview';
import PieChartConnector from '../dashboard2/PieChartConnector';



export default function Dashboard2() {
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
  const { categoryGroups } = useCategoryGroups();
  // Configuración API_BASE y aliases si es necesario
  const API_BASE = '/api';
  const cryptoAliases = {};
  const { marketData, exchangeRates } = useMarketData(categoryGroups || {}, 0, { 
    enableInterval: false  // Dashboard2 no necesita interval automático
  });
  const { assets, totalCurrent, totalInitial } = usePortfolioOverview(categoryGroups, marketData);
  // Hook antiguo para obtener los datos históricos igual que Dashboard.jsx
  const { multiHistory: multiHistoryOld } = useCombinedHistory(assets, exchangeRates, 30);

  // Tabs para grupos y assets, usando solo los datos de assets (dashboard2)
  const groupNames = React.useMemo(() => {
    const names = new Set();
    assets.forEach(a => {
      if (a.groupName) names.add(a.groupName);
    });
    return Array.from(names);
  }, [assets]);

  const groupTabs = React.useMemo(() => [
    { id: 'ALL', label: 'Todos' },
    ...groupNames.map(name => ({ id: `GROUP:${name}`, label: name }))
  ], [groupNames]);

  const assetTabs = React.useMemo(() => [
    { id: 'ALL', label: 'Todos' },
    ...assets.map(a => ({ id: a.id, label: a.nameShort || a.name }))
  ], [assets]);

  // Estado de selección
  const [selectedId, setSelectedId] = React.useState('ALL');
  const [selectionSource, setSelectionSource] = React.useState('tabs');

  // Handlers de selección
  const handleGroupSelect = (id) => {
    setSelectedId(id);
  };
  const handleAssetSelect = (id) => {
    setSelectedId(id);
  };

  // Sincronizar selección desde el gráfico
  const handleAssetSelectFromChart = (id) => {
    setSelectedId(id);
  };

  // Filtrado de assets según selección (usa hook nuevo)
  const filteredAssets = useFilteredAssets(assets, selectedId);

  // Hook para histórico multi-línea por activo
  const { multiHistory, loading: loadingMultiHistory } = useCombinedHistoryDashboard2({
    assets: filteredAssets,
    exchangeRates,
    days: 30,
    API_BASE,
    cryptoAliases
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
//////////////////////////////////////////////////////////  console.log('Dashboard2.jsx - multiHistory:', multiHistory);
  // Usar el mismo tab que Assets (por defecto 'Investments')
  const activeTab = 'Investments';
  // DEBUG VISUAL: Mostrar cómo llegan los datos de assets
//  console.log('Dashboard2.jsx - assets:', assets);
  // DEBUG VISUAL: Mostrar cómo llegan los datos de multiHistoryOld
  //console.log('Dashboard2.jsx - multiHistoryOld:', multiHistoryOld);
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

      {/* Filtros para todos los tamaños de pantalla */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 mb-4">
          <ChartTabs
            selectedId={selectedId}
            userAssets={assets}
            groupNames={groupNames}
            onSelect={setSelectedId}
          />
        </div>
        {/* Portfolio Overview solo en móvil aquí */}
        <div className="block lg:hidden w-full overflow-x-auto">
          <PortfolioOverview assets={filteredAssets} totalCurrent={totalCurrent} totalInitial={totalInitial} />
        </div>
      </div>

      {/* Charts Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-stretch">
  <div className="lg:col-span-2 flex flex-col h-full min-w-0">
          <div className="mb-2">
            <h4 className="text-sm font-semibold text-gray-700">Evolución total (una línea)</h4>
          </div>
          <div className="h-full flex-col bg-white rounded shadow-sm p-4 min-h-[300px] justify-center items-center">
            {/* Gráfico de suma total */}
            {multiHistoryTotal && multiHistoryTotal.length > 0 ? (
              <Suspense fallback={<div className="text-gray-400">Cargando gráfico...</div>}>
                <MultiLineChartPanelTotal data={multiHistoryTotal} height={320} />
              </Suspense>
            ) : (
              <span className="text-gray-400">Sin datos históricos para mostrar.</span>
            )}
          </div>
        </div>
  <div className="h-full flex flex-col bg-white rounded shadow-sm p-4 min-h-[300px] justify-center items-center">
          <div className="mb-2">
            <h4 className="text-sm font-semibold text-gray-700">Distribución por grupos</h4>
          </div>
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

      {/* Sección inferior: multi-gráfico y panel derecho (desktop) */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mt-4 lg:mt-6">
  <div className="lg:col-span-2 flex flex-col gap-6 min-w-0">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Evolución por grupos (multi línea)</h4>
            <div className="bg-white rounded shadow-sm p-4 min-h-[300px] items-center justify-center">
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
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Evolución por activos (multi línea)</h4>
            <div className="bg-white rounded shadow-sm p-4 min-h-[300px]">
              {/* Gráfico multilinea afectado por filtro de grupos, usando hook correcto */}
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
        <div className="hidden lg:flex">
          <div className="w-full">
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-gray-700 invisible">Evolución por grupos (multi línea)</h4>
            </div>
            <div className="bg-white rounded-lg shadow-sm w-full px-6">
              <PortfolioOverview assets={filteredAssets} totalCurrent={totalCurrent} totalInitial={totalInitial} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
