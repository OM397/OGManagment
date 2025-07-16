// 📁 frontend/src/features/history/useInvestmentsIRR.js
import { useEffect, useState } from 'react';
import { API_BASE } from '../../shared/config';

export default function useInvestmentsIRR() {
  const [irr, setIrr] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/investments/irr`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        setIrr(data.irr || {});
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { irr, loading, error };
}
