// src/pages/ManufacturingOrders/ManufacturingOrdersPage.tsx
import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Plus, RefreshCw, FileDown, Search, Factory, MoreVertical, Eye, Download, CheckCircle, XCircle, Copy, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { manufacturingAPI, ManufacturingOrder } from '../../api/manufacturing';
import NewManufacturingOrderModal from './components/NewManufacturingOrderModal';
import EditManufacturingOrderModal from './components/EditManufacturingOrderModal';
import { dialog } from '../../services/dialog.service';
import Modal from '../../components/ui/Modal';

const statusLabels = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  completed: 'Completada',
  delivered: 'Entregada'
} as const;

const priorityLabels = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
} as const;

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800'
} as const;

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
} as const;

// ✅ COMPONENTE DROPDOWN MENU - Replicado exactamente del patrón de reparación
const DropdownMenu: React.FC<{
  order: ManufacturingOrder;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onViewDetails: (order: ManufacturingOrder) => void;
  onDownloadPDF: (order: ManufacturingOrder) => void;
  onChangeStatus: (order: ManufacturingOrder, status: string) => void;
  onDeleteOrder: (order: ManufacturingOrder) => void;
}> = ({ order, anchorEl, onClose, onViewDetails, onDownloadPDF, onChangeStatus, onDeleteOrder }) => {
  if (!anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();
  const menuHeight = 240; // Ajustado para fabricación
  const menuWidth = 224;
  const padding = 10;
  
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };

  // ✅ LÓGICA INTELIGENTE DE POSICIONAMIENTO - Idéntica a reparación
  let top = rect.bottom + 5;
  let left = rect.right - menuWidth;

  if (top + menuHeight > viewport.height - padding) {
    top = rect.top - menuHeight - 5;
    if (top < padding) {
      top = Math.max(padding, (viewport.height - menuHeight) / 2);
    }
  }

  if (left < padding) {
    left = rect.left;
  } else if (left + menuWidth > viewport.width - padding) {
    left = viewport.width - menuWidth - padding;
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
        
        {/* ✅ ESTADOS ESPECÍFICOS PARA FABRICACIÓN */}
        {order.status !== 'in_progress' && order.status !== 'completed' && order.status !== 'delivered' && (
          <button
            type="button"
            onClick={() => {
              onChangeStatus(order, 'in_progress');
              onClose();
            }}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <AlertCircle className="w-4 h-4" style={{ color: '#5487c0' }} />
            Iniciar fabricación
          </button>
        )}
        
        {order.status !== 'completed' && order.status !== 'delivered' && (
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
        
        {order.status === 'completed' && (
          <button
            type="button"
            onClick={() => {
              onChangeStatus(order, 'delivered');
              onClose();
            }}
            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <CheckCircle className="w-4 h-4" style={{ color: '#059669' }} />
            Marcar como entregada
          </button>
        )}
        
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

export default function ManufacturingOrdersPage() {
  const [orders, setOrders] = useState<ManufacturingOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // ✅ ESTADO PARA DROPDOWN - Idéntico a reparación
  const [activeDropdown, setActiveDropdown] = useState<{id: number, element: HTMLElement} | null>(null);

  // ✅ FUNCIÓN HELPER PARA TRUNCADO - Idéntica a reparación
  const truncateText = (text: string, maxLength: number = 30): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        sort_by: 'created_at',
        sort_order: 'DESC'
      };

      const response = await manufacturingAPI.list(params);
      setOrders(response.data.orders);
      setTotalPages(response.data.pagination.total_pages);
      setTotalRecords(response.data.pagination.total_records);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar órdenes de fabricación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentPage, search, statusFilter, priorityFilter]);

  // ✅ CONTROL DE DROPDOWN - Idéntico a reparación
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

  // ✅ HANDLERS DE ACCIONES - Adaptados para fabricación
  const handleViewDetails = (order: ManufacturingOrder) => {
    setSelectedOrderId(order.id);
    setShowEditModal(true);
  };

  const handleDownloadPDF = async (order: ManufacturingOrder) => {
    try {
      const pdfUrl = manufacturingAPI.getPdfUrl(order.id);
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error abriendo PDF:', error);
      await dialog.error('Error al abrir el PDF');
    }
  };

  const handleChangeStatus = async (order: ManufacturingOrder, newStatus: string) => {
    const statusMessages = {
      in_progress: 'en progreso',
      completed: 'completada',
      delivered: 'entregada'
    };

    const confirmed = await dialog.confirm(
      `¿Cambiar el estado de la orden ${order.order_number} a ${statusMessages[newStatus as keyof typeof statusMessages]}?`,
      'Esta acción actualizará el estado de la orden'
    );

    if (!confirmed) return;

    try {
      await manufacturingAPI.updateStatus(order.id, newStatus as any);
      await dialog.success('Estado actualizado correctamente');
      loadOrders();
    } catch (error: any) {
      console.error('Error cambiando estado:', error);
      await dialog.error(error.response?.data?.message || 'Error al cambiar el estado');
    }
  };

  const handleDeleteOrder = async (order: ManufacturingOrder) => {
    const confirmed = await dialog.confirm(
      `¿Eliminar la orden ${order.order_number}?`,
      'Esta acción no se puede deshacer'
    );

    if (!confirmed) return;

    try {
      await manufacturingAPI.delete(order.id);
      await dialog.success(`Orden ${order.order_number} eliminada correctamente`);
      loadOrders();
    } catch (error: any) {
      console.error('Error eliminando orden:', error);
      await dialog.error(error.response?.data?.message || 'Error al eliminar la orden');
    }
  };

  const toggleDropdown = (orderId: number, element: HTMLElement) => {
    setActiveDropdown(activeDropdown?.id === orderId ? null : {id: orderId, element});
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div className="p-6">
      {/* Header - Estructura idéntica a reparación */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Factory className="w-8 h-8 mr-3 text-primary-600" />
          Órdenes de Fabricación
        </h1>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={loadOrders} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refrescar
          </Button>
          <Button onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Orden
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Factory className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Órdenes</p>
              <p className="text-xl font-semibold text-gray-900">{totalRecords}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros - Estructura idéntica a reparación */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por número de orden, cliente, marca o bastidor..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
          />
        </div>
        
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="in_progress">En Progreso</option>
          <option value="completed">Completada</option>
          <option value="delivered">Entregada</option>
        </select>

        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Todas las prioridades</option>
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>

        <Button 
          variant="secondary" 
          onClick={() => {
            setSearch('');
            setStatusFilter('');
            setPriorityFilter('');
            setCurrentPage(1);
          }}
        >
          Limpiar Filtros
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* ✅ TABLA CON ESTRUCTURA IDÉNTICA A REPARACIÓN */}
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
                  Tipo Carrozado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marca/Modelo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bastidor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Pedido
                </th>
                {/* ✅ COLUMNA ACCIONES STICKY - Idéntica a reparación */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 border-l border-gray-200 z-10">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                      Cargando órdenes...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    <Factory className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p>No se encontraron órdenes de fabricación</p>
                    {(search || statusFilter || priorityFilter) && (
                      <p className="text-sm text-gray-400 mt-1">
                        Prueba ajustando los filtros de búsqueda
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_number}
                      </div>
                    </td>
                    
                    {/* ✅ CELDA CLIENTE CON TRUNCADO - Idéntica a reparación */}
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
                        <div className="max-w-xs truncate" title={order.bodywork_type || 'No especificado'}>
                          {order.bodywork_type || '-'}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={[order.brand, order.model].filter(Boolean).join(' ') || 'No especificado'}>
                          {[order.brand, order.model].filter(Boolean).join(' ') || '-'}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={order.chassis_number || 'No especificado'}>
                          {order.chassis_number || '-'}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[order.priority]}`}>
                        {priorityLabels[order.priority]}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.order_date)}
                    </td>
                    
                    {/* ✅ CELDA ACCIONES STICKY - Idéntica a reparación */}
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

        {/* Paginación - Idéntica a la actual */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Siguiente
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Página <span className="font-medium">{currentPage}</span> de{' '}
                  <span className="font-medium">{totalPages}</span> ({totalRecords} órdenes totales)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </Button>
                  
                  <div className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    {currentPage} / {totalPages}
                  </div>
                  
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ MODALES - Estructura idéntica a reparación */}
      <NewManufacturingOrderModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onOrderCreated={() => {
          setShowNewModal(false);
          loadOrders();
        }}
      />

{selectedOrderId !== null && (
  <Modal
    isOpen={showEditModal}
    onClose={() => {
      setShowEditModal(false);
      setSelectedOrderId(null);
    }}
       size="max-w-5xl"
  >
    <EditManufacturingOrderModal
      orderId={selectedOrderId}
      onCancel={() => {
        setShowEditModal(false);
        setSelectedOrderId(null);
      }}
      onSuccess={() => {
        setShowEditModal(false);
        setSelectedOrderId(null);
        loadOrders();
      }}
    />
  </Modal>
)}

      {/* ✅ DROPDOWN MENU PORTAL - Idéntico a reparación */}
      {activeDropdown && (
        <DropdownMenu
          order={orders.find(o => o.id === activeDropdown.id)!}
          anchorEl={activeDropdown.element}
          onClose={() => setActiveDropdown(null)}
          onViewDetails={handleViewDetails}
          onDownloadPDF={handleDownloadPDF}
          onChangeStatus={handleChangeStatus}
          onDeleteOrder={handleDeleteOrder}
        />
      )}
    </div>
  );
}
