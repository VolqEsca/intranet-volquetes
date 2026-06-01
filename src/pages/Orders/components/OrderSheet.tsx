import React, { useState, useEffect } from 'react';
import { Save, Plus, Printer, Zap, Paintbrush, Droplets, Wrench, Check, User, FileText } from 'lucide-react';
import { Sheet } from '../../../components/ui/Sheet';
import { Button } from '../../../components/ui/Button';
import CustomDatePicker from '../../../components/ui/CustomDatePicker';
import { ClientCombobox } from './ClientCombobox';
import { QuickCreateClientSheet } from './QuickCreateClientSheet';
import { ClientEditModal } from './ClientEditModal';
import { apiClient } from '../../../api';
import { apiErrorMessage } from '../../../utils/error';
import { OrderFormData } from '../../../types/order';

interface OrderSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId?: number;
}

interface Department {
  id: number;
  name: string;
}

interface UnitType {
  id: number;
  name: string;
}

interface OrderDetail {
  client_id: number;
  client_name: string;
  client_cif: string;
  contact_person: string | null;
  phone: string | null;
  unit_type_id: number;
  brand: string | null;
  model: string | null;
  license_plate: string | null;
  status: OrderFormData['status'];
  priority: OrderFormData['priority'];
  entry_date: string;
  notes: string | null;
  tasks: Array<{ id: number; description: string; status: string }>;
  departments: Array<{ id: number; name: string }>;
  history: Array<{ action: string; details: string; created_at: string; user_name: string }>;
  order_number: string;
}

// Icono por nombre de departamento
const deptIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('electric') || n.includes('eléctric')) return Zap;
  if (n.includes('chapa') || n.includes('pintura')) return Paintbrush;
  if (n.includes('hidraulica') || n.includes('hidráulica')) return Droplets;
  return Wrench;
};

const EMPTY_FORM: OrderFormData = {
  client_id: '',
  contact_person: '',
  phone: '',
  unit_type_id: '',
  brand: '',
  model: '',
  license_plate: '',
  department_ids: [],
  status: 'pending',
  priority: 'normal',
  entry_date: new Date().toISOString().split('T')[0],
  tasks: '',
  notes: '',
};

const INPUT_CLASS =
  'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1162a6] focus:border-transparent text-sm';

const INPUT_ERROR_CLASS =
  'w-full px-4 py-2.5 border border-[#dc2626] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-transparent text-sm';

const SECTION_HEADING = 'text-sm font-semibold text-[#1162a6] uppercase tracking-wide mb-4';
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1.5';

