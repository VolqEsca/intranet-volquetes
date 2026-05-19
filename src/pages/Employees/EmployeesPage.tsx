// src/pages/Employees/EmployeesPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { employeesAPI, Employee, EmployeesResponse, PaginationData } from '../../api/employees';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { NewEmployeeModal } from './components/NewEmployeeModal';
import { EditEmployeeModal } from './components/EditEmployeeModal';
import { ImportEmployeesModal } from './components/ImportEmployeesModal';
import { GenerateDocumentsModal } from './components/GenerateDocumentsModal';
import AlertDialog from '../../components/ui/AlertDialog';
import { Plus, Upload, Edit, Trash2, Users, Search, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { dialog } from '../../services/dialog.service';
import { formatDate } from '../../utils/formatters';

export const EmployeesPage = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1, 
    total_pages: 1, 
    total_records: 0, 
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
      const params: any = { page, limit };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (locationFilter) params.location = locationFilter;
      if (contractFilter) params.contract_type = contractFilter;

      const response = await employeesAPI.list(params);
      setEmployees(response.data.employees);
      setPagination(response.data.pagination);
    } catch (err: any) {
      console.error("Error al cargar empleados:", err);
      const errorMessage = err?.response?.data?.message || "No se pudieron cargar los empleados.";
      setError(errorMessage);
      setEmployees([]);
      setPagination({ current_page: 1, total_pages: 1, total_records: 0, limit: 100 });
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
      await fetchEmployees(pagination.current_page, pagination.limit);
      setError(null);
    } catch (err: any) {
      console.error("Error al eliminar empleado:", err);
      const errorMessage = err?.response?.data?.message || "No se pudo eliminar el empleado.";
      setError(errorMessage);
    } finally {
      setIsDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary-dark mb-2 flex items-center gap-3">
          <Users size={32} className="text-primary-dark" />
          Gestión de Empleados
        </h1>
        <p className="text-gray-600">
          Administra la información de los empleados de Volquetes Escalante
        </p>
      </div>

      {/* Card de controles */}
      <Card className="p-6 mb-6 bg-white shadow-md rounded-lg">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-700">
            Listado de Empleados
            {pagination.total_records > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({pagination.total_records} empleado{pagination.total_records !== 1 ? 's' : ''})
              </span>
            )}
          </h2>
          
          {/* Botones de acción */}
          <div className="flex gap-2">
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
        <div className="flex flex-wrap gap-4 items-center mt-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-dark focus:border-transparent"
            />
          </div>
          
          {/* Filtro Nave */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-dark focus:border-transparent"
          >
            <option value="">Todas las naves</option>
            <option value="Nave 01">Nave 01</option>
            <option value="Nave 02">Nave 02</option>
          </select>

          {/* Filtro Contrato */}
          <select
            value={contractFilter}
            onChange={(e) => setContractFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-dark focus:border-transparent"
          >
            <option value="">Todos los contratos</option>
            <option value="Indefinido">Indefinido</option>
            <option value="Temporal">Temporal</option>
          </select>

          {/* Botón limpiar filtros */}
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
      </Card>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
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
        <Card className="overflow-hidden shadow-md rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
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
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contrato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
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
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {employee.location}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.contract_type === 'Indefinido' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {employee.contract_type}
                      </span>
                      {employee.contract_type === 'Temporal' && employee.contract_end_date && (
                        <div className="text-xs text-gray-500 mt-1">
                          Fin: {formatDate(employee.contract_end_date)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {employee.email_primary}
                      </div>
                      {employee.phone && (
                        <div className="text-xs text-gray-400">
                          {employee.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-1">
                        <Button 
                          onClick={() => handleEditEmployee(employee)} 
                          variant="ghost" 
                          size="sm" 
                          title="Editar empleado"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Edit size={16} />
                        </Button>
                        
                        {/* NUEVO BOTÓN: Generar documentos */}
                        <Button 
                          onClick={() => handleGenerateDocuments(employee)} 
                          variant="ghost" 
                          size="sm" 
                          title="Generar documentos de incorporación"
                          className="text-green-600 hover:text-green-800 hover:bg-green-50"
                        >
                          <FileText size={16} />
                        </Button>
                        
                        {user?.rol === 'admin' && (
                          <Button 
                            onClick={() => handleDeleteClick(employee)} 
                            variant="ghost" 
                            size="sm" 
                            title="Desactivar empleado"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
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
                Página {pagination.current_page} de {pagination.total_pages}
              </span>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">{employees.length}</span>
                  {' '}de{' '}
                  <span className="font-medium">{pagination.total_records}</span>
                  {' '}empleado{pagination.total_records !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-700">
                  Página {pagination.current_page} de {pagination.total_pages}
                </span>
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
          fetchEmployees(pagination.current_page, pagination.limit);
        }}
      />

      {selectedEmployee && (
        <EditEmployeeModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          employee={selectedEmployee}
          onEmployeeUpdated={() => {
            fetchEmployees(pagination.current_page, pagination.limit);
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
