// 📁 frontend/features/admin/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Login from '../auth/Login';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../shared/config';

export default function AdminPanel() {
  // --- Mailing Config State ---
  const [mailingSchedule, setMailingSchedule] = useState({ weekday: 0, hour: 10 });
  // Mensaje predeterminado del cuerpo del mail
  const defaultMailBody = 'Hola {username},\n\nEste es tu resumen semanal de inversiones.';
  const [mailBody, setMailBody] = useState(defaultMailBody);
  const [mailingLoading, setMailingLoading] = useState(false);
  const [mailingMsg, setMailingMsg] = useState('');

  const weekdays = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ];

  // Fetch current mailing config
  useEffect(() => {
    axios.get(`${API_BASE}/mailing-config`, { withCredentials: true })
      .then(res => {
        if (res.data?.schedule) setMailingSchedule(res.data.schedule);
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
      await axios.post(`${API_BASE}/mailing-config`, { ...mailingSchedule, mailBody }, { withCredentials: true });
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

  const handleRoleToggle = async (username) => {
    if (!window.confirm(`¿Deseas cambiar el rol del usuario "${username}"?`)) return;
    try {
      const res = await axios.patch(`${API_BASE}/admin/users/${username}/role`, {}, { withCredentials: true });
      alert(`✅ Rol actualizado a "${res.data.role}"`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cambiar el rol.');
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
        if (!res?.data?.username) throw new Error();
        setAuth({ username: res.data.username });
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
  if (error || !auth.username) return <Login onLogin={() => navigate('/admin')} />;

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

      {/* Mailing Config Title */}
      <h2 className="text-lg font-semibold mb-2">✉️ Configuración de Mailing Semanal</h2>
      {/* Mailing Config Panel */}
      <div className="mb-8 p-4 border rounded bg-gray-50">
        <div className="flex flex-wrap gap-4 items-center mb-2">
          <label className="flex items-center gap-2">
            Día:
            <select
              value={mailingSchedule.weekday}
              onChange={e => setMailingSchedule(s => ({ ...s, weekday: Number(e.target.value) }))}
              className="border rounded px-2 py-1"
            >
              {weekdays.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </label>
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

      <h2 className="text-xl font-semibold mb-2">👥 Usuarios Registrados</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full hidden md:table border text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Usuario</th>
              <th className="p-2 border">Rol</th>
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
                <td className="p-2 border">{u.role}</td>
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
                  <button onClick={() => handleRoleToggle(u.username)} className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 rounded px-2 py-1 hover:bg-yellow-200">
                    Cambiar Rol
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
