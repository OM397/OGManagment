// 📁 frontend/features/admin/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Login from '../auth/Login';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../shared/config';

export default function AdminPanel() {
  // --- Métricas en tiempo real ---
  const [metrics, setMetrics] = useState({});
  const [metricsLoading, setMetricsLoading] = useState(true);
  // Touch logs from mobile clients
  const [touchLogsEntries, setTouchLogsEntries] = useState([]);
  const [touchLogsLoading, setTouchLogsLoading] = useState(false);
  // Refactor: export fetchMetrics for manual refresh
  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const [activeUsers, recentErrors, resourceUsage, apiCalls, servicesStatus] = await Promise.all([
        axios.get(`${API_BASE}/admin/dashboard/active-users`, { withCredentials: true }),
        axios.get(`${API_BASE}/admin/dashboard/recent-errors`, { withCredentials: true }),
        axios.get(`${API_BASE}/admin/dashboard/resource-usage`, { withCredentials: true }),
        axios.get(`${API_BASE}/admin/dashboard/api-calls`, { withCredentials: true }),
        axios.get(`${API_BASE}/admin/dashboard/services-status`, { withCredentials: true })
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
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000); // refresca cada 15s
    return () => clearInterval(interval);
  }, []);

  const fetchTouchLogs = async () => {
    setTouchLogsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/dashboard/touch-logs`, { withCredentials: true });
      setTouchLogsEntries(res.data.entries || []);
    } catch (e) {
      setTouchLogsEntries([]);
    } finally { setTouchLogsLoading(false); }
  };
  // --- Mailing Config State ---
  // Ahora soporta múltiples días: schedule.weekdays (array de números 0-6) y hour
  const [mailingSchedule, setMailingSchedule] = useState({ weekdays: [0], hour: 10 });
  // Mensaje predeterminado del cuerpo del mail
  const defaultMailBody = 'Hola {username},\n\nEste es tu resumen semanal de inversiones.';
  const [mailBody, setMailBody] = useState(defaultMailBody);
  const [mailingLoading, setMailingLoading] = useState(false);
  const [mailingMsg, setMailingMsg] = useState('');
  // --- Scripts Config State ---
  const [assetInterval, setAssetInterval] = useState(() => Number(localStorage.getItem('assetListIntervalMs')) || 120000);
  const [summaryInterval, setSummaryInterval] = useState(() => Number(localStorage.getItem('marketSummaryIntervalMs')) || (12*60*60*1000));
  const [summaryAutoTs, setSummaryAutoTs] = useState(Date.now());
  // --- Market Summary State ---
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryMsg, setSummaryMsg] = useState('');

  const weekdays = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ];

  // Fetch current mailing config
  useEffect(() => {
    axios.get(`${API_BASE}/mailing-config`, { withCredentials: true })
      .then(res => {
        if (res.data?.schedule) {
          // Normalizar: si viniera legacy (weekday) migrar a weekdays
            const sched = res.data.schedule;
            if (Array.isArray(sched.weekdays)) {
              setMailingSchedule({ weekdays: sched.weekdays, hour: sched.hour });
            } else if (typeof sched.weekday === 'number') {
              setMailingSchedule({ weekdays: [sched.weekday], hour: sched.hour });
            }
        }
        if (typeof res.data?.mailBody === 'string' && res.data.mailBody.trim() !== '') {
          setMailBody(res.data.mailBody);
        } else {
          setMailBody(defaultMailBody);
        }
      })
      .catch(() => {
        setMailBody(defaultMailBody);
      });
  }, []);

  const handleMailingConfigSave = async () => {
    setMailingLoading(true);
    setMailingMsg('');
    try {
  await axios.post(`${API_BASE}/mailing-config`, { weekdays: mailingSchedule.weekdays, hour: mailingSchedule.hour, mailBody }, { withCredentials: true });
      setMailingMsg('✅ Configuración guardada');
    } catch (err) {
      setMailingMsg('❌ Error al guardar la configuración');
    } finally {
      setMailingLoading(false);
    }
  };

  const handleManualMailing = async () => {
    setMailingLoading(true);
    setMailingMsg('');
    try {
      await axios.post(`${API_BASE}/admin/manual-mailing`, {}, { withCredentials: true });
      setMailingMsg('✅ Mailing ejecutado manualmente');
    } catch (err) {
      setMailingMsg('❌ Error al ejecutar el mailing');
    } finally {
      setMailingLoading(false);
    }
  };
  // Helpers & handlers Market Summary
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
  const refreshSummary = async (force=false) => {
    setSummaryLoading(true); setSummaryMsg('');
    try {
      const { data } = await axios.get(`${API_BASE}/market-summary${force ? '?force=1':''}`, { withCredentials: true });
      setSummary(data);
      setSummaryMsg(force ? '✅ Refrescado manualmente' : '');
    } catch (e) {
      setSummaryMsg('❌ Error cargando Market Summary');
    } finally { setSummaryLoading(false); }
  };
  useEffect(() => { refreshSummary(false); }, []); // cargar cache actual
  // Eliminar auto-refresh de Market Summary (solo manual ahora)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [auth, setAuth] = useState({ username: '' });
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/admin/users`, { withCredentials: true });
      setUsers(data.users || []);
    } catch (err) {
      setError('Error cargando usuarios.');
    }
  };

  const handleApprove = async (username) => {
    try {
      await axios.patch(`${API_BASE}/admin/users/${username}/approve`, {}, { withCredentials: true });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al aprobar usuario.');
    }
  };

  const handleRoleChange = async (username, newRole) => {
    try {
      const res = await axios.patch(`${API_BASE}/admin/users/${username}/role`, { role: newRole }, { withCredentials: true });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cambiar el rol.');
    }
  };

  const handleBlockToggle = async (username, blocked) => {
    try {
      await axios.patch(`${API_BASE}/admin/users/${username}/block`, { blocked }, { withCredentials: true });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar bloqueo.');
    }
  };

  const handleDelete = async (username) => {
    if (!window.confirm(`¿Seguro que quieres eliminar a "${username}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/admin/users/${username}`, { withCredentials: true });
      alert(`✅ Usuario "${username}" eliminado`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar usuario.');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/logout`, {}, { withCredentials: true });
    } catch (_) {}
    localStorage.clear();
    sessionStorage.clear();
    navigate('/');
  };

  useEffect(() => {
    axios.get(`${API_BASE}/admin-only`, { withCredentials: true })
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



  // Cambiar preferencia de recibir mail semanal
  const handleToggleWeeklyEmail = async (username, value) => {
    try {
      await axios.patch(`${API_BASE}/admin/users/${username}/weekly-email`, { receiveWeeklyEmail: value }, { withCredentials: true });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al actualizar preferencia de email.');
    }
  };

  if (loading) return <p className="text-center mt-10">Cargando...</p>;
  if (error || !auth.username) return <p className="text-center mt-10 text-sm text-gray-600">Verificando acceso de administrador...</p>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header: Título a la izq, botón a la der */}
      <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex-shrink-0">Panel de Administrador</h1>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
        >
          Cerrar sesión
        </button>
      </div>
      {/* Mensaje de bienvenida debajo del header */}
      <div className="mb-4">
        <p className="bg-green-100 border border-green-300 text-green-800 p-3 rounded text-sm md:text-base min-w-[280px] text-center mb-0">
          {message}
        </p>
      </div>
      <h2 className="text-lg font-semibold mb-2">⚙️ Scripts</h2>
      <div className="mb-8 p-4 border rounded bg-gray-50 space-y-6">
        {/* Métricas en tiempo real */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded shadow p-4 flex flex-col items-center">
            <div className="text-2xl font-bold text-blue-700">{metricsLoading ? '...' : metrics.activeUsers ?? '-'}</div>
            <div className="text-sm text-gray-600 mt-1">Usuarios activos (últimos 10 min)</div>
          </div>
          <div className="bg-white rounded shadow p-4 flex flex-col">
            <div className="font-semibold text-gray-800 mb-2">Errores recientes</div>
            <div className="overflow-y-auto max-h-24 text-xs text-red-700">
              {metricsLoading ? '...' : (metrics.recentErrors?.length ? metrics.recentErrors.slice(0,5).map((e,i)=>(<div key={i}>{e}</div>)) : 'Sin errores')}
            </div>
          </div>
          <div className="bg-white rounded shadow p-4 flex flex-col">
            <div className="font-semibold text-gray-800 mb-2">Uso de recursos</div>
            <div className="text-xs text-gray-700">
              {metricsLoading ? '...' : metrics.resourceUsage ? (
                <>
                  <div>Memoria: {(metrics.resourceUsage.memory?.rss/1048576).toFixed(1)} MB</div>
                  <div>CPU: {Array.isArray(metrics.resourceUsage.cpu) ? metrics.resourceUsage.cpu.map(v=>v.toFixed(2)).join(', ') : '-'}</div>
                  <div>Uptime: {metrics.resourceUsage.uptime ? (metrics.resourceUsage.uptime/60).toFixed(1)+' min' : '-'}</div>
                </>
              ) : 'Sin datos'}
            </div>
          </div>
          <div className="bg-white rounded shadow p-4 flex flex-col md:col-span-2">
            <div className="font-semibold text-gray-800 mb-2">Llamadas a APIs recientes</div>
            <div className="overflow-y-auto max-h-24 text-xs text-blue-700">
              {metricsLoading ? '...' : (metrics.apiCalls?.length ? metrics.apiCalls.slice(0,5).map((c,i)=>(<div key={i}>{c}</div>)) : 'Sin llamadas')}
            </div>
          </div>
          <div className="bg-white rounded shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-800">Touch logs (clients)</div>
              <div>
                <button onClick={fetchTouchLogs} className="px-2 py-1 bg-indigo-600 text-white text-xs rounded">Refresh</button>
              </div>
            </div>
            <div className="text-xs text-gray-700 max-h-24 overflow-y-auto">
              {touchLogsLoading ? 'Cargando...' : (
                touchLogsEntries.length === 0 ? <div className="text-gray-500">No hay logs</div> : (
                  touchLogsEntries.map((entry, idx) => (
                    <div key={idx} className="mb-2 border-b pb-1">
                      <div className="text-[11px] text-gray-600">{entry.receivedAt} — {entry.count} events</div>
                      <div className="text-[11px] text-gray-800 max-h-20 overflow-auto">
                        {entry.logs && entry.logs.slice(0,10).map((l,i)=>(
                          <div key={i} className="text-[11px] text-gray-700">{new Date(l.t).toLocaleTimeString()} — {l.type} — {l.target} — {l.path}</div>
                        ))}
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
          <div className="bg-white rounded shadow p-4 flex flex-col md:col-span-1">
            <div className="font-semibold text-gray-800 mb-2">Estado de servicios</div>
            <div className="text-xs">
              {metricsLoading ? '...' : metrics.servicesStatus ? (
                <>
                  <div>Redis: <span className={metrics.servicesStatus.redis==='ok'?'text-green-600':'text-red-600'}>{metrics.servicesStatus.redis}</span></div>
                  <div>MongoDB: <span className={metrics.servicesStatus.mongo==='ok'?'text-green-600':'text-red-600'}>{metrics.servicesStatus.mongo}</span></div>
                  <div>Mailing: <span className={metrics.servicesStatus.mailing==='ok'?'text-green-600':'text-red-600'}>{metrics.servicesStatus.mailing}</span></div>
                </>
              ) : 'Sin datos'}
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Intervalo Asset List (ms)</label>
            <input type="number" min={15000} max={1800000} step={5000} value={assetInterval}
              onChange={e=>setAssetInterval(Number(e.target.value))}
              className="border rounded w-full px-2 py-1 text-sm"/>
            <div className="text-[11px] text-gray-500 mt-1">Rango 15s - 30m. Actual: {(assetInterval/1000).toFixed(0)}s</div>
          </div>
          <div className="md:col-span-2 flex flex-col gap-2 items-end justify-end">
            <button
              onClick={async () => {
                setSummaryLoading(true);
                setMetricsLoading(true);
                await Promise.all([
                  fetchMetrics(),
                  refreshSummary(true)
                ]);
                setSummaryLoading(false);
                setMetricsLoading(false);
                setSummaryMsg('✅ Refrescado Market Summary y métricas');
              }}
              disabled={summaryLoading || metricsLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-60"
            >{summaryLoading || metricsLoading ? 'Actualizando…' : 'Refrescar'}</button>
          </div>
        </div>
        <div className="text-[11px] text-gray-500">El botón refresca métricas y precios de la tabla Market Summary (forzado).</div>

        {/* Vista embebida de Market Summary */}
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">📊 Market Summary (Vista)</h3>
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
            <p className="text-xs text-gray-600 flex-1">El botón "Refrescar" fuerza precios y métricas actualizadas.</p>
            <button
              onClick={async () => {
                setSummaryLoading(true);
                setMetricsLoading(true);
                await Promise.all([
                  fetchMetrics(),
                  refreshSummary(true)
                ]);
                setSummaryLoading(false);
                setMetricsLoading(false);
                setSummaryMsg('\u2705 Refrescado Market Summary y métricas');
                setTimeout(() => { window.location.reload(); }, 500);
              }}
              disabled={summaryLoading || metricsLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-60"
            >{summaryLoading || metricsLoading ? 'Actualizando…' : 'Refrescar'}</button>
          </div>
          {(summary?.updatedAt || summaryMsg) && (
            <div className="text-xs text-gray-700 mb-2 flex flex-wrap gap-4">
              {summary?.updatedAt && <span>Último update: {new Date(summary.updatedAt).toLocaleString()}</span>}
              {summary?.nextUpdate && <span>Próximo estimado: {new Date(summary.nextUpdate).toLocaleString()}</span>}
              {summaryMsg && <span>{summaryMsg}</span>}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-[620px] text-xs border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Asset</th>
                  <th className="p-2 border text-right">Price</th>
                  <th className="p-2 border text-right">Mkt Cap</th>
                  <th className="p-2 border text-right">7d</th>
                  <th className="p-2 border text-right">30d</th>
                  <th className="p-2 border text-right">1y</th>
                </tr>
              </thead>
              <tbody>
                {!summary?.assets?.length && <tr><td colSpan="6" className="p-3 text-center text-gray-500">Sin datos aún.</td></tr>}
                {summary?.assets?.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{a.label || a.id}</td>
                    <td className="p-2 border text-right">{a.price != null ? a.price.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits:2, maximumFractionDigits:2 }) : '-'}</td>
                    <td className="p-2 border text-right">{a.marketCap != null ? formatCap(a.marketCap) : '-'}</td>
                    <td className={`p-2 border text-right ${colorClass(a.changes?.['7d'])}`}>{formatPct(a.changes?.['7d'])}</td>
                    <td className={`p-2 border text-right ${colorClass(a.changes?.['30d'])}`}>{formatPct(a.changes?.['30d'])}</td>
                    <td className={`p-2 border text-right ${colorClass(a.changes?.['1y'])}`}>{formatPct(a.changes?.['1y'])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mailing Config Title */}
      <h2 className="text-lg font-semibold mb-2">✉️ Configuración de Mailing Semanal</h2>
      {/* Mailing Config Panel */}
      <div className="mb-8 p-4 border rounded bg-gray-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-center mb-2">
          <div className="flex flex-col">
            <span className="font-medium text-sm mb-1">Días de envío:</span>
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
                      // Evitar quedar vacío: si se quita el último, mantenerlo
                      if (set.size === 0) set.add(idx);
                      return { ...s, weekdays: Array.from(set).sort((a,b)=>a-b) };
                    })}
                    className={`px-2 py-1 text-xs rounded border transition ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                  >
                    {label.slice(0,3)}
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">Haz click para seleccionar múltiples días.</div>
          </div>
          <label className="flex items-center gap-2">
            Hora:
            <input
              type="number"
              min={0}
              max={23}
              value={mailingSchedule.hour}
              onChange={e => setMailingSchedule(s => ({ ...s, hour: Math.max(0, Math.min(23, Number(e.target.value))) }))}
              className="border rounded px-2 py-1 w-16"
            />
            <span className="text-xs text-gray-500">(0-23h)</span>
          </label>
        </div>
        <div className="text-xs text-gray-600 mb-2">Configuración actual: {mailingSchedule.weekdays.map(d => weekdays[d]).join(', ')} a las {mailingSchedule.hour}:00h</div>
        {/* Cuerpo del mail */}
        <div className="w-full mt-4">
          <label className="block font-medium mb-1" htmlFor="mailBody">Cuerpo del mail:</label>
          <textarea
            id="mailBody"
            className="w-full border rounded px-2 py-1 min-h-[80px]"
            value={mailBody}
            onChange={e => setMailBody(e.target.value)}
            placeholder="Texto del cuerpo del mail..."
            disabled={mailingLoading}
          />
        </div>
        {/* Botones alineados a la derecha debajo del textarea */}
        <div className="w-full flex justify-end gap-4 mt-4">
          <button
            onClick={handleMailingConfigSave}
            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
            disabled={mailingLoading}
          >
            Guardar configuración
          </button>
          <button
            onClick={handleManualMailing}
            className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
            disabled={mailingLoading}
          >
            Ejecutar mailing ahora
          </button>
        </div>
        {mailingMsg && <div className="text-sm mt-2">{mailingMsg}</div>}
        <div className="text-xs text-gray-500 mt-1">El mailing se enviará a todos los usuarios con "Recibe Mail" activado.</div>
      </div>

  {/* (Se eliminó la sección separada de Market Summary; ahora está dentro de Scripts) */}

      <h2 className="text-xl font-semibold mb-2">👥 Usuarios Registrados</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full hidden md:table border text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Usuario</th>
              <th className="p-2 border">Rol</th>
              <th className="p-2 border">Bloqueado</th>
              <th className="p-2 border">Estado</th>
              <th className="p-2 border">Creado</th>
              <th className="p-2 border">Último Login</th>
              <th className="p-2 border">Recibe Mail</th>
              <th className="p-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="6" className="p-4 text-center">No hay usuarios disponibles.</td></tr>
            ) : users.map((u) => (
              <tr key={u._id}>
                <td className="p-2 border">{u.username}</td>
                <td className="p-2 border">
                  <select
                    value={u.role}
                    disabled={u.username === 'admin'}
                    onChange={e => handleRoleChange(u.username, e.target.value)}
                    className="border rounded px-2 py-1 text-xs"
                  >
                    <option value="admin">admin</option>
                    <option value="user">user</option>
                    <option value="readonly">solo lectura</option>
                  </select>
                </td>
                <td className="p-2 border text-center">
                  {u.username !== 'admin' ? (
                    <button
                      onClick={() => handleBlockToggle(u.username, !u.blocked)}
                      className={`text-xs px-2 py-1 rounded border ${u.blocked ? 'bg-red-100 text-red-800 border-red-300' : 'bg-green-100 text-green-800 border-green-300'}`}
                    >
                      {u.blocked ? 'Bloqueado' : 'Activo'}
                    </button>
                  ) : '—'}
                </td>
                <td className="p-2 border">
                  {u.approved ? (
                    <span className="text-green-600">Aprobado</span>
                  ) : (
                    <span className="text-yellow-600">Pendiente</span>
                  )}
                </td>
                <td className="p-2 border">{new Date(u.createdAt).toLocaleString()}</td>
                <td className="p-2 border">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '—'}</td>
                <td className="p-2 border text-center">
                  <input
                    type="checkbox"
                    checked={!!u.receiveWeeklyEmail}
                    onChange={() => handleToggleWeeklyEmail(u.username, !u.receiveWeeklyEmail)}
                    disabled={u.username === 'admin'}
                  />
                </td>
                <td className="p-2 border space-x-2">
                  {u.username !== 'admin' && (
                    <>
                      {!u.approved && (
                        <button onClick={() => handleApprove(u.username)} className="text-xs bg-blue-100 text-blue-800 border border-blue-300 rounded px-2 py-1 hover:bg-blue-200">
                          Aprobar
                        </button>
                      )}
                      <button onClick={() => handleRoleToggle(u.username)} className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 rounded px-2 py-1 hover:bg-yellow-200">
                        Cambiar Rol
                      </button>
                      <button onClick={() => handleDelete(u.username)} className="text-xs bg-red-100 text-red-800 border border-red-300 rounded px-2 py-1 hover:bg-red-200">
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>

            ))}
          </tbody>


        </table>

        {/* Móvil / Responsive Lista */}
        <div className="md:hidden space-y-4">
          {users.length === 0 ? (
            <div className="text-center text-sm text-gray-600">No hay usuarios disponibles.</div>
          ) : users.map((u) => (
            <div key={u._id} className="border rounded-md p-4 shadow-sm">
              <div className="font-semibold mb-1">{u.username}</div>
              <div className="text-sm text-gray-600 mb-1">Rol: {u.role}</div>
              <div className="text-sm text-gray-600 mb-1">
                Estado: {u.approved ? <span className="text-green-600">Aprobado</span> : <span className="text-yellow-600">Pendiente</span>}
              </div>
              <div className="text-xs text-gray-500 mb-1">Creado: {new Date(u.createdAt).toLocaleString()}</div>
              <div className="text-xs text-gray-500 mb-2">Último Login: {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '—'}</div>

              {u.username !== 'admin' && (
                <div className="flex flex-wrap gap-2">
                  {!u.approved && (
                    <button onClick={() => handleApprove(u.username)} className="text-xs bg-blue-100 text-blue-800 border border-blue-300 rounded px-2 py-1 hover:bg-blue-200">
                      Aprobar
                    </button>
                  )}
                  <select
                    value={u.role}
                    disabled={u.username === 'admin'}
                    onChange={e => handleRoleChange(u.username, e.target.value)}
                    className="border rounded px-2 py-1 text-xs"
                  >
                    <option value="admin">admin</option>
                    <option value="user">user</option>
                    <option value="readonly">solo lectura</option>
                  </select>
                  <button
                    onClick={() => handleBlockToggle(u.username, !u.blocked)}
                    className={`text-xs px-2 py-1 rounded border ${u.blocked ? 'bg-red-100 text-red-800 border-red-300' : 'bg-green-100 text-green-800 border-green-300'}`}
                  >
                    {u.blocked ? 'Bloqueado' : 'Activo'}
                  </button>
                  <button onClick={() => handleDelete(u.username)} className="text-xs bg-red-100 text-red-800 border border-red-300 rounded px-2 py-1 hover:bg-red-200">
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
