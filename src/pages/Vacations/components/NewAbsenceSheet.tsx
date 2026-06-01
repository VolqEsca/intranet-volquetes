import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2, Calculator, Calendar, FileText, Users, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet } from '../../../components/ui/Sheet';
import { Button } from '../../../components/ui/Button';
import { EmployeeCombobox } from './EmployeeCombobox';
import {
  vacationsAPI,
  CalendarData,
  Absence,
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
import { isAxiosError } from 'axios';
import { apiErrorMessage } from '../../../utils/error';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  calendarData: CalendarData;
  prefilledDate?: string | null;
  prefilledEmployeeId?: number | null;
  warningThreshold?: number;
  criticalRemaining?: number;
}

export const NewAbsenceSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  calendarData,
  prefilledDate = null,
  prefilledEmployeeId = null,
  warningThreshold = 3,
  criticalRemaining = 2,
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [absenceType, setAbsenceType] = useState<keyof typeof ABSENCE_TYPES>('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const [calculation, setCalculation] = useState<WorkingDaysCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [conflictDetection, setConflictDetection] = useState<ConflictDetection | null>(null);
  const [overlapDetection, setOverlapDetection] = useState<{
    hasOverlap: boolean;
    message: string;
    existingAbsence?: Absence;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const prefillEmp = prefilledEmployeeId
        ? calendarData.employees.find(e => e.id === prefilledEmployeeId)
        : null;
      setEmployeeId(prefillEmp ? String(prefillEmp.id) : '');
      setEmployeeName(prefillEmp?.full_name ?? '');
      setAbsenceType('vacation');
      setStartDate(prefilledDate || '');
      setEndDate(prefilledDate || '');
      setNotes('');
      setCalculation(null);
      setCalculationError(null);
      setSubmitError(null);
      setConflictDetection(null);
      setOverlapDetection(null);
    }
  }, [isOpen, prefilledDate, prefilledEmployeeId, calendarData]);

  // Detección de solapamiento individual
  useEffect(() => {
    if (employeeId && startDate && endDate) {
      const empId = Number(employeeId);
      const overlapping = calendarData.absences.find(abs => {
        if (abs.employee_id !== empId) return false;
        return startDate <= abs.end_date && endDate >= abs.start_date;
      });
      if (overlapping) {
        setOverlapDetection({
          hasOverlap: true,
          message: 'Ya existe una ausencia registrada que se solapa con este período',
          existingAbsence: overlapping,
        });
      } else {
        setOverlapDetection(null);
      }
    } else {
      setOverlapDetection(null);
    }
  }, [employeeId, startDate, endDate, calendarData]);

  // Cálculo automático de días con debounce
  useEffect(() => {
    if (!startDate || !endDate || overlapDetection?.hasOverlap) {
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
  }, [startDate, endDate, overlapDetection?.hasOverlap]);

  // Detección de conflictos operativos
  useEffect(() => {
    if (!employeeId || !startDate || !endDate || overlapDetection?.hasOverlap) {
      setConflictDetection(null);
      return;
    }
    const empId = Number(employeeId);
    const emp = calendarData.employees.find(e => e.id === empId);
    if (emp) {
      setConflictDetection(
        detectConflicts(emp.id, emp.location, startDate, endDate, calendarData.employees, calendarData.absences, undefined, warningThreshold, criticalRemaining)
      );
    } else {
      setConflictDetection(null);
    }
  }, [employeeId, startDate, endDate, calendarData, overlapDetection?.hasOverlap]);

  const balance = employeeId ? (calendarData.balances[Number(employeeId)] ?? null) : null;

  const hasInsufficientBalance =
    absenceType === 'vacation' &&
    balance !== null &&
    calculation !== null &&
    calculation.working_days > balance.available_days;

  const canSubmit =
    !!employeeId &&
    !!startDate &&
    !!endDate &&
    calculation !== null &&
    calculation.working_days > 0 &&
    !overlapDetection?.hasOverlap &&
    !isCalculating &&
    !isSubmitting;

  const handleEmployeeChange = (id: string, name: string) => {
    setEmployeeId(id);
    setEmployeeName(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !calculation) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await vacationsAPI.createAbsence({
        employee_id: Number(employeeId),
        absence_type: absenceType,
        start_date: startDate,
        end_date: endDate,
        notes,
      });

      if (res.data.success) {
        const daysText = calculation.working_days === 1 ? 'día laboral' : 'días laborales';
        toast.success(`${ABSENCE_TYPES[absenceType]} creada correctamente`, {
          description: `${employeeName} • ${calculation.working_days} ${daysText} (${startDate} al ${endDate})`,
          duration: 6000,
        });
        onSuccess();
        onClose();
      } else {
        const msg = res.data.error || 'Error desconocido al crear ausencia';
        setSubmitError(msg);
        toast.error('No se pudo crear la ausencia', { description: msg });
      }
    } catch (error: unknown) {
      let msg = 'Error al crear la ausencia';
      if (isAxiosError(error)) {
        const data = error.response?.data as Record<string, string> | undefined;
        msg = error.response?.status === 409
          ? (data?.details || 'Conflicto de fechas detectado')
          : (data?.error || msg);
      } else {
        msg = apiErrorMessage(error, msg);
      }
      setSubmitError(msg);
      toast.error('Error al crear la ausencia', { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-end items-center gap-3">
      <Button type="button" variant="subtle" onClick={onClose} disabled={isSubmitting} size="md">
        Cancelar
      </Button>
      <Button type="submit" form="new-absence-form" disabled={!canSubmit} isLoading={isSubmitting} size="md">
        <CheckCircle className="w-4 h-4 mr-2" />
        Crear Ausencia
      </Button>
    </div>
  );

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={prefilledDate ? 'Nueva Ausencia — Fecha Seleccionada' : 'Nueva Ausencia'}
      size="lg"
      footer={footer}
    >
      <form id="new-absence-form" onSubmit={handleSubmit} className="space-y-5">

        {/* Banner fecha pre-seleccionada */}
        {prefilledDate && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              <strong>Fecha pre-seleccionada:</strong>{' '}
              {new Date(prefilledDate + 'T00:00:00').toLocaleDateString('es-ES', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Empleado */}
        <EmployeeCombobox
          value={employeeId}
          initialName={employeeName || undefined}
          onChange={handleEmployeeChange}
        />

        {/* Chip de saldo inline */}
        {balance !== null && (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${
            balanceChipColor(balance.available_days)
          }`}>
            <Calendar className="w-3.5 h-3.5" />
            {Math.floor(balance.available_days)} días disponibles
          </div>
        )}

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
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#1162a6] focus:border-transparent text-sm ${
                  overlapDetection?.hasOverlap ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
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
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#1162a6] focus:border-transparent text-sm ${
                  overlapDetection?.hasOverlap ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
            </div>
          </div>
        </div>

        {/* Alerta solapamiento (bloqueante) */}
        {overlapDetection?.hasOverlap && (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
            <div className="flex items-start gap-3">
              <Ban className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 font-bold text-sm mb-1">Fechas no válidas</p>
                <p className="text-red-700 text-sm">{overlapDetection.message}</p>
                {overlapDetection.existingAbsence && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-xs font-semibold mb-1">AUSENCIA EXISTENTE:</p>
                    <div className="text-red-700 text-xs space-y-0.5">
                      <div><strong>Tipo:</strong> {ABSENCE_TYPES[overlapDetection.existingAbsence.absence_type]}</div>
                      <div><strong>Fechas:</strong> {overlapDetection.existingAbsence.start_date} al {overlapDetection.existingAbsence.end_date}</div>
                      <div><strong>Días:</strong> {overlapDetection.existingAbsence.working_days_count} laborales</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cálculo de días */}
        {!overlapDetection?.hasOverlap && (isCalculating || calculation || calculationError) && (
          <div className={`p-4 rounded-lg border-2 ${
            hasInsufficientBalance ? 'bg-yellow-50 border-yellow-300' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start gap-3.5">
              {isCalculating ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
              ) : hasInsufficientBalance ? (
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Calculator className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-900 mb-2.5">
                  {isCalculating ? 'Calculando días laborables...' : 'Resumen de Días'}
                </div>
                {calculation && !isCalculating && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Días laborales:</span>
                      <span className="font-mono font-semibold text-[#1162a6]">{calculation.working_days}</span>
                    </div>
                    {hasInsufficientBalance && balance && (
                      <div className="mt-2.5 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
                        <p className="text-yellow-900 font-semibold text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          Se generará un saldo negativo de {Math.abs(balance.available_days - calculation.working_days)} días
                        </p>
                        <p className="text-yellow-800 text-xs mt-1.5">
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

        {/* Conflictos operativos (warning, no bloqueante) */}
        {!overlapDetection?.hasOverlap && conflictDetection?.hasConflict && (
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
                <div className={`font-semibold text-sm mb-2 ${
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
  );
};
