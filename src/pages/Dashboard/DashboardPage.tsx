import { useState, useEffect } from 'react';
import apiClient from '../../api';
import Card from '../../components/ui/Card';
import { Truck, Users, Clock, CheckCircle } from 'lucide-react';

interface DashboardStats {
  ordenesActivas: number;
  clientesTotales: number;
  ordenesPendientes: number;
  ordenesCompletadas30dias: number;
  ordenesRecientes: any[]; // Deberíamos definir un tipo más estricto para las órdenes
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/dashboard/summary');
        setStats(response.data);
      } catch (error) {
        console.error("Error al cargar los datos del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div>Cargando panel...</div>;
  }

  return (
    <div>
      {/* Sección de Tarjetas de KPIs */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center">
            <Truck className="w-12 h-12 text-blue-500" />
            <div className="ml-4">
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Órdenes Activas</p>
              <p className="text-3xl font-bold">{stats?.ordenesActivas ?? '0'}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <Users className="w-12 h-12 text-green-500" />
            <div className="ml-4">
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Clientes Totales</p>
              <p className="text-3xl font-bold">{stats?.clientesTotales ?? '0'}</p>
            </div>
          </div>
        </Card>
        <Card>
           <div className="flex items-center">
            <Clock className="w-12 h-12 text-yellow-500" />
            <div className="ml-4">
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Órdenes Pendientes</p>
              <p className="text-3xl font-bold">{stats?.ordenesPendientes ?? '0'}</p>
            </div>
          </div>
        </Card>
        <Card>
           <div className="flex items-center">
            <CheckCircle className="w-12 h-12 text-purple-500" />
            <div className="ml-4">
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Completadas (30d)</p>
              <p className="text-3xl font-bold">{stats?.ordenesCompletadas30dias ?? '0'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sección de Órdenes Recientes */}
      <div className="mt-8">
        <Card>
          <h2 className="text-xl font-semibold mb-4">Órdenes Recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="py-2">ID</th>
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Descripción</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {stats?.ordenesRecientes.map((order) => (
                  <tr key={order.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-2">{order.id}</td>
                    <td className="py-2">{order.cliente_nombre}</td>
                    <td className="py-2">{order.descripcion}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        order.estado === 'Pendiente' ? 'bg-yellow-200 text-yellow-800' :
                        order.estado === 'Activa' ? 'bg-blue-200 text-blue-800' :
                        'bg-green-200 text-green-800'
                      }`}>
                        {order.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}