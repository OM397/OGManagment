// Hook para obtener el IRR de las inversiones con caché y deduplicación de peticiones
import { useEffect, useState } from 'react';
import apiClient from '../services/apiService';

// Caché simple en módulo para compartir entre instancias del hook
let cachedIrr = null; // { [assetId]: { irr, ... } }
let lastError = null;
let isFetching = false;
let pendingPromise = null;
const subscribers = new Set(); // listeners de resultado

const notifyAll = (data, error = null) => {
  subscribers.forEach((fn) => {
    try { fn(data, error); } catch (_) {}
  });
};

async function fetchIRRShared() {
  if (cachedIrr && !isFetching) {
    // Ya tenemos datos en caché
    return cachedIrr;
  }
  if (pendingPromise) {
    // Devolver la promesa en curso para deduplicar
    return pendingPromise;
  }
  isFetching = true;
  lastError = null;
  pendingPromise = apiClient.get('/investments/irr')
    .then((res) => {
      cachedIrr = res.data?.irr || {};
      notifyAll(cachedIrr, null);
      return cachedIrr;
    })
    .catch((err) => {
      lastError = err;
      notifyAll(cachedIrr || {}, err);
      throw err;
    })
    .finally(() => {
      isFetching = false;
      pendingPromise = null;
    });
  return pendingPromise;
}

export default function useInvestmentsIRR() {
  const [irr, setIrr] = useState(cachedIrr || {});
  const [loading, setLoading] = useState(!cachedIrr);
  const [error, setError] = useState(lastError);

  useEffect(() => {
    let mounted = true;

    const onUpdate = (data, err) => {
      if (!mounted) return;
      if (data) setIrr(data);
      setError(err || null);
      setLoading(false);
    };
    subscribers.add(onUpdate);

    if (!cachedIrr) {
      setLoading(true);
      fetchIRRShared().catch(() => {/* error se maneja en onUpdate */});
    } else {
      // Tenemos datos; asegurar loading=false
      setLoading(false);
    }

    return () => {
      mounted = false;
      subscribers.delete(onUpdate);
    };
  }, []);

  const refetch = async () => {
    // Forzar refetch invalidando caché
    cachedIrr = null;
    return fetchIRRShared();
  };

  return { irr, loading, error, refetch };
}
