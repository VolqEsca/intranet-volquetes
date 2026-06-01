import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2, Calculator, Calendar, FileText, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet } from '../../../components/ui/Sheet';
import { Button } from '../../../components/ui/Button';
import { useAlertModal } from '../../../hooks/useAlertModal';
import {
  vacationsAPI,
  Absence,
  Employee,
  CalendarData,
  VacationBalance,
  ABSENCE_TYPES,
  WorkingDaysCalculation,
  detectConflicts,
  ConflictDetection
} from '../../../api/vacations';

const balanceChipColor = (days: number) => {
  if (days > 5) return 'bg-green-100 text-green-800 border-green-200';
  if (days >= 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-red-100 text-red-800 border-red-200';
};
import { apiErrorMessage } from '../../../utils/error';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  absence: Absence | null;
  employee: Employee | null;
  balance: VacationBalance | null;
  calendarData: CalendarData;
  warningThreshold?: number;
  criticalRemaining?: number;
}

export const EditAbsenceSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  absence,
  employee,
  balance,
  calendarData,
  warningThreshold = 3,
  criticalRemaining = 2,
}) => {
  const { confirm, modal: alertModal } = useAlertModal();

  const [absenceType, setAbsenceType] = useState<keyof typeof ABSENCE_TYPES>('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const [calculation, setCalculation] = useState<WorkingDaysCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [conflictDetection, setConflictDetection] = useState<ConflictDetection | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

  useEffect(() => {
    if (isOpen && absence) {
      setAbsenceType(absence.absence_type);
      setStartDate(absence.start_date);
      setEndDate(absence.end_date);
      setNotes(absence.notes || '');
      setCalculation(null);
      setCalculationError(null);
      setSubmitError(null);
      setConflictDetection(null);
      setIsGeneratingReceipt(false);
    }
  }, [isOpen, absence]);

  // Cálculo de días con debounce
  useEffect(() => {
    if (!startDate || !endDate) {
      setCalculation(null);
      setCalculationError(null);
      return;
    }
    const t = setTimeout(async () => {
      setIsCalculating(true);
      setCalculationError(null);
      try {
        const res = await vacationsAPI.calculateWorkingDays(startDate, endDate);
        setCalculation(res.data.calculation);
      } catch {
        setCalculationError('Error al calcular días laborales');
        setCalculation(null);
      } finally {
        setIsCalculating(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [startDate, endDate]);

  // Detección de conflictos operativos
  useEffect(() => {
    if (absence && employee && startDate && endDate) {
      setConflictDetection(
        detectConflicts(employee.id, employee.location, startDate, endDate, calendarData.employees, calendarData.absences, absence.id, warningThreshold, criticalRemaining)
      );
    } else {
      setConflictDetection(null);
    }
  }, [startDate, endDate, absence, employee, calendarData]);

  if (!absence || !employee) return null;

  const currentAbsenceReturn = absence.absence_type === 'vacation' ? absence.working_days_count : 0;
  const availableWithReturn = (balance?.available_days ?? 0) + currentAbsenceReturn;

  const hasInsufficientBalance =
    absenceType === 'vacation' &&
    calculation !== null &&
    calculation.working_days > availableWithReturn;

  const canSubmit =
    !!startDate &&
    !!endDate &&
    calculation !== null &&
    calculation.working_days > 0 &&
    !isCalculating &&
    !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !calculation) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await vacationsAPI.updateAbsence({
        id: absence.id,
        absence_type: absenceType,
        start_date: startDate,
        end_date: endDate,
        notes,
      });

      if (res.data.success) {
        const daysText = calculation.working_days === 1 ? 'día laboral' : 'días laborales';
        toast.success(`${ABSENCE_TYPES[absenceType]} actualizada correctamente`, {
          description: `${employee.full_name} • ${calculation.working_days} ${daysText} (${startDate} al ${endDate})`,
          duration: 6000,
        });
        onSuccess();
        onClose();
      } else {
        const msg = res.data.error || 'Error desconocido al actualizar ausencia';
        setSubmitError(msg);
        toast.error('No se pudo actualizar la ausencia', { description: msg, duration: 7000 });
      }
    } catch (error: unknown) {
      const msg = apiErrorMessage(error, 'Error al actualizar la ausencia');
      setSubmitError(msg);
      toast.error('Error al actualizar la ausencia', { description: msg, duration: 8000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: `¿Eliminar ausencia de ${employee.full_name}?`,
      description: 'El saldo se restaurará automáticamente. Esta acción no se puede deshacer.',
      variant: 'danger',
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
    });
    if (!ok) return;

    try {
      const res = await vacationsAPI.deleteAbsence(absence.id);
      if (res.data.success) {
        toast.success(`Ausencia eliminada: ${employee.full_name}`, {
          description: res.data.message || 'El saldo ha sido restaurado correctamente',
          duration: 6000,
        });
        onSuccess();
        onClose();
      }
    } catch (error: unknown) {
      toast.error('Error al eliminar ausencia', {
        description: apiErrorMessage(error, 'Error de conexión con el servidor'),
        duration: 8000,
      });
    }
  };

  const handleGenerateReceipt = () => {
    if (absence.absence_type !== 'vacation') {
      toast.error('Los recibos solo están disponibles para vacaciones');
      return;
    }
    setIsGeneratingReceipt(true);
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://intranet.volquetesescalante.com';
    const pdfUrl = `${baseUrl}/api/vacations/receipt-pdf.php?id=${absence.id}`;
    const newWindow = window.open(pdfUrl, '_blank');
    if (!newWindow || newWindow.closed) {
      toast.error('Ventana emergente bloqueada', {
        description: 'Permite ventanas emergentes para esta página e inténtalo de nuevo',
        duration: 6000,
      });
    } else {
      toast.success('Recibo generado correctamente', {
        description: `${employee.full_name} • ${absence.working_days_count} días`,
        duration: 4000,
      });
    }
    setIsGeneratingReceipt(false);
  };

  const footer = (
    <div className="flex items-center justify-between gap-3">
      {/* Izquierda: destructivo */}
      <Button type="button" variant="destructive" onClick={handleDelete} size="md">
        <Trash2 className="w-4 h-4 mr-2" />
        Eliminar
      </Button>

      {/* Derecha: cancelar + PDF + guardar */}
      <div className="flex items-center gap-2">
        <Button type="button" variant="subtle" onClick={onClose} disabled={isSubmitting} size="md">
          Cancelar
        </Button>
        {absence.absence_type === 'vacation' && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleGenerateReceipt}
            disabled={isGeneratingReceipt}
            isLoading={isGeneratingReceipt}
            size="md"
          >
            <FileText className="w-4 h-4 mr-2" />
            Recibo PDF
          </Button>
        )}
        <Button type="submit" form="edit-absence-form" disabled={!canSubmit} isLoading={isSubmitting} size="md">
          <CheckCircle className="w-4 h-4 mr-2" />
          Guardar
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Sheet
        isOpen={isOpen}
        onClose={onClose}
        title="Editar Ausencia"
        size="lg"
        footer={footer}
      >
        <form id="edit-absence-form" onSubmit={handleSubmit} className="space-y-5">

          {/* Empleado — solo lectura */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Empleado</label>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-[#5487c0] bg-[#1162a6]/5">
              <div className="w-9 h-9 rounded-full bg-[#1162a6] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {employee.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-gray-900 truncate">{employee.full_name}</span>
                <span className="block text-xs text-gray-500">{employee.location}</span>
              </div>
              {balance !== null && (
                <div className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${
                  balanceChipColor(balance.available_days)
                }`}>
                  <Calendar className="w-3 h-3" />
                  {Math.floor(balance.available_days)} días
                </div>
              )}
            </div>
          </div>

          {/* Tipo de ausencia */}
          <div className="space-y-2.5">
            <label className="block text-sm font-semibold text-gray-700">Tipo de Ausencia *</label>
            <div className="flex p-1 bg-gray-100 rounded-lg">
              {(Object.keys(ABSENCE_TYPES) as Array<keyof typeof ABSENCE_TYPES>).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAbsenceType(type)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${
                    absenceType === type
                      ? 'bg-white text-[#1162a6] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {ABSENCE_TYPES[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha Inicio *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1162a6] focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha Fin *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1162a6] focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Preview de cambios — solo cuando las fechas difieren de las originales */}
          {(startDate !== absence.start_date || endDate !== absence.end_date) &&
           (isCalculating || calculation || calculationError) && (
            <div className={`p-4 rounded-lg border-2 ${
              hasInsufficientBalance ? 'bg-yellow-50 border-yellow-300' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start gap-3">
                {isCalculating ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                ) : hasInsufficientBalance ? (
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Calculator className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  {isCalculating && (
                    <p className="text-sm text-gray-500">Recalculando...</p>
                  )}
                  {calculation && !isCalculating && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono font-semibold text-orange-600">{absence.working_days_count} días</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-mono font-semibold text-[#1162a6]">{calculation.working_days} días</span>
                        {calculation.working_days !== absence.working_days_count && (
                          <span className={`ml-auto text-xs font-bold font-mono ${
                            calculation.working_days > absence.working_days_count ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {calculation.working_days > absence.working_days_count ? '+' : ''}
                            {calculation.working_days - absence.working_days_count}
                          </span>
                        )}
                      </div>
                      {hasInsufficientBalance && (
                        <div className="p-2.5 bg-yellow-100 border border-yellow-400 rounded-lg">
                          <p className="text-yellow-900 font-semibold text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            Saldo negativo de {Math.abs(availableWithReturn - calculation.working_days)} días
                          </p>
                          <p className="text-yellow-800 text-xs mt-1">
                            Las vacaciones adelantadas se descontarán del saldo del próximo año
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {calculationError && (
                    <p className="text-red-600 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {calculationError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Conflictos operativos */}
          {conflictDetection?.hasConflict && (
            <div className={`p-4 rounded-lg border-2 ${
              conflictDetection.severity === 'critical'
                ? 'bg-[#1162a6] border-[#0d4d85]'
                : conflictDetection.severity === 'warning'
                ? 'bg-[#dbeafe] border-[#5487c0]'
                : 'bg-[#f0f9ff] border-[#a2bade]'
            }`}>
              <div className="flex items-start gap-3">
                <Users className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  conflictDetection.severity === 'critical' ? 'text-white'
                    : conflictDetection.severity === 'warning' ? 'text-[#2563eb]'
                    : 'text-[#3b82f6]'
                }`} />
                <div className="flex-1">
                  <div className={`font-semibold text-sm mb-1 ${
                    conflictDetection.severity === 'critical' ? 'text-white'
                      : conflictDetection.severity === 'warning' ? 'text-[#1e3a8a]'
                      : 'text-[#1e40af]'
                  }`}>
                    {conflictDetection.severity === 'critical' && '🚨 '}
                    {conflictDetection.severity === 'warning' && '⚠️ '}
                    {conflictDetection.severity === 'info' && 'ℹ️ '}
                    {conflictDetection.message}
                  </div>
                  {conflictDetection.impactDescription && (
                    <p className={`text-sm ${conflictDetection.severity === 'critical' ? 'text-white' : 'text-gray-700'}`}>
                      {conflictDetection.impactDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Notas (opcional)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Información adicional sobre esta ausencia..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1162a6] focus:border-transparent resize-none text-sm"
              />
            </div>
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{submitError}</p>
            </div>
          )}
        </form>
      </Sheet>
      {alertModal}
    </>
  );
};
