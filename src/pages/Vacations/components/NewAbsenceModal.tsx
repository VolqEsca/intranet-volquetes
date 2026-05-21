import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2, Calculator, Calendar, FileText, Users, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import {
  vacationsAPI,
  Employee,
  VacationBalance,
  Absence,
  ABSENCE_TYPES,
  WorkingDaysCalculation,
  detectConflicts,
  ConflictDetection
} from '../../../api/vacations';
import { isAxiosError } from 'axios';
import { apiErrorMessage } from '../../../utils/error';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: Employee[];
  balances: Record<number, VacationBalance>;
  calendarData: any; // TODO: tipar correctamente (Sprint 5)
  // ✅ NUEVO: Props para click-to-create
  prefilledDate?: string | null;
  prefilledEmployeeId?: number | null;
}

export const NewAbsenceModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  employees,
  balances,
  calendarData,
  prefilledDate = null,
  prefilledEmployeeId = null
}) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    absence_type: 'vacation' as 'vacation' | 'special_permit' | 'sick_leave' | 'unpaid_leave',
    start_date: '',
    end_date: '',
    notes: ''
  });

  const [calculation, setCalculation] = useState<WorkingDaysCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [conflictDetection, setConflictDetection] = useState<ConflictDetection | null>(null);
  
  // 🛡️ Estado para detección de solapamientos individuales
  const [overlapDetection, setOverlapDetection] = useState<{
    hasOverlap: boolean;
    message: string;
    existingAbsence?: Absence;
  } | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ✅ ACTUALIZADO: Reset con datos pre-rellenados
  useEffect(() => {
    if (isOpen) {
      setFormData({
        employee_id: prefilledEmployeeId ? String(prefilledEmployeeId) : '',
        absence_type: 'vacation',
        start_date: prefilledDate || '',
        end_date: prefilledDate || '',
        notes: ''
      });
      setCalculation(null);
      setCalculationError(null);
      setSubmitError(null);
      setConflictDetection(null);
      setOverlapDetection(null);
    }
  }, [isOpen, prefilledDate, prefilledEmployeeId]);

  // 🛡️ DETECCIÓN DE SOLAPAMIENTOS INDIVIDUALES (CRÍTICO v12.7)
  useEffect(() => {
    const checkOverlap = () => {
      if (formData.employee_id && formData.start_date && formData.end_date && calendarData) {
        const empId = Number(formData.employee_id);
        const newStart = formData.start_date;
        const newEnd = formData.end_date;

        // Buscar ausencias existentes de este empleado que se solapen
        // Lógica: (StartA <= EndB) AND (EndA >= StartB)
        const overlappingAbsence = calendarData.absences.find((abs: { employee_id: number; status: string; start_date: string; end_date: string }) => {
          if (abs.employee_id !== empId) return false;
          if (abs.status === 'rejected') return false; // Ignorar rechazadas
          
          return (newStart <= abs.end_date && newEnd >= abs.start_date);
        });

        if (overlappingAbsence) {
          setOverlapDetection({
            hasOverlap: true,
            message: `Ya existe una ausencia registrada que se solapa con este período`,
            existingAbsence: overlappingAbsence
          });
        } else {
          setOverlapDetection(null);
        }
      } else {
        setOverlapDetection(null);
      }
    };

    checkOverlap();
  }, [formData.employee_id, formData.start_date, formData.end_date, calendarData]);

  // Cálculo automático de días (solo si no hay solapamiento)
  useEffect(() => {
    const calculateDays = async () => {
      if (formData.start_date && formData.end_date && !overlapDetection?.hasOverlap) {
        setIsCalculating(true);
        setCalculationError(null);
        
        try {
          const response = await vacationsAPI.calculateWorkingDays(
            formData.start_date, 
            formData.end_date
          );
          setCalculation(response.data.calculation);
        } catch (error) {
          console.error('Error calculando días:', error);
          setCalculationError('Error al calcular días laborales');
          setCalculation(null);
        } finally {
          setIsCalculating(false);
        }
      } else {
        setCalculation(null);
        setCalculationError(null);
      }
    };

    const timeoutId = setTimeout(calculateDays, 300);
    return () => clearTimeout(timeoutId);
  }, [formData.start_date, formData.end_date, overlapDetection?.hasOverlap]);

  // Detección automática de conflictos operativos
  useEffect(() => {
    const checkConflicts = () => {
      if (formData.employee_id && formData.start_date && formData.end_date && calendarData && !overlapDetection?.hasOverlap) {
        const selectedEmployee = employees.find(emp => emp.id === Number(formData.employee_id));
        
        if (selectedEmployee) {
          const detection = detectConflicts(
            selectedEmployee.id,
            selectedEmployee.location,
            formData.start_date,
            formData.end_date,
            calendarData.employees,
            calendarData.absences
          );
          
          setConflictDetection(detection);
        } else {
          setConflictDetection(null);
        }
      } else {
        setConflictDetection(null);
      }
    };

    checkConflicts();
  }, [formData.employee_id, formData.start_date, formData.end_date, employees, calendarData, overlapDetection?.hasOverlap]);

  const selectedEmployee = employees.find(e => e.id === Number(formData.employee_id));
  const selectedBalance = selectedEmployee ? balances[selectedEmployee.id] : null;

  const hasInsufficientBalance = 
    formData.absence_type === 'vacation' && 
    selectedBalance && 
    calculation && 
    calculation.working_days > selectedBalance.available_days;

  // ✅ CRÍTICO v12.7: Bloqueo si hay solapamiento individual
  const canSubmit = 
    formData.employee_id && 
    formData.start_date && 
    formData.end_date && 
    calculation &&
    calculation.working_days > 0 &&
    !overlapDetection?.hasOverlap && // 🛡️ CRÍTICO: Bloqueo por solapamiento
    !isCalculating &&
    !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !calculation) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await vacationsAPI.createAbsence({
        ...formData,
        employee_id: Number(formData.employee_id)
      });

      if (response.data.success) {
        const employeeName = selectedEmployee?.full_name;
        const absenceTypeName = ABSENCE_TYPES[formData.absence_type];
        const daysText = calculation.working_days === 1 ? 'día laboral' : 'días laborales';
        
        toast.success(`${absenceTypeName} creada correctamente`, {
          description: `${employeeName} • ${calculation.working_days} ${daysText} (${formData.start_date} al ${formData.end_date})`,
          duration: 6000,
        });
        
        onSuccess();
        onClose();
      } else {
        const errorMessage = response.data.error || 'Error desconocido al crear ausencia';
        setSubmitError(errorMessage);
        toast.error('No se pudo crear la ausencia', { description: errorMessage });
      }
    } catch (error: unknown) {
      console.error('Error creando ausencia:', error);
      let errorMessage = 'Error al crear la ausencia';

      if (isAxiosError(error)) {
        const data = error.response?.data as Record<string, string> | undefined;
        if (error.response?.status === 409) {
          errorMessage = data?.details || 'Conflicto de fechas detectado';
        } else {
          errorMessage = data?.error || errorMessage;
        }
      } else {
        errorMessage = apiErrorMessage(error, errorMessage);
      }

      setSubmitError(errorMessage);
      toast.error('Error al crear la ausencia', { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={prefilledDate ? "Nueva Ausencia - Fecha Seleccionada" : "Nueva Ausencia"}
      size="max-w-2xl"
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* ✅ Banner informativo si viene de click-to-create */}
          {prefilledDate && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                <strong>Fecha pre-seleccionada:</strong> {new Date(prefilledDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          )}

          {/* Selección Empleado */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              Empleado *
            </label>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1162a6] focus:border-transparent text-sm"
              required
            >
              <option value="">Selecciona un empleado...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} • {emp.location}
                </option>
              ))}
            </select>
          </div>

          {/* Info empleado + saldo */}
          {selectedEmployee && selectedBalance && (
            <div className="p-3.5 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1162a6] flex items-center justify-center text-white font-bold text-xs">
                  {selectedEmployee.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm">{selectedEmployee.full_name}</div>
                  <div className="text-xs text-gray-600">
                    {selectedEmployee.job_category} • {selectedEmployee.location}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-gray-500">Disponibles</div>
                  <div className={`font-bold text-base ${
                    selectedBalance.available_days < 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {Math.floor(selectedBalance.available_days || 0)} días
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tipo de Ausencia */}
          <div className="space-y-2.5">
            <label className="block text-sm font-semibold text-gray-700">
              Tipo de Ausencia *
            </label>
            <div className="flex p-1 bg-gray-100 rounded-lg">
              {(Object.keys(ABSENCE_TYPES) as Array<keyof typeof ABSENCE_TYPES>).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({...formData, absence_type: type})}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${
                    formData.absence_type === type
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
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Fecha Inicio *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#1162a6] focus:border-transparent text-sm ${
                    overlapDetection?.hasOverlap ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Fecha Fin *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  min={formData.start_date}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#1162a6] focus:border-transparent text-sm ${
                    overlapDetection?.hasOverlap ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
              </div>
            </div>
          </div>

          {/* 🛡️ ALERTA DE SOLAPAMIENTO INDIVIDUAL (CRÍTICO v12.7) */}
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
                      <div className="text-red-700 text-xs">
                        <div><strong>Tipo:</strong> {ABSENCE_TYPES[overlapDetection.existingAbsence.absence_type as keyof typeof ABSENCE_TYPES]}</div>
                        <div><strong>Fechas:</strong> {overlapDetection.existingAbsence.start_date} al {overlapDetection.existingAbsence.end_date}</div>
                        <div><strong>Días:</strong> {overlapDetection.existingAbsence.working_days_count} laborales</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preview cálculo días (Solo si no hay solapamiento) */}
          {!overlapDetection?.hasOverlap && (isCalculating || calculation || calculationError) && (
            <div className={`p-4 rounded-lg border-2 ${
              hasInsufficientBalance 
                ? 'bg-yellow-50 border-yellow-300'
                : 'bg-blue-50 border-blue-200'
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
                        <span className="font-mono font-semibold text-[#1162a6]">
                          {calculation.working_days}
                        </span>
                      </div>

                      {/* ✅ v12.7: Warning amarillo para saldos negativos (no bloqueante) */}
                      {hasInsufficientBalance && selectedBalance && calculation && (
                        <div className="mt-2.5 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
                          <p className="text-yellow-900 font-semibold text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            Se generará un saldo negativo de {Math.abs(selectedBalance.available_days - calculation.working_days)} días
                          </p>
                          <p className="text-yellow-800 text-xs mt-1.5">
                            💡 Las vacaciones adelantadas se descontarán automáticamente del saldo del próximo año
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

          {/* Alerta de Conflictos Operativos (Solo si no hay solapamiento individual) */}
          {!overlapDetection?.hasOverlap && conflictDetection && conflictDetection.hasConflict && (
            <div className={`p-4 rounded-lg border-2 ${
              conflictDetection.severity === 'critical' 
                ? 'bg-[#1162a6] border-[#0d4d85]' 
                : conflictDetection.severity === 'warning' 
                ? 'bg-[#dbeafe] border-[#5487c0]' 
                : 'bg-[#f0f9ff] border-[#a3bade]'
            }`}>
              <div className="flex items-start gap-3">
                <Users className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  conflictDetection.severity === 'critical' 
                    ? 'text-white' 
                    : conflictDetection.severity === 'warning' 
                    ? 'text-[#2563eb]' 
                    : 'text-[#3b82f6]'
                }`} />
                
                <div className="flex-1">
                  <div className={`font-semibold text-sm mb-2 ${
                    conflictDetection.severity === 'critical' 
                      ? 'text-white' 
                      : conflictDetection.severity === 'warning' 
                      ? 'text-[#1e3a8a]' 
                      : 'text-[#1e40af]'
                  }`}>
                    {conflictDetection.severity === 'critical' && '🚨 '}
                    {conflictDetection.severity === 'warning' && '⚠️ '}
                    {conflictDetection.severity === 'info' && 'ℹ️ '}
                    {conflictDetection.message}
                  </div>
                  
                  {conflictDetection.impactDescription && (
                    <div className={`text-sm ${
                      conflictDetection.severity === 'critical' ? 'text-white' : 'text-gray-700'
                    }`}>
                      <p>{conflictDetection.impactDescription}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              Notas (opcional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={2}
                placeholder="Añade información adicional sobre esta ausencia..."
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

          {/* Botones */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="subtle"
              onClick={onClose}
              disabled={isSubmitting}
              size="md"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              isLoading={isSubmitting}
              size="md"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Crear Ausencia
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
