export interface EmployeeSummary {
  id: number;
  full_name: string;
  location: string;
  job_category: string;
  status: 'active' | 'inactive';
}

export interface EmployeeFull {
  id: number;
  employee_code?: string | null;
  location: 'Nave 01' | 'Nave 02';
  full_name: string;
  dni_nie: string;
  social_security_number: string;
  hire_date: string;
  rgpd_date?: string;
  phone?: string | null;
  email_primary: string;
  email_secondary?: string | null;
  birth_date?: string | null;
  job_category: string;
  gender?: 'Varón' | 'Mujer' | null;
  contract_type: 'Indefinido' | 'Temporal';
  contract_end_date?: string | null;
  iban: string | null;
  verso_user_id?: number | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  updated_by_name?: string;
  verso_user_name?: string;
}
