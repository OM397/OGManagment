// 📁 frontend/features/admin/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Login from '../auth/Login';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../shared/config';
import apiClient, { authAPI } from '../../shared/services/apiService';

export default function AdminPanel() {
  // --- Estados principales ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [auth, setAuth] = useState({ username: '' });

  // --- Estados de métricas ---
  const [metrics, setMetrics] = useState({});
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [touchLogsEntries, setTouchLogsEntries] = useState([]);
  const [touchLogsLoading, setTouchLogsLoading] = useState(false);

  // --- Estados de configuración ---
  const [mailingSchedule, setMailingSchedule] = useState({ weekdays: [0], hour: 10 });
  const [mailBody, setMailBody] = useState('Hola {username},\n\nEste es tu resumen semanal de inversiones.');
  const [mailingLoading, setMailingLoading] = useState(false);
  const [mailingMsg, setMailingMsg] = useState('');
  const [assetInterval, setAssetInterval] = useState(() => Number(localStorage.getItem('assetListIntervalMs')) || 120000);

  // --- Estados de Market Summary ---
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryMsg, setSummaryMsg] = useState('');

  // --- Estados de usuarios ---
  const [users, setUsers] = useState([]);
  const [overview, setOverview] = useState({ rows: [], count: 0 });
  const [overviewLoading, setOverviewLoading] = useState(false);

  // --- Estados de APIs ---
  const [apiStatus, setApiStatus] = useState({
    prices: { lastUpdate: null, status: 'idle', loading: false },
    fx: { lastUpdate: null, status: 'idle', loading: false },
    marketSummary: { lastUpdate: null, status: 'idle', loading: false },
    history: { lastUpdate: null, status: 'idle', loading: false }
  });

  const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // --- Funciones de métricas ---
  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const [activeUsers, recentErrors, resourceUsage, apiCalls, servicesStatus] = await Promise.all([
        apiClient.get(`/admin/dashboard/active-users`),
        apiClient.get(`/admin/dashboard/recent-errors`),
        apiClient.get(`/admin/dashboard/resource-usage`),
        apiClient.get(`/admin/dashboard/api-calls`),
        apiClient.get(`/admin/dashboard/services-status`)
      ]);
      setMetrics({
        activeUsers: activeUsers.data.activeUsers,
        recentErrors: recentErrors.data.errors,
        resourceUsage: resourceUsage.data.usage,
        apiCalls: apiCalls.data.calls,
        servicesStatus: servicesStatus.data
      });
    } catch (err) {
      setMetrics({});
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchTouchLogs = async () => {
    setTouchLogsLoading(true);
    try {
      const res = await apiClient.get(`/admin/dashboard/touch-logs`);
      setTouchLogsEntries(res.data.entries || []);
    } catch (e) {
      setTouchLogsEntries([]);
    } finally { setTouchLogsLoading(false); }
  };

  // --- Funciones de Market Summary ---
  const refreshSummary = async (force=false) => {
    setSummaryLoading(true); 
    setSummaryMsg('');
    setApiStatus(prev => ({ ...prev, marketSummary: { ...prev.marketSummary, loading: true } }));
    try {
      const { data } = await axios.get(`${API_BASE}/market-summary${force ? '?force=1':''}`, { withCredentials: true });
      setSummary(data);
      setSummaryMsg(force ? '✅ Refrescado manualmente' : '');
      setApiStatus(prev => ({ 
        ...prev, 
        marketSummary: { 
          lastUpdate: new Date(), 
          status: 'success', 
          loading: false 
        } 
      }));
    } catch (e) {
      setSummaryMsg('❌ Error cargando Market Summary');
      setApiStatus(prev => ({ 
        ...prev, 
        marketSummary: { 
          lastUpdate: new Date(), 
          status: 'error', 
          loading: false 
        } 
      }));
    } finally { setSummaryLoading(false); }
  };

  // --- Funciones de mailing ---
  const handleMailingConfigSave = async () => {
    setMailingLoading(true);
    setMailingMsg('');
    try {
      await apiClient.post('/mailing-config', {
        schedule: mailingSchedule,
        mailBody: mailBody
      });
      setMailingMsg('✅ Configuración guardada');
    } catch (err) {
      setMailingMsg('❌ Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setMailingLoading(false);
    }
  };

  const handleManualMailing = async () => {
    if (!window.confirm('¿Ejecutar mailing semanal ahora? Se enviará a todos los usuarios con "Recibe Mail" activado.')) return;
    setMailingLoading(true);
    setMailingMsg('');
    try {
      await apiClient.post('/admin/mailing/send-now');
      setMailingMsg('✅ Mailing ejecutado correctamente');
    } catch (err) {
      setMailingMsg('❌ Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setMailingLoading(false);
    }
  };

  // --- Funciones de usuarios ---
  const fetchUsers = async () => {
    try {
      const { data } = await apiClient.get(`/admin/users`);
      setUsers(data.users || []);
    } catch (err) {
      setError('Error cargando usuarios.');
    }
  };

  const handleApprove = async (username) => {
    try {
      await apiClient.patch(`/admin/users/${username}/approve`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al aprobar usuario.');
    }
  };

  const handleRoleChange = async (username, newRole) => {
    try {
      await apiClient.patch(`/admin/users/${username}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cambiar rol.');
    }
  };

  const handleBlockToggle = async (username, blocked) => {
    try {
      await apiClient.patch(`/admin/users/${username}/block`, { blocked });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar bloqueo.');
    }
  };

  const handleDelete = async (username) => {
    if (!window.confirm(`¿Seguro que quieres eliminar a "${username}"?`)) return;
    try {
      await apiClient.delete(`/admin/users/${username}`);
      alert(`✅ Usuario "${username}" eliminado`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar usuario.');
    }
  };

  const handleToggleWeeklyEmail = async (username, value) => {
    try {
      await apiClient.patch(`/admin/users/${username}/weekly-email`, { receiveWeeklyEmail: value });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar preferencia de email.');
    }
  };

  const fetchInvestmentsOverview = async () => {
    setOverviewLoading(true);
    try {
      const { data } = await apiClient.get('/admin/investments/overview');
      setOverview(data);
    } catch (err) {
      console.error('Error fetching overview:', err);
    } finally {
      setOverviewLoading(false);
    }
  };

  // --- Funciones de APIs ---
  const refreshPrices = async () => {
    setApiStatus(prev => ({ ...prev, prices: { ...prev.prices, loading: true } }));
    try {
      // Simular llamada a precios (en realidad se actualiza automáticamente)
      await new Promise(resolve => setTimeout(resolve, 1000));
      setApiStatus(prev => ({ 
        ...prev, 
        prices: { 
          lastUpdate: new Date(), 
          status: 'success', 
          loading: false 
        } 
      }));
    } catch (e) {
      setApiStatus(prev => ({ 
        ...prev, 
        prices: { 
          lastUpdate: new Date(), 
          status: 'error', 
          loading: false 
        } 
      }));
    }
  };

  const refreshFX = async () => {
    setApiStatus(prev => ({ ...prev, fx: { ...prev.fx, loading: true } }));
    try {
      await apiClient.get('/fx?currencies=USD,GBP');
      setApiStatus(prev => ({ 
        ...prev, 
        fx: { 
          lastUpdate: new Date(), 
          status: 'success', 
          loading: false 
        } 
      }));
    } catch (e) {
      setApiStatus(prev => ({ 
        ...prev, 
        fx: { 
          lastUpdate: new Date(), 
          status: 'error', 
          loading: false 
        } 
      }));
    }
  };

  const refreshHistory = async () => {
    setApiStatus(prev => ({ ...prev, history: { ...prev.history, loading: true } }));
    try {
      // Simular llamada a históricos
      await new Promise(resolve => setTimeout(resolve, 1500));
      setApiStatus(prev => ({ 
        ...prev, 
        history: { 
          lastUpdate: new Date(), 
          status: 'success', 
          loading: false 
        } 
      }));
    } catch (e) {
      setApiStatus(prev => ({ 
        ...prev, 
        history: { 
          lastUpdate: new Date(), 
          status: 'error', 
          loading: false 
        } 
      }));
    }
  };

  const handleLogout = async () => {
    try { await authAPI.logout(); } catch (_) {}
    sessionStorage.clear();
    navigate('/');
  };

  // --- Efectos iniciales ---
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { refreshSummary(false); }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSummary(false);
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    apiClient.get(`/mailing-config`)
      .then(res => {
        if (res.data?.schedule) {
          const sched = res.data.schedule;
          if (Array.isArray(sched.weekdays)) {
            setMailingSchedule({ weekdays: sched.weekdays, hour: sched.hour });
          } else if (typeof sched.weekday === 'number') {
            setMailingSchedule({ weekdays: [sched.weekday], hour: sched.hour });
          }
        }
        if (typeof res.data?.mailBody === 'string' && res.data.mailBody.trim() !== '') {
          setMailBody(res.data.mailBody);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    apiClient.get(`/admin-only`)
      .then(res => {
        const u = res?.data?.username || res?.data?.maskedEmail || res?.data?.uid;
        if (!u) throw new Error('missing user id');
        setAuth({ username: u });
        setMessage(res.data.message || 'Bienvenido admin');
        fetchUsers();
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Acceso denegado');
      })
      .finally(() => setLoading(false));
  }, []);

  // --- Helpers ---
  const formatPct = v => v == null ? '-' : (v * 100).toFixed(2) + '%';
  const formatCap = v => {
    if (v == null || isNaN(v)) return '-';
    if (v >= 1e12) return '€' + (v/1e12).toFixed(2) + 'T';
    if (v >= 1e9) return '€' + (v/1e9).toFixed(2) + 'B';
    if (v >= 1e6) return '€' + (v/1e6).toFixed(2) + 'M';
    if (v >= 1e3) return '€' + (v/1e3).toFixed(1) + 'K';
    return '€' + v.toFixed(2);
  };
  const colorClass = v => v == null ? 'text-gray-600' : v > 0 ? 'text-green-600' : v < 0 ? 'text-red-600' : 'text-gray-600';

  if (loading) return <p className="text-center mt-10">Cargando...</p>;
  if (error || !auth.username) return <p className="text-center mt-10 text-sm text-gray-600">Verificando acceso de administrador...</p>;

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administrador</h1>
          <p className="text-gray-600 mt-1">{message}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Tabs de navegación */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
            { id: 'market', label: '📈 Market Summary', icon: '📈' },
            { id: 'apis', label: '📡 APIs', icon: '📡' },
            { id: 'mailing', label: '✉️ Mailing', icon: '✉️' },
            { id: 'users', label: '👥 Usuarios', icon: '👥' },
            { id: 'investments', label: '📒 Inversiones', icon: '📒' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de las pestañas */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Métricas en tiempo real */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-blue-600 text-xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metricsLoading ? '...' : metrics.activeUsers ?? '0'}
                  </p>
                  <p className="text-xs text-gray-500">últimos 10 min</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Errores Recientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metricsLoading ? '...' : metrics.recentErrors?.length ?? '0'}
                  </p>
                  <p className="text-xs text-gray-500">últimas 24h</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-green-600 text-xl">🔄</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Llamadas API</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metricsLoading ? '...' : metrics.apiCalls?.length ?? '0'}
                  </p>
                  <p className="text-xs text-gray-500">recientes</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-purple-600 text-xl">💾</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Memoria</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metricsLoading ? '...' : metrics.resourceUsage?.memory?.rss ? 
                      `${(metrics.resourceUsage.memory.rss/1048576).toFixed(1)} MB` : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">RSS</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estado de servicios */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Estado de Servicios</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.servicesStatus && Object.entries(metrics.servicesStatus).map(([service, status]) => (
                <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium capitalize">{service}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {status === 'ok' ? '✅ OK' : '❌ Error'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Touch Logs */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Touch Logs (Clientes)</h3>
              <button 
                onClick={fetchTouchLogs} 
                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Actualizar
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {touchLogsLoading ? (
                <p className="text-gray-500">Cargando...</p>
              ) : touchLogsEntries.length === 0 ? (
                <p className="text-gray-500">No hay logs disponibles</p>
              ) : (
                <div className="space-y-3">
                  {touchLogsEntries.map((entry, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700">
                        {entry.receivedAt} — {entry.count} eventos
                      </div>
                      {entry.logs && entry.logs.slice(0, 5).map((log, i) => (
                        <div key={i} className="text-xs text-gray-600 mt-1">
                          {new Date(log.t).toLocaleTimeString()} — {log.type} — {log.target}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'market' && (
        <div className="space-y-6">


          {/* Market Summary Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">📊 Market Summary</h3>
              {(summary?.updatedAt || summaryMsg) && (
                <div className="text-sm text-gray-600">
                  {summary?.updatedAt && (
                    <span className="mr-4">
                      Último update: {new Date(summary.updatedAt).toLocaleString('es-ES')}
                      {summaryLoading && <span className="ml-1 text-blue-500">🔄</span>}
                    </span>
                  )}
                  {summaryMsg && <span className="text-green-600">{summaryMsg}</span>}
                </div>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Asset</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 border-b">Price</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 border-b">Mkt Cap</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 border-b">7d</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 border-b">30d</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 border-b">1y</th>
                  </tr>
                </thead>
                <tbody>
                  {!summary?.assets?.length ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        Sin datos disponibles
                      </td>
                    </tr>
                  ) : (
                    summary.assets.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50 border-b">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{a.label || a.id}</div>
                          <div className="text-sm text-gray-500">{a.type}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {a.price != null ? (
                            <div>
                              <div className="font-medium">
                                {a.price.toLocaleString('es-ES', { 
                                  style: 'currency', 
                                  currency: 'EUR', 
                                  minimumFractionDigits: 2, 
                                  maximumFractionDigits: 2 
                                })}
                              </div>
                              {a.priceMeta?.provider && (
                                <div className="text-xs text-gray-500">
                                  {a.priceMeta.source === 'cache' ? 'cache / ' : ''}{a.priceMeta.provider}
                                </div>
                              )}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {a.marketCap != null ? formatCap(a.marketCap) : '-'}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${colorClass(a.changes?.['7d'])}`}>
                          {formatPct(a.changes?.['7d'])}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${colorClass(a.changes?.['30d'])}`}>
                          {formatPct(a.changes?.['30d'])}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${colorClass(a.changes?.['1y'])}`}>
                          {formatPct(a.changes?.['1y'])}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
             )}

                   {activeTab === 'apis' && (
              <div className="space-y-6">


                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-6">📡 Estado de APIs</h3>
             
             <div className="space-y-4">
               {/* Precios */}
               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                 <div className="flex items-center space-x-3">
                   <div className="p-2 bg-blue-100 rounded-lg">
                     <span className="text-blue-600 text-lg">💰</span>
                   </div>
                   <div>
                     <h4 className="font-medium text-gray-900">Llamada de Precios de Assets</h4>
                     <p className="text-sm text-gray-600">
                       Auto-refresh cada 120s • TTL: 15 min • Frescura: 5 min
                     </p>
                     {apiStatus.prices.lastUpdate && (
                       <p className="text-xs text-gray-500">
                         Último update: {apiStatus.prices.lastUpdate.toLocaleTimeString('es-ES')}
                       </p>
                     )}
                   </div>
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                     apiStatus.prices.status === 'success' ? 'bg-green-100 text-green-800' :
                     apiStatus.prices.status === 'error' ? 'bg-red-100 text-red-800' :
                     'bg-gray-100 text-gray-600'
                   }`}>
                     {apiStatus.prices.status === 'success' ? '✅ OK' :
                      apiStatus.prices.status === 'error' ? '❌ Error' : '⏳ Idle'}
                   </span>
                   <button
                     onClick={refreshPrices}
                     disabled={apiStatus.prices.loading}
                     className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                   >
                     {apiStatus.prices.loading ? '🔄' : '🔄 Forzar'}
                   </button>
                 </div>
               </div>

               {/* FX Rates */}
               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                 <div className="flex items-center space-x-3">
                   <div className="p-2 bg-green-100 rounded-lg">
                     <span className="text-green-600 text-lg">🌍</span>
                   </div>
                   <div>
                     <h4 className="font-medium text-gray-900">Llamada de FX</h4>
                     <p className="text-sm text-gray-600">
                       Auto-refresh cada 200s • TTL: 1 hora
                     </p>
                     {apiStatus.fx.lastUpdate && (
                       <p className="text-xs text-gray-500">
                         Último update: {apiStatus.fx.lastUpdate.toLocaleTimeString('es-ES')}
                       </p>
                     )}
                   </div>
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                     apiStatus.fx.status === 'success' ? 'bg-green-100 text-green-800' :
                     apiStatus.fx.status === 'error' ? 'bg-red-100 text-red-800' :
                     'bg-gray-100 text-gray-600'
                   }`}>
                     {apiStatus.fx.status === 'success' ? '✅ OK' :
                      apiStatus.fx.status === 'error' ? '❌ Error' : '⏳ Idle'}
                   </span>
                   <button
                     onClick={refreshFX}
                     disabled={apiStatus.fx.loading}
                     className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                   >
                     {apiStatus.fx.loading ? '🔄' : '🔄 Forzar'}
                   </button>
                 </div>
               </div>

               {/* Market Summary */}
               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                 <div className="flex items-center space-x-3">
                   <div className="p-2 bg-purple-100 rounded-lg">
                     <span className="text-purple-600 text-lg">📊</span>
                   </div>
                   <div>
                     <h4 className="font-medium text-gray-900">Llamada de Market Summary</h4>
                     <p className="text-sm text-gray-600">
                       Auto-refresh cada 5 min • TTL backend: 1 hora
                     </p>
                     {apiStatus.marketSummary.lastUpdate && (
                       <p className="text-xs text-gray-500">
                         Último update: {apiStatus.marketSummary.lastUpdate.toLocaleTimeString('es-ES')}
                       </p>
                     )}
                   </div>
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                     apiStatus.marketSummary.status === 'success' ? 'bg-green-100 text-green-800' :
                     apiStatus.marketSummary.status === 'error' ? 'bg-red-100 text-red-800' :
                     'bg-gray-100 text-gray-600'
                   }`}>
                     {apiStatus.marketSummary.status === 'success' ? '✅ OK' :
                      apiStatus.marketSummary.status === 'error' ? '❌ Error' : '⏳ Idle'}
                   </span>
                   <div className="flex items-center space-x-2">
                     <button
                       onClick={() => refreshSummary(true)}
                       disabled={apiStatus.marketSummary.loading}
                       className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors"
                     >
                       {apiStatus.marketSummary.loading ? '🔄' : '🔄 Forzar'}
                     </button>
                     <button
                       onClick={async () => {
                         try {
                           await axios.post(`${API_BASE}/market-summary/clear-cache`, {}, { withCredentials: true });
                           setSummaryMsg('✅ Cache limpiado. Próximo refresh usará nuevo TTL.');
                           setTimeout(() => refreshSummary(true), 1000);
                         } catch (e) {
                           setSummaryMsg('❌ Error limpiando cache');
                         }
                       }}
                       className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                     >
                       🗑️ Limpiar Cache
                     </button>
                   </div>
                 </div>
               </div>

               {/* Históricos */}
               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                 <div className="flex items-center space-x-3">
                   <div className="p-2 bg-orange-100 rounded-lg">
                     <span className="text-orange-600 text-lg">📈</span>
                   </div>
                   <div>
                     <h4 className="font-medium text-gray-900">Llamada de Históricos</h4>
                     <p className="text-sm text-gray-600">
                       Auto-refresh cada 200s • TTL: 24 horas • Dashboard2
                     </p>
                     {apiStatus.history.lastUpdate && (
                       <p className="text-xs text-gray-500">
                         Último update: {apiStatus.history.lastUpdate.toLocaleTimeString('es-ES')}
                       </p>
                     )}
                   </div>
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                     apiStatus.history.status === 'success' ? 'bg-green-100 text-green-800' :
                     apiStatus.history.status === 'error' ? 'bg-red-100 text-red-800' :
                     'bg-gray-100 text-gray-600'
                   }`}>
                     {apiStatus.history.status === 'success' ? '✅ OK' :
                      apiStatus.history.status === 'error' ? '❌ Error' : '⏳ Idle'}
                   </span>
                   <button
                     onClick={refreshHistory}
                     disabled={apiStatus.history.loading}
                     className="px-3 py-1 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 disabled:opacity-60 transition-colors"
                   >
                     {apiStatus.history.loading ? '🔄' : '🔄 Forzar'}
                   </button>
                 </div>
               </div>
             </div>

             <div className="mt-6 p-4 bg-blue-50 rounded-lg">
               <h4 className="font-medium text-blue-900 mb-2">💡 Información</h4>
               <ul className="text-sm text-blue-800 space-y-1">
                 <li>• <strong>Precios de Assets:</strong> Se actualizan automáticamente cada 120 segundos (2 minutos)</li>
                 <li>• <strong>FX:</strong> Se actualizan automáticamente cada 200 segundos</li>
                 <li>• <strong>Market Summary:</strong> Se actualiza automáticamente cada 5 minutos</li>
                 <li>• <strong>Históricos:</strong> Se actualizan automáticamente cada 200 segundos en Dashboard2</li>
                 <li>• Los botones "Forzar" permiten actualizar inmediatamente cada API</li>
               </ul>
             </div>
           </div>
         </div>
       )}

       {activeTab === 'mailing' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-6">✉️ Configuración de Mailing Semanal</h3>
          
          <div className="space-y-6">
            {/* Configuración de días y hora */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-3">Días de envío:</label>
                <div className="flex flex-wrap gap-2">
                  {weekdays.map((label, idx) => {
                    const active = mailingSchedule.weekdays.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setMailingSchedule(s => {
                          const set = new Set(s.weekdays);
                          if (set.has(idx)) {
                            set.delete(idx);
                          } else {
                            set.add(idx);
                          }
                          if (set.size === 0) set.add(idx);
                          return { ...s, weekdays: Array.from(set).sort((a,b)=>a-b) };
                        })}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          active 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {label.slice(0,3)}
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-500 mt-2">Haz click para seleccionar múltiples días</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Hora de envío:</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={mailingSchedule.hour}
                    onChange={e => setMailingSchedule(s => ({ 
                      ...s, 
                      hour: Math.max(0, Math.min(23, Number(e.target.value))) 
                    }))}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="text-sm text-gray-600">:00h (0-23)</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Configuración actual: {mailingSchedule.weekdays.map(d => weekdays[d]).join(', ')} a las {mailingSchedule.hour}:00h
                </p>
              </div>
            </div>

            {/* Cuerpo del mail */}
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="mailBody">
                Cuerpo del mail:
              </label>
              <textarea
                id="mailBody"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[120px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={mailBody}
                onChange={e => setMailBody(e.target.value)}
                placeholder="Texto del cuerpo del mail..."
                disabled={mailingLoading}
              />
              <p className="text-sm text-gray-500 mt-1">
                Usa {'{username}'} para insertar el nombre del usuario
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={handleMailingConfigSave}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                disabled={mailingLoading}
              >
                💾 Guardar Configuración
              </button>
              <button
                onClick={handleManualMailing}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                disabled={mailingLoading}
              >
                📤 Ejecutar Mailing Ahora
              </button>
            </div>

            {mailingMsg && (
              <div className={`p-3 rounded-lg ${
                mailingMsg.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {mailingMsg}
              </div>
            )}

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              💡 El mailing se enviará automáticamente a todos los usuarios con "Recibe Mail" activado en los días y hora configurados.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">👥 Gestión de Usuarios</h3>
            
            {/* Tabla de usuarios */}
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Usuario</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Rol</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Creado</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Último Login</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">Recibe Mail</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        No hay usuarios disponibles
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u._id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{u.username}</div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            disabled={u.username === 'admin'}
                            onChange={e => handleRoleChange(u.username, e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="admin">Admin</option>
                            <option value="user">Usuario</option>
                            <option value="readonly">Solo Lectura</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {u.username !== 'admin' ? (
                            <button
                              onClick={() => handleBlockToggle(u.username, !u.blocked)}
                              className={`px-3 py-1 text-xs rounded-full font-medium ${
                                u.blocked 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {u.blocked ? '🚫 Bloqueado' : '✅ Activo'}
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(u.createdAt).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('es-ES') : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={!!u.receiveWeeklyEmail}
                            onChange={() => handleToggleWeeklyEmail(u.username, !u.receiveWeeklyEmail)}
                            disabled={u.username === 'admin'}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {u.username !== 'admin' && (
                            <div className="flex space-x-1">
                              {!u.approved && (
                                <button 
                                  onClick={() => handleApprove(u.username)} 
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 transition-colors"
                                >
                                  ✅
                                </button>
                              )}
                              <button 
                                onClick={() => handleDelete(u.username)} 
                                className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded hover:bg-red-200 transition-colors"
                                title="Eliminar usuario"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'investments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">📒 Overview de Inversiones</h3>
              <button 
                onClick={fetchInvestmentsOverview} 
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                disabled={overviewLoading}
              >
                {overviewLoading ? '🔄 Cargando…' : '📊 Cargar/Refrescar'}
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Listado plano con precio actual, fuente, FX y mini histórico (7d).
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b">Usuario</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b">Grupo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b">ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b">Tipo</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 border-b">Precio (EUR)</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b">Moneda</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b">Fuente</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b">FX</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.rows.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-3 py-8 text-center text-gray-500">
                        {overviewLoading ? 'Cargando…' : 'Sin datos'}
                      </td>
                    </tr>
                  ) : (
                    overview.rows.map((r, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm font-medium">{r.user}</td>
                        <td className="px-3 py-2 text-sm text-gray-600">{r.group}</td>
                        <td className="px-3 py-2 text-sm text-gray-600">{r.id}</td>
                        <td className="px-3 py-2 text-sm text-gray-600">{r.type}</td>
                        <td className="px-3 py-2 text-sm text-right font-medium">
                          {r.priceEUR != null ? 
                            r.priceEUR.toLocaleString('es-ES', { 
                              style: 'currency', 
                              currency: 'EUR', 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            }) : '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600">{r.currency || '-'}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {r.priceMeta ? `${r.priceMeta.source || '-'}${r.priceMeta.provider ? ' / ' + r.priceMeta.provider : ''}` : '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600">
                          {r.fx ? r.fx.rate?.toFixed(4) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="text-sm text-gray-600 mt-4">
              Total: {overview.count} inversiones
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
