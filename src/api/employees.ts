// src/api/employees.ts
import { apiClient as api } from './index';

export interface Employee {
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

export interface EmployeeFormData {
  employee_code?: string;
  location: 'Nave 01' | 'Nave 02';
  full_name: string;
  dni_nie: string;
  social_security_number: string;
  hire_date: string | null;
  rgpd_date?: string | null;
  phone?: string;
  email_primary?: string; // Opcional - backend genera si está vacío
  email_secondary?: string;
  birth_date: string | null;
  job_category: string;
  gender?: 'Varón' | 'Mujer';
  contract_type: 'Indefinido' | 'Temporal';
  contract_end_date: string | null;
  iban?: string; // Opcional
  verso_user_id?: number | null;
}

export interface PaginationData {
  current_page: number;
  total_pages: number;
  total_records: number;
  limit: number;
}

export interface EmployeesResponse {
  employees: Employee[];
  pagination: PaginationData;
}

export interface EmployeeApiResponse {
  success: boolean;
  message?: string;
  employee?: Employee;
  employee_id?: number;
  error?: string;
}

export interface ImportResponse {
  success: boolean;
  imported: number;
  updated: number;
  total: number;
  errors: string[];
}

// Función normalización centralizada
function normalizeEmployeePayload(data: Partial<EmployeeFormData>) {
  return {
    employee_code: data.employee_code?.trim() || null,
    location: data.location,
    full_name: data.full_name?.trim(),
    dni_nie: data.dni_nie?.replace(/\s/g, '').toUpperCase(),
    social_security_number: data.social_security_number?.replace(/\s/g, ''),
    hire_date: data.hire_date || null,
    phone: data.phone?.replace(/[\s-]/g, '') || null,
    email_primary: data.email_primary?.trim() || null,
    email_secondary: data.email_secondary?.trim() || null,
    birth_date: data.birth_date || null,
    job_category: data.job_category?.trim(),
    gender: data.gender || null,
    contract_type: data.contract_type || 'Indefinido',
    contract_end_date: data.contract_end_date || null,
    iban: data.iban?.trim() || null,
    verso_user_id: data.verso_user_id ?? null
  };
}

// Constantes para formularios
export const EMPLOYEE_CONSTANTS = {
  LOCATIONS: ['Nave 01', 'Nave 02'] as const,
  GENDERS: ['Varón', 'Mujer'] as const,
  CONTRACT_TYPES: ['Indefinido', 'Temporal'] as const,
  JOB_CATEGORIES: [
    'OFICIAL 1ª',
    'OFICIAL 2ª', 
    'OFICIAL 3ª',
    'PEON',
    'AUXILIAR ADMINISTRATIVO',
    'ENCARGADO'
  ] as const
};

// API calls para empleados
export const employeesAPI = {
  // Listar empleados
  list: (params: any = {}): Promise<{ data: EmployeesResponse }> => 
    api.get('/employees/list.php', { params }),

  // Crear empleado
  create: (data: EmployeeFormData): Promise<{ data: EmployeeApiResponse }> => {
    const jsonData = normalizeEmployeePayload(data);
    return api.post('/employees/create.php', jsonData);
  },

  // Obtener detalles
  details: (id: number): Promise<{ data: { success: boolean; employee: Employee } }> => 
    api.get(`/employees/details.php?id=${id}`),

  // Actualizar empleado
  update: (id: number, data: Partial<EmployeeFormData>): Promise<{ data: EmployeeApiResponse }> => {
    const jsonData = normalizeEmployeePayload(data);
    return api.put(`/employees/update.php?id=${id}`, jsonData);
  },

  // Eliminar empleado (soft delete)
  delete: (id: number): Promise<{ data: EmployeeApiResponse }> => 
    api.delete(`/employees/delete.php?id=${id}`),

  // Importar empleados
  import: (file: File): Promise<{ data: ImportResponse }> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/employees/import.php', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // NUEVA FUNCIONALIDAD: Generar documento individual
  generateDocument: (employeeId: number, documentType: string): Promise<{ data: Blob }> => 
  api.get(`/employees/details.php?id=${employeeId}&action=generate_document&document_type=${documentType}`, {
    responseType: 'blob'
  }),

  // Funciones auxiliares para formularios
  validateDNI_NIE: (document: string): boolean => {
    const clean = document.replace(/\s/g, '').toUpperCase();
    
    // DNI: 8 dígitos + letra
    if (/^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(clean)) {
      const number = parseInt(clean.substring(0, 8));
      const letter = clean.substring(8, 9);
      const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
      return letters[number % 23] === letter;
    }
    
    // NIE: X/Y/Z + 7 dígitos + letra
    if (/^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/.test(clean)) {
      const nieMap: { [key: string]: string } = { 'X': '0', 'Y': '1', 'Z': '2' };
      const number = parseInt(nieMap[clean[0]] + clean.substring(1, 8));
      const letter = clean.substring(8, 9);
      const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
      return letters[number % 23] === letter;
    }
    
    return false;
  },

  validateIBAN: (iban: string): boolean => {
    if (!iban || iban.trim() === '') return true; // IBAN opcional
    
    const clean = iban.replace(/\s/g, '').toUpperCase();
    if (clean.length !== 24 || !clean.startsWith('ES')) {
      return false;
    }
    
    // Algoritmo módulo 97 ISO 13616
    const rearranged = clean.substring(4) + clean.substring(0, 4);
    const numericString = rearranged.replace(/[A-Z]/g, (letter) => 
      (letter.charCodeAt(0) - 55).toString()
    );
    
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
      remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
    }
    
    return remainder === 1;
  },

  formatIBAN: (iban: string): string => {
    if (!iban) return '';
    const clean = iban.replace(/\s/g, '').toUpperCase();
    if (clean.length !== 24) return iban;
    
    return clean.substring(0, 4) + ' ' + 
           clean.substring(4, 8) + ' ' + 
           clean.substring(8, 12) + ' ' + 
           clean.substring(12, 16) + ' ' + 
           clean.substring(16, 20) + ' ' + 
           clean.substring(20, 24);
  },

  formatPhone: (phone: string): string => {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 9) {
      return clean.substring(0, 3) + ' ' + clean.substring(3, 5) + ' ' + 
             clean.substring(5, 7) + ' ' + clean.substring(7, 9);
    }
    return phone;
  }
};

export default employeesAPI;
