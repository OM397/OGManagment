// 📁 frontend/src/shared/context/CategoryGroupsContext.jsx

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const CategoryGroupsContext = createContext();
export const useCategoryGroups = () => useContext(CategoryGroupsContext);

export const CategoryGroupsProvider = ({ initialData, children }) => {
  const [categoryGroups, setCategoryGroupsState] = useState(initialData || {
    Investments: {},
    'Real Estate': {},
    Others: {}
  });

  const isFirstRender = useRef(true);
  const hasPendingChanges = useRef(false);

  useEffect(() => {
    setCategoryGroupsState(initialData || {
      Investments: {},
      'Real Estate': {},
      Others: {}
    });
  }, [initialData]);

  const saveUserData = async (data) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.post(`${API_BASE}/user-data`, data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('💾 Datos guardados correctamente en el backend');
    } catch (err) {
      console.error('❌ Error al guardar datos en el backend:', err);
    }
  };

  const setCategoryGroups = (updater) => {
    setCategoryGroupsState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      hasPendingChanges.current = true;
      return updated;
    });
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (hasPendingChanges.current) {
      saveUserData(categoryGroups);
      hasPendingChanges.current = false;
    }
  }, [categoryGroups]);

  return (
    <CategoryGroupsContext.Provider value={{ categoryGroups, setCategoryGroups }}>
      {children}
    </CategoryGroupsContext.Provider>
  );
};
