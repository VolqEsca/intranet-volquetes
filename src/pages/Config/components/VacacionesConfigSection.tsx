import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar, AlertTriangle, RefreshCw, Loader2, CheckCircle,
  AlertCircle, Plus, Pencil, Trash2, Copy, Settings, Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/Button';
import { TableActionButton } from '../../../components/ui/TableActionButton';
import { apiClient } from '../../../api';
import { useAlertModal } from '../../../hooks/useAlertModal';
import { apiErrorMessage } from '../../../utils/error';
import {
  vacationsAPI, holidaysAPI, Holiday, HolidayFormData,
  HOLIDAY_TYPES, HOLIDAY_TYPE_COLORS
} from '../../../api/vacations';

interface VacationConfig {
  vacation_annual_days: number;
  vacation_annual_days_type: 'laborables' | 'naturales';
  vacation_conflict_warning_threshold: number;
  vacation_conflict_critical_remaining: number;
  location_1_name: string;
  location_2_name: string;
}

interface CarryoverDetail {
  name: string;
  available: number;
  carried: number;
}

interface CarryoverResult {
  success: boolean;
  processed: number;
  skipped: number;
  detail: CarryoverDetail[];
}

const DEFAULT_CONFIG: VacationConfig = {
  vacation_annual_days: 22,
  vacation_annual_days_type: 'laborables',
  vacation_conflict_warning_threshold: 3,
  vacation_conflict_critical_remaining: 2,
  location_1_name: 'Nave 01',
  location_2_name: 'Nave 02',
};

