// 📁 frontend/src/shared/context/CategoryGroupsContext.jsx

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const CategoryGroupsContext = createContext();
export const useCategoryGroups = () => useContext(CategoryGroupsContext);

export const CategoryGroupsProvider = ({ initialData, children }) => {
  const [categoryGroups, setCategoryGroupsState] = useState(null);
  const timeoutRef = useRef(null);
  const isInitialLoadDone = useRef(false);

  // 🔧 Normaliza las claves antes de enviar al backend
  const normalizeKeys = (groups) => ({
    Investments: groups['Investments'] || {},
    RealEstate: groups['Real Estate'] || groups['RealEstate'] || {},
    Others: groups['Others'] || {}
  });

  const saveUserData = async (categoryGroupsToSave) => {
    if (!categoryGroupsToSave) return;
    try {
      const normalized = normalizeKeys(categoryGroupsToSave);
      await axios.post(
        `${API_BASE}/user-data`,
        { data: normalized },
        { withCredentials: true }
      );
      console.log('💾 Datos guardados correctamente');
    } catch (err) {
      console.error('❌ Error al guardar datos en backend:', err);
    }
  };

  const setCategoryGroups = (updater) => {
    setCategoryGroupsState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        saveUserData(updated);
      }, 1000);
      return updated;
    });
  };

  useEffect(() => {
    if (!isInitialLoadDone.current && initialData) {
      setCategoryGroupsState(initialData);
      isInitialLoadDone.current = true;
    }
  }, [initialData]);

  const defaultGroups = {
    Investments: {},
    'Real Estate': {},
    Others: {}
  };

  return (
    <CategoryGroupsContext.Provider
      value={{ categoryGroups: categoryGroups || defaultGroups, setCategoryGroups }}
    >
      {children}
    </CategoryGroupsContext.Provider>
  );
};
