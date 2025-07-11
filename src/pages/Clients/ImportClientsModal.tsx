import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import apiClient from '../../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function ImportClientsModal({ isOpen, onClose, onImportSuccess }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Por favor, seleccione un archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('excelFile', selectedFile);

    setError('');
    setLoading(true);

    try {
      await apiClient.post('/clients/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onImportSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al importar el archivo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importar Clientes desde Excel">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm">
          Seleccione un archivo .xlsx o .csv. Asegúrese de que las columnas estén en el orden correcto: 
          Nombre, CIF/NIF, Persona de Contacto, Teléfono.
        </p>
        <div>
          <label className="block text-sm font-medium">Archivo Excel</label>
          <input 
            type="file" 
            onChange={handleFileChange} 
            accept=".xlsx, .xls, .csv"
            className="mt-1 block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading || !selectedFile}>{loading ? 'Importando...' : 'Importar'}</Button>
        </div>
      </form>
    </Modal>
  );
}