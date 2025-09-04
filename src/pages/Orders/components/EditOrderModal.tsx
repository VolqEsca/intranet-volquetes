// src/pages/Orders/components/EditOrderModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, Save, User, Building2, Wrench, Calendar, AlertTriangle, AlertCircle,
  Zap, Paintbrush, Droplets, Check, FileText, Printer
} from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import CustomDatePicker from '../../../components/ui/CustomDatePicker';
import { apiClient } from '../../../api';
import { dialog } from '../../../services/dialog.service';

interface EditOrderModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
  onSuccess: () => void;
}

interface Client {
  id: number;
  name: string;
  cif_nif: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
}

interface Department {
  id: number;
  name: string;
}

interface UnitType {
  id: number;
  name: string;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ 
  isOpen, 
  order: initialOrder, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Estados del formulario - EXACTAMENTE IGUAL que NewOrderModal
  const [formData, setFormData] = useState({
    client_id: '',
    unit_type_id: '',
    brand: '',
    model: '',
    license_plate: '',
    department_ids: [] as number[],
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    entry_date: '',
    tasks: '',
    notes: '',
    // ✅ NUEVOS CAMPOS: Información de contacto del cliente
    client_contact_person: '',
    client_phone: ''
  });

  useEffect(() => {
    if (initialOrder && isOpen) {
      loadInitialData();
      loadCatalogs();
    }
  }, [initialOrder, isOpen]);

