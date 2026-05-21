import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2, Calculator, Calendar, FileText, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import {
  vacationsAPI,
  Absence,
  Employee,
  VacationBalance,
  ABSENCE_TYPES,
  WorkingDaysCalculation,
  detectConflicts,
  ConflictDetection
} from '../../../api/vacations';
import { dialog } from '../../../services/dialog.service';
import { apiErrorMessage } from '../../../utils/error';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  absence: Absence | null;
  employee: Employee | null;
  balance: VacationBalance | null;
  calendarData: any; // TODO: tipar correctamente (Sprint 5)
}

export const EditAbsenceModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  absence,
  employee,
  balance,
  calendarData
}) => {
  const [formData, setFormData] = useState({
    absence_type: 'vacation' as 'vacation' | 'special_permit' | 'sick_leave' | 'unpaid_leave',
    start_date: '',
    end_date: '',
    notes: ''
  });

  const [calculation, setCalculation] = useState<WorkingDaysCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [conflictDetection, setConflictDetection] = useState<ConflictDetection | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

  // Pre-cargar datos al abrir modal
  useEffect(() => {
    if (isOpen && absence) {
      setFormData({
        absence_type: absence.absence_type,
        start_date: absence.start_date,
        end_date: absence.end_date,
        notes: absence.notes || ''
      });
      setCalculation(null);
      setCalculationError(null);
      setSubmitError(null);
      setConflictDetection(null);
      setIsGeneratingReceipt(false);
    }
  }, [isOpen, absence]);

  // Cálculo automático de días
  useEffect(() => {
    const calculateDays = async () => {
      if (formData.start_date && formData.end_date) {
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
  }, [formData.start_date, formData.end_date]);

  // Detección automática de conflictos
  useEffect(() => {
    const checkConflicts = () => {
      if (absence && employee && formData.start_date && formData.end_date && calendarData) {
        const detection = detectConflicts(
          employee.id,
          employee.location,
          formData.start_date,
          formData.end_date,
          calendarData.employees,
          calendarData.absences,
          absence.id
        );
        
        setConflictDetection(detection);
      } else {
        setConflictDetection(null);
      }
    };

    checkConflicts();
  }, [formData.start_date, formData.end_date, absence, employee, calendarData]);

  if (!absence || !employee) return null;

  // Lógica de saldo inteligente
  const currentAbsenceReturn = absence.absence_type === 'vacation' ? absence.working_days_count : 0;
  const availableWithReturn = (balance?.available_days || 0) + currentAbsenceReturn;

  const hasInsufficientBalance = 
    formData.absence_type === 'vacation' && 
    calculation && 
    calculation.working_days > availableWithReturn;

  const canSubmit = 
    formData.start_date && 
    formData.end_date && 
    calculation &&
    calculation.working_days > 0 &&
    !hasInsufficientBalance &&
    !isCalculating &&
    !isSubmitting;

  // ✅ SOLUCIÓN DEFINITIVA v13.0.2: Enlace directo sin axios/blob
  const handleGenerateReceipt = () => {
    if (!absence || absence.absence_type !== 'vacation') {
      toast.error('Los recibos solo están disponibles para vacaciones');
      return;
    }

    setIsGeneratingReceipt(true);

    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://intranet.volquetesescalante.com';
    const pdfUrl = `${baseUrl}/api/vacations/receipt-pdf.php?id=${absence.id}`;
    
    // Abrir en nueva pestaña
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !calculation) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await vacationsAPI.updateAbsence({
        id: absence.id,
        ...formData
      });

      if (response.data.success) {
        const absenceTypeName = ABSENCE_TYPES[formData.absence_type];
        const daysText = calculation.working_days === 1 ? 'día laboral' : 'días laborales';
        
        toast.success(`${absenceTypeName} actualizada correctamente`, {
          description: `${employee.full_name} • ${calculation.working_days} ${daysText} (${formData.start_date} al ${formData.end_date})`,
          duration: 6000,
        });
        
        onSuccess();
        onClose();
      } else {
        const errorMessage = response.data.error || 'Error desconocido al actualizar ausencia';
        setSubmitError(errorMessage);
        
        toast.error('No se pudo actualizar la ausencia', {
          description: errorMessage,
          duration: 7000,
        });
      }
    } catch (error: unknown) {
      console.error('Error actualizando ausencia:', error);
      const errorMessage = apiErrorMessage(error, 'Error al actualizar la ausencia');
      setSubmitError(errorMessage);

      toast.error('Error al actualizar la ausencia', {
        description: errorMessage,
        duration: 8000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await dialog.confirm(
      `¿Eliminar la ausencia de ${employee.full_name}?`,
      'El saldo se restaurará automáticamente.'
    );
    if (!confirmed) return;

    try {
      const response = await vacationsAPI.deleteAbsence(absence.id);
      
      if (response.data.success) {
        toast.success(`Ausencia eliminada: ${employee.full_name}`, {
          description: response.data.message || 'El saldo ha sido restaurado correctamente',
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Ausencia"
      size="max-w-2xl"
    >
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Info empleado con métricas de cambio */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1162a6] flex items-center justify-center text-white font-bold text-xs">
                {employee.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm">{employee.full_name}</div>
                <div className="text-xs text-gray-600">{employee.job_category} • {employee.location}</div>
              </div>
            </div>
            {balance && (
              <div className="grid grid-cols-3 gap-3 pt-2.5 mt-2.5 border-t border-blue-200">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-0.5">Disponibles</div>
                  <div className="font-bold text-green-600 text-base">{Math.floor(balance.available_days)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-0.5">Esta Ausencia</div>
                  <div className="font-bold text-orange-600 text-base">{absence.working_days_count}d</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-0.5">Nuevo Cálculo</div>
                  <div className="font-bold text-[#1162a6] text-base">
                    {calculation ? `${calculation.working_days}d` : '—'}
                  </div>
                </div>
              </div>
            )}
          </div>

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
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1162a6] focus:border-transparent text-sm"
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
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1162a6] focus:border-transparent text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Preview de cambios */}
          {(isCalculating || calculation || calculationError) && (
            <div className={`p-4 rounded-lg border-2 ${
              hasInsufficientBalance 
                ? 'bg-red-50 border-red-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start gap-3.5">
                {isCalculating ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                ) : hasInsufficientBalance ? (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Calculator className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900 mb-2.5">
                    {isCalculating ? 'Recalculando días laborables...' : 'Preview de Cambios'}
                  </div>
                  
                  {calculation && !isCalculating && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Días laborales nuevos:</span>
                        <span className="font-mono font-semibold text-[#1162a6]">{calculation.working_days}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Días laborales actuales:</span>
                        <span className="font-mono font-semibold text-orange-600">{absence.working_days_count}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Diferencia:</span>
                        <span className={`font-mono font-bold ${
                          calculation.working_days > absence.working_days_count ? 'text-red-600' : 
                          calculation.working_days < absence.working_days_count ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {calculation.working_days > absence.working_days_count ? '+' : ''}
                          {calculation.working_days - absence.working_days_count} días
                        </span>
                      </div>

                      {hasInsufficientBalance && (
                        <div className="mt-2.5 p-2.5 bg-red-100 border border-red-300 rounded-lg">
                          <p className="text-red-800 font-semibold text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            Saldo insuficiente para este cambio
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

          {/* ALERTA DE CONFLICTOS CORPORATIVA VERSO */}
          {conflictDetection && conflictDetection.hasConflict && (
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
                  
                  <div className={`space-y-2 text-sm ${
                    conflictDetection.severity === 'critical' ? 'text-white' : 'text-gray-700'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Empleados afectados:</span>
                      <span className="font-bold">
                        {conflictDetection.affectedCount} de {conflictDetection.totalEmployeesInLocation}
                      </span>
                    </div>
                    
                    <div className={`mt-2 p-3 rounded-md ${
                      conflictDetection.severity === 'critical' 
                        ? 'bg-[#0d4d85]' 
                        : conflictDetection.severity === 'warning' 
                        ? 'bg-[#bfdbfe]' 
                        : 'bg-[#dbeafe]'
                    }`}>
                      <p className={`font-semibold text-xs mb-1.5 uppercase tracking-wide ${
                        conflictDetection.severity === 'critical' ? 'text-blue-100' : 'text-[#1e40af]'
                      }`}>
                        Ausencias detectadas:
                      </p>
                      <div className="space-y-1">
                        {conflictDetection.conflictingEmployees.map((emp, idx) => (
                          <div key={idx} className={`text-xs flex justify-between items-center ${
                            conflictDetection.severity === 'critical' ? 'text-white' : 'text-gray-800'
                          }`}>
                            <span className="font-medium">{emp.full_name}</span>
                            <span className="font-mono text-xs">
                              {emp.start_date} → {emp.end_date} ({emp.working_days_count}d)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {conflictDetection.impactDescription && (
                      <div className={`mt-2 p-2.5 rounded-lg border-2 ${
                        conflictDetection.severity === 'critical' 
                          ? 'bg-[#0d4d85] border-[#084081]' 
                          : conflictDetection.severity === 'warning' 
                          ? 'bg-[#93c5fd] border-[#60a5fa]' 
                          : 'bg-[#bfdbfe] border-[#93c5fd]'
                      }`}>
                        <p className={`font-bold text-xs flex items-start gap-2 ${
                          conflictDetection.severity === 'critical' 
                            ? 'text-white' 
                            : 'text-[#1e3a8a]'
                        }`}>
                          <span className="flex-shrink-0 mt-0.5">🏭</span>
                          <span>
                            <span className="uppercase tracking-wide">IMPACTO:</span> {conflictDetection.impactDescription}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
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

          {/* FOOTER OPTIMIZADO */}
          <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-200">
            {/* Lado izquierdo: Acciones secundarias */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                size="md"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>

              {/* ✅ BOTÓN RECIBO PDF OPTIMIZADO - Solo para vacaciones */}
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
                  {isGeneratingReceipt ? 'Generando...' : 'Recibo PDF'}
                </Button>
              )}
            </div>

            {/* Lado derecho: Acciones principales */}
            <div className="flex gap-3">
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
                Guardar Cambios
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
