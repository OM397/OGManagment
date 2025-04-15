// 📁 frontend/features/admin/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Login from '../auth/Login';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../shared/config';

export default function AdminPanel() {
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

  if (loading) return <p className="text-center mt-10">Cargando...</p>;
  if (error || !auth.username) return <Login onLogin={() => navigate('/admin')} />;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Panel de Administrador</h1>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
        >
          Cerrar sesión
        </button>
      </div>

      <p className="bg-green-100 border border-green-300 text-green-800 p-4 rounded mb-6">
        {message}
      </p>

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
