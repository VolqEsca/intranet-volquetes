export interface DashboardAlert {
  type: 'info' | 'critical';
  icon: string;
  title: string;
  count: number;
  message: string;
  action_path: string;
}

// 🆕 Interfaz para detalle individual de ausencia
export interface AbsenceDetail {
  full_name: string;
  absence_type: string;
  tipo_legible: string;
}

export interface DashboardKPIs {
  // Base (preservados)
  or_active: number;
  of_active: number;
  employees_total: number;
  
  // Contextuales Producción
  or_critical: number;
  or_in_progress: number;
  of_pending: number;
  of_in_progress: number;
  
  // Contextuales RRHH
  employees_absent_today: number;
  employees_absent_detail: AbsenceDetail[]; // 🆕 CRÍTICO: Esta línea faltaba
  employees_negative_balance: number;
  vacations_historical_total: number;
}

export interface DashboardData {
  alerts: DashboardAlert[];
  kpis: DashboardKPIs;
  timestamp: string;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}
