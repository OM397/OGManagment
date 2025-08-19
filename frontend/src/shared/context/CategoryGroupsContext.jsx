// 📁 frontend/src/shared/context/CategoryGroupsContext.jsx

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import apiClient from '../services/apiService';
import { API_BASE } from '../config';

const CategoryGroupsContext = createContext();
export const useCategoryGroups = () => useContext(CategoryGroupsContext);

export const CategoryGroupsProvider = ({ initialData, children }) => {
  const [categoryGroups, setCategoryGroupsState] = useState(null);
  const timeoutRef = useRef(null);
  const isInitialLoadDone = useRef(false);
  // Track last pending snapshot to flush on unload
  const pendingRef = useRef(null);

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
      await apiClient.post('/user-data', { data: normalized });
  // ...existing code...
    } catch (err) {
  // ...existing code...
    }
  };

  // Keepalive save for unload/hidden (avoids losing changes on quick refresh)
  const saveUserDataKeepalive = async (categoryGroupsToSave) => {
    if (!categoryGroupsToSave) return;
    try {
      const normalized = normalizeKeys(categoryGroupsToSave);
      const body = JSON.stringify({ data: normalized });
      // Use fetch with keepalive to allow completion during page unload
      await fetch(`${API_BASE}/user-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        credentials: 'include',
        mode: 'cors'
      });
    } catch (_) {
      // swallow: best-effort on unload
    }
  };

  const setCategoryGroups = (updater) => {
    setCategoryGroupsState(prev => {
      const updated = typeof updater === 'function' ? updater(prev) : updater;
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        saveUserData(updated);
      }, 1000);
  // mark as pending to flush on unload if user navigates quickly
  pendingRef.current = updated;
      return updated;
    });
  };

  // Forzar guardado inmediato (antes de logout)
  const flushSave = async () => {
    try {
      clearTimeout(timeoutRef.current);
  await saveUserData(categoryGroups || defaultGroups);
  pendingRef.current = null;
    } catch (e) {
  // ...existing code...
    }
  };

  useEffect(() => {
    if (!isInitialLoadDone.current && initialData) {
      setCategoryGroupsState(initialData);
      isInitialLoadDone.current = true;
    }
  }, [initialData]);

  // Flush pending changes on page hide/unload (best effort)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && pendingRef.current) {
        // Use keepalive so it can finish after tab is hidden
        saveUserDataKeepalive(pendingRef.current);
      }
    };
    const handleBeforeUnload = () => {
      if (pendingRef.current) {
        // try best-effort keepalive
        saveUserDataKeepalive(pendingRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleBeforeUnload);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handleBeforeUnload);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const defaultGroups = {
    Investments: {},
    'Real Estate': {},
    Others: {}
  };

  return (
    <CategoryGroupsContext.Provider
  value={{ categoryGroups: categoryGroups || defaultGroups, setCategoryGroups, flushSave }}
    >
      {children}
    </CategoryGroupsContext.Provider>
  );
};
