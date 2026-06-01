import { apiClient } from './index';

// ========================================
// INTERFACES PRINCIPALES
// ========================================

import type { EmployeeSummary as Employee } from '../types/employee';
export type { Employee };

export interface VacationBalance {
  id: number;
  employee_id: number;
  year: number;
  annual_days: number;
  carried_over_days: number;
  consumed_days: number;
  manual_adjustments: number;
  adjustment_reason?: string;
  available_days: number;
  total_generated: number;
}

export interface Absence {
  id: number;
  employee_id: number;
  absence_type: 'vacation' | 'special_permit' | 'sick_leave' | 'unpaid_leave';
  status: 'approved';
  start_date: string;
  end_date: string;
  working_days_count: number;
  year: number;
  notes?: string;
  created_at: string;
}

export interface Holiday {
  id: number;
  holiday_date: string;
  description: string;
  type: 'national' | 'regional' | 'local' | 'agreement';
  year: number;
  is_active?: boolean;
}

export interface CalendarData {
  employees: Employee[];
  absences: Absence[];
  balances: Record<number, VacationBalance>;
  holidays: Holiday[];
  meta: {
    year: number;
    month: number;
    total_employees: number;
  };
}

export interface WorkingDaysCalculation {
  working_days: number;
  breakdown: {
    total_days: number;
    weekends: number;
    holidays: number;
  };
}

// ========================================
// INTERFACES DETECCIÓN DE CONFLICTOS
// ========================================

export interface ConflictEmployee {
  id: number;
  full_name: string;
  start_date: string;
  end_date: string;
  working_days_count: number;
}

export interface ConflictDetection {
  hasConflict: boolean;
  severity: 'none' | 'info' | 'warning' | 'critical';
  location: string;
  conflictingEmployees: ConflictEmployee[];
  totalEmployeesInLocation: number;
  affectedCount: number;
  message: string;
  impactDescription?: string;
}

// ========================================
// INTERFACES REPORTE MENSUAL
// ========================================

export interface WeeklyRange {
  start_date: string;
  end_date: string;
  working_days: number;
}

export interface MonthlyReportData {
  vacations: Record<string, WeeklyRange[]>;
  unpaid_leaves: Record<string, WeeklyRange[]>;
}

export interface MonthlyReportResponse {
  success: boolean;
  year: number;
  month: number;
  data: MonthlyReportData;
}

// ========================================
// INTERFACES GESTIÓN DE FESTIVOS v13.1.4
// ========================================

export interface HolidayFormData {
  holiday_date: string;
  description: string;
  type: 'national' | 'regional' | 'local' | 'agreement';
}

// ✅ CORRECCIÓN CRÍTICA: Interface que refleja estructura real del backend
export interface HolidaysResponse {
  success: boolean;
  year: number;
  holidays: Holiday[];
  total: number;
}

export interface CopyYearResponse {
  success: boolean;
  message: string;
  stats: {
    copied: number;
    skipped: number;
    total_fixed: number;
    pending_manual: number;
  };
  warning?: string;
  errors?: string[];
}

export interface UpdateBalanceData {
  employee_id: number;
  year: number;
  annual_days: number;
  carried_over_days: number;
  manual_adjustments: number;
  adjustment_reason: string;
}

// ========================================
// CONSTANTES Y UTILIDADES
// ========================================

export const ABSENCE_TYPES = {
  vacation: 'Vacaciones',
  special_permit: 'Permiso Especial',
  sick_leave: 'Baja Médica',
  unpaid_leave: 'Permiso No Retribuido'
};

export const getAbsenceColor = (type: string) => {
  switch (type) {
    case 'vacation': return '#1162a6';
    case 'special_permit': return '#5487c0';
    case 'sick_leave': return '#a2bade';
    case 'unpaid_leave': return '#dc2626';
    default: return '#cbd5e1';
  }
};

export const getAbsenceTextColor = (type: string) => {
  switch (type) {
    case 'vacation':       return '#072742';
    case 'special_permit': return '#22364d';
    case 'sick_leave':     return '#414a59';
    case 'unpaid_leave':   return '#580f0f';
    default:               return '#51555a';
  }
};

export const getBalanceBadgeColor = (available: number, total: number) => {
  // 🔴 PRIORIDAD CRÍTICA: Saldo negativo = Rojo intenso corporativo
  if (available < 0) {
    return 'bg-red-600 text-white border-red-700 font-bold shadow-sm';
  }
  
  // Escala normal para saldos positivos/cero
  const percentage = total > 0 ? (available / total) * 100 : 0;
  if (percentage >= 70) return 'bg-green-100 text-green-800 border-green-200';
  if (percentage >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (percentage > 0) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-red-100 text-red-800 border-red-200'; // Saldo exacto = 0
};

export const getMonthName = (month: number) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month - 1];
};

export const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

export const getAbsencesForDate = (employeeId: number, dateString: string, absences: Absence[]) => {
  return absences.find(abs => 
    abs.employee_id === employeeId && 
    dateString >= abs.start_date && 
    dateString <= abs.end_date
  );
};

export const getHolidayForDate = (dateString: string, holidays: Holiday[]) => {
  return holidays.find(h => h.holiday_date === dateString);
};

// ✅ CONSTANTES FESTIVOS v13.1.4
export const HOLIDAY_TYPES = {
  national: 'Nacional',
  regional: 'Autonómico', 
  local: 'Local',
  agreement: 'Convenio',
} as const;

export const HOLIDAY_TYPE_COLORS = {
  national: 'bg-[#1162a6] text-white border-[#1162a6]',
  regional: 'bg-[#5487c0]/20 text-[#1162a6] border-[#5487c0]/30',
  local: 'bg-[#a2bade]/20 text-[#1162a6] border-[#a2bade]/40',
  agreement: 'bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20',
} as const;

