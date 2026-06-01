export interface Order {
  id: number;
  order_number: string;
  client_id: number;
  client_name: string;
  unit_type_name: string;
  brand: string;
  model: string;
  license_plate: string;
  contact_person: string | null;
  phone: string | null;
  departments: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  entry_date: string;
  estimated_delivery: string | null;
  completion_date: string | null;
  created_by_name: string;
  created_at: string;
}

export interface OrderFormData {
  client_id: string;
  contact_person: string;
  phone: string;
  unit_type_id: string;
  brand: string;
  model: string;
  license_plate: string;
  department_ids: number[];
  status: Order['status'];
  priority: Order['priority'];
  entry_date: string;
  tasks: string;
  notes: string;
}
