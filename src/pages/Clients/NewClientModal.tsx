import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import apiClient from '../../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: () => void;
}

export default function NewClientModal({ isOpen, onClose, onClientAdded }: Props) {
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
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al crear el cliente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Añadir Nuevo Cliente">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Nombre de la Empresa</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md"/>
        </div>
        <div>
          <label className="block text-sm font-medium">CIF / NIF</label>
          <input type="text" value={cifNif} onChange={(e) => setCifNif(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md"/>
        </div>
        <div>
          <label className="block text-sm font-medium">Persona de Contacto</label>
          <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md"/>
        </div>
        <div>
          <label className="block text-sm font-medium">Teléfono de Contacto</label>
          <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md"/>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Cliente'}</Button>
        </div>
      </form>
    </Modal>
  );
}