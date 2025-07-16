// Hook para obtener el IRR de las inversiones
import { useEffect, useState } from 'react';
import { API_BASE } from '../../shared/config';

export default function useInvestmentsIRR() {
  const [irr, setIrr] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIRR = () => {
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
  };

  useEffect(() => {
    fetchIRR();
  }, []);

  return { irr, loading, error, refetch: fetchIRR };
}
