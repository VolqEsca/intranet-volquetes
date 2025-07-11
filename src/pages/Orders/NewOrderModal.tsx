import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import apiClient from '../../api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOrderAdded: () => void;
}

interface ClientSuggestion {
  id: number;
  nombre: string;
}

export default function NewOrderModal({ isOpen, onClose, onOrderAdded }: Props) {
  // Estado para los campos del formulario
  const [selectedClient, setSelectedClient] = useState<ClientSuggestion | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState('Pendiente');
  
  // Estado para la búsqueda de clientes
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  
  // Estado para errores y carga
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Efecto para buscar clientes cuando el usuario escribe
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }
    
    const fetchSuggestions = async () => {
            try {
        const response = await apiClient.get(`/clients?search=${searchTerm}`);
        setSuggestions(response.data);
      } catch (err) {
        console.error("Error buscando clientes:", err);
      } finally {
       }
    };
    
    // Usamos un temporizador (debounce) para no hacer una llamada en cada letra
    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleClientSelect = (client: ClientSuggestion) => {
    setSelectedClient(client);
    setSearchTerm(client.nombre);
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      setError('Por favor, seleccione un cliente de la lista.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/orders', {
        cliente_id: selectedClient.id,
        descripcion,
        estado,
      });
      onOrderAdded();
      onClose();
      // Reseteamos el formulario
      setSelectedClient(null);
      setSearchTerm('');
      setDescripcion('');
      setEstado('Pendiente');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear la orden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nueva Orden">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo de búsqueda de cliente */}
        <div className="relative">
          <label className="block text-sm font-medium">Cliente</label>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedClient(null); // Deseleccionar si el usuario edita
            }}
            placeholder="Empiece a escribir para buscar..."
            required 
            className="mt-1 block w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md mt-1 max-h-40 overflow-y-auto">
              {suggestions.map(client => (
                <li 
                  key={client.id} 
                  onClick={() => handleClientSelect(client)}
                  className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800"
                >
                  {client.nombre}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Descripción</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required rows={3} className="mt-1 block w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md"/>
        </div>

        <div>
          <label className="block text-sm font-medium">Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-md">
            <option>Pendiente</option>
            <option>Activa</option>
            <option>Completada</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading || !selectedClient}>{loading ? 'Guardando...' : 'Guardar Orden'}</Button>
        </div>
      </form>
    </Modal>
  );
}