// src/pages/Employees/components/GenerateDocumentsModal.tsx
import React, { useState } from 'react';
import { Sheet } from '../../../components/ui/Sheet';
import { Button } from '../../../components/ui/Button';
import { employeesAPI, Employee } from '../../../api/employees';
import { apiErrorMessage } from '../../../utils/error';

interface GenerateDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
}

const documentOptions = [
  { id: 'epis', label: 'Registro Entrega EPIs', description: 'Equipos de protección individual' },
  { id: 'rgpd', label: 'Consentimiento RGPD', description: 'Tratamiento de datos personales' },
  { id: 'videovigilancia', label: 'Info Videovigilancia', description: 'Cámaras de seguridad' },
  { id: 'prl', label: 'Entrega Info PRL', description: 'Prevención de Riesgos Laborales' }
];

export const GenerateDocumentsModal: React.FC<GenerateDocumentsModalProps> = ({
  isOpen,
  onClose,
  employee,
}) => {
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckboxChange = (docId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedDocs((prev) => [...prev, docId]);
    } else {
      setSelectedDocs((prev) => prev.filter((id) => id !== docId));
    }
    setError(null);
  };

  // Generación y descarga individual automática
  const handleGenerate = async () => {
    if (selectedDocs.length === 0) {
      setError('Selecciona al menos un documento para generar.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    let successCount = 0;
    let errorMessages: string[] = [];

    // Generar cada documento individualmente
    for (const docType of selectedDocs) {
      try {
        const response = await employeesAPI.generateDocument(employee.id, docType);
        
        // Crear descarga automática
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        // Generar nombre de archivo consistente
        const safeName = employee.full_name.replace(/\s+/g, '_').toUpperCase();
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        link.download = `${safeName}_${docType}_${timestamp}.pdf`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        successCount++;
        
        // Pequeña pausa entre descargas para evitar problemas del navegador
        if (selectedDocs.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (err: unknown) {
        console.error(`Error generando ${docType}:`, err);
        errorMessages.push(apiErrorMessage(err, `Error generando ${docType}`));
      }
    }

    setIsGenerating(false);
    
    if (errorMessages.length > 0) {
      setError(`Errores encontrados:\n${errorMessages.join('\n')}`);
    }
    
    if (successCount > 0 && errorMessages.length === 0) {
      // Solo cerrar si todo fue exitoso
      onClose();
      setSelectedDocs([]);
    }
  };

  const handleClose = () => {
    if (isGenerating) return;
    onClose();
    setSelectedDocs([]);
    setError(null);
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={handleClose}
      title={`Documentos: ${employee.full_name}`}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" onClick={handleClose} variant="subtle" disabled={isGenerating}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || selectedDocs.length === 0}
          >
            {isGenerating ? 'Generando...' : `Generar ${selectedDocs.length} Documento${selectedDocs.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
          {error && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700 whitespace-pre-wrap">
              {error}
            </div>
          )}

          <p className="text-gray-600">
            Selecciona los documentos de incorporación para <strong>{employee.full_name}</strong>:
          </p>

          <div className="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
            {documentOptions.map((doc) => (
              <label key={doc.id} className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDocs.includes(doc.id)}
                  onChange={(e) => handleCheckboxChange(doc.id, e.target.checked)}
                  className="mt-1 mr-3 h-4 w-4 text-primary-dark rounded focus:ring-primary-dark"
                  disabled={isGenerating}
                />
                <div>
                  <div className="font-medium text-gray-900">{doc.label}</div>
                  <div className="text-sm text-gray-500">{doc.description}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Información de fecha */}
          <div className="p-3 bg-[#a2bade]/15 border border-[#a2bade] rounded-md">
            <p className="text-sm text-[#1162a6]">
              <strong>Fecha de alta:</strong> {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('es-ES') : 'No registrada'}
            </p>
            <p className="text-xs text-[#5487c0] mt-1">
              Los documentos se generarán con esta fecha de incorporación.
            </p>
          </div>
        </div>
    </Sheet>
  );
};