// ========================================
// API CALLS
// ========================================

export const vacationsAPI = {
  getCalendar: (year: number, month: number) => 
    apiClient.get<CalendarData>(`/vacations/calendar.php?year=${year}&month=${month}`),

  getYearlyAbsences: (year: number, employeeId?: number) =>
    apiClient.get<{ absences: Absence[] }>(
      `/vacations/calendar.php?year=${year}${employeeId ? `&employee_id=${employeeId}` : ''}`
    ),

  calculateWorkingDays: (start: string, end: string) => 
    apiClient.get<{ calculation: WorkingDaysCalculation }>(`/vacations/calculate-days.php?start=${start}&end=${end}`),

  createAbsence: (data: Partial<Absence>) => 
    apiClient.post('/vacations/create.php', data),

  updateAbsence: (data: Partial<Absence>) => 
    apiClient.put('/vacations/update.php', data),

  deleteAbsence: (id: number) => 
    apiClient.delete(`/vacations/delete.php?id=${id}`),

  updateBalance: (data: UpdateBalanceData) =>
    apiClient.post('/vacations/update-balance.php', data),
    
  // ✅ CORRECCIÓN CRÍTICA: Tipado correcto según respuesta backend
  getHolidays: (year: number) => 
    apiClient.get<HolidaysResponse>(`/vacations/holidays.php?year=${year}`),

  getMonthlyReport: (year: number, month: number) => 
    apiClient.get<MonthlyReportResponse>(`/vacations/monthly-report.php?year=${year}&month=${month}`),

  // ✅ Generación de recibos PDF
  generateReceipt: (absenceId: number) =>
    apiClient.get(`/vacations/receipt-pdf.php?id=${absenceId}`, {
      responseType: 'blob'
    })
};

// ========================================
// API GESTIÓN DE FESTIVOS v13.1.4
// ========================================

export const holidaysAPI = {
  // Crear festivo
  create: (data: HolidayFormData): Promise<{ data: { success: boolean; message: string; id: number } }> =>
    apiClient.post('/vacations/holidays/create.php', data),

  // Actualizar festivo
  update: (id: number, data: HolidayFormData): Promise<{ data: { success: boolean; message: string } }> =>
    apiClient.put(`/vacations/holidays/update.php?id=${id}`, data),

  // Eliminar festivo
  delete: (id: number): Promise<{ data: { success: boolean; message: string; warning?: string; affected_absences?: number } }> =>
    apiClient.delete(`/vacations/holidays/delete.php?id=${id}`),

  // ✅ SMART SEEDING: Copiar festivos estándar
  copyYear: (targetYear: number): Promise<{ data: CopyYearResponse }> =>
    apiClient.post('/vacations/holidays/copy-year.php', { target_year: targetYear }),
};

// ========================================
// DETECCIÓN INTELIGENTE DE CONFLICTOS
// ========================================

export const detectConflicts = (
  employeeId: number,
  location: string,
  startDate: string,
  endDate: string,
  employees: Employee[],
  absences: Absence[],
  excludeAbsenceId?: number,
  warningThreshold = 3,
  criticalRemaining = 2
): ConflictDetection => {
  const employeesInLocation = employees.filter(emp => 
    emp.location === location && emp.status === 'active'
  );
  const totalInLocation = employeesInLocation.length;

  const proposedStart = new Date(startDate + 'T00:00:00');
  const proposedEnd = new Date(endDate + 'T00:00:00');

  const conflictingEmployees: ConflictEmployee[] = [];

  employeesInLocation.forEach(emp => {
    if (emp.id === employeeId) return;

    const empAbsences = absences.filter(abs => {
      if (excludeAbsenceId && abs.id === excludeAbsenceId) return false;
      if (abs.employee_id !== emp.id) return false;
      if (abs.absence_type !== 'vacation' && abs.absence_type !== 'unpaid_leave') return false;

      const absStart = new Date(abs.start_date + 'T00:00:00');
      const absEnd = new Date(abs.end_date + 'T00:00:00');

      return absStart <= proposedEnd && absEnd >= proposedStart;
    });

    empAbsences.forEach(abs => {
      conflictingEmployees.push({
        id: emp.id,
        full_name: emp.full_name,
        start_date: abs.start_date,
        end_date: abs.end_date,
        working_days_count: abs.working_days_count
      });
    });
  });

  const affectedCount = conflictingEmployees.length;
  const remainingEmployees = totalInLocation - affectedCount - 1;

  let severity: ConflictDetection['severity'] = 'none';
  let message = '';
  let impactDescription = '';

  if (affectedCount === 0) {
    severity = 'none';
    message = 'No hay conflictos detectados';
  } else if (remainingEmployees <= criticalRemaining) {
    severity = 'critical';
    message = `ALERTA OPERATIVA: ${location}`;
    impactDescription = `Solo quedarían ${remainingEmployees} empleados operativos. Riesgo de parada de producción.`;
  } else if (affectedCount >= warningThreshold) {
    severity = 'warning';
    message = `Concentración de Ausencias en ${location}`;
    impactDescription = `${affectedCount} empleados ya ausentes. Revisar carga de trabajo restante.`;
  } else {
    severity = 'info';
    message = `Coincidencia en ${location}`;
    impactDescription = `${affectedCount} empleado(s) con ausencias coincidentes.`;
  }

  return {
    hasConflict: affectedCount > 0,
    severity,
    location,
    conflictingEmployees,
    totalEmployeesInLocation: totalInLocation,
    affectedCount,
    message,
    impactDescription
  };
};