export const OrderSheet: React.FC<OrderSheetProps> = ({ isOpen, onClose, onSuccess, orderId }) => {
  const isEditing = orderId !== undefined;

  const [formData, setFormData] = useState<OrderFormData>(EMPTY_FORM);
  const [clientName, setClientName] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof OrderFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [quickCreateName, setQuickCreateName] = useState('');
  const [editingClientId, setEditingClientId] = useState<number | null>(null);

  // Datos de vehículo anterior para quick-fill
  const [recentVehicle, setRecentVehicle] = useState<{
    brand: string | null;
    model: string | null;
    license_plate: string | null;
    unit_type_id: number | null;
  } | null>(null);

  // Historial (solo edición)
  const [history, setHistory] = useState<OrderDetail['history']>([]);
  // Nombre del cliente en edición (para ClientEditModal)
  const [editClientData, setEditClientData] = useState<{ id: number; name: string; cif: string } | null>(null);

  // Cargar catálogos al abrir
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const [dRes, uRes] = await Promise.all([
          apiClient.get('/orders/departments.php'),
          apiClient.get('/orders/unit-types.php'),
        ]);
        setDepartments(dRes.data.departments || []);
        setUnitTypes(uRes.data.unit_types || []);
      } catch {
        // catálogos no críticos para renderizar el sheet
      }
    })();
  }, [isOpen]);

  // Cargar datos de la orden en modo edición
  useEffect(() => {
    if (!isOpen || !isEditing) return;
    setLoadingData(true);
    apiClient
      .get(`/orders/details.php?id=${orderId}`)
      .then((res) => {
        if (!res.data.success) return;
        const d: OrderDetail = res.data.data;
        const tasksText = Array.isArray(d.tasks)
          ? d.tasks.map((t) => t.description).join('\n')
          : '';
        setFormData({
          client_id: String(d.client_id),
          contact_person: d.contact_person || '',
          phone: d.phone || '',
          unit_type_id: String(d.unit_type_id),
          brand: d.brand || '',
          model: d.model || '',
          license_plate: d.license_plate || '',
          department_ids: (d.departments || []).map((dep) => dep.id),
          status: d.status,
          priority: d.priority,
          entry_date: d.entry_date || '',
          tasks: tasksText,
          notes: d.notes || '',
        });
        setClientName(d.client_name);
        setHistory(d.history || []);
        setEditClientData({ id: d.client_id, name: d.client_name, cif: d.client_cif });
      })
      .catch(() => {/* error silencioso — el form queda vacío */})
      .finally(() => setLoadingData(false));
  }, [isOpen, isEditing, orderId]);

  // Al cerrar: resetear todo
  useEffect(() => {
    if (!isOpen) {
      setFormData(EMPTY_FORM);
      setClientName('');
      setErrors({});
      setQuickCreateName('');
      setRecentVehicle(null);
      setHistory([]);
      setEditClientData(null);
      setEditingClientId(null);
    }
  }, [isOpen]);

  // Al seleccionar cliente: buscar vehículo reciente
  const handleClientChange = async (id: string, name: string) => {
    setFormData((prev) => ({ ...prev, client_id: id }));
    setClientName(name);
    clearError('client_id');
    setRecentVehicle(null);
    if (!id) return;
    try {
      const res = await apiClient.get(`/orders/recent-vehicle.php?client_id=${id}`);
      if (res.data.success && res.data.data) {
        setRecentVehicle(res.data.data);
      }
    } catch {
      // sin quick-fill si falla
    }
  };

  const applyRecentVehicle = () => {
    if (!recentVehicle) return;
    setFormData((prev) => ({
      ...prev,
      brand: recentVehicle.brand || prev.brand,
      model: recentVehicle.model || prev.model,
      license_plate: recentVehicle.license_plate || prev.license_plate,
      unit_type_id: recentVehicle.unit_type_id ? String(recentVehicle.unit_type_id) : prev.unit_type_id,
    }));
    setRecentVehicle(null);
  };

  const toggleDepartment = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      department_ids: prev.department_ids.includes(id)
        ? prev.department_ids.filter((d) => d !== id)
        : [...prev.department_ids, id],
    }));
    clearError('department_ids');
  };

  const clearError = (field: keyof OrderFormData) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.client_id) newErrors.client_id = 'Selecciona un cliente';
    if (!formData.unit_type_id) newErrors.unit_type_id = 'Selecciona el tipo de unidad';
    if (formData.department_ids.length === 0) newErrors.department_ids = 'Selecciona al menos un departamento';
    if (!formData.entry_date) newErrors.entry_date = 'La fecha de entrada es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = () => {
    const tasksArray = formData.tasks
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((description) => ({ description }));
    return {
      client_id: formData.client_id,
      contact_person: formData.contact_person.trim() || null,
      phone: formData.phone.trim() || null,
      unit_type_id: formData.unit_type_id,
      brand: formData.brand.trim() || null,
      model: formData.model.trim() || null,
      license_plate: formData.license_plate.trim() || null,
      department_ids: formData.department_ids,
      status: formData.status,
      priority: formData.priority,
      entry_date: formData.entry_date,
      description: formData.notes.trim() || '',
      notes: formData.notes.trim() || null,
      tasks: tasksArray,
    };
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEditing) {
        await apiClient.put(`/orders/update.php?id=${orderId}`, buildPayload());
      } else {
        await apiClient.post('/orders/', buildPayload());
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrors({ notes: apiErrorMessage(err, 'Error al guardar la orden') });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPDF = () => {
    let base = apiClient.defaults.baseURL || '';
    if (!base.endsWith('/')) base += '/';
    window.open(`${base}orders/pdf-tcpdf-adaptive.php?id=${orderId}`, '_blank', 'noopener,noreferrer');
  };

  const footer = (
    <div className="flex items-center justify-between">
      <Button type="button" variant="subtle" onClick={onClose} disabled={loading}>
        Cancelar
      </Button>
      <div className="flex items-center gap-3">
        {isEditing && (
          <Button
            type="button"
            variant="secondary"
            onClick={handlePrintPDF}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Printer size={15} />
            Imprimir PDF
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          onClick={handleSubmit}
          isLoading={loading}
          className="flex items-center gap-2"
        >
          {isEditing ? (
            <>
              <Save size={15} />
              Guardar Cambios
            </>
          ) : (
            <>
              <Plus size={15} />
              Crear Orden
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const sheetTitle = isEditing ? `Editar Orden` : 'Nueva Orden de Trabajo';

  return (
    <>
      <Sheet isOpen={isOpen} onClose={onClose} title={sheetTitle} size="xl" footer={footer}>
        {loadingData ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1162a6]" />
          </div>
        ) : (
          <div className="space-y-8">

            {/* ── Sección Cliente ───────────────────────────── */}
            <section>
              <h3 className={SECTION_HEADING}>Cliente</h3>
              <div className="space-y-4">
                <ClientCombobox
                  value={formData.client_id}
                  initialName={clientName}
                  onChange={handleClientChange}
                  onCreateNew={(text) => setQuickCreateName(text)}
                  error={errors.client_id}
                />

                {/* Campos de contacto propios de la orden */}
                {formData.client_id && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={LABEL_CLASS}>
                          <User size={13} className="inline mr-1 text-gray-400" />
                          Persona de contacto
                        </label>
                        <input
                          type="text"
                          value={formData.contact_person}
                          onChange={(e) => setFormData((p) => ({ ...p, contact_person: e.target.value }))}
                          className={INPUT_CLASS}
                          placeholder="Juan Pérez"
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Teléfono</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                          className={INPUT_CLASS}
                          placeholder="600 000 000"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Los datos de contacto son específicos de esta orden y no modifican la ficha del cliente.
                    </p>
                    {/* Link editar cliente — solo en edición */}
                    {isEditing && editClientData && (
                      <button
                        type="button"
                        onClick={() => setEditingClientId(editClientData.id)}
                        className="text-xs text-[#1162a6] hover:underline"
                      >
                        Editar ficha del cliente →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* ── Sección Vehículo ──────────────────────────── */}
            <section>
              <h3 className={SECTION_HEADING}>Vehículo</h3>

              {/* Pill vehículo anterior */}
              {recentVehicle && (
                <div className="mb-4 flex items-center gap-2 p-3 bg-[#1162a6]/5 border border-[#5487c0] rounded-lg text-sm">
                  <span className="text-gray-600 flex-1">
                    Vehículo anterior:{' '}
                    <strong>
                      {[recentVehicle.license_plate, recentVehicle.brand, recentVehicle.model]
                        .filter(Boolean)
                        .join(' · ')}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={applyRecentVehicle}
                    className="text-xs font-medium text-[#1162a6] hover:text-[#5487c0] whitespace-nowrap"
                  >
                    Usar estos datos
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecentVehicle(null)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>
                    Tipo de unidad <span className="text-[#dc2626]">*</span>
                  </label>
                  <select
                    value={formData.unit_type_id}
                    onChange={(e) => {
                      setFormData((p) => ({ ...p, unit_type_id: e.target.value }));
                      clearError('unit_type_id');
                    }}
                    className={errors.unit_type_id ? INPUT_ERROR_CLASS : INPUT_CLASS}
                  >
                    <option value="">Selecciona un tipo</option>
                    {unitTypes.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  {errors.unit_type_id && (
                    <p className="mt-1 text-xs text-[#dc2626]">{errors.unit_type_id}</p>
                  )}
                </div>
                <div>
                  <label className={LABEL_CLASS}>Matrícula</label>
                  <input
                    type="text"
                    value={formData.license_plate}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, license_plate: e.target.value.toUpperCase() }))
                    }
                    className={INPUT_CLASS}
                    placeholder="1234-ABC"
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Marca</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData((p) => ({ ...p, brand: e.target.value }))}
                    className={INPUT_CLASS}
                    placeholder="Ej: Mercedes-Benz"
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Modelo</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData((p) => ({ ...p, model: e.target.value }))}
                    className={INPUT_CLASS}
                    placeholder="Ej: Actros 2545"
                  />
                </div>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* ── Sección Trabajo ───────────────────────────── */}
            <section>
              <h3 className={SECTION_HEADING}>Trabajo</h3>
              <div className="space-y-5">

                {/* Departamentos */}
                <div>
                  <label className={LABEL_CLASS}>
                    Departamentos <span className="text-[#dc2626]">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {departments.map((dept) => {
                      const Icon = deptIcon(dept.name);
                      const selected = formData.department_ids.includes(dept.id);
                      return (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => toggleDepartment(dept.id)}
                          className={`relative flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all ${
                            selected
                              ? 'border-[#1162a6] bg-[#1162a6]/5'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              selected ? 'bg-[#1162a6]' : 'bg-gray-100'
                            }`}
                          >
                            <Icon className={`h-4 w-4 ${selected ? 'text-white' : 'text-gray-500'}`} />
                          </div>
                          <span
                            className={`text-sm font-medium text-left ${
                              selected ? 'text-[#1162a6]' : 'text-gray-700'
                            }`}
                          >
                            {dept.name}
                          </span>
                          {selected && (
                            <Check className="absolute top-1 right-1 h-3.5 w-3.5 text-[#1162a6]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {errors.department_ids && (
                    <p className="mt-2 text-xs text-[#dc2626]">{errors.department_ids}</p>
                  )}
                </div>

                {/* Fecha + Prioridad + Estado (edición) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <CustomDatePicker
                      label="Fecha de entrada"
                      value={formData.entry_date}
                      onChange={(d) => {
                        setFormData((p) => ({ ...p, entry_date: d }));
                        clearError('entry_date');
                      }}
                      error={!!errors.entry_date}
                      required
                    />
                    {errors.entry_date && (
                      <p className="mt-1 text-xs text-[#dc2626]">{errors.entry_date}</p>
                    )}
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Prioridad</label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          priority: e.target.value as OrderFormData['priority'],
                        }))
                      }
                      className={INPUT_CLASS}
                    >
                      <option value="low">Baja</option>
                      <option value="normal">Normal</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>

                {/* Estado — solo en edición */}
                {isEditing && (
                  <div>
                    <label className={LABEL_CLASS}>Estado</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          status: e.target.value as OrderFormData['status'],
                        }))
                      }
                      className={INPUT_CLASS}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                )}
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* ── Sección Detalle ───────────────────────────── */}
            <section>
              <h3 className={SECTION_HEADING}>Detalle</h3>
              <div className="space-y-4">
                <div>
                  <label className={LABEL_CLASS}>
                    <Wrench size={13} className="inline mr-1 text-gray-400" />
                    Trabajos a realizar
                  </label>
                  <textarea
                    value={formData.tasks}
                    onChange={(e) => setFormData((p) => ({ ...p, tasks: e.target.value }))}
                    rows={5}
                    className={`${INPUT_CLASS} resize-none`}
                    placeholder={'Cada línea es una tarea independiente\n\nEj:\nCambiar aceite motor\nRevisar frenos\nCambiar filtro de aire'}
                  />
                  <p className="mt-1 text-xs text-gray-400">Cada línea se guarda como una tarea separada.</p>
                </div>
                <div>
                  <label className={LABEL_CLASS}>
                    <FileText size={13} className="inline mr-1 text-gray-400" />
                    Observaciones / Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                    rows={4}
                    className={`${INPUT_CLASS} resize-none`}
                    placeholder="Cualquier observación relevante para esta orden..."
                  />
                  {errors.notes && (
                    <p className="mt-1 text-xs text-[#dc2626]">{errors.notes}</p>
                  )}
                </div>
              </div>
            </section>

            {/* ── Historial — solo en edición ───────────────── */}
            {isEditing && (
              <>
                <hr className="border-gray-100" />
                <section>
                  <h3 className={SECTION_HEADING}>Historial de cambios</h3>
                  {history.length === 0 ? (
                    <p className="text-sm text-gray-400">Sin cambios registrados.</p>
                  ) : (
                    <ul className="space-y-2">
                      {history.map((h, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="text-gray-400 whitespace-nowrap">
                            {new Date(h.created_at).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-gray-500">{h.user_name || '—'}</span>
                          <span className="text-gray-700">{h.details}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>
        )}
      </Sheet>

      {/* QuickCreateClientSheet — superpuesta */}
      <QuickCreateClientSheet
        isOpen={!!quickCreateName}
        onClose={() => setQuickCreateName('')}
        initialName={quickCreateName}
        onCreated={(id, name) => {
          setFormData((p) => ({ ...p, client_id: String(id) }));
          setClientName(name);
          clearError('client_id');
          setQuickCreateName('');
        }}
      />

      {/* ClientEditModal — solo en edición */}
      {editingClientId && editClientData && (
        <ClientEditModal
          client={{
            id: editClientData.id,
            name: editClientData.name,
            cif_nif: editClientData.cif,
            contact_person: '',
            phone: '',
            email: '',
            address: '',
            active: true,
          }}
          isOpen
          onClose={() => setEditingClientId(null)}
          onSave={() => setEditingClientId(null)}
        />
      )}
    </>
  );
};
