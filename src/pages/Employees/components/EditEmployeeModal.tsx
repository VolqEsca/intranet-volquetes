// src/pages/Employees/components/EditEmployeeModal.tsx - VERSIÓN COMPLETA CORREGIDA
import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { employeesAPI, EmployeeFormData, EMPLOYEE_CONSTANTS, Employee } from '../../../api/employees';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onEmployeeUpdated: () => void;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
  onEmployeeUpdated,
}) => {
  const [formData, setFormData] = useState<EmployeeFormData>({
    employee_code: '',
    location: 'Nave 01',
    full_name: '',
    dni_nie: '',
    social_security_number: '',
    hire_date: '',
    phone: '',
    email_primary: '',
    email_secondary: '',
    birth_date: '',
    job_category: '',
    gender: undefined,
    contract_type: 'Indefinido',
    contract_end_date: '',
    iban: '',
  });

  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ PRE-CARGAR DATOS DEL EMPLEADO cuando se abre el modal o cambia el empleado
  useEffect(() => {
    if (employee && isOpen) {
      setFormData({
        employee_code: employee.employee_code || '',
        location: employee.location,
        full_name: employee.full_name,
        dni_nie: employee.dni_nie,
        social_security_number: employee.social_security_number,
        hire_date: employee.hire_date,
        phone: employee.phone || '',
        email_primary: employee.email_primary,
        email_secondary: employee.email_secondary || '',
        birth_date: employee.birth_date || '',
        job_category: employee.job_category,
        gender: employee.gender || undefined,
        contract_type: employee.contract_type,
        contract_end_date: employee.contract_end_date || '',
        iban: employee.iban || '',
      });
      // Limpiar errores al cargar nuevo empleado
      setErrors({});
      setSubmitError(null);
    }
  }, [employee, isOpen]);

  const handleChange = (field: keyof EmployeeFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    if (submitError) setSubmitError(null);
  };

  // ✅ VALIDACIÓN ADAPTADA PARA EDICIÓN (permite DNI actual del empleado)
  const validate = (): boolean => {
    const newErrors: { [k: string]: string } = {};

    if (!formData.full_name.trim()) newErrors.full_name = 'Nombre obligatorio';
    if (!formData.dni_nie.trim()) newErrors.dni_nie = 'DNI/NIE obligatorio';
    if (!formData.social_security_number.trim())
      newErrors.social_security_number = 'Nº SS obligatorio';
    if (!formData.hire_date) newErrors.hire_date = 'Fecha alta obligatoria';
    if (!formData.job_category.trim()) newErrors.job_category = 'Categoría obligatoria';

    // Validar DNI/NIE formato (el backend manejará la unicidad excluyendo el empleado actual)
    if (formData.dni_nie.trim() && !employeesAPI.validateDNI_NIE(formData.dni_nie)) {
      newErrors.dni_nie = 'Formato DNI/NIE inválido';
    }

    // Validar IBAN si se proporciona
    if (formData.iban && formData.iban.trim() && !employeesAPI.validateIBAN(formData.iban)) {
      newErrors.iban = 'Formato IBAN inválido';
    }

    // Si es temporal, forzar fecha fin
    if (formData.contract_type === 'Temporal' && !formData.contract_end_date) {
      newErrors.contract_end_date = 'Fecha fin obligatoria para contrato temporal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ SUBMIT PARA EDICIÓN con employeesAPI.update()
  const handleSubmit = async () => {
    if (!validate()) {
      setSubmitError('Revisa los campos marcados antes de actualizar el empleado.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await employeesAPI.update(employee.id, formData);
      onEmployeeUpdated(); // Refrescar listado en EmployeesPage
      onClose();
    } catch (err: any) {
      console.error('Error al actualizar empleado:', err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'No se pudo actualizar el empleado.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
    setSubmitError(null);
    setErrors({});
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Editar: ${employee.full_name}`}>
      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        {submitError && (
          <div className="p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* Información Básica */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
          
          {/* Nombre */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre y Apellidos *
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.full_name ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
              placeholder="Nombre y apellidos completos"
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>
            )}
          </div>

          {/* DNI / SS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI/NIE *
              </label>
              <input
                type="text"
                value={formData.dni_nie}
                onChange={(e) => handleChange('dni_nie', e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.dni_nie ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
                placeholder="12345678A"
                maxLength={9}
              />
              {errors.dni_nie && (
                <p className="mt-1 text-xs text-red-600">{errors.dni_nie}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nº Seguridad Social *
              </label>
              <input
                type="text"
                value={formData.social_security_number}
                onChange={(e) => handleChange('social_security_number', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.social_security_number ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
                placeholder="471009296542"
              />
              {errors.social_security_number && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.social_security_number}
                </p>
              )}
            </div>
          </div>

          {/* Código Empleado + Ubicación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código Empleado (Reloj)
              </label>
              <input
                type="text"
                value={formData.employee_code || ''}
                onChange={(e) => handleChange('employee_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isSubmitting}
                placeholder="Ej: 001, 002..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nave *
              </label>
              <select
                value={formData.location}
                onChange={(e) =>
                  handleChange('location', e.target.value as 'Nave 01' | 'Nave 02')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isSubmitting}
              >
                {EMPLOYEE_CONSTANTS.LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha de Alta */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Alta *
            </label>
            <input
              type="date"
              value={formData.hire_date || ''}
              onChange={(e) => handleChange('hire_date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.hire_date ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.hire_date && (
              <p className="mt-1 text-xs text-red-600">{errors.hire_date}</p>
            )}
          </div>
        </div>

        {/* Información Laboral */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información Laboral</h3>
          
          {/* Categoría */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría *
            </label>
            <select
              value={formData.job_category}
              onChange={(e) => handleChange('job_category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.job_category ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <option value="">Seleccionar categoría</option>
              {EMPLOYEE_CONSTANTS.JOB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.job_category && (
              <p className="mt-1 text-xs text-red-600">{errors.job_category}</p>
            )}
          </div>

          {/* Género + Tipo de contrato */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Género
              </label>
              <select
                value={formData.gender || ''}
                onChange={(e) =>
                  handleChange('gender', e.target.value || undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isSubmitting}
              >
                <option value="">Sin especificar</option>
                {EMPLOYEE_CONSTANTS.GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Contrato *
              </label>
              <select
                value={formData.contract_type}
                onChange={(e) =>
                  handleChange('contract_type', e.target.value as 'Indefinido' | 'Temporal')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isSubmitting}
              >
                {EMPLOYEE_CONSTANTS.CONTRACT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha fin contrato si es temporal */}
          {formData.contract_type === 'Temporal' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin Contrato *
              </label>
              <input
                type="date"
                value={formData.contract_end_date || ''}
                onChange={(e) => handleChange('contract_end_date', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.contract_end_date ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.contract_end_date && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.contract_end_date}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Información Personal y Contacto */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal y Contacto</h3>
          
          {/* Fecha nacimiento */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              value={formData.birth_date || ''}
              onChange={(e) => handleChange('birth_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isSubmitting}
            />
          </div>

          {/* Email Principal + Teléfono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Principal *
              </label>
              <input
                type="email"
                value={formData.email_primary}
                onChange={(e) => handleChange('email_primary', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isSubmitting}
                placeholder="empleado@volquetesescalante.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                Si se deja vacío, se generará automáticamente
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isSubmitting}
                placeholder="605972518"
              />
            </div>
          </div>

          {/* Email Secundario */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Secundario
            </label>
            <input
              type="email"
              value={formData.email_secondary}
              onChange={(e) => handleChange('email_secondary', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isSubmitting}
              placeholder="email.personal@ejemplo.com"
            />
          </div>

          {/* IBAN */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IBAN
            </label>
            <input
              type="text"
              value={formData.iban}
              onChange={(e) => handleChange('iban', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.iban ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ES00 0000 0000 0000 0000 0000"
              disabled={isSubmitting}
            />
            {errors.iban && (
              <p className="mt-1 text-xs text-red-600">{errors.iban}</p>
            )}
          </div>
        </div>

        {/* BOTONES - VERSIÓN CORPORATIVA CORREGIDA */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 mt-6">
          <Button
            type="button"
            onClick={handleClose}
            variant="secondary"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
