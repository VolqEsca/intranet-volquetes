// src/api/manufacturing.ts
import { apiClient as api } from './index';

export interface ManufacturingOrder {
  id: number;
  order_number: string;
  client_name: string;
  bodywork_type?: string;
  brand?: string;
  model?: string;
  chassis_number?: string;
  budget_number?: string;
  order_date?: string;
  vehicle_reception_date?: string;
  expected_completion_date?: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'delivered';
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  assigned_to_name?: string;
}

// ✅ INTERFAZ CORREGIDA: Fechas como string | null (realidad del sistema)
export interface ManufacturingOrderFormData {
  client_name: string;
  bodywork_type: string;
  brand: string;
  model: string;
  chassis_number: string;
  budget_number: string;
  order_date: string | null;           // ✅ CORREGIDO: Date | null → string | null
  vehicle_reception_date: string | null;    // ✅ CORREGIDO: Date | null → string | null
  expected_completion_date: string | null;  // ✅ CORREGIDO: Date | null → string | null
  description: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to?: number | null;
}

export interface PaginationData {
  current_page: number;
  total_pages: number;
  total_records: number;
  limit: number;
}

export interface ManufacturingOrdersResponse {
  orders: ManufacturingOrder[];
  pagination: PaginationData;
}

// API calls para fabricación
export const manufacturingAPI = {
  // Listar órdenes con filtros
  list: (params: any = {}): Promise<{ data: ManufacturingOrdersResponse }> => 
    api.get('/manufacturing-orders/list.php', { params }),

  // ✅ MÉTODO CREATE SIMPLIFICADO: Ya no necesita conversión de fechas
  create: (data: ManufacturingOrderFormData) => {
    const jsonData = {
      client_name: data.client_name,
      bodywork_type: data.bodywork_type || '',
      brand: data.brand || '',
      model: data.model || '',
      chassis_number: data.chassis_number || '',
      budget_number: data.budget_number || '',
      order_date: data.order_date || '',           // ✅ Ya es string, sin conversión
      vehicle_reception_date: data.vehicle_reception_date || '',
      expected_completion_date: data.expected_completion_date || '',
      description: data.description || '',
      priority: data.priority,
      assigned_to: data.assigned_to || null
    };
    
    return api.post('/manufacturing-orders/create.php', jsonData);
  },

  // Obtener detalles
  details: (id: number) => 
    api.get(`/manufacturing-orders/details.php?id=${id}`),

  // Actualizar orden
  update: (id: number, data: Partial<ManufacturingOrderFormData> & { status?: string }) => 
    api.put(`/manufacturing-orders/update.php?id=${id}`, data),

  // Cambiar estado
  updateStatus: (id: number, status: string) => 
    api.put('/manufacturing-orders/status.php', { id, status }),

  // Eliminar orden
  delete: (id: number) => 
    api.delete(`/manufacturing-orders/delete.php?id=${id}`),

  // URL del PDF
  getPdfUrl: (id: number) => 
    `${api.defaults.baseURL}/manufacturing-orders/pdf-tcpdf-adaptive.php?id=${id}`
};
