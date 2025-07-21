import { useState, useEffect } from 'react';
import apiClient from '../../api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import NewOrderModal from './NewOrderModal';

interface Order {
  id: number;
  cliente_nombre: string;
  usuario_nombre: string;
  descripcion: string;
  estado: string;
  created_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/orders');
      setOrders(response.data);
    } catch (error) {
      console.error("Error al cargar las órdenes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return <div>Cargando órdenes...</div>;
  }

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Gestión de Órdenes</h1>
          <div>
            <Button onClick={() => setIsNewOrderModalOpen(true)}>Nueva Orden</Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="py-2">ID</th>
                <th className="py-2">Cliente</th>
                <th className="py-2">Descripción</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Creada por</th>
                <th className="py-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
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
                  <td className="py-2">{order.usuario_nombre}</td>
                  <td className="py-2">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onOrderAdded={fetchOrders}
      />
    </>
  );
}