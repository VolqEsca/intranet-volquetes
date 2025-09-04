// src/types/orders.ts
export interface OrderFormData {
    client_id: number;
    unit_type_id: number;
    brand: string;
    license_plate: string;
    department_id: number;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    description: string;
    observations: string;
    entry_date: string;
    estimated_delivery: string;
    tasks: string[];
  }
  
  export interface Client {
    id: number;
    name: string;
    cif?: string;
    email?: string;
    phone?: string;
  }
  
  export interface UnitType {
    id: number;
    name: string;
  }
  
  export interface Department {
    id: number;
    name: string;
    color: string;
  }
  
  export interface Order {
    id: number;
    order_number: string;
    client_name: string;
    client_cif: string;
    unit_type: string;
    brand: string;
    license_plate: string;
    department: Department;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    description: string;
    observations?: string;
    tasks: Array<{
      id: number;
      description: string;
      completed: boolean;
    }>;
    entry_date: string;
    estimated_delivery: string;
    completion_date: string | null;
    created_by: string;
    created_at: string;
    updated_at?: string;
  }
  