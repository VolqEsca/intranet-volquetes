import { useState, useEffect } from 'react';
import apiClient from '../../api';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import NewClientModal from './NewClientModal';
import ImportClientsModal from './ImportClientsModal';

interface Client {
  id: number;
  nombre: string;
  cif_nif: string;
  contact_person: string;
  contact_phone: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error("Error al cargar los clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  if (loading) {
    return <div>Cargando clientes...</div>;
  }

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Gestión de Clientes</h1>
          <div className="space-x-2">
            <Button onClick={() => setIsNewClientModalOpen(true)}>Añadir Cliente</Button>
            <Button onClick={() => setIsImportModalOpen(true)} variant="secondary">Importar desde Excel</Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="py-2">Nombre</th>
                <th className="py-2">CIF/NIF</th>
                <th className="py-2">Persona de Contacto</th>
                <th className="py-2">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-2">{client.nombre}</td>
                  <td className="py-2">{client.cif_nif}</td>
                  <td className="py-2">{client.contact_person}</td>
                  <td className="py-2">{client.contact_phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onClientAdded={fetchClients} // Para refrescar la lista al añadir un cliente
      />

      <ImportClientsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={fetchClients} // Para refrescar la lista tras importar
      />
    </>
  );
}