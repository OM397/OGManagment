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
          return axios.get('http://localhost:3001/api/admin/users', {
            headers: { Authorization: `Bearer ${token}` }
          });
        })
        .then(res => {
          setUsers(res.data.users || []);
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
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Panel de Administrador</h1>

      <p className="bg-green-100 border border-green-300 text-green-800 p-4 rounded mb-6">
        {message}
      </p>

      <h2 className="text-xl font-semibold mb-2">👥 Usuarios Registrados</h2>
      <table className="w-full border text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Usuario</th>
            <th className="p-2 border">Rol</th>
            <th className="p-2 border">Creado</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td className="p-2 border">{u.username}</td>
              <td className="p-2 border">{u.role}</td>
              <td className="p-2 border">{new Date(u.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
