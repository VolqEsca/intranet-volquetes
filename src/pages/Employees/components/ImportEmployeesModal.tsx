import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { employeesAPI } from '../../../api/employees';
import { apiErrorMessage, apiErrorList } from '../../../utils/error';
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface ImportEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

// Interfaz exacta que coincide con la respuesta del backend actualizado
interface ImportResult {
  success: boolean;
  imported: number;
  updated: number;
  total: number;
  errors: string[];
}

export const ImportEmployeesModal: React.FC<ImportEmployeesModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError('');
      setImportResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Por favor, seleccione un archivo Excel.');
      return;
    }

    setError('');
    setLoading(true);
    setImportResult(null);

    try {
      const response = await employeesAPI.import(selectedFile);
      
      if (response.data.success) {
        setImportResult(response.data);
        onImportComplete();
      } else {
        // ✅ CORRECCIÓN LÍNEA 56: Usar 'errors' array en lugar de 'error' inexistente
        const errorMsg = response.data.errors?.[0] || 'Error en la importación';
        throw new Error(errorMsg);
      }
    } catch (err: unknown) {
      console.error('Error en importación:', err);
      const errorMessage = apiErrorList(err)[0] ?? apiErrorMessage(err, 'Error al importar el archivo.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError('');
    setImportResult(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Empleados desde Excel" size="max-w-2xl">
      <div className="p-6">
        {!importResult ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Instrucciones Mejoradas con Numeración Visual */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="text-blue-600 mt-0.5" size={20} />
                <div className="w-full">
                  <h4 className="font-medium text-blue-900 mb-2">Formato del archivo Excel (13 columnas)</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Seleccione un archivo .xlsx con las columnas en este orden exacto:
                  </p>
                  
                  {/* Lista numerada con indicadores visuales - CORREGIDA A 13 COLUMNAS */}
                  <div className="text-sm text-blue-700 space-y-1">
                    <div className="grid grid-cols-1 gap-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded text-center text-xs font-mono flex items-center justify-center">1</span>
                        <span>Nave</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded text-center text-xs font-mono flex items-center justify-center">2</span>
                        <span>Reloj (opcional)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded text-center text-xs font-mono flex items-center justify-center">3</span>
                        <span>Nombre y Apellidos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded text-center text-xs font-mono flex items-center justify-center">4</span>
                        <span>DNI/NIE</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded text-center text-xs font-mono flex items-center justify-center">5</span>
                        <span>Nº Seguridad Social (11-12 dígitos, sin espacios)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded text-center text-xs font-mono flex items-center justify-center">6</span>
                        <span>Antigüedad (fecha alta) → <strong>DD/MM/YYYY</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded text-center text-xs font-mono flex items-center justify-center">7</span>
                        <span>Teléfono de contacto</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded text-center text-xs font-mono flex items-center justify-center">8</span>
                        <span>Correo electrónico</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded text-center text-xs font-mono flex items-center justify-center">9</span>
                        <span>Fecha de nacimiento → <strong>DD/MM/YYYY</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded text-center text-xs font-mono flex items-center justify-center">10</span>
                        <span>Categoría</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded text-center text-xs font-mono flex items-center justify-center">11</span>
                        <span>Tipo de contrato (Indefinido | Temporal)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded text-center text-xs font-mono flex items-center justify-center">12</span>
                        <span>Fecha fin (obligatoria si Temporal) → <strong>DD/MM/YYYY</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded text-center text-xs font-mono flex items-center justify-center">13</span>
                        <span>Nº de cuenta (IBAN)</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notas importantes destacadas */}
                  <div className="mt-4 p-3 bg-blue-100 rounded text-xs text-blue-800">
                    <strong>📋 Notas importantes:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5">
                      <li>Fechas en formato español: <strong>DD/MM/YYYY</strong> (ej: 05/06/2006)</li>
                      <li>Seguridad Social: <strong>11 o 12 dígitos</strong> sin espacios</li>
                      <li>Contratos temporales requieren fecha fin obligatoriamente</li>
                      <li>Emails múltiples separados por " / " (ej: email1@test.com / email2@test.com)</li>
                      <li>Campos vacíos: dejar completamente vacíos (no usar "-")</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Selector de archivo optimizado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo Excel
              </label>
              <input 
                type="file" 
                onChange={handleFileChange} 
                accept=".xlsx,.xls"
                className="block w-full text-sm text-gray-500
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-lg file:border-0
                           file:text-sm file:font-semibold
                           file:bg-primary-dark file:text-white
                           hover:file:bg-secondary
                           border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-primary-dark focus:border-transparent"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Archivo seleccionado: {selectedFile.name}
                </p>
              )}
            </div>

            {/* Error display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="subtle" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !selectedFile}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Importar
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          /* Resultado de importación con estadísticas mejoradas */
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Importación Completada
              </h3>
            </div>

            {/* Estadísticas en tres columnas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{importResult.imported}</div>
                <div className="text-sm text-green-600">Empleados creados</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{importResult.updated}</div>
                <div className="text-sm text-blue-600">Empleados actualizados</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-700">{importResult.total}</div>
                <div className="text-sm text-gray-600">Total procesados</div>
              </div>
            </div>

            {/* Errores con scroll si los hay */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="text-yellow-600" size={20} />
                  <h4 className="font-medium text-yellow-800">
                    {importResult.errors.length} filas con errores
                  </h4>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {importResult.errors.map((errorItem, index) => (
                    <div key={index} className="text-sm text-yellow-700 py-1">
                      • {errorItem}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resumen ejecutivo */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Resumen de importación:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>✅ {importResult.imported} empleados nuevos creados</div>
                <div>🔄 {importResult.updated} empleados existentes actualizados</div>
                <div>📊 {importResult.total} registros procesados correctamente</div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div>⚠️ {importResult.errors.length} filas con errores (revisar datos)</div>
                )}
              </div>
            </div>

            {/* Botón finalizar */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleClose} className="flex items-center gap-2">
                <CheckCircle size={18} />
                Finalizar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
