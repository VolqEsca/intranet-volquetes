export interface PaginationData {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
}

// Para OR: backend devuelve { totalPages, total, page?, limit }
export function fromCamel(raw: unknown): PaginationData {
  const r = raw as Record<string, unknown>;
  return {
    currentPage: Number(r.currentPage ?? r.page ?? 1),
    totalPages: Number(r.totalPages ?? 1),
    total: Number(r.total ?? 0),
    limit: Number(r.limit ?? 20),
  };
}

// Para OF y Empleados: backend devuelve { current_page, total_pages, total_records, limit }
export function fromSnake(raw: unknown): PaginationData {
  const r = raw as Record<string, unknown>;
  return {
    currentPage: Number(r.current_page ?? 1),
    totalPages: Number(r.total_pages ?? 1),
    total: Number(r.total_records ?? r.total ?? 0),
    limit: Number(r.limit ?? 10),
  };
}