export const VacacionesConfigSection: React.FC = () => {
  const [config, setConfig] = useState<VacationConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [employeeCounts, setEmployeeCounts] = useState<Record<string, number>>({});

  const [savedField, setSavedField] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [naturalesConfirmed, setNaturalesConfirmed] = useState(false);
  const [isSavingAnnual, setIsSavingAnnual] = useState(false);
  const [isSavingNaves, setIsSavingNaves] = useState(false);

  const [carryoverYear, setCarryoverYear] = useState(new Date().getFullYear());
  const [isCarryoverRunning, setIsCarryoverRunning] = useState(false);
  const [carryoverResult, setCarryoverResult] = useState<CarryoverResult | null>(null);

  const festCurrentYear = new Date().getFullYear();
  const [selectedHolidayYear, setSelectedHolidayYear] = useState<number>(festCurrentYear);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(false);
  const [isSubmittingHoliday, setIsSubmittingHoliday] = useState(false);
  const [editingHolidayId, setEditingHolidayId] = useState<number | null>(null);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidayFormData, setHolidayFormData] = useState<HolidayFormData>({
    holiday_date: '',
    description: '',
    type: 'national',
  });

  const { confirm, modal } = useAlertModal();
  const currentYear = new Date().getFullYear();
  const availableCarryoverYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const availableHolidayYears = Array.from({ length: 7 }, (_, i) => festCurrentYear - 1 + i);

  // ─── Carga de configuración ───────────────────────────────────────────────

  const reloadConfig = async () => {
    const res = await apiClient.get<{
      config: Record<string, { valor: string | number }>;
      employee_counts?: Record<string, number>;
    }>('/config/vacations.php');
    const raw = res.data.config;
    setConfig({
      vacation_annual_days: Number(raw.vacation_annual_days?.valor ?? 22),
      vacation_annual_days_type:
        (raw.vacation_annual_days_type?.valor as 'laborables' | 'naturales') ?? 'laborables',
      vacation_conflict_warning_threshold: Number(raw.vacation_conflict_warning_threshold?.valor ?? 3),
      vacation_conflict_critical_remaining: Number(raw.vacation_conflict_critical_remaining?.valor ?? 2),
      location_1_name: String(raw.location_1_name?.valor ?? 'Nave 01'),
      location_2_name: String(raw.location_2_name?.valor ?? 'Nave 02'),
    });
    setEmployeeCounts(res.data.employee_counts ?? {});
  };

  useEffect(() => {
    reloadConfig()
      .catch(() => toast.error('No se pudo cargar la configuración de vacaciones'))
      .finally(() => setIsLoading(false));
  }, []);

  // ─── Festivos ────────────────────────────────────────────────────────────

  const loadHolidays = async () => {
    setIsLoadingHolidays(true);
    try {
      const response = await vacationsAPI.getHolidays(selectedHolidayYear);
      setHolidays(response.data.holidays || []);
    } catch {
      toast.error('Error al cargar los festivos');
      setHolidays([]);
    } finally {
      setIsLoadingHolidays(false);
    }
  };

  useEffect(() => {
    loadHolidays(); // eslint-disable-line react-hooks/exhaustive-deps
  }, [selectedHolidayYear]);

  // ─── Auto-save helpers ────────────────────────────────────────────────────

  const showSaved = (field: string) => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    setSavedField(field);
    timerRef.current = setTimeout(() => setSavedField(null), 2000);
  };

  const autoSaveKey = async (clave: string, valor: string | number, field: string) => {
    try {
      await apiClient.put('/config/vacations.php', { clave, valor });
      showSaved(field);
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, 'Error al guardar'));
    }
  };

  // ─── Convenio ────────────────────────────────────────────────────────────

  const handleDaysTypeChange = (type: 'laborables' | 'naturales') => {
    if (type === config.vacation_annual_days_type) return;
    setConfig(prev => ({ ...prev, vacation_annual_days_type: type }));
    setNaturalesConfirmed(false);
    autoSaveKey('vacation_annual_days_type', type, 'days_type');
  };

  const handleAnnualDaysBlur = async () => {
    if (config.vacation_annual_days_type === 'naturales') return;
    await autoSaveKey('vacation_annual_days', config.vacation_annual_days, 'annual_days');
  };

  const handleNaturalesSave = async () => {
    if (!naturalesConfirmed) return;
    setIsSavingAnnual(true);
    try {
      await apiClient.put('/config/vacations.php', {
        clave: 'vacation_annual_days',
        valor: config.vacation_annual_days,
      });
      showSaved('annual_days');
      setNaturalesConfirmed(false);
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, 'Error al guardar'));
    } finally {
      setIsSavingAnnual(false);
    }
  };

  // ─── Umbrales de conflicto ────────────────────────────────────────────────

  const handleWarningBlur = () =>
    autoSaveKey('vacation_conflict_warning_threshold', config.vacation_conflict_warning_threshold, 'warning');

  const handleCriticalBlur = () =>
    autoSaveKey('vacation_conflict_critical_remaining', config.vacation_conflict_critical_remaining, 'critical');

  // ─── Naves ────────────────────────────────────────────────────────────────

  const handleSaveNaves = async () => {
    setIsSavingNaves(true);
    try {
      let totalUpdated = 0;
      const res1 = await apiClient.put<{ success: boolean; employees_updated?: number }>(
        '/config/vacations.php',
        { clave: 'location_1_name', valor: config.location_1_name }
      );
      totalUpdated += res1.data.employees_updated ?? 0;
      const res2 = await apiClient.put<{ success: boolean; employees_updated?: number }>(
        '/config/vacations.php',
        { clave: 'location_2_name', valor: config.location_2_name }
      );
      totalUpdated += res2.data.employees_updated ?? 0;
      await reloadConfig();
      if (totalUpdated > 0) {
        toast.success(`Naves actualizadas. ${totalUpdated} empleados reasignados.`);
      } else {
        toast.success('Nombres de nave guardados.');
      }
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, 'Error al guardar las naves'));
    } finally {
      setIsSavingNaves(false);
    }
  };

  // ─── Cierre de año ────────────────────────────────────────────────────────

  const handleCarryover = async () => {
    const confirmed = await confirm({
      title: `¿Ejecutar arrastre ${carryoverYear} → ${carryoverYear + 1}?`,
      description: `Se calculará el saldo disponible de cada empleado en ${carryoverYear} y se actualizará el campo carried_over_days en vacation_balances para ${carryoverYear + 1}. Esta operación es reversible manualmente.`,
      variant: 'warning',
      confirmLabel: 'Ejecutar arrastre',
    });
    if (!confirmed) return;

    setIsCarryoverRunning(true);
    setCarryoverResult(null);
    try {
      const res = await apiClient.post<CarryoverResult>('/vacations/year-end-carryover.php', {
        year: carryoverYear,
      });
      setCarryoverResult(res.data);
      toast.success(`Arrastre completado: ${res.data.processed} empleados procesados`);
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, 'Error al ejecutar el arrastre'));
    } finally {
      setIsCarryoverRunning(false);
    }
  };

  // ─── Festivos handlers ────────────────────────────────────────────────────

  const resetHolidayForm = () => {
    setHolidayFormData({ holiday_date: '', description: '', type: 'national' });
    setEditingHolidayId(null);
    setShowHolidayForm(false);
  };

  const handleHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayFormData.holiday_date || !holidayFormData.description.trim()) {
      toast.error('La fecha y descripción son obligatorias');
      return;
    }
    setIsSubmittingHoliday(true);
    try {
      if (editingHolidayId) {
        await holidaysAPI.update(editingHolidayId, holidayFormData);
        toast.success('Festivo actualizado correctamente');
      } else {
        await holidaysAPI.create(holidayFormData);
        toast.success('Festivo creado correctamente');
      }
      resetHolidayForm();
      loadHolidays();
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, 'Error al guardar el festivo'));
    } finally {
      setIsSubmittingHoliday(false);
    }
  };

  const handleHolidayEdit = (holiday: Holiday) => {
    setHolidayFormData({
      holiday_date: holiday.holiday_date,
      description: holiday.description,
      type: holiday.type,
    });
    setEditingHolidayId(holiday.id);
    setShowHolidayForm(true);
  };

  const handleHolidayDelete = async (id: number) => {
    const confirmed = await confirm({
      title: '¿Eliminar festivo?',
      description:
        'Si eliminas un festivo que afecta a vacaciones ya aprobadas, los días laborales se recalcularán automáticamente.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
    });
    if (!confirmed) return;

    setIsSubmittingHoliday(true);
    try {
      const response = await holidaysAPI.delete(id);
      if (response.data.warning) {
        toast.warning(response.data.message, { description: response.data.warning });
      } else {
        toast.success(response.data.message);
      }
      loadHolidays();
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, 'Error al eliminar el festivo'));
    } finally {
      setIsSubmittingHoliday(false);
    }
  };

  const handleCopyYear = async () => {
    const confirmed = await confirm({
      title: `¿Generar festivos de fecha fija para ${selectedHolidayYear}?`,
      description:
        'Se crearán automáticamente los 12 festivos estándar: 9 Nacionales, 1 Autonómico (Castilla y León) y 2 Locales Valladolid. Semana Santa y días de convenio deben añadirse manualmente.',
      variant: 'warning',
      confirmLabel: 'Generar festivos',
    });
    if (!confirmed) return;

    setIsSubmittingHoliday(true);
    try {
      const response = await holidaysAPI.copyYear(selectedHolidayYear);
      toast.success(response.data.message, {
        description: response.data.warning || `Copiados ${response.data.stats.copied} festivos`,
      });
      loadHolidays();
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, 'Error al generar festivos'));
    } finally {
      setIsSubmittingHoliday(false);
    }
  };

  const formatHolidayDate = (dateString: string) => {
    if (!dateString || dateString === '0000-00-00' || dateString.includes('00-00')) {
      return 'Fecha inválida';
    }
    try {
      const [y, m, d] = dateString.split('-').map(Number);
      if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return `Formato: ${dateString}`;
      const date = new Date(y, m - 1, d);
      if (isNaN(date.getTime()) || date.getDate() !== d || date.getMonth() !== m - 1) {
        return `Error: ${dateString}`;
      }
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const savedCheck = (field: string) =>
    savedField === field ? (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <CheckCircle className="w-3.5 h-3.5" />
        Guardado
      </span>
    ) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-7 h-7 text-[#1162a6] animate-spin" />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-8">

        {/* ════════════════════════════════════════════════════════════
            Configuración de vacaciones
        ════════════════════════════════════════════════════════════ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1162a6]/10 flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 text-[#1162a6]" />
            </div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Configuración de vacaciones</h2>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden divide-y divide-gray-100">

            {/* Subsección: Convenio */}
            <div className="px-5 py-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Convenio</p>
              <div className="flex items-start gap-6">
                <div className="w-52 flex-shrink-0 pt-0.5">
                  <p className="text-sm font-semibold text-gray-900">Días anuales</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    Jornadas de vacaciones por empleado/año según convenio
                  </p>
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Segmented control — mismo patrón que toggles de nave */}
                  <div className="flex gap-1 p-1 bg-gray-50 rounded-lg border border-[#e2e8f0] w-fit">
                    <Button
                      type="button"
                      variant="toggle"
                      active={config.vacation_annual_days_type === 'laborables'}
                      size="sm"
                      onClick={() => handleDaysTypeChange('laborables')}
                      className="font-semibold"
                    >
                      Laborables
                    </Button>
                    <Button
                      type="button"
                      variant="toggle"
                      active={config.vacation_annual_days_type === 'naturales'}
                      size="sm"
                      onClick={() => handleDaysTypeChange('naturales')}
                      className={`font-semibold ${
                        config.vacation_annual_days_type === 'naturales'
                          ? '!bg-[#dc2626] !text-white'
                          : ''
                      }`}
                    >
                      Naturales
                    </Button>
                  </div>

                  <p className={`text-xs ${
                    config.vacation_annual_days_type === 'naturales' ? 'text-[#dc2626]' : 'text-gray-400'
                  }`}>
                    {config.vacation_annual_days_type === 'laborables'
                      ? 'Convenio Colectivo Metal Valladolid — 22 días laborables por defecto'
                      : 'Naturales (no recomendado — Convenio Metal Valladolid)'}
                  </p>

                  {/* Input */}
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={config.vacation_annual_days}
                      onChange={(e) =>
                        setConfig(prev => ({ ...prev, vacation_annual_days: Number(e.target.value) }))
                      }
                      onBlur={
                        config.vacation_annual_days_type === 'laborables' ? handleAnnualDaysBlur : undefined
                      }
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center font-semibold focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
                    />
                    <span className="text-sm text-gray-500">días</span>
                    {config.vacation_annual_days_type === 'laborables' && savedCheck('annual_days')}
                  </div>

                  {/* Naturales: aviso + confirmación */}
                  {config.vacation_annual_days_type === 'naturales' && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800">
                          Los días naturales incluyen sábados, domingos y festivos. El Convenio del Metal
                          de Valladolid establece 22 días <strong>laborables</strong>. Este cambio puede
                          generar conflictos con la normativa laboral vigente.
                        </p>
                      </div>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={naturalesConfirmed}
                          onChange={(e) => setNaturalesConfirmed(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#dc2626] focus:ring-[#dc2626]"
                        />
                        <span className="text-xs text-gray-700">
                          Entiendo que el convenio establece días laborables y acepto la responsabilidad
                          de este cambio
                        </span>
                      </label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleNaturalesSave}
                          disabled={!naturalesConfirmed || isSavingAnnual}
                          isLoading={isSavingAnnual}
                        >
                          Confirmar y guardar
                        </Button>
                        {savedCheck('annual_days')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subsección: Detección de conflictos */}
            <div className="px-5 py-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Detección de conflictos</p>
              <div className="divide-y divide-gray-100">
                {/* Umbral de advertencia */}
                <div className="flex items-center gap-6">
                  <div className="w-52 flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">Umbral de advertencia</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Ausentes simultáneos por nave que activa alerta
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={config.vacation_conflict_warning_threshold}
                      onChange={(e) =>
                        setConfig(prev => ({
                          ...prev,
                          vacation_conflict_warning_threshold: Number(e.target.value),
                        }))
                      }
                      onBlur={handleWarningBlur}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center font-semibold focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
                    />
                    <span className="text-sm text-gray-500">empleados</span>
                    {savedCheck('warning')}
                  </div>
                </div>

                {/* Umbral crítico */}
                <div className="flex items-center gap-6">
                  <div className="w-52 flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">Umbral crítico</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Operativos mínimos antes de activar alerta roja
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={config.vacation_conflict_critical_remaining}
                      onChange={(e) =>
                        setConfig(prev => ({
                          ...prev,
                          vacation_conflict_critical_remaining: Number(e.target.value),
                        }))
                      }
                      onBlur={handleCriticalBlur}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center font-semibold focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
                    />
                    <span className="text-sm text-gray-500">operativos</span>
                    {savedCheck('critical')}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            Grupo 2 — Identificadores de nave
        ════════════════════════════════════════════════════════════ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1162a6]/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-[#1162a6]" />
            </div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Identificadores de nave</h2>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden divide-y divide-gray-100">
            {/* Note */}
            <div className="px-5 py-3 bg-gray-50/70">
              <p className="text-xs text-gray-500">
                Al guardar se actualiza el campo{' '}
                <code className="bg-gray-100 px-1 rounded text-[11px]">location</code> de todos los
                empleados asignados en la misma transacción.
              </p>
            </div>

            {/* Nave 1 */}
            <div className="flex items-center gap-6 px-5 py-4">
              <div className="w-52 flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">Nave 1</p>
                {employeeCounts[config.location_1_name] !== undefined && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {employeeCounts[config.location_1_name]} empleados activos
                  </p>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={config.location_1_name}
                  onChange={(e) =>
                    setConfig(prev => ({ ...prev, location_1_name: e.target.value }))
                  }
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
                  maxLength={50}
                />
              </div>
            </div>

            {/* Nave 2 */}
            <div className="flex items-center gap-6 px-5 py-4">
              <div className="w-52 flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">Nave 2</p>
                {employeeCounts[config.location_2_name] !== undefined && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {employeeCounts[config.location_2_name]} empleados activos
                  </p>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={config.location_2_name}
                  onChange={(e) =>
                    setConfig(prev => ({ ...prev, location_2_name: e.target.value }))
                  }
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
                  maxLength={50}
                />
              </div>
            </div>

            {/* Footer con botón */}
            <div className="flex justify-end px-5 py-3 bg-gray-50/70">
              <Button
                variant="subtle"
                size="sm"
                onClick={handleSaveNaves}
                disabled={isSavingNaves}
                isLoading={isSavingNaves}
              >
                Guardar naves
              </Button>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            Grupo 3 — Cierre de año
        ════════════════════════════════════════════════════════════ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1162a6]/10 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-4 h-4 text-[#1162a6]" />
            </div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cierre de año — Arrastre de saldos</h2>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl px-5 py-5 space-y-4">
            <p className="text-sm text-gray-600">
              Calcula el saldo disponible de cada empleado al cierre del año seleccionado y lo
              registra como arrastre en el año siguiente. Solo actualiza{' '}
              <code className="text-xs bg-gray-100 px-1 rounded">carried_over_days</code> — no
              modifica días anuales ni ajustes manuales.
            </p>

            <div className="flex items-center gap-3">
              <select
                value={carryoverYear}
                onChange={(e) => {
                  setCarryoverYear(Number(e.target.value));
                  setCarryoverResult(null);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
              >
                {availableCarryoverYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span className="text-sm text-gray-400">→</span>
              <span className="text-sm font-semibold text-gray-700">{carryoverYear + 1}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCarryover}
                disabled={isCarryoverRunning}
                isLoading={isCarryoverRunning}
                className="ml-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Ejecutar arrastre
              </Button>
            </div>

            {carryoverResult && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2 text-sm text-[#1162a6]">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-semibold">
                    {carryoverResult.processed} empleados procesados
                    {carryoverResult.skipped > 0 && ` · ${carryoverResult.skipped} omitidos`}
                  </span>
                </div>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Empleado
                        </th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Disponible {carryoverYear}
                        </th>
                        <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Arrastre → {carryoverYear + 1}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {carryoverResult.detail.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-gray-900 font-medium">{row.name}</td>
                          <td className="px-4 py-2.5 text-center text-gray-600">{row.available} días</td>
                          <td
                            className={`px-4 py-2.5 text-center font-semibold ${
                              row.carried > 0
                                ? 'text-[#1162a6]'
                                : row.carried < 0
                                ? 'text-[#dc2626]'
                                : 'text-gray-400'
                            }`}
                          >
                            {row.carried > 0 ? '+' : ''}{row.carried} días
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            Grupo 4 — Festivos y días no laborables
        ════════════════════════════════════════════════════════════ */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1162a6]/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-[#1162a6]" />
            </div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Festivos y días no laborables</h2>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">

            {/* Header: selector de año + nuevo festivo */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50/70 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <select
                  value={selectedHolidayYear}
                  onChange={(e) => setSelectedHolidayYear(Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-[#1162a6] focus:border-transparent bg-white cursor-pointer"
                  disabled={isLoadingHolidays}
                >
                  {availableHolidayYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                {isLoadingHolidays && (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              {!showHolidayForm && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowHolidayForm(true)}
                  disabled={isSubmittingHoliday}
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Nuevo festivo
                </Button>
              )}
            </div>

            {/* Formulario */}
            {showHolidayForm && (
              <div className="px-5 py-4 bg-blue-50/60 border-b border-blue-100">
                <form onSubmit={handleHolidaySubmit}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-700">Fecha *</label>
                        <input
                          type="date"
                          value={holidayFormData.holiday_date}
                          onChange={(e) =>
                            setHolidayFormData({ ...holidayFormData, holiday_date: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-700">Tipo *</label>
                        <select
                          value={holidayFormData.type}
                          onChange={(e) =>
                            setHolidayFormData({
                              ...holidayFormData,
                              type: e.target.value as HolidayFormData['type'],
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
                          required
                        >
                          {Object.entries(HOLIDAY_TYPES).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700">Descripción *</label>
                      <input
                        type="text"
                        value={holidayFormData.description}
                        onChange={(e) =>
                          setHolidayFormData({ ...holidayFormData, description: e.target.value })
                        }
                        placeholder="Ej: Jueves Santo, Día de descanso convenio..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
                        required
                        minLength={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="subtle"
                        size="sm"
                        onClick={resetHolidayForm}
                        disabled={isSubmittingHoliday}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={isSubmittingHoliday}
                        isLoading={isSubmittingHoliday}
                      >
                        {editingHolidayId ? 'Actualizar' : 'Crear'} festivo
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Lista */}
            {isLoadingHolidays ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-[#1162a6] animate-spin" />
              </div>
            ) : holidays.length === 0 ? (
              <div className="text-center py-14">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#1162a6]/10 flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6 text-[#1162a6]" />
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Sin festivos para {selectedHolidayYear}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Genera los festivos estándar o añádelos manualmente
                </p>
                {selectedHolidayYear >= festCurrentYear && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyYear}
                    disabled={isSubmittingHoliday}
                    isLoading={isSubmittingHoliday}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Generar festivos {selectedHolidayYear}
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Columnas */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 border-b border-gray-100">
                  <div className="col-span-4">Fecha</div>
                  <div className="col-span-4">Descripción</div>
                  <div className="col-span-2">Tipo</div>
                  <div className="col-span-2 text-right">Acciones</div>
                </div>

                <div className="divide-y divide-gray-100">
                  {holidays
                    .sort((a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime())
                    .map(holiday => (
                      <div
                        key={holiday.id}
                        className="grid grid-cols-12 gap-3 px-5 py-3 items-center hover:bg-gray-50/70 transition-colors"
                      >
                        <div className="col-span-12 sm:col-span-4">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatHolidayDate(holiday.holiday_date)}
                          </span>
                        </div>
                        <div className="col-span-12 sm:col-span-4">
                          <span className="text-sm text-gray-600">{holiday.description}</span>
                        </div>
                        <div className="col-span-8 sm:col-span-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${HOLIDAY_TYPE_COLORS[holiday.type]}`}
                          >
                            {HOLIDAY_TYPES[holiday.type]}
                          </span>
                        </div>
                        <div className="col-span-4 sm:col-span-2 flex justify-end gap-0.5">
                          <TableActionButton
                            variant="primary"
                            onClick={() => handleHolidayEdit(holiday)}
                            title="Editar festivo"
                            disabled={isSubmittingHoliday}
                          >
                            <Pencil size={14} />
                          </TableActionButton>
                          <TableActionButton
                            variant="danger"
                            onClick={() => handleHolidayDelete(holiday.id)}
                            title="Eliminar festivo"
                            disabled={isSubmittingHoliday}
                          >
                            <Trash2 size={14} />
                          </TableActionButton>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Aviso festivos incompletos */}
                {holidays.length < 19 && (
                  <div className="flex items-start gap-3 px-5 py-3.5 bg-amber-50/70 border-t border-amber-100">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      <span className="font-semibold">Festivos pendientes. </span>
                      El convenio establece 19 días no laborables. Tienes {holidays.length}. Recuerda
                      añadir Semana Santa {selectedHolidayYear} y los 5 días de descanso del convenio.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

      </div>
      {modal}
    </>
  );
};
