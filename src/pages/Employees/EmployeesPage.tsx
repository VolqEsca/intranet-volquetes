// src/pages/Employees/EmployeesPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { employeesAPI, Employee, EmployeesResponse } from '../../api/employees';
import { PaginationData, fromSnake } from '../../types/pagination';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { NewEmployeeModal } from './components/NewEmployeeModal';
import { EditEmployeeModal } from './components/EditEmployeeModal';
import { ImportEmployeesModal } from './components/ImportEmployeesModal';
import { GenerateDocumentsModal } from './components/GenerateDocumentsModal';
import AlertDialog from '../../components/ui/AlertDialog';
import { Plus, Upload, Pencil, Trash2, Users, Search, FileText } from 'lucide-react';
import { TableActionButton } from '../../components/ui/TableActionButton';
import { apiErrorMessage } from '../../utils/error';
import { useAuth } from '../../hooks/useAuth';
import { dialog } from '../../services/dialog.service';
import { formatDate } from '../../utils/formatters';

export const EmployeesPage = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 100
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para modales
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGenerateDocsModalOpen, setIsGenerateDocsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedEmployeeForDocs, setSelectedEmployeeForDocs] = useState<Employee | null>(null);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [contractFilter, setContractFilter] = useState('');

  // Estados para confirmación de borrado
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // Función para cargar empleados con manejo robusto de errores
  const fetchEmployees = useCallback(async (page = 1, limit = 100) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params: Record<string, unknown> = { page, limit };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (locationFilter) params.location = locationFilter;
      if (contractFilter) params.contract_type = contractFilter;

      const response = await employeesAPI.list(params);
      setEmployees(response.data.employees);
      setPagination(fromSnake(response.data.pagination));
    } catch (err: unknown) {
      console.error("Error al cargar empleados:", err);
      setError(apiErrorMessage(err, "No se pudieron cargar los empleados."));
      setEmployees([]);
      setPagination({ currentPage: 1, totalPages: 1, total: 0, limit: 100 });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, locationFilter, contractFilter]);

  // Cargar empleados al montar y cuando cambien filtros
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Manejadores de eventos
  const handleNewEmployee = () => {
    setSelectedEmployee(null);
    setIsNewModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleImportEmployees = () => {
    setIsImportModalOpen(true);
  };

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteConfirmOpen(true);
  };

  // NUEVA FUNCIONALIDAD: Generar documentos con validaciones
  const handleGenerateDocuments = async (employee: Employee) => {
    if (!employee.hire_date) {
      await dialog.warning(`${employee.full_name} no tiene fecha de alta registrada. Edítalo primero para añadir la fecha de alta antes de generar documentos.`);
      return;
    }

    const hireDate = new Date(employee.hire_date);
    if (isNaN(hireDate.getTime())) {
      await dialog.warning(`La fecha de alta de ${employee.full_name} tiene formato inválido. Corrígela antes de generar documentos.`);
      return;
    }

    if (!employee.full_name || !employee.dni_nie) {
      await dialog.warning(`Faltan datos críticos para ${employee.full_name}. Completa nombre completo y DNI/NIE antes de generar documentos.`);
      return;
    }

    setSelectedEmployeeForDocs(employee);
    setIsGenerateDocsModalOpen(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    try {
      await employeesAPI.delete(employeeToDelete.id);
      await fetchEmployees(pagination.currentPage, pagination.limit);
      setError(null);
    } catch (err: unknown) {
      console.error("Error al eliminar empleado:", err);
      setError(apiErrorMessage(err, "No se pudo eliminar el empleado."));
    } finally {
      setIsDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1162a6] flex items-center justify-center shadow-sm flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Empleados</h1>
            <p className="text-sm text-gray-500">
              {pagination.total > 0
                ? `${pagination.total} empleado${pagination.total !== 1 ? 's' : ''} registrado${pagination.total !== 1 ? 's' : ''}`
                : 'Administra la información de los empleados'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleImportEmployees}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Upload size={18} />
            Importar
          </Button>
          <Button
            onClick={handleNewEmployee}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            Nuevo Empleado
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent"
          />
        </div>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="px-4 py-2 border border-[#e2e8f0] rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent"
        >
          <option value="">Todas las naves</option>
          <option value="Nave 01">Nave 01</option>
          <option value="Nave 02">Nave 02</option>
        </select>

        <select
          value={contractFilter}
          onChange={(e) => setContractFilter(e.target.value)}
          className="px-4 py-2 border border-[#e2e8f0] rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent"
        >
          <option value="">Todos los contratos</option>
          <option value="Indefinido">Indefinido</option>
          <option value="Temporal">Temporal</option>
        </select>

        {(searchTerm || locationFilter || contractFilter) && (
          <Button
            onClick={() => {
              setSearchTerm('');
              setLocationFilter('');
              setContractFilter('');
            }}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-800"
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-white border-l-4 border-[#dc2626] rounded-r-xl px-4 py-3 text-[#dc2626]">
          {error}
        </div>
      )}

      {/* Contenido principal */}
      {isLoading ? (
        <Card className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando empleados...</p>
          </div>
        </Card>
      ) : employees.length === 0 ? (
        <Card className="p-8">
          <div className="text-center">
            <Users size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm || locationFilter || contractFilter ? 
                'No se encontraron empleados con los filtros aplicados' : 
                'No hay empleados registrados'
              }
            </p>
            <Button onClick={handleNewEmployee} className="mt-2">
              {searchTerm || locationFilter || contractFilter ? 'Crear empleado' : 'Crear primer empleado'}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden rounded-xl border border-[#e2e8f0] shadow-none">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e2e8f0]">
              <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DNI/NIE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contrato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e2e8f0]">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-dark text-white flex items-center justify-center text-sm font-medium">
                            {employee.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.full_name}
                          </div>
                          {employee.employee_code && (
                            <div className="text-sm text-gray-500">
                              Reloj: {employee.employee_code}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.dni_nie}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.job_category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.contract_type === 'Indefinido'
                          ? 'bg-[#a2bade]/20 text-[#1162a6]'
                          : 'bg-[#dc2626]/10 text-[#dc2626]'
                      }`}>
                        {employee.contract_type}
                      </span>
                      {employee.contract_type === 'Temporal' && employee.contract_end_date && (
                        <div className="text-xs text-[#dc2626]/70 mt-1">
                          hasta {formatDate(employee.contract_end_date)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-1">
                        <TableActionButton onClick={() => handleEditEmployee(employee)} title="Editar empleado">
                          <Pencil size={16} />
                        </TableActionButton>

                        <TableActionButton onClick={() => handleGenerateDocuments(employee)} title="Generar documentos de incorporación">
                          <FileText size={16} />
                        </TableActionButton>

                        {user?.rol === 'admin' && (
                          <TableActionButton variant="danger" onClick={() => handleDeleteClick(employee)} title="Desactivar empleado">
                            <Trash2 size={16} />
                          </TableActionButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer con información de paginación */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <span className="text-sm text-gray-700">
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => fetchEmployees(pagination.currentPage - 1)}
                    disabled={pagination.currentPage <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => fetchEmployees(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">{employees.length}</span>
                  {' '}de{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}empleado{pagination.total !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">
                  Página {pagination.currentPage} de {pagination.totalPages}
                </span>
                {pagination.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => fetchEmployees(pagination.currentPage - 1)}
                      disabled={pagination.currentPage <= 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => fetchEmployees(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Modales */}
      <NewEmployeeModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onEmployeeAdded={() => {
          fetchEmployees(pagination.currentPage, pagination.limit);
        }}
      />

      {selectedEmployee && (
        <EditEmployeeModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          employee={selectedEmployee}
          onEmployeeUpdated={() => {
            fetchEmployees(pagination.currentPage, pagination.limit);
          }}
        />
      )}

      <ImportEmployeesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          fetchEmployees(1, pagination.limit);
        }}
      />

      {/* NUEVO MODAL: Generar documentos */}
      {selectedEmployeeForDocs && (
        <GenerateDocumentsModal
          isOpen={isGenerateDocsModalOpen}
          onClose={() => {
            setIsGenerateDocsModalOpen(false);
            setSelectedEmployeeForDocs(null);
          }}
          employee={selectedEmployeeForDocs}
        />
      )}

      {/* Diálogo de confirmación */}
      <AlertDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteEmployee}
        title="Confirmar Desactivación"
        description={`¿Estás seguro de que quieres desactivar al empleado ${employeeToDelete?.full_name}?\n\nEsta acción cambiará su estado a inactivo pero mantendrá todos sus datos para consultas futuras.`}
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="warning"
        showCancel={true}
      />
    </div>
  );
};
