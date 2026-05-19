import { useState, useEffect } from 'react';
import { apiClient } from '../api'; // ✅ Usar el cliente configurado existente
import { DashboardData, DashboardResponse } from '../types/dashboard';

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // ✅ PATRÓN VERSO: Igual que vacationsAPI.getCalendar()
      const response = await apiClient.get<DashboardResponse>('/dashboard/stats.php');
      
      if (response.data.success) {
        setStats(response.data.data);
        setError(null);
      } else {
        setError('Error en el formato de respuesta del servidor');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.response?.status === 401 ? 'Sesión expirada' : 'No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Recarga automática cada 5 minutos
    const interval = setInterval(fetchStats, 300000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error, refresh: fetchStats };
};
