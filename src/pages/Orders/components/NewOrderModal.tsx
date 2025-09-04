// src/pages/Orders/components/NewOrderModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronRight, ChevronLeft, User, Building2, Wrench, Calendar, AlertTriangle, Search, Check, AlertCircle, Zap, Paintbrush, Droplets, FileText } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import CustomDatePicker from '../../../components/ui/CustomDatePicker';
import { apiClient } from '../../../api';
import { dialog } from '../../../services/dialog.service';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
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

// Componente CustomSelect mejorado con búsqueda inteligente
const CustomSelect: React.FC<{
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  options: Array<{ id: string | number; name: string; subtitle?: string; extra?: string }>;
  placeholder: string;
  error?: string;
  required?: boolean;
  searchable?: boolean;
  icon?: React.ReactNode;
  showRecent?: boolean;
  recentIds?: (string | number)[];
}> = ({ label, value, onChange, options, placeholder, error, required, searchable = false, icon, showRecent = false, recentIds = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  // Función de búsqueda fuzzy mejorada
  const searchScore = (text: string, query: string): number => {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Coincidencia exacta
    if (textLower === queryLower) return 100;
    
    // Empieza con la búsqueda
    if (textLower.startsWith(queryLower)) return 90;
    
    // Contiene la búsqueda completa
    if (textLower.includes(queryLower)) return 80;
    
    // Búsqueda por palabras
    const queryWords = queryLower.split(' ').filter(w => w.length > 0);
    const textWords = textLower.split(' ');
    let wordScore = 0;
    
    queryWords.forEach(queryWord => {
      if (textWords.some(textWord => textWord.startsWith(queryWord))) {
        wordScore += 50 / queryWords.length;
      } else if (textWords.some(textWord => textWord.includes(queryWord))) {
        wordScore += 30 / queryWords.length;
      }
    });
    
    // Búsqueda por caracteres (fuzzy)
    let charScore = 0;
    let lastIndex = -1;
    for (const char of queryLower) {
      const index = textLower.indexOf(char, lastIndex + 1);
      if (index > -1) {
        charScore += 20 / queryLower.length;
        lastIndex = index;
      }
    }
    
    return Math.max(wordScore, charScore);
  };
  
  // Filtrar y ordenar opciones
  const getFilteredOptions = () => {
    if (!searchable || !search) {
      // Si hay recientes y no hay búsqueda, mostrarlos primero
      if (showRecent && recentIds.length > 0) {
        const recentOptions = options.filter(opt => recentIds.includes(opt.id));
        const otherOptions = options.filter(opt => !recentIds.includes(opt.id));
        return [...recentOptions, ...otherOptions];
      }
      return options;
    }
    
    // Calcular scores para cada opción
    const scoredOptions = options.map(option => {
      const nameScore = searchScore(option.name, search);
      const subtitleScore = option.subtitle ? searchScore(option.subtitle, search) : 0;
      const extraScore = option.extra ? searchScore(option.extra, search) : 0;
      
      return {
        option,
        score: Math.max(nameScore, subtitleScore * 0.8, extraScore * 0.6)
      };
    });
    
    // Filtrar por score mínimo y ordenar
    return scoredOptions
      .filter(item => item.score > 20)
      .sort((a, b) => b.score - a.score)
      .map(item => item.option);
  };
  
  const filteredOptions = getFilteredOptions();
  const selectedOption = options.find(opt => opt.id === value);
  
  // Highlight del texto que coincide
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={index} className="font-semibold text-primary-dark bg-primary-50 px-0.5 rounded">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };
  
  // Manejo del teclado
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredOptions[highlightedIndex]) {
            onChange(filteredOptions[highlightedIndex].id);
            setIsOpen(false);
            setSearch('');
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearch('');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions, onChange]);
  
  // Reset highlighted index cuando cambian las opciones filtradas
  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);
  
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-secondary">*</span>}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 text-left bg-white border rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-primary-dark transition-colors ${
          error ? 'border-secondary' : 'border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <span className="text-gray-400">{icon}</span>}
            {selectedOption ? (
              <div>
                <span className="text-gray-900">{selectedOption.name}</span>
                {selectedOption.subtitle && (
                  <span className="text-gray-500 text-sm ml-2">({selectedOption.subtitle})</span>
                )}
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
            {searchable && (
              <div className="p-2 border-b sticky top-0 bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre, CIF/NIF o teléfono..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
              </div>
            )}
            
            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <Search className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-500">No se encontraron resultados</p>
                  {search && (
                    <p className="text-xs text-gray-400 mt-1">
                      Intenta con otro término de búsqueda
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {showRecent && recentIds.length > 0 && !search && (
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                      RECIENTES
                    </div>
                  )}
                  {filteredOptions.map((option, index) => {
                    const isRecent = showRecent && recentIds.includes(option.id) && !search;
                    const isHighlighted = index === highlightedIndex;
                    
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          onChange(option.id);
                          setIsOpen(false);
                          setSearch('');
                        }}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                          value === option.id ? 'bg-primary-50' : ''
                        } ${isHighlighted ? 'bg-gray-100' : ''} ${
                          isRecent ? 'border-l-4 border-primary-dark' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {searchable && search ? highlightMatch(option.name, search) : option.name}
                              </span>
                              {isRecent && (
                                <span className="text-xs bg-primary-100 text-primary-dark px-1.5 py-0.5 rounded">
                                  Reciente
                                </span>
                              )}
                            </div>
                            {(option.subtitle || option.extra) && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {option.subtitle && (
                                  <span>
                                    {searchable && search ? highlightMatch(option.subtitle, search) : option.subtitle}
                                  </span>
                                )}
                                {option.subtitle && option.extra && <span className="mx-1">•</span>}
                                {option.extra && (
                                  <span>
                                    {searchable && search ? highlightMatch(option.extra, search) : option.extra}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {value === option.id && (
                            <Check className="h-4 w-4 text-primary-600 flex-shrink-0 ml-2" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
            
            {searchable && filteredOptions.length > 0 && (
              <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-t">
                {filteredOptions.length} resultado{filteredOptions.length !== 1 ? 's' : ''} • 
                Usa <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">↑↓</kbd> para navegar, 
                <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs ml-1">Enter</kbd> para seleccionar
              </div>
            )}
          </div>
        </>
      )}
      
      {error && <p className="mt-1 text-sm text-secondary">{error}</p>}
    </div>
  );
};

const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose, onOrderCreated }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    client_id: '',
    unit_type_id: '',
    brand: '',
    model: '',
    license_plate: '',
    department_ids: [] as number[],
    status: 'pending',
    priority: 'normal',
    entry_date: new Date().toISOString().split('T')[0],
    tasks: '', // CAMBIADO: de array a string
    notes: ''
  });

  const [newClientData, setNewClientData] = useState({
    name: '',
    cif_nif: '',
    contact_person: '',
    phone: '',
    notes: ''
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [savingClient, setSavingClient] = useState(false);

  // Configuración de tabs
  const tabs = [
    { id: 'client', label: 'Cliente', icon: User },
    { id: 'vehicle', label: 'Vehículo', icon: Building2 },
    { id: 'order', label: 'Detalles', icon: Wrench }
  ];

  // Funciones para manejar clientes recientes
  const getRecentClientIds = (): number[] => {
    const stored = localStorage.getItem('recentClientIds');
    return stored ? JSON.parse(stored).slice(0, 5) : [];
  };

  const saveRecentClient = (clientId: number) => {
    const recent = getRecentClientIds();
    const updated = [clientId, ...recent.filter(id => id !== clientId)].slice(0, 5);
    localStorage.setItem('recentClientIds', JSON.stringify(updated));
  };

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
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
      console.error('Error fetching data:', error);
    }
  };

  // Validación por pasos - solo marca errores, NO muestra popups
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 0: // Cliente
        if (!formData.client_id) newErrors.client_id = 'Seleccione un cliente';
        break;
      case 1: // Vehículo
        if (!formData.unit_type_id) newErrors.unit_type_id = 'Seleccione el tipo de unidad';
        break;
      case 2: // Detalles
        if (formData.department_ids.length === 0) newErrors.department_ids = 'Seleccione al menos un departamento';
        if (!formData.entry_date) newErrors.entry_date = 'La fecha de entrada es requerida';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navegación entre tabs
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

  // NO VALIDAR AL CAMBIAR DE TAB
  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  const handleCreateOrder = async () => {
    // Validar todos los pasos
    let hasErrors = false;
    for (let i = 0; i <= 2; i++) {
      if (!validateStep(i)) {
        hasErrors = true;
        setActiveTab(i);
        break;
      }
    }
    
    if (hasErrors) {
      await dialog.error(
        'Por favor, complete todos los campos requeridos antes de continuar.',
        'Campos Requeridos'
      );
      return;
    }
    
    setLoading(true);
    try {
      // Convertir el texto de tareas a array
      const tasksArray = formData.tasks
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(description => ({ description }));
      
      // Preparar los datos para enviar
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
        description: formData.notes || 'Orden de trabajo',
        notes: formData.notes || '',
        tasks: tasksArray
      };
      
      console.log('📤 Enviando orden:', orderData); // Debug
      
      const response = await apiClient.post('/orders/', orderData);
      
      await dialog.success(
        'La orden de trabajo ha sido creada exitosamente.',
        'Orden Creada'
      );
      
      onOrderCreated();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error creating order:', error);
      console.error('Response data:', error.response?.data); // Debug adicional
      
      await dialog.error(
        error.response?.data?.error || 'No se pudo crear la orden. Por favor, inténtalo de nuevo.',
        'Error al crear la orden'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    const clientErrors: Record<string, string> = {};
    if (!newClientData.name) clientErrors.name = 'El nombre es requerido';
    if (!newClientData.cif_nif) clientErrors.cif_nif = 'El CIF/NIF es requerido';
    
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }
    
    setSavingClient(true);
    try {
      const response = await apiClient.post('/clients/', {
        ...newClientData,
        email: '',
        address: '',
        active: true
      });
      
      const newClient = response.data;
      const newClientId = response.data.id;
      
      // Recargar la lista de clientes
      await fetchInitialData();
      
      // Seleccionar el nuevo cliente
      setFormData({ ...formData, client_id: newClientId });
      saveRecentClient(newClientId);
      
      setNewClientData({
        name: '',
        cif_nif: '',
        contact_person: '',
        phone: '',
        notes: ''
      });
      setShowNewClientForm(false);
      setErrors({});
      
      await dialog.success(
        `Cliente "${newClientData.name}" creado y seleccionado correctamente.`,
        'Cliente Creado'
      );
    } catch (error: any) {
      console.error('Error creating client:', error);
      await dialog.error(
        error.response?.data?.error || 'No se pudo crear el cliente. Por favor, inténtalo de nuevo.',
        'Error al crear cliente'
      );
    } finally {
      setSavingClient(false);
    }
  };

  const toggleDepartment = (deptId: number) => {
    setFormData(prev => ({
      ...prev,
      department_ids: prev.department_ids.includes(deptId)
        ? prev.department_ids.filter(id => id !== deptId)
        : [...prev.department_ids, deptId]
    }));
    setErrors({ ...errors, department_ids: '' });
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      unit_type_id: '',
      brand: '',
      model: '',
      license_plate: '',
      department_ids: [],
      status: 'pending',
      priority: 'normal',
      entry_date: new Date().toISOString().split('T')[0],
      tasks: '',
      notes: ''
    });
    setNewClientData({
      name: '',
      cif_nif: '',
      contact_person: '',
      phone: '',
      notes: ''
    });
    setErrors({});
    setShowNewClientForm(false);
    setActiveTab(0);
  };

  // Preparar opciones para los selects con información adicional
  const clientOptions = clients.map(client => ({
    id: client.id,
    name: client.name,
    subtitle: client.cif_nif,
    extra: client.phone
  }));

  const unitTypeOptions = unitTypes.map(type => ({
    id: type.id,
    name: type.name
  }));

  // Calcular progreso
  const calculateProgress = () => {
    let progress = 0;
    if (formData.client_id) progress += 33;
    if (formData.unit_type_id) progress += 33;
    if (formData.department_ids.length > 0 && formData.entry_date) progress += 34;
    return progress;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="max-w-5xl">
      <div className="flex flex-col h-[calc(100vh-10rem)]">
        {/* Header con barra de progreso */}
        <div className="bg-white px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nueva Orden de Trabajo</h2>
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
          
          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-primary-dark h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
          
          {/* Tabs con mejor diseño */}
          <div className="flex space-x-1">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === index;
              const isCompleted = 
                (index === 0 && formData.client_id) ||
                (index === 1 && formData.unit_type_id) ||
                (index === 2 && formData.department_ids.length > 0);
              
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
              {!showNewClientForm ? (
                <>
                  <CustomSelect
                    label="Cliente"
                    value={formData.client_id}
                    onChange={(value) => {
                      setFormData({ ...formData, client_id: value as string });
                      setErrors({ ...errors, client_id: '' });
                      saveRecentClient(Number(value));
                    }}
                    options={clientOptions}
                    placeholder="Seleccione un cliente"
                    error={errors.client_id}
                    required
                    searchable
                    showRecent
                    recentIds={getRecentClientIds()}
                    icon={<User className="h-4 w-4" />}
                  />
                  
                  <div className="flex items-center justify-center py-4">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="px-4 text-sm text-gray-500">o</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setShowNewClientForm(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Crear nuevo cliente
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Nuevo Cliente</h3>
                    <button
                      type="button"
                      onClick={() => setShowNewClientForm(false)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre <span className="text-secondary">*</span>
                      </label>
                      <input
                        type="text"
                        value={newClientData.name}
                        onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark ${
                          errors.name ? 'border-secondary' : 'border-gray-300'
                        }`}
                        placeholder="Nombre del cliente"
                      />
                      {errors.name && <p className="mt-1 text-sm text-secondary">{errors.name}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CIF/NIF <span className="text-secondary">*</span>
                      </label>
                      <input
                        type="text"
                        value={newClientData.cif_nif}
                        onChange={(e) => setNewClientData({ ...newClientData, cif_nif: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark ${
                          errors.cif_nif ? 'border-secondary' : 'border-gray-300'
                        }`}
                        placeholder="B12345678"
                      />
                      {errors.cif_nif && <p className="mt-1 text-sm text-secondary">{errors.cif_nif}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Persona de Contacto
                      </label>
                      <input
                        type="text"
                        value={newClientData.contact_person}
                        onChange={(e) => setNewClientData({ ...newClientData, contact_person: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                        placeholder="Juan Pérez"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={newClientData.phone}
                        onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                        placeholder="666 777 888"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas
                    </label>
                    <textarea
                      value={newClientData.notes}
                      onChange={(e) => setNewClientData({ ...newClientData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark resize-none"
                      placeholder="Observaciones adicionales..."
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleCreateClient}
                    disabled={savingClient}
                    className="w-full"
                  >
                    {savingClient ? 'Guardando...' : 'Guardar Cliente'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Tab Vehículo */}
          {activeTab === 1 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="grid grid-cols-2 gap-6">
                <CustomSelect
                  label="Tipo de Unidad"
                  value={formData.unit_type_id}
                  onChange={(value) => {
                    setFormData({ ...formData, unit_type_id: value as string });
                    setErrors({ ...errors, unit_type_id: '' });
                  }}
                  options={unitTypeOptions}
                  placeholder="Seleccione un tipo"
                  error={errors.unit_type_id}
                  required
                  icon={<Building2 className="h-4 w-4" />}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Matrícula
                  </label>
                  <input
                    type="text"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
                    onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                    placeholder="1234-ABC"
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
                    onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                    placeholder="Ej: Actros 2545"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab Detalles */}
          {activeTab === 2 && (
            <div className="space-y-6">
              {/* Departamentos - VERSION RESPONSIVE ACTUALIZADA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Departamentos <span className="text-secondary">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
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
                {errors.department_ids && (
                  <p className="mt-2 text-sm text-secondary">{errors.department_ids}</p>
                )}
              </div>

              {/* Fecha de entrada, Estado y Prioridad en la misma línea */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <CustomDatePicker
                    label="Fecha de Entrada"
                    value={formData.entry_date}
                    onChange={(date) => {
                      setFormData({ ...formData, entry_date: date });
                      setErrors({ ...errors, entry_date: '' });
                    }}
                    error={!!errors.entry_date}
                    required
                  />
                  {errors.entry_date && (
                    <p className="mt-1 text-sm text-secondary">{errors.entry_date}</p>
                  )}
                </div>

                <CustomSelect
                  label="Estado"
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value as string })}
                  options={[
                    { id: 'pending', name: 'Pendiente' },
                    { id: 'in_progress', name: 'En Progreso' },
                    { id: 'completed', name: 'Completado' },
                    { id: 'cancelled', name: 'Cancelado' }
                  ]}
                  placeholder="Seleccione estado"
                  icon={<AlertCircle className="h-4 w-4" />}
                />

                <CustomSelect
                  label="Prioridad"
                  value={formData.priority}
                  onChange={(value) => setFormData({ ...formData, priority: value as string })}
                  options={[
                    { id: 'low', name: 'Baja' },
                    { id: 'normal', name: 'Normal' },
                    { id: 'high', name: 'Alta' },
                    { id: 'urgent', name: 'Urgente' }
                  ]}
                  placeholder="Seleccione prioridad"
                  icon={<AlertTriangle className="h-4 w-4" />}
                />
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

              {/* Campo de observaciones/notas al final */}
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
          )}
        </div>

        {/* Footer con navegación mejorada */}
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

export default NewOrderModal;
