// src/pages/ManufacturingOrders/ManufacturingOrdersPage.tsx
import { useState, useEffect } from 'react';
import { Plus, RefreshCw, FileDown, Search, Factory, MoreVertical, Eye, Download, CheckCircle, XCircle, Copy, AlertCircle, Trash2 } from 'lucide-react';
import { PortalDropdownMenu, DropdownAction } from '../../components/ui/PortalDropdownMenu';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../api';
import { manufacturingAPI, ManufacturingOrder } from '../../api/manufacturing';
import NewManufacturingOrderModal from './components/NewManufacturingOrderModal';
import EditManufacturingOrderModal from './components/EditManufacturingOrderModal';
import ManufacturingOrderStatusBadge from './components/ManufacturingOrderStatusBadge';
import ManufacturingOrderPriorityBadge from './components/ManufacturingOrderPriorityBadge';
import { dialog } from '../../services/dialog.service';
import { Modal } from '../../components/ui/Modal';
import { formatDate, truncateText } from '../../utils/formatters';
import { fromSnake } from '../../types/pagination';
import { apiErrorMessage } from '../../utils/error';



export function ManufacturingOrdersPage() {
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

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [applyingBulk, setApplyingBulk] = useState(false);

  // ✅ ESTADO PARA DROPDOWN - Idéntico a reparación
  const [activeDropdown, setActiveDropdown] = useState<{id: number, element: HTMLElement} | null>(null);

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
      const pg = fromSnake(response.data.pagination);
      setTotalPages(pg.totalPages);
      setTotalRecords(pg.total);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Error al cargar órdenes de fabricación'));
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
    try {
      await manufacturingAPI.updateStatus(order.id, newStatus as any);
      await dialog.success('Estado actualizado correctamente');
      loadOrders();
    } catch (error: unknown) {
      console.error('Error cambiando estado:', error);
      await dialog.error(apiErrorMessage(error, 'Error al cambiar el estado'));
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
    } catch (error: unknown) {
      console.error('Error eliminando orden:', error);
      await dialog.error(apiErrorMessage(error, 'Error al eliminar la orden'));
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
      await apiClient.put('/manufacturing-orders/bulk-status.php', {
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
            <Factory className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Órdenes de Fabricación</h1>
            {totalRecords > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">{totalRecords} órdenes en total</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
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
            className="w-full pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
          />
        </div>

        <select
          className="px-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
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
          className="px-4 py-2 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
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
          variant="subtle"
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
            <option value="completed">Completada</option>
            <option value="delivered">Entregada</option>
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
      <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedIds.size === orders.length}
                    ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < orders.length; }}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary-dark focus:ring-primary-dark"
                  />
                </th>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-[#f8fafc] border-l border-[#e2e8f0] z-10">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#e2e8f0]">
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
                  <tr key={order.id} className={`transition-colors ${selectedIds.has(order.id) ? 'bg-[#a2bade]/10' : 'hover:bg-[#f8fafc]'}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="rounded border-gray-300 text-primary-dark focus:ring-primary-dark"
                      />
                    </td>
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
                      <ManufacturingOrderStatusBadge status={order.status} size="sm" />
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <ManufacturingOrderPriorityBadge priority={order.priority} size="sm" />
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.order_date)}
                    </td>
                    
                    {/* ✅ CELDA ACCIONES STICKY - Idéntica a reparación */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white border-l border-[#e2e8f0] z-5">
                      <div className="relative dropdown-container">
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
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="inline-flex items-center px-4 py-2 border border-[#e2e8f0] rounded-lg bg-white text-sm font-medium text-[#1162a6] hover:bg-[#a2bade]/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center px-4 py-2 border border-[#e2e8f0] rounded-lg bg-white text-sm font-medium text-[#1162a6] hover:bg-[#a2bade]/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Página <span className="font-medium">{currentPage}</span> de{' '}
                  <span className="font-medium">{totalPages}</span> ({totalRecords} órdenes totales)
                </p>
              </div>
              <div>
                <nav className="inline-flex rounded-lg border border-[#e2e8f0] overflow-hidden">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-4 py-2 bg-white text-sm font-medium text-[#1162a6] hover:bg-[#a2bade]/10 border-r border-[#e2e8f0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>
                  <div className="px-4 py-2 bg-white text-sm font-medium text-gray-700 border-r border-[#e2e8f0] select-none">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 bg-white text-sm font-medium text-[#1162a6] hover:bg-[#a2bade]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
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

      {activeDropdown && (() => {
        const order = orders.find(o => o.id === activeDropdown.id)!;
        const close = () => setActiveDropdown(null);
        const statusActions: DropdownAction[] = [];
        if (order.status !== 'in_progress' && order.status !== 'completed' && order.status !== 'delivered')
          statusActions.push({ label: 'Iniciar fabricación', icon: <AlertCircle className="w-4 h-4 text-[#5487c0]" />, onClick: () => { handleChangeStatus(order, 'in_progress'); close(); } });
        if (order.status !== 'completed' && order.status !== 'delivered')
          statusActions.push({ label: 'Marcar como completada', icon: <CheckCircle className="w-4 h-4 text-[#1162a6]" />, onClick: () => { handleChangeStatus(order, 'completed'); close(); } });
        if (order.status === 'completed')
          statusActions.push({ label: 'Marcar como entregada', icon: <CheckCircle className="w-4 h-4 text-[#1162a6]" />, onClick: () => { handleChangeStatus(order, 'delivered'); close(); } });
        if (statusActions.length > 0) statusActions[0].dividerBefore = true;
        const actions: DropdownAction[] = [
          { label: 'Ver/Editar orden', icon: <Eye className="w-4 h-4 text-gray-400" />, onClick: () => { handleViewDetails(order); close(); } },
          { label: 'Imprimir PDF',     icon: <Download className="w-4 h-4 text-gray-400" />, onClick: () => { handleDownloadPDF(order); close(); } },
          ...statusActions,
          { label: 'Eliminar orden', icon: <Trash2 className="w-4 h-4 text-[#5487c0]" />, onClick: () => { handleDeleteOrder(order); close(); }, labelStyle: { color: '#5487c0' }, dividerBefore: true },
        ];
        return <PortalDropdownMenu anchorEl={activeDropdown.element} onClose={close} actions={actions} menuHeight={240} />;
      })()}
    </div>
  );
}
