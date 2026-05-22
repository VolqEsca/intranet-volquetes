// src/pages/ManufacturingOrders/components/EditManufacturingOrderModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Save, User, Wrench, AlertTriangle, FileEdit, Printer } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import CustomDatePicker from '../../../components/ui/CustomDatePicker';
import { manufacturingAPI } from '../../../api/manufacturing';
import { dialog } from '../../../services/dialog.service';
import { apiErrorMessage } from '../../../utils/error';

interface EditManufacturingOrderModalProps {
  orderId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const EditManufacturingOrderModal: React.FC<EditManufacturingOrderModalProps> = ({
  orderId,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [orderNumber, setOrderNumber] = useState('');
  
  // ✅ ESTRUCTURA IDÉNTICA AL MODAL DE REPARACIÓN - Formulario único sin pestañas
  const [formData, setFormData] = useState({
    client_name: '',
    bodywork_type: '',
    brand: '',
    model: '',
    chassis_number: '',
    budget_number: '',
    order_date: '',
    vehicle_reception_date: '',
    expected_completion_date: '',
    description: '',
    observations: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'delivered'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ✅ FUNCIÓN DE CONVERSIÓN DE FECHAS: dd/mm/yyyy → yyyy-mm-dd
  const convertDateFormat = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    
    // Si ya está en formato yyyy-mm-dd, devolverlo tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Convertir dd/mm/yyyy a yyyy-mm-dd
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return '';
  };

  // ✅ FUNCIÓN PARA SEPARAR DESCRIPCIÓN Y OBSERVACIONES
  const splitDescriptionAndObservations = (fullDescription: string) => {
    let description = fullDescription || '';
    let observations = '';
    
    const markers = ['--- OBSERVACIONES ---\n', '---\nObservaciones:\n'];
    
    for (const marker of markers) {
      if (description.includes(marker)) {
        const parts = description.split(marker);
        description = parts[0].trim();
        observations = parts[1]?.trim() || '';
        break;
      }
    }
    
    return { description, observations };
  };

  useEffect(() => {
    if (orderId) {
      loadOrderData();
    }
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      setLoadingData(true);
      const response = await manufacturingAPI.details(orderId);
      // ✅ ADAPTACIÓN: El backend devuelve datos directamente (sin wrapper success/data)
      const orderData = response.data?.data || response.data;
      
      if (!orderData || !orderData.id) {
        throw new Error('No se encontraron datos válidos en la respuesta');
      }

      setOrderNumber(orderData.order_number || 'Sin número');
      
      // ✅ SEPARACIÓN INTELIGENTE: Descripción y observaciones
      const { description, observations } = splitDescriptionAndObservations(orderData.description);
      
      // ✅ MAPEO COMPLETO DE DATOS CON CONVERSIÓN DE FECHAS
      setFormData({
        client_name: orderData.client_name || '',
        bodywork_type: orderData.bodywork_type || '',
        brand: orderData.brand || '',
        model: orderData.model || '',
        chassis_number: orderData.chassis_number || '',
        budget_number: orderData.budget_number || '',
        order_date: convertDateFormat(orderData.order_date),
        vehicle_reception_date: convertDateFormat(orderData.vehicle_reception_date),
        expected_completion_date: convertDateFormat(orderData.expected_completion_date),
        description: description,
        observations: observations,
        priority: orderData.priority || 'medium',
        status: orderData.status || 'pending'
      });
      
    } catch (error: unknown) {
      console.error('❌ Error loading order data:', error);
      await dialog.error(
        apiErrorMessage(error, 'No se pudieron cargar los datos de la orden'),
        'Error de Carga'
      );
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    // ✅ VALIDACIONES BÁSICAS
    if (!formData.client_name.trim()) {
      await dialog.error('El nombre del cliente es requerido', 'Campo Requerido');
      return;
    }

    const confirmed = await dialog.confirm(
      `¿Está seguro de guardar los cambios en la orden ${orderNumber}?`,
      'Confirmar Actualización'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      // ✅ COMBINAR DESCRIPCIÓN Y OBSERVACIONES
      const description = formData.description?.trim() || '';
      const observations = formData.observations?.trim() || '';
      
      const combinedDescription = observations
        ? `${description}${description ? '\n\n' : ''}--- OBSERVACIONES ---\n${observations}`
        : description;

      const orderData = {
        client_name: formData.client_name,
        bodywork_type: formData.bodywork_type,
        brand: formData.brand,
        model: formData.model,
        chassis_number: formData.chassis_number,
        budget_number: formData.budget_number,
        order_date: formData.order_date || null,
        vehicle_reception_date: formData.vehicle_reception_date || null,
        expected_completion_date: formData.expected_completion_date || null,
        description: combinedDescription,
        priority: formData.priority,
        status: formData.status
      };
      
      await manufacturingAPI.update(orderId, orderData);
      
      await dialog.success(
        `La orden ${orderNumber} ha sido actualizada exitosamente.`,
        'Orden Actualizada'
      );
      
      onSuccess();
    } catch (error: unknown) {
      console.error('Error updating manufacturing order:', error);
      await dialog.error(
        apiErrorMessage(error, 'No se pudo actualizar la orden. Por favor, inténtalo de nuevo.'),
        'Error al actualizar la orden'
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ LOADING STATE ELEGANTE
  if (loadingData) {
    return (
      <div className="flex flex-col max-h-[90vh]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos de la orden...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* ✅ HEADER IDÉNTICO AL MODAL DE REPARACIÓN */}
      <div className="bg-white px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Editar Orden de Fabricación #{orderNumber}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Modifique los datos de la orden de fabricación
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

      {/* ✅ CONTENIDO - FORMULARIO ÚNICO COMO REPARACIÓN (SIN PESTAÑAS) */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente <span className="text-secondary">*</span>
            </label>
            <input
              type="text"
              value={formData.client_name}
              onChange={(e) => {
                setFormData({ ...formData, client_name: e.target.value });
                if (errors.client_name) setErrors({ ...errors, client_name: '' });
              }}
              placeholder="Introduce el nombre del cliente"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark ${
                errors.client_name ? 'border-secondary' : 'border-gray-300'
              }`}
            />
            {errors.client_name && <p className="mt-1 text-sm text-secondary">{errors.client_name}</p>}
          </div>

          {/* ✅ INFORMACIÓN DEL VEHÍCULO - Adaptada para fabricación */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Carrozado
              </label>
              <input
                type="text"
                value={formData.bodywork_type}
                onChange={(e) => setFormData({ ...formData, bodywork_type: e.target.value })}
                placeholder="Ej: Furgón isotermo, Plataforma basculante..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Bastidor
              </label>
              <input
                type="text"
                value={formData.chassis_number}
                onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value })}
                placeholder="Número de bastidor"
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
                placeholder="Ej: Mercedes, Iveco, Scania..."
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
                placeholder="Ej: Sprinter, Daily, R450..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
              />
            </div>
          </div>

          {/* ✅ INFORMACIÓN ADMINISTRATIVA */}
          <div className="grid grid-cols-2 gap-4">
          <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Número de Presupuesto
  </label>
  <input
    type="text"
    value={formData.budget_number}
    onChange={(e) => setFormData({ ...formData, budget_number: e.target.value })}
    placeholder="Ej: PRES-2025-001"
    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
    autoComplete="off"             // ✅ SOLUCIÓN PRINCIPAL
    data-form-type="other"         // ✅ Clasifica como NO financiero
    data-lpignore="true"           // ✅ LastPass
    data-1p-ignore="true"          // ✅ 1Password
    data-bwignore="true"           // ✅ Bitwarden
    autoCorrect="off"              // ✅ Evita corrección automática
    spellCheck="false"             // ✅ Sin corrector ortográfico
  />
</div>

            <div>
              <CustomDatePicker
                label="Fecha del Pedido"
                value={formData.order_date}
                onChange={(date) => setFormData({ ...formData, order_date: date })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <CustomDatePicker
                label="Fecha de Recepción del Vehículo"
                value={formData.vehicle_reception_date}
                onChange={(date) => setFormData({ ...formData, vehicle_reception_date: date })}
              />
            </div>

            <div>
              <CustomDatePicker
                label="Fecha de Finalización Prevista"
                value={formData.expected_completion_date}
                onChange={(date) => setFormData({ ...formData, expected_completion_date: date })}
              />
            </div>
          </div>

          {/* ✅ ESTADO Y PRIORIDAD */}
          <div className="grid grid-cols-2 gap-4">
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
                <option value="completed">Completada</option>
                <option value="delivered">Entregada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                Prioridad 
                <AlertTriangle className="w-4 h-4 text-gray-400 ml-2" />
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          {/* ✅ DESCRIPCIÓN DE TRABAJOS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Wrench className="inline-block w-4 h-4 mr-1" />
              Descripción de los Trabajos a Realizar
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark resize-none"
              placeholder="Describe aquí todos los trabajos de fabricación a realizar..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Descripción detallada de todos los trabajos de fabricación necesarios
            </p>
          </div>

          {/* ✅ OBSERVACIONES */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileEdit className="inline-block w-4 h-4 mr-1" />
              Observaciones / Notas
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark resize-none"
              placeholder="Notas adicionales, consideraciones especiales, instrucciones particulares..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Campo opcional para información adicional no crítica
            </p>
          </div>
        </div>
      </div>

      {/* ✅ FOOTER IDÉNTICO AL MODAL DE REPARACIÓN */}
      <div className="border-t border-[#e2e8f0] px-6 py-4 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="subtle"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const pdfUrl = manufacturingAPI.getPdfUrl(orderId);
            window.open(pdfUrl, '_blank', 'noopener,noreferrer');
          }}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Imprimir PDF
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Guardando...
            </>
          ) : (
            'Guardar Cambios'
          )}
        </Button>
      </div>
    </div>
  );
};

export { EditManufacturingOrderModal };
