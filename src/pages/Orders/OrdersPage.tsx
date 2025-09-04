// src/pages/Orders/OrdersPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Search, Filter, Calendar, Package, Users, MoreVertical, Eye, Edit, Download, CheckCircle, XCircle, Copy, Trash2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../api';
import NewOrderModal from './components/NewOrderModal';
import OrderStatusBadge from './components/OrderStatusBadge';
import OrderPriorityBadge from './components/OrderPriorityBadge';
import DepartmentBadge from './components/DepartmentBadge';
import { ClientsManagementModal } from './components/ClientsManagementModal';
import { dialog } from '../../services/dialog.service';
import EditOrderModal from './components/EditOrderModal';

interface Order {
  id: number;
  order_number: string;
  client_name: string;
  unit_type_name: string;
  brand: string;
  model: string;
  license_plate: string;
  departments: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  entry_date: string;
  estimated_delivery: string | null;
  completion_date: string | null;
  created_by_name: string;
  created_at: string;
}

// Componente para el menú dropdown
const DropdownMenu: React.FC<{
  order: Order;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onViewDetails: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onDownloadPDF: (order: Order) => void;
  onChangeStatus: (order: Order, status: string) => void;
  onDuplicateOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
}> = ({ order, anchorEl, onClose, onViewDetails, onEditOrder, onDownloadPDF, onChangeStatus, onDuplicateOrder, onDeleteOrder }) => {
  if (!anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();
  const menuHeight = 280; // Altura aproximada del menú completo
  const menuWidth = 224;  // w-56 = 14rem = 224px
  const padding = 10;     // Margen de seguridad desde bordes
  
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };

  // ✅ LÓGICA INTELIGENTE: Calcular posición óptima
  let top = rect.bottom + 5;  // Por defecto: debajo del botón
  let left = rect.right - menuWidth; // Por defecto: alineado a la derecha

  // ✅ REPOSICIONAMIENTO VERTICAL: Si se sale por abajo, mostrarlo arriba
  if (top + menuHeight > viewport.height - padding) {
    top = rect.top - menuHeight - 5;
    
    // Si aún se sale por arriba, centrarlo verticalmente
    if (top < padding) {
      top = Math.max(padding, (viewport.height - menuHeight) / 2);
    }
  }

  // ✅ REPOSICIONAMIENTO HORIZONTAL: Mantener dentro del viewport
  if (left < padding) {
    left = rect.left; // Alinear a la izquierda del botón
  } else if (left + menuWidth > viewport.width - padding) {
    left = viewport.width - menuWidth - padding; // Alinear al borde derecho
  }

  const style = {
    position: 'fixed' as const,
    top,
    left,
    zIndex: 9999,
  };

  return ReactDOM.createPortal(
    <div 
      className="bg-white rounded-lg shadow-xl border border-gray-200 w-56 max-h-[80vh] overflow-y-auto"
      style={style}
    >
      <div className="py-1">
        <button
          type="button"
          onClick={() => {
            onViewDetails(order);
            onClose();
          }}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
        >
          <Eye className="w-4 h-4 text-gray-400" />
          Ver/Editar orden
        </button>
        
        <button
          type="button"
          onClick={() => {
            onDownloadPDF(order);
            onClose();
          }}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
        >
          <Download className="w-4 h-4 text-gray-400" />
          Imprimir PDF
        </button>
        
        <div className="border-t border-gray-100 my-1"></div>
        
        {order.status !== 'in_progress' && order.status !== 'completed' && order.status !== 'cancelled' && (
          <button
            type="button"
            onClick={() => {
              onChangeStatus(order, 'in_progress');
              onClose();
            }}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <AlertCircle className="w-4 h-4" style={{ color: '#5487c0' }} />
            Marcar en progreso
          </button>
        )}
        
        {order.status !== 'completed' && order.status !== 'cancelled' && (
          <button
            type="button"
            onClick={() => {
              onChangeStatus(order, 'completed');
              onClose();
            }}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <CheckCircle className="w-4 h-4" style={{ color: '#1162a6' }} />
            Marcar como completada
          </button>
        )}
        
        {order.status !== 'cancelled' && order.status !== 'completed' && (
          <button
            type="button"
            onClick={() => {
              onChangeStatus(order, 'cancelled');
              onClose();
            }}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <XCircle className="w-4 h-4" style={{ color: '#a2bade' }} />
            Cancelar orden
          </button>
        )}
        
        <div className="border-t border-gray-100 my-1"></div>
        
        <button
          type="button"
          onClick={() => {
            onDuplicateOrder(order);
            onClose();
          }}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
        >
          <Copy className="w-4 h-4 text-gray-400" />
          Duplicar orden
        </button>
        
        <div className="border-t border-gray-100 my-1"></div>
        
        <button
          type="button"
          onClick={() => {
            onDeleteOrder(order);
            onClose();
          }}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors text-left"
        >
          <Trash2 className="w-4 h-4" style={{ color: '#5487c0' }} />
          <span style={{ color: '#5487c0' }}>Eliminar orden</span>
        </button>
      </div>
    </div>,
    document.body
  );
};

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<{id: number, element: HTMLElement} | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // ✅ FUNCIÓN HELPER PARA TRUNCADO INTELIGENTE
  const truncateText = (text: string, maxLength: number = 30): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/orders/');
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error cargando órdenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleDownloadPDF = async (order: Order) => {
    try {
      // Construir URL usando la configuración del apiClient
      let baseUrl = apiClient.defaults.baseURL;
      if (baseUrl && !baseUrl.endsWith('/')) {
        baseUrl += '/';
      }
      const pdfUrl = `${baseUrl}orders/pdf-tcpdf-adaptive.php?id=${order.id}`;
      
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
      
      //dialog.success(`PDF de la orden ${order.order_number} abierto para imprimir`);
    } catch (error) {
      console.error('Error abriendo PDF:', error);
      dialog.error('Error al abrir el PDF');
    }
  };

  const handleChangeStatus = async (order: Order, newStatus: string) => {
    const statusMessages = {
      in_progress: 'en progreso',
      completed: 'completada',
      cancelled: 'cancelada'
    };

    const confirmed = await dialog.confirm(
      `¿Cambiar el estado de la orden ${order.order_number} a ${statusMessages[newStatus as keyof typeof statusMessages]}?`,
      'Esta acción actualizará el estado de la orden'
    );

    if (!confirmed) return;

    try {
      const response = await apiClient.put(`/orders/status/${order.id}`, {
        status: newStatus
      });

      if (response.data.success) {
        dialog.success('Estado actualizado correctamente');
        loadOrders();
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      dialog.error('Error al cambiar el estado');
    }
  };

  const handleDuplicateOrder = async (order: Order) => {
    const confirmed = await dialog.confirm(
      `¿Duplicar la orden ${order.order_number}?`,
      'Se creará una nueva orden con los mismos datos'
    );

    if (!confirmed) return;

    try {
      const response = await apiClient.post(`/orders/duplicate/${order.id}`);
      
      if (response.data.success) {
        dialog.success('Orden duplicada correctamente');
        loadOrders();
      }
    } catch (error) {
      console.error('Error duplicando orden:', error);
      dialog.error('Error al duplicar la orden');
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    const confirmed = await dialog.confirm(
      `¿Eliminar la orden ${order.order_number}?`,
      'Esta acción no se puede deshacer'
    );

    if (!confirmed) return;

    try {
      const response = await apiClient.delete(`/orders/${order.id}`);
      
      if (response.data.success) {
        dialog.success('Orden eliminada correctamente');
        loadOrders();
      }
    } catch (error) {
      console.error('Error eliminando orden:', error);
      dialog.error('Error al eliminar la orden');
    }
  };

  const toggleDropdown = (orderId: number, element: HTMLElement) => {
    setActiveDropdown(activeDropdown?.id === orderId ? null : {id: orderId, element});
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.license_plate.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || order.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de Trabajo</h1>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => setShowClientsModal(true)}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Gestionar Clientes
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowNewOrderModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva Orden
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por número de orden, cliente o matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
          >
            <option value="all">Todas las prioridades</option>
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
      </div>

      {/* ✅ TABLA OPTIMIZADA CON TRUNCADO Y STICKY COLUMN */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nº Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehículo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Departamentos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Entrada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entrega Est.
                </th>
                {/* ✅ COLUMNA ACCIONES STICKY - Siempre visible */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 border-l border-gray-200 z-10">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    Cargando órdenes...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron órdenes
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_number}
                      </div>
                    </td>
                    
                    {/* ✅ CELDA CLIENTE CON TRUNCADO INTELIGENTE */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div 
                        className="text-sm text-gray-900 max-w-[200px] sm:max-w-[250px] lg:max-w-[300px] truncate cursor-help" 
                        title={order.client_name}
                      >
                        {truncateText(order.client_name, 30)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>{order.unit_type_name}</div>
                        <div className="text-xs text-gray-500">
                          {order.brand} {order.model} - {order.license_plate}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {order.departments.map((dept) => (
                          <DepartmentBadge
                            key={dept.id}
                            name={dept.name}
                            color={dept.color}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OrderPriorityBadge priority={order.priority} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.entry_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.estimated_delivery)}
                    </td>
                    
                    {/* ✅ CELDA ACCIONES STICKY - Siempre accesible */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white border-l border-gray-200 z-5">
                      <div className="relative dropdown-container">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDropdown(order.id, e.currentTarget);
                          }}
                          className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de nueva orden */}
      {showNewOrderModal && (
        <NewOrderModal
          isOpen={showNewOrderModal}
          onClose={() => setShowNewOrderModal(false)}
          onOrderCreated={() => {
            setShowNewOrderModal(false);
            loadOrders();
          }}
        />
      )}

      {/* Modal de gestión de clientes */}
      {showClientsModal && (
        <ClientsManagementModal
          isOpen={showClientsModal}
          onClose={() => setShowClientsModal(false)}
          onClientCreated={() => {
            // Aquí podrías refrescar la lista de clientes si fuera necesario
          }}
        />
      )}

      {/* Dropdown Menu Portal */}
      {activeDropdown && (
        <DropdownMenu
          order={orders.find(o => o.id === activeDropdown.id)!}
          anchorEl={activeDropdown.element}
          onClose={() => setActiveDropdown(null)}
          onViewDetails={handleViewDetails}
          onEditOrder={handleEditOrder}
          onDownloadPDF={handleDownloadPDF}
          onChangeStatus={handleChangeStatus}
          onDuplicateOrder={handleDuplicateOrder}
          onDeleteOrder={handleDeleteOrder}
        />
      )}

      {/* Modal de edición */}
      {showEditModal && selectedOrder && (
        <EditOrderModal
          isOpen={showEditModal}
          order={selectedOrder}
          onClose={() => {
            setShowEditModal(false);
            setSelectedOrder(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedOrder(null);
            loadOrders();
          }}
        />
      )}
    </div>
  );
};
