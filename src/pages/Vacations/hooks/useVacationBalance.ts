import { useState, useEffect } from 'react';
import { VacationBalance, vacationsAPI } from '../../../api/vacations';

interface UseVacationBalanceResult {
  balance: VacationBalance | null;
  loading: boolean;
  error: string | null;
}

export const useVacationBalance = (
  employeeId: number | null,
  year: number
): UseVacationBalanceResult => {
  const [balance, setBalance] = useState<VacationBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) {
      setBalance(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    vacationsAPI
      .getCalendar(year, 1)
      .then(res => {
        if (cancelled) return;
        const bal = res.data.balances?.[employeeId] ?? null;
        setBalance(bal);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudo cargar el saldo');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [employeeId, year]);

  return { balance, loading, error };
};
