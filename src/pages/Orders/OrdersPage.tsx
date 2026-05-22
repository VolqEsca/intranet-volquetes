// src/pages/Orders/OrdersPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Filter, Calendar, Package, Users, MoreVertical, Eye, Edit, FileText, CheckCircle, XCircle, Copy, Trash2, Clock, AlertCircle, Wrench } from 'lucide-react';
import { PortalDropdownMenu, DropdownAction } from '../../components/ui/PortalDropdownMenu';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { apiClient } from '../../api';
import NewOrderModal from './components/NewOrderModal';
import OrderStatusBadge from './components/OrderStatusBadge';
import DepartmentBadge from './components/DepartmentBadge';
import { ClientsManagementModal } from './components/ClientsManagementModal';
import { dialog } from '../../services/dialog.service';
import EditOrderModal from './components/EditOrderModal';
import { formatDate, truncateText } from '../../utils/formatters';
import { fromCamel } from '../../types/pagination';
import { apiErrorMessage } from '../../utils/error';
import { Checkbox } from '../../components/ui/Checkbox';

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


const ORDERS_PER_PAGE = 20;

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<{id: number, element: HTMLElement} | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [applyingBulk, setApplyingBulk] = useState(false);

  // Debounce búsqueda 300ms y resetear página
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cargar cuando cambien página, búsqueda o filtros
  useEffect(() => {
    loadOrders();
  }, [currentPage, debouncedSearch, filterStatus, filterPriority]);

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
      setError(null);

      const params: Record<string, string | number> = {
        page: currentPage,
        limit: ORDERS_PER_PAGE,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPriority !== 'all') params.priority = filterPriority;

      const response = await apiClient.get('/orders/', { params });
      setOrders(response.data.data || []);
      const pg = fromCamel(response.data.pagination ?? {});
      setTotalPages(pg.totalPages);
      setTotalOrders(pg.total);
    } catch (err: unknown) {
      console.error('Error cargando órdenes:', err);
      setError(apiErrorMessage(err, 'Error al cargar las órdenes de trabajo'));
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
      let baseUrl = apiClient.defaults.baseURL;
      if (baseUrl && !baseUrl.endsWith('/')) {
        baseUrl += '/';
      }
      const pdfUrl = `${baseUrl}orders/pdf-tcpdf-adaptive.php?id=${order.id}`;
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error abriendo PDF:', error);
      dialog.error('Error al abrir el PDF');
    }
  };

  const handleChangeStatus = async (order: Order, newStatus: string) => {
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

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === orders.length ? new Set() : new Set(orders.map(o => o.id)));
  };

  const applyBulkStatus = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setApplyingBulk(true);
    try {
      await apiClient.put('/orders/bulk-status.php', {
        ids: Array.from(selectedIds),
        status: bulkStatus,
      });
      setSelectedIds(new Set());
      setBulkStatus('');
      loadOrders();
    } catch {
      dialog.error('Error al aplicar cambio de estado');
    } finally {
      setApplyingBulk(false);
    }
  };

  const toggleDropdown = (orderId: number, element: HTMLElement) => {
    setActiveDropdown(activeDropdown?.id === orderId ? null : {id: orderId, element});
  };


  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1162a6] flex items-center justify-center shadow-sm flex-shrink-0">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Órdenes de Trabajo</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => setShowClientsModal(true)}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Gestionar Clientes
          </Button>
          <Button
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
            className="w-full pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="in_progress">En Progreso</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => {
            setFilterPriority(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
        >
          <option value="all">Todas las prioridades</option>
          <option value="low">Baja</option>
          <option value="normal">Normal</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>
      </div>

      {error && (
        <div className="bg-white border-l-4 border-[#dc2626] rounded-r-xl px-4 py-3 text-[#dc2626]">
          {error}
        </div>
      )}

      {/* Barra de acción bulk */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-[#a2bade]/15 border border-[#a2bade] rounded-lg">
          <span className="text-sm font-medium text-primary-dark">
            {selectedIds.size} {selectedIds.size === 1 ? 'orden seleccionada' : 'órdenes seleccionadas'}
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
          >
            <option value="">Cambiar estado a...</option>
            <option value="pending">Pendiente</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>
          <Button
            variant="primary"
            onClick={applyBulkStatus}
            disabled={!bulkStatus || applyingBulk}
          >
            {applyingBulk ? 'Aplicando...' : 'Aplicar'}
          </Button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Limpiar selección
          </button>
        </div>
      )}

      {/* Tabla */}
      <>
        {/* Lista de órdenes — tarjetas */}
        {loading ? (
          <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-[#e2e8f0]">
            Cargando órdenes...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-[#e2e8f0]">
            No se encontraron órdenes
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header de columnas */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider items-center border-b border-[#e2e8f0]">
              <div className="col-span-1">
                <Checkbox
                  checked={orders.length > 0 && selectedIds.size === orders.length}
                  indeterminate={selectedIds.size > 0 && selectedIds.size < orders.length}
                  onChange={toggleSelectAll}
                />
              </div>
              <div className="col-span-3">Nº Orden</div>
              <div className="col-span-2">Vehículo</div>
              <div className="col-span-3">Departamentos</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-1 text-right">Acciones</div>
            </div>

            {orders.map((order) => (
              <Card
                key={order.id}
                className={`p-4 transition-all duration-200 hover:shadow-md ${selectedIds.has(order.id) ? 'ring-2 ring-[#1162a6]/30 bg-[#1162a6]/5' : ''}`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Checkbox */}
                  <div className="col-span-12 lg:col-span-1">
                    <Checkbox
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                    />
                  </div>

                  {/* Nº Orden + Cliente */}
                  <div className="col-span-12 lg:col-span-3">
                    <h3 className="font-semibold text-gray-900 text-sm">{order.order_number}</h3>
                    <p className="text-sm text-gray-600 truncate" title={order.client_name}>
                      {truncateText(order.client_name, 30)}
                    </p>
                  </div>

                  {/* Vehículo */}
                  <div className="col-span-12 lg:col-span-2">
                    <div className="text-sm text-gray-900">{order.unit_type_name}</div>
                    <div className="text-xs text-gray-400">{order.brand} {order.model} - {order.license_plate}</div>
                  </div>

                  {/* Departamentos */}
                  <div className="col-span-12 lg:col-span-3">
                    <div className="flex flex-wrap gap-1">
                      {order.departments.map((dept) => (
                        <DepartmentBadge key={dept.id} name={dept.name} color={dept.color} />
                      ))}
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="col-span-12 lg:col-span-2">
                    <OrderStatusBadge status={order.status} />
                  </div>

                  {/* Acciones */}
                  <div className="col-span-12 lg:col-span-1">
                    <div className="flex lg:justify-end dropdown-container">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDropdown(order.id, e.currentTarget);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border border-[#e2e8f0] rounded-xl sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="inline-flex items-center px-4 py-2 border border-[#e2e8f0] rounded-lg bg-white text-sm font-medium text-[#1162a6] hover:bg-[#a2bade]/10 disabled:opacity-50 disabled:cursor-not-allowed">
                Anterior
              </button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="inline-flex items-center px-4 py-2 border border-[#e2e8f0] rounded-lg bg-white text-sm font-medium text-[#1162a6] hover:bg-[#a2bade]/10 disabled:opacity-50 disabled:cursor-not-allowed">
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <p className="text-sm text-gray-700">
                Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span> ({totalOrders} órdenes totales)
              </p>
              <nav className="inline-flex rounded-lg border border-[#e2e8f0] overflow-hidden">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1} className="px-4 py-2 bg-white text-sm font-medium text-[#1162a6] hover:bg-[#a2bade]/10 border-r border-[#e2e8f0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Anterior
                </button>
                <div className="px-4 py-2 bg-white text-sm font-medium text-gray-700 border-r border-[#e2e8f0] select-none">
                  {currentPage} / {totalPages}
                </div>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="px-4 py-2 bg-white text-sm font-medium text-[#1162a6] hover:bg-[#a2bade]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        )}
      </>

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
          onClientCreated={() => {}}
        />
      )}

      {activeDropdown && (() => {
        const order = orders.find(o => o.id === activeDropdown.id)!;
        const close = () => setActiveDropdown(null);
        const statusActions: DropdownAction[] = [];
        if (order.status !== 'in_progress' && order.status !== 'completed' && order.status !== 'cancelled')
          statusActions.push({ label: 'Marcar en progreso', icon: <AlertCircle className="w-4 h-4 text-[#5487c0]" />, onClick: () => { handleChangeStatus(order, 'in_progress'); close(); } });
        if (order.status !== 'completed' && order.status !== 'cancelled')
          statusActions.push({ label: 'Marcar como completada', icon: <CheckCircle className="w-4 h-4 text-[#1162a6]" />, onClick: () => { handleChangeStatus(order, 'completed'); close(); } });
        if (order.status !== 'cancelled' && order.status !== 'completed')
          statusActions.push({ label: 'Cancelar orden', icon: <XCircle className="w-4 h-4 text-[#a2bade]" />, onClick: () => { handleChangeStatus(order, 'cancelled'); close(); } });
        if (statusActions.length > 0) statusActions[0].dividerBefore = true;
        const actions: DropdownAction[] = [
          { label: 'Ver/Editar orden', icon: <Eye className="w-4 h-4" />, onClick: () => { handleViewDetails(order); close(); } },
          { label: 'Imprimir PDF',     icon: <FileText className="w-4 h-4" />, onClick: () => { handleDownloadPDF(order); close(); } },
          ...statusActions,
          { label: 'Duplicar orden',  icon: <Copy className="w-4 h-4" />, onClick: () => { handleDuplicateOrder(order); close(); }, dividerBefore: true },
          { label: 'Eliminar orden',  icon: <Trash2 className="w-4 h-4" />, onClick: () => { handleDeleteOrder(order); close(); }, rowClassName: 'hover:text-[#dc2626]', dividerBefore: true },
        ];
        return <PortalDropdownMenu anchorEl={activeDropdown.element} onClose={close} actions={actions} />;
      })()}

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
