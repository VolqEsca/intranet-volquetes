// src/pages/ManufacturingOrders/components/NewManufacturingOrderModal.tsx
import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, User, Car, FileText, Check, AlertTriangle, Wrench, FileEdit } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import CustomDatePicker from '../../../components/ui/CustomDatePicker';
import { manufacturingAPI, ManufacturingOrderFormData } from '../../../api/manufacturing';
import { dialog } from '../../../services/dialog.service';

interface NewManufacturingOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

const NewManufacturingOrderModal: React.FC<NewManufacturingOrderModalProps> = ({ 
  isOpen, 
  onClose, 
  onOrderCreated 
}) => {
  const [activeTab, setActiveTab] = useState(0);
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
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const tabs = [
    { id: 'client', label: 'Cliente', icon: User },
    { id: 'vehicle', label: 'Vehículo', icon: Car },
    { id: 'order', label: 'Detalles', icon: FileText }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 0: // Cliente
        if (!formData.client_name.trim()) newErrors.client_name = 'El nombre del cliente es requerido';
        break;
      case 1: // Vehículo - campos opcionales
        break;
      case 2: // Detalles - campos opcionales por ahora
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    const isValid = validateStep(activeTab);
    
    if (!isValid) {
      await dialog.error(
        'Por favor, complete todos los campos requeridos antes de continuar.',
        'Campos Requeridos'
      );
      return;
    }
    
    if (activeTab < tabs.length - 1) {
      setActiveTab(activeTab + 1);
    }
  };

  const handlePrevious = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  const handleCreateOrder = async () => {
    let hasErrors = false;
    for (let i = 0; i < tabs.length; i++) {
      if (!validateStep(i)) {
        hasErrors = true;
        setActiveTab(i);
        break;
      }
    }
    
    if (hasErrors) {
      await dialog.error(
        'Por favor, complete todos los campos requeridos antes de crear la orden.',
        'Campos Requeridos'
      );
      return;
    }
    
    setLoading(true);
    try {
      const description = formData.description?.trim() || '';
      const observations = formData.observations?.trim() || '';
      
      const combinedDescription = observations
        ? `${description}${description ? '\n\n' : ''}--- OBSERVACIONES ---\n${observations}`
        : description;

      // ✅ CORREGIDO: Envía fechas como string directamente (sin conversión a Date)
      const orderData: ManufacturingOrderFormData = {
        client_name: formData.client_name,
        bodywork_type: formData.bodywork_type,
        brand: formData.brand,
        model: formData.model,
        chassis_number: formData.chassis_number,
        budget_number: formData.budget_number,
        order_date: formData.order_date || null,           // ✅ string | null
        vehicle_reception_date: formData.vehicle_reception_date || null,
        expected_completion_date: formData.expected_completion_date || null,
        description: combinedDescription,
        priority: formData.priority
      };
      
      console.log('📤 Enviando orden de fabricación:', orderData);
      
      await manufacturingAPI.create(orderData);
      
      await dialog.success(
        'La orden de fabricación ha sido creada exitosamente.',
        'Orden Creada'
      );
      
      onOrderCreated();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error creating manufacturing order:', error);
      console.error('Response data:', error.response?.data);
      
      await dialog.error(
        error.response?.data?.message || 'No se pudo crear la orden. Por favor, inténtalo de nuevo.',
        'Error al crear la orden'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
      priority: 'medium'
    });
    setErrors({});
    setActiveTab(0);
  };

  const calculateProgress = () => {
    let progress = 0;
    if (formData.client_name.trim()) progress += 33;
    if (formData.bodywork_type || formData.brand || formData.model || formData.chassis_number) progress += 33;
    if (formData.order_date || formData.description || formData.observations || formData.budget_number) progress += 34;
    return progress;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="max-w-5xl">
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        {/* Header con barra de progreso */}
        <div className="bg-white px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nueva Orden de Fabricación</h2>
              <p className="text-sm text-gray-500 mt-0.5">Complete los datos para crear una nueva orden</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1.5 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-primary-dark h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
          
          <div className="flex space-x-1">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === index;
              const isCompleted = 
                (index === 0 && formData.client_name.trim()) ||
                (index === 1 && (formData.bodywork_type || formData.brand || formData.model || formData.chassis_number)) ||
                (index === 2 && (formData.order_date || formData.description || formData.observations || formData.budget_number));
              
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(index)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary-dark text-white'
                      : isCompleted
                      ? 'bg-primary-50 text-primary-dark hover:bg-primary-100'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                  {isCompleted && !isActive && (
                    <Check className="w-4 h-4 ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido con altura fija */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab Cliente */}
          {activeTab === 0 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Cliente <span className="text-secondary">*</span>
                </label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => {
                    setFormData({ ...formData, client_name: e.target.value });
                    setErrors({ ...errors, client_name: '' });
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark ${
                    errors.client_name ? 'border-secondary' : 'border-gray-300'
                  }`}
                  placeholder="Introduce el nombre del cliente"
                />
                {errors.client_name && <p className="mt-1 text-sm text-secondary">{errors.client_name}</p>}
              </div>
            </div>
          )}

          {/* Tab Vehículo */}
          {activeTab === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Carrozado
                  </label>
                  <input
                    type="text"
                    value={formData.bodywork_type}
                    onChange={(e) => setFormData({ ...formData, bodywork_type: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
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
                    onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                    placeholder="Número de bastidor (texto libre)"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
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
                    onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                    placeholder="Ej: Sprinter, Daily, R450..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab Detalles */}
          {activeTab === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
              <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Número de Presupuesto
  </label>
  <input
    type="text"
    value={formData.budget_number}
    onChange={(e) => setFormData({ ...formData, budget_number: e.target.value })}
    onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
    placeholder="Ej: PRES-2025-001"
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
                    onChange={(date) => {
                      setFormData({ ...formData, order_date: date });
                      setErrors({ ...errors, order_date: '' });
                    }}
                    error={!!errors.order_date}
                  />
                  {errors.order_date && (
                    <p className="mt-1 text-sm text-secondary">{errors.order_date}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
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

              <div className="grid grid-cols-3 gap-4">
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
          )}
        </div>

        {/* Footer con navegación */}
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeTab > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            
            {activeTab < tabs.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-2"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleCreateOrder}
                disabled={loading}
                className="bg-primary-dark hover:bg-primary-dark/90 shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creando...
                  </>
                ) : (
                  'Crear Orden'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default NewManufacturingOrderModal;
