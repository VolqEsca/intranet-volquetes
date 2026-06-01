import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { Sheet } from '../../../components/ui/Sheet';
import { Button } from '../../../components/ui/Button';
import { apiClient } from '../../../api';
import { apiErrorMessage } from '../../../utils/error';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';

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

interface ClientEditSheetProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const ClientEditSheet: React.FC<ClientEditSheetProps> = ({
  client,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: client.name,
    cif_nif: client.cif_nif,
    contact_person: client.contact_person || '',
    phone: client.phone || '',
    email: client.email || '',
    address: client.address || '',
    notes: client.notes || '',
    active: client.active,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!formData.cif_nif.trim()) newErrors.cif_nif = 'El CIF/NIF es obligatorio';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await apiClient.put(`/clients/${client.id}`, formData);
      toast.success('Cliente actualizado correctamente');
      onSave();
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const data = error.response?.data as Record<string, unknown> | undefined;
        if (data?.errors) {
          setErrors(data.errors as Record<string, string>);
        } else if (typeof data?.error === 'string') {
          if (data.error.includes('CIF/NIF')) {
            setErrors({ cif_nif: data.error });
          } else {
            toast.error(data.error);
          }
        } else {
          toast.error('No se pudo actualizar el cliente. Por favor, inténtalo de nuevo.');
        }
      } else {
        toast.error('No se pudo actualizar el cliente. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const INPUT_CLASS =
    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1162a6] focus:border-transparent text-sm';

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Cliente"
      description="Modifica los datos del cliente"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="subtle" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="client-edit-sheet-form"
            variant="primary"
            isLoading={loading}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            Guardar Cambios
          </Button>
        </div>
      }
    >
      <form id="client-edit-sheet-form" onSubmit={handleSubmit} className="space-y-4">
        {Object.keys(errors).length > 0 && errors._general && (
          <div className="flex items-center gap-2 p-3 bg-[#dc2626]/5 border border-[#dc2626]/20 rounded-lg text-[#dc2626] text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errors._general}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-[#dc2626]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              className={`${INPUT_CLASS} ${errors.name ? 'border-[#dc2626]' : 'border-gray-300'}`}
              placeholder="Nombre del cliente"
            />
            {errors.name && <p className="text-sm text-[#dc2626] mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CIF/NIF <span className="text-[#dc2626]">*</span>
            </label>
            <input
              type="text"
              value={formData.cif_nif}
              onChange={(e) => {
                setFormData({ ...formData, cif_nif: e.target.value });
                if (errors.cif_nif) setErrors({ ...errors, cif_nif: '' });
              }}
              className={`${INPUT_CLASS} ${errors.cif_nif ? 'border-[#dc2626]' : 'border-gray-300'}`}
              placeholder="B12345678"
            />
            {errors.cif_nif && <p className="text-sm text-[#dc2626] mt-1">{errors.cif_nif}</p>}
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
              className={`${INPUT_CLASS} border-gray-300`}
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`${INPUT_CLASS} border-gray-300`}
              placeholder="600 000 000"
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
            className={`${INPUT_CLASS} border-gray-300`}
            placeholder="Observaciones adicionales..."
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="client-active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="rounded"
          />
          <label htmlFor="client-active" className="text-sm font-medium text-gray-700">
            Cliente activo
          </label>
        </div>
      </form>
    </Sheet>
  );
};
