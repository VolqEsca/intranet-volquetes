import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, Calendar, AlertCircle, Loader2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { 
  vacationsAPI, 
  holidaysAPI, 
  Holiday, 
  HolidayFormData,
  HOLIDAY_TYPES,
  HOLIDAY_TYPE_COLORS 
} from '../../../api/vacations';

interface HolidaysConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHolidaysUpdated: () => void;
}

const HolidaysConfigModal: React.FC<HolidaysConfigModalProps> = ({
  isOpen,
  onClose,
  onHolidaysUpdated
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState<HolidayFormData>({
    holiday_date: '',
    description: '',
    type: 'national'
  });

  // ✅ CORRECCIÓN CRÍTICA: Acceso correcto a response.data.holidays
  const loadHolidays = async () => {
    setIsLoading(true);
    try {
      const response = await vacationsAPI.getHolidays(selectedYear);
      setHolidays(response.data.holidays || []);
    } catch (error) {
      console.error('Error cargando festivos:', error);
      toast.error('Error al cargar los festivos');
      setHolidays([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHolidays();
    }
  }, [isOpen, selectedYear]);

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      holiday_date: '',
      description: '',
      type: 'national'
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Crear/Actualizar festivo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.holiday_date || !formData.description.trim()) {
      toast.error('La fecha y descripción son obligatorias');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await holidaysAPI.update(editingId, formData);
        toast.success('Festivo actualizado correctamente');
      } else {
        await holidaysAPI.create(formData);
        toast.success('Festivo creado correctamente');
      }
      
      resetForm();
      loadHolidays();
      onHolidaysUpdated();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Error al guardar el festivo';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Editar festivo
  const handleEdit = (holiday: Holiday) => {
    setFormData({
      holiday_date: holiday.holiday_date,
      description: holiday.description,
      type: holiday.type
    });
    setEditingId(holiday.id);
    setShowForm(true);
  };

  // Eliminar festivo
  const handleDelete = async (id: number) => {
    if (!window.confirm('⚠️ ¿Eliminar festivo?\n\nSi eliminas un festivo que afecta a vacaciones ya aprobadas, los días laborales se recalcularán automáticamente.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await holidaysAPI.delete(id);
      
      if (response.data.warning) {
        toast.warning(response.data.message, {
          description: response.data.warning
        });
      } else {
        toast.success(response.data.message);
      }
      
      loadHolidays();
      onHolidaysUpdated();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Error al eliminar el festivo';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ SMART SEEDING: Copiar festivos estándar
  const handleCopyYear = async () => {
    if (!window.confirm(
      `¿Generar festivos de fecha fija para ${selectedYear}?\n\n` +
      `Se crearán automáticamente los 12 festivos estándar:\n` +
      `• 9 Nacionales (Año Nuevo, Reyes, Trabajo, etc.)\n` +
      `• 1 Autonómico (Castilla y León)\n` +
      `• 2 Locales Valladolid (San Pedro, Ntra. Sra.)\n\n` +
      `Semana Santa y días de convenio deben añadirse manualmente.`
    )) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await holidaysAPI.copyYear(selectedYear);
      
      toast.success(response.data.message, {
        description: response.data.warning || `Copiados ${response.data.stats.copied} festivos`
      });
      
      loadHolidays();
      onHolidaysUpdated();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Error al generar festivos';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ FORMATEO ROBUSTO: Parseo manual anti-corrupción
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '0000-00-00' || dateString.includes('00-00')) {
      return 'Fecha inválida';
    }
    
    try {
      // Parseo manual para evitar problemas de timezone y formato
      const [year, month, day] = dateString.split('-').map(Number);
      
      // Validación estricta de rangos
      if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
        return `Formato incorrecto: ${dateString}`;
      }
      
      // Crear fecha local (mes es 0-indexado en JavaScript)
      const date = new Date(year, month - 1, day);
      
      // Verificar que la fecha construida es válida
      if (isNaN(date.getTime()) || date.getDate() !== day || date.getMonth() !== (month - 1)) {
        return `Fecha corrupta: ${dateString}`;
      }

      return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (error) {
      console.warn('Error formateando fecha:', dateString, error);
      return `Error: ${dateString}`;
    }
  };

  // Años disponibles para selector
  const availableYears = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuración de Festivos"
      size="max-w-2xl"
    >
      {/* ✅ PADDING PRINCIPAL VERSO: p-6 */}
      <div className="p-6">
        {/* ✅ ESPACIADO VERSO: space-y-5 */}
        <div className="space-y-5">
          
          {/* Header con selector de año y botón nuevo */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-[#1162a6]" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1162a6] focus:border-transparent font-semibold text-gray-900 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                disabled={isLoading}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Solo botón "Nuevo Festivo" en header */}
            <div className="flex gap-2">
              {!showForm && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowForm(true)}
                  disabled={isSubmitting}
                  className="bg-[#1162a6] hover:bg-[#0d4d85]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Festivo
                </Button>
              )}
            </div>
          </div>

          {/* Formulario de creación/edición */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={formData.holiday_date}
                      onChange={(e) => setFormData({ ...formData, holiday_date: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1162a6] focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      Tipo *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1162a6] focus:border-transparent text-sm"
                      required
                    >
                      {Object.entries(HOLIDAY_TYPES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Descripción *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ej: Jueves Santo, Día descanso convenio..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1162a6] focus:border-transparent text-sm"
                    required
                    minLength={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-blue-200">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                    isLoading={isSubmitting}
                    className="bg-[#1162a6] hover:bg-[#0d4d85]"
                  >
                    {editingId ? 'Actualizar' : 'Crear'} Festivo
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Lista de festivos o estado vacío */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-[#1162a6] animate-spin" />
            </div>
          ) : holidays.length === 0 ? (
            /* Estado vacío profesional */
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4 shadow-sm">
                <Calendar className="w-8 h-8 text-[#1162a6]" />
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No hay festivos configurados para {selectedYear}
              </h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Genera automáticamente los 12 festivos de fecha fija o añádelos manualmente uno por uno
              </p>
              
              {selectedYear >= currentYear && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleCopyYear}
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300 font-semibold shadow-sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Generar Festivos {selectedYear}
                </Button>
              )}
            </div>
          ) : (
            /* Lista de festivos */
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {holidays
                .sort((a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime())
                .map(holiday => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-3.5 bg-white border border-gray-200 rounded-lg hover:shadow-sm hover:border-gray-300 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatDate(holiday.holiday_date)}
                        </span>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${HOLIDAY_TYPE_COLORS[holiday.type]}`}>
                          {HOLIDAY_TYPES[holiday.type]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{holiday.description}</p>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(holiday)}
                        disabled={isSubmitting}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(holiday.id)}
                        disabled={isSubmitting}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Información de ayuda */}
          {holidays.length > 0 && holidays.length < 19 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Festivos pendientes de configurar</p>
                <p>
                  El Convenio Metal Valladolid establece 19 días no laborables. 
                  Tienes {holidays.length} configurados. Recuerda añadir Semana Santa {selectedYear} y los 5 días de descanso del convenio.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default HolidaysConfigModal;