  const loadInitialData = async () => {
    try {
      // Cargar detalles completos de la orden
      const response = await apiClient.get(`/orders/details.php?id=${initialOrder.id}`);
      if (response.data.success) {
        const orderData = response.data.data;
        
        // Convertir las tareas array a texto
        let tasksText = '';
        if (orderData.tasks && Array.isArray(orderData.tasks)) {
          tasksText = orderData.tasks
            .map((task: any) => task.description)
            .join('\n');
        }
        
        setFormData({
          client_id: String(orderData.client_id || ''),
          unit_type_id: String(orderData.unit_type_id || ''),
          brand: orderData.brand || '',
          model: orderData.model || '',
          license_plate: orderData.license_plate || '',
          department_ids: orderData.departments?.map((d: any) => d.id) || [],
          status: orderData.status || 'pending',
          priority: orderData.priority || 'normal',
          entry_date: orderData.entry_date || '',
          tasks: tasksText,
          notes: orderData.notes || '',
          // ✅ SOLUCIÓN: Cargar datos reales del cliente
          client_contact_person: orderData.client_contact_person || '',
          client_phone: orderData.client_phone || ''
        });
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      // Usar datos básicos si falla
      setFormData({
        client_id: String(initialOrder.client_id || ''),
        unit_type_id: String(initialOrder.unit_type_id || ''),
        brand: initialOrder.brand || '',
        model: initialOrder.model || '',
        license_plate: initialOrder.license_plate || '',
        department_ids: initialOrder.departments?.map((d: any) => d.id) || [],
        status: initialOrder.status || 'pending',
        priority: initialOrder.priority || 'normal',
        entry_date: initialOrder.entry_date || '',
        tasks: '',
        notes: initialOrder.notes || '',
        // ✅ SOLUCIÓN: Intentar cargar desde initialOrder también
        client_contact_person: initialOrder.client_contact_person || '',
        client_phone: initialOrder.client_phone || ''
      });
    }
  };

  const loadCatalogs = async () => {
    try {
      const [clientsRes, deptsRes, unitsRes] = await Promise.all([
        apiClient.get('/clients/'),
        apiClient.get('/orders/departments.php'),
        apiClient.get('/orders/unit-types.php')
      ]);
      
      setClients(clientsRes.data.data || clientsRes.data.clients || []);
      setDepartments(deptsRes.data.departments || []);
      setUnitTypes(unitsRes.data.unit_types || []);
    } catch (error) {
      console.error('Error loading catalogs:', error);
    }
  };

  const toggleDepartment = (deptId: number) => {
    setFormData(prev => ({
      ...prev,
      department_ids: prev.department_ids.includes(deptId)
        ? prev.department_ids.filter(id => id !== deptId)
        : [...prev.department_ids, deptId]
    }));
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.client_id) {
      await dialog.error('Debe seleccionar un cliente', 'Campo Requerido');
      return;
    }
    
    if (!formData.unit_type_id) {
      await dialog.error('Debe seleccionar un tipo de unidad', 'Campo Requerido');
      return;
    }
    
    if (formData.department_ids.length === 0) {
      await dialog.error('Debe seleccionar al menos un departamento', 'Campo Requerido');
      return;
    }

    if (!formData.entry_date) {
      await dialog.error('La fecha de entrada es requerida', 'Campo Requerido');
      return;
    }

    const confirmed = await dialog.confirm(
      '¿Está seguro de guardar los cambios en la orden?',
      'Confirmar Actualización'
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      
      // Convertir el texto de tareas a array
      const tasksArray = formData.tasks
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(description => ({ description, status: 'pending' }));
      
// Preparar datos para enviar
const orderData = {
  client_id: formData.client_id,
  unit_type_id: formData.unit_type_id,
  brand: formData.brand || '',
  model: formData.model || '',
  license_plate: formData.license_plate || '',
  department_ids: formData.department_ids,
  status: formData.status,
  priority: formData.priority,
  entry_date: formData.entry_date,
  description: formData.notes || 'Orden de trabajo actualizada',
  notes: formData.notes || '',
  tasks: tasksArray,
  // ✅ SOLUCIÓN: Incluir campos de contacto del cliente
  client_contact_person: formData.client_contact_person || '',
  client_phone: formData.client_phone || ''
};

      console.log('📤 Actualizando orden:', orderData);

      const response = await apiClient.put(`/orders/update.php?id=${initialOrder.id}`, orderData);

      if (response.data.success) {
        await dialog.success(
          'La orden ha sido actualizada exitosamente.',
          'Orden Actualizada'
        );
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Error updating order:', error);
      await dialog.error(
        error.response?.data?.error || 'No se pudo actualizar la orden. Por favor, inténtalo de nuevo.',
        'Error al actualizar'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="max-w-5xl">
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Editar Orden #{initialOrder?.order_number}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Modifique los datos de la orden de trabajo
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1.5 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenido - IDÉNTICO a NewOrderModal pero sin tabs */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
           {/* Cliente */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Cliente <span className="text-secondary">*</span>
  </label>
  <select
    value={formData.client_id}
    onChange={(e) => {
      const newClientId = e.target.value;
      const selectedClient = clients.find(c => String(c.id) === newClientId);
      
      setFormData(prev => ({
        ...prev,
        client_id: newClientId,
        // ✅ AUTORRELLENADO: Al cambiar cliente, cargar sus datos de contacto
        client_contact_person: selectedClient?.contact_person || '',
        client_phone: selectedClient?.phone || ''
      }));
    }}  // ✅ Línea mejorada
    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
  >
    <option value="">Seleccione un cliente</option>
    {clients.map(client => (
      <option key={client.id} value={client.id}>
        {client.name} - {client.cif_nif}
      </option>
    ))}
  </select>
</div>

{/* ✅ CAMPOS DE CONTACTO DEL CLIENTE - Solo aparecen si hay cliente seleccionado */}
{formData.client_id && (
  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
      <User className="h-4 w-4 mr-1" />
      Información de Contacto
    </h4>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Persona de Contacto
        </label>
        <input
          type="text"
          value={formData.client_contact_person}
          onChange={(e) => setFormData({ ...formData, client_contact_person: e.target.value })}
          placeholder="Ej: Juan Pérez"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teléfono de Contacto
        </label>
        <input
          type="tel"
          value={formData.client_phone}
          onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
          placeholder="Ej: 612 345 678"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
        />
      </div>
    </div>
  </div>
)}


            {/* Información del Vehículo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Unidad <span className="text-secondary">*</span>
                </label>
                <select
                  value={formData.unit_type_id}
                  onChange={(e) => setFormData({ ...formData, unit_type_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                >
                  <option value="">Seleccione un tipo</option>
                  {unitTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matrícula
                </label>
                <input
                  type="text"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                  placeholder="1234-ABC"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Ej: Mercedes-Benz"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Ej: Actros 2545"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                />
              </div>
            </div>

            {/* Departamentos - VERSION RESPONSIVE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Departamentos <span className="text-secondary">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {departments.map((dept) => {
                  let DeptIcon = Wrench;
                  const deptNameLower = dept.name.toLowerCase();
                  
                  if (deptNameLower.includes('mecanica') || deptNameLower.includes('mecánica')) {
                    DeptIcon = Wrench;
                  } else if (deptNameLower.includes('electric') || deptNameLower.includes('eléctric')) {
                    DeptIcon = Zap;
                  } else if (deptNameLower.includes('chapa') || deptNameLower.includes('pintura')) {
                    DeptIcon = Paintbrush;
                  } else if (deptNameLower.includes('hidraulica') || deptNameLower.includes('hidráulica')) {
                    DeptIcon = Droplets;
                  }
                  
                  const isSelected = formData.department_ids.includes(dept.id);
                  
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => toggleDepartment(dept.id)}
                      className={`relative px-3 py-2.5 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary-dark bg-primary-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-primary-dark' : 'bg-gray-100'
                        }`}>
                          <DeptIcon className={`h-4 w-4 ${
                            isSelected ? 'text-white' : 'text-gray-500'
                          }`} />
                        </div>
                        <span className={`text-sm font-medium flex-1 text-left ${
                          isSelected ? 'text-primary-dark' : 'text-gray-700'
                        }`}>
                          {dept.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1">
                          <Check className="h-3.5 w-3.5 text-primary-dark" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fecha, Estado y Prioridad */}
            <div className="grid grid-cols-3 gap-4">
              <CustomDatePicker
                label="Fecha de Entrada"
                value={formData.entry_date}
                onChange={(date) => setFormData({ ...formData, entry_date: date })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                >
                  <option value="low">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>

            {/* Trabajos a Realizar - SIMPLIFICADO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Wrench className="inline-block w-4 h-4 mr-1" />
                Trabajos a Realizar
              </label>
              <textarea
                value={formData.tasks}
                onChange={(e) => setFormData({ ...formData, tasks: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark resize-none"
                placeholder="Escriba cada tarea en una línea separada...&#10;&#10;Ejemplo:&#10;- Cambiar aceite motor&#10;- Revisar frenos&#10;- Cambiar filtro de aire"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cada línea se guardará como una tarea independiente
              </p>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="inline-block w-4 h-4 mr-1" />
                Observaciones / Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark resize-none"
                placeholder="Añade cualquier observación o nota relevante sobre esta orden..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              let baseUrl = apiClient.defaults.baseURL;
              if (baseUrl && !baseUrl.endsWith('/')) {
                baseUrl += '/';
              }
              const pdfUrl = `${baseUrl}orders/pdf-tcpdf-adaptive.php?id=${initialOrder.id}`;
              window.open(pdfUrl, '_blank', 'noopener,noreferrer');
              //dialog.success(`PDF de la orden ${initialOrder.order_number} abierto para imprimir`);
            }}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir PDF
          </Button>
          
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary-dark hover:bg-primary-dark/90 shadow-sm flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditOrderModal;
