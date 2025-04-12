// 📁 frontend/src/features/admin/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);

  const fetchUsers = async (token) => {
    try {
      const res = await axios.get('http://localhost:3001/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.users || []);
    } catch (err) {
      setError('Error cargando usuarios');
    }
  };

  const handleRoleToggle = async (username) => {
    const token = localStorage.getItem('token');
    const confirmChange = window.confirm(`¿Deseas cambiar el rol del usuario "${username}"?`);
    if (!confirmChange) return;

    try {
      const res = await axios.patch(`http://localhost:3001/api/admin/users/${username}/role`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`✅ Rol actualizado a "${res.data.role}"`);
      fetchUsers(token);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cambiar el rol.');
    }
  };

  const handleDelete = async (username) => {
    const token = localStorage.getItem('token');
    const confirmDelete = window.confirm(`¿Seguro que quieres eliminar a "${username}"?`);
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:3001/api/admin/users/${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`✅ Usuario "${username}" eliminado`);
      fetchUsers(token);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar usuario.');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const { role, username } = jwtDecode(token);
      if (role !== 'admin') {
        setError('Acceso denegado. No eres administrador.');
        return;
      }

      axios.get('http://localhost:3001/api/admin-only', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setMessage(res.data.message || `Bienvenido admin ${username}`);
          return fetchUsers(token);
        })
        .catch(err => {
          setError(err.response?.data?.error || 'Error al validar admin');
        })
        .finally(() => setLoading(false));
    } catch (err) {
      setError('Token inválido.');
      setLoading(false);
    }
  }, [navigate]);

  if (loading) return <p className="text-center mt-10">Cargando...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Panel de Administrador</h1>

      <p className="bg-green-100 border border-green-300 text-green-800 p-4 rounded mb-6">
        {message}
      </p>

      <h2 className="text-xl font-semibold mb-2">👥 Usuarios Registrados</h2>
      <table className="w-full border text-left text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Usuario</th>
            <th className="p-2 border">Rol</th>
            <th className="p-2 border">Creado</th>
            <th className="p-2 border">Último Login</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td className="p-2 border">{u.username}</td>
              <td className="p-2 border">{u.role}</td>
              <td className="p-2 border">{new Date(u.createdAt).toLocaleString()}</td>
              <td className="p-2 border">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '—'}</td>
              <td className="p-2 border space-x-2">
                {u.username !== 'admin' && (
                  <>
                    <button
                      onClick={() => handleRoleToggle(u.username)}
                      className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300 rounded px-2 py-1 hover:bg-yellow-200"
                    >
                      Cambiar Rol
                    </button>
                    <button
                      onClick={() => handleDelete(u.username)}
                      className="text-xs bg-red-100 text-red-800 border border-red-300 rounded px-2 py-1 hover:bg-red-200"
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
