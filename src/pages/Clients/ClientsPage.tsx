import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { apiClient } from '../../api';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { NewClientModal } from './NewClientModal';
import { ImportClientsModal } from './ImportClientsModal';

interface Client {
  id: number;
  nombre: string;
  cif_nif: string;
  contact_person: string;
  contact_phone: string;
}

export const ClientsPage = () => {
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
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1162a6] mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando clientes...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1162a6] flex items-center justify-center shadow-sm flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {clients.length > 0
                ? `${clients.length} cliente${clients.length !== 1 ? 's' : ''} registrado${clients.length !== 1 ? 's' : ''}`
                : 'Administra el catálogo de clientes'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsImportModalOpen(true)} variant="secondary" className="flex items-center gap-2">
            Importar desde Excel
          </Button>
          <Button onClick={() => setIsNewClientModalOpen(true)} className="flex items-center gap-2">
            Añadir Cliente
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e2e8f0]">
                <th className="py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">CIF/NIF</th>
                <th className="py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Persona de Contacto</th>
                <th className="py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-[#e2e8f0] hover:bg-gray-50">
                  <td className="py-2 text-sm font-semibold text-gray-900">{client.nombre}</td>
                  <td className="py-2 text-sm text-gray-600">{client.cif_nif}</td>
                  <td className="py-2 text-sm text-gray-600">{client.contact_person}</td>
                  <td className="py-2 text-sm text-gray-600">{client.contact_phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onClientAdded={fetchClients}
      />

      <ImportClientsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={fetchClients}
      />
    </div>
  );
};
