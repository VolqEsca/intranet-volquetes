import React, { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { Sheet } from '../../../components/ui/Sheet';
import { Button } from '../../../components/ui/Button';
import { apiClient } from '../../../api';
import { apiErrorMessage } from '../../../utils/error';

interface QuickCreateClientSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialName: string;
  onCreated: (id: number, name: string) => void;
}

export const QuickCreateClientSheet: React.FC<QuickCreateClientSheetProps> = ({
  isOpen,
  onClose,
  initialName,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [cifNif, setCifNif] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sincronizar nombre inicial al abrir
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setCifNif('');
      setContactPerson('');
      setPhone('');
      setError('');
    }
  }, [isOpen, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cifNif.trim()) {
      setError('Nombre y CIF/NIF son obligatorios');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await apiClient.post('/clients/', {
        name: name.trim(),
        cif_nif: cifNif.trim(),
        contact_person: contactPerson.trim() || null,
        phone: phone.trim() || null,
        email: null,
        address: null,
        active: true,
      });
      onCreated(res.data.id, name.trim());
    } catch (err) {
      setError(apiErrorMessage(err, 'Error al crear el cliente'));
    } finally {
      setSaving(false);
    }
  };

  const INPUT_CLASS =
    'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1162a6] focus:border-transparent text-sm';

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Cliente"
      description="Campos mínimos para continuar con la orden"
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="subtle" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="quick-create-client-form"
            variant="primary"
            isLoading={saving}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            Crear y seleccionar
          </Button>
        </div>
      }
    >
      <form id="quick-create-client-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre <span className="text-[#dc2626]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT_CLASS}
            placeholder="Nombre del cliente"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CIF/NIF <span className="text-[#dc2626]">*</span>
          </label>
          <input
            type="text"
            value={cifNif}
            onChange={(e) => setCifNif(e.target.value)}
            className={INPUT_CLASS}
            placeholder="B12345678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Persona de contacto
          </label>
          <input
            type="text"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            className={INPUT_CLASS}
            placeholder="Juan Pérez"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={INPUT_CLASS}
            placeholder="600 000 000"
          />
        </div>
      </form>
    </Sheet>
  );
};
