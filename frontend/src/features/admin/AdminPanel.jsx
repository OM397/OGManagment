import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // ✅ correcto






import axios from 'axios';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const { role, username } = jwt_decode(token);
      if (role !== 'admin') {
        setError('Acceso denegado. No eres administrador.');
        return;
      }

      axios.get('http://localhost:3001/api/admin-only', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setMessage(res.data.message || `Bienvenido admin ${username}`);
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
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Panel de Administrador</h1>
      <p className="bg-green-100 border border-green-300 text-green-800 p-4 rounded">
        {message}
      </p>
      {/* 🔧 Aquí puedes añadir más opciones admin */}
    </div>
  );
}
