// src/pages/Orders/components/ClientEditModal.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { apiClient } from '../../../api';
import { dialog } from '../../../services/dialog.service';

interface Client {
  id: number;
  name: string;
  cif_nif: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  active: boolean;
}

interface ClientEditModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isCreating?: boolean;
}

export const ClientEditModal: React.FC<ClientEditModalProps> = ({
  client,
  isOpen,
  onClose,
  onSave,
  isCreating = false
}) => {
  const [formData, setFormData] = useState({
    name: client.name,
    cif_nif: client.cif_nif,
    contact_person: client.contact_person || '',
    phone: client.phone || '',
    email: client.email || '',
    address: client.address || '',
    notes: client.notes || '',
    active: client.active
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!formData.cif_nif.trim()) newErrors.cif_nif = 'El CIF/NIF es obligatorio';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      
      if (isCreating || client.id === 0) {
        // Crear nuevo cliente
        await apiClient.post('/clients/', formData);
        await dialog.success('Cliente creado correctamente');
      } else {
        // Actualizar cliente existente
        await apiClient.put(`/clients/${client.id}`, formData);
        await dialog.success('Cliente actualizado correctamente');
      }
      
      onSave();
    } catch (error: any) {
      console.error('Error guardando cliente:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.error) {
        // Si el error es por CIF/NIF duplicado
        if (error.response.data.error.includes('CIF/NIF')) {
          setErrors({ cif_nif: error.response.data.error });
        } else {
          await dialog.error(
            error.response.data.error,
            'Error al guardar'
          );
        }
      } else {
        await dialog.error(
          `No se pudo ${isCreating ? 'crear' : 'actualizar'} el cliente. Por favor, inténtalo de nuevo.`,
          'Error al guardar'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isCreating || client.id === 0 ? 'Nuevo Cliente' : 'Editar Cliente'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark ${
                  errors.name ? 'border-red-500' : ''
                }`}
                placeholder="Nombre del cliente"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CIF/NIF *
              </label>
              <input
                type="text"
                value={formData.cif_nif}
                onChange={(e) => {
                  setFormData({ ...formData, cif_nif: e.target.value });
                  if (errors.cif_nif) setErrors({ ...errors, cif_nif: '' });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark ${
                  errors.cif_nif ? 'border-red-500' : ''
                }`}
                placeholder="B12345678"
              />
              {errors.cif_nif && (
                <p className="text-sm text-red-600 mt-1">{errors.cif_nif}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Persona de Contacto
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                placeholder="666 777 888"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
              placeholder="Observaciones adicionales..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="active" className="ml-2 text-sm font-medium text-gray-700">
              Cliente activo
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Guardando...' : (isCreating || client.id === 0 ? 'Crear Cliente' : 'Guardar Cambios')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
