import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../api';
import { apiErrorMessage } from '../../utils/error';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: () => void;
}

export function NewClientModal({ isOpen, onClose, onClientAdded }: Props) {
  const [nombre, setNombre] = useState('');
  const [cifNif, setCifNif] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/clients', {
        nombre,
        cif_nif: cifNif,
        contact_person: contactPerson,
        contact_phone: contactPhone,
      });
      onClientAdded(); // Llama a la función para refrescar la tabla
      onClose(); // Cierra el modal
    } catch (err: unknown) {
      setError(apiErrorMessage(err, 'Error al crear el cliente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Añadir Nuevo Cliente">
      <div className="flex flex-col max-h-[90vh]">
        <form id="new-client-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Nombre de la Empresa</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium">CIF / NIF</label>
            <input type="text" value={cifNif} onChange={(e) => setCifNif(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Persona de Contacto</label>
            <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Teléfono de Contacto</label>
            <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md"/>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
        <div className="flex-shrink-0 border-t border-[#e2e8f0] px-6 py-4 flex justify-end gap-3">
          <Button type="button" variant="subtle" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="new-client-form" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Cliente'}</Button>
        </div>
      </div>
    </Modal>
  );
}