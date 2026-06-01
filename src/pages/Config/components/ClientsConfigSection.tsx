import React, { useState, useEffect, useCallback } from 'react';
import { Search, Pencil, Trash2, Plus, Upload, Building2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { apiClient } from '../../../api';
import { apiErrorMessage } from '../../../utils/error';
import { NewClientModal } from '../../Clients/NewClientModal';
import { ImportClientsModal } from '../../Clients/ImportClientsModal';
import { ClientEditSheet } from './ClientEditSheet';

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

export const ClientsConfigSection: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchClients = useCallback(async (search: string) => {
    if (search.length < 2) {
      setClients([]);
      setHasSearched(false);
      return;
    }
    try {
      setLoading(true);
      setHasSearched(true);
      const res = await apiClient.get(`/clients/?search=${encodeURIComponent(search)}`);
      setClients(res.data.data || []);
    } catch (err) {
      console.error(apiErrorMessage(err, 'Error cargando clientes'));
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients(debouncedSearch);
  }, [debouncedSearch, fetchClients]);

  const handleDelete = async () => {
    if (!deletingClient) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/clients/${deletingClient.id}`);
      setDeletingClient(null);
      fetchClients(debouncedSearch);
    } catch (err) {
      console.error(apiErrorMessage(err, 'Error al eliminar el cliente'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1162a6] flex items-center justify-center shadow-sm flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Gestión de Clientes</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Busca, edita y gestiona el catálogo de clientes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsImportModalOpen(true)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Upload size={16} />
            Importar Excel
          </Button>
          <Button onClick={() => setIsNewModalOpen(true)} className="flex items-center gap-2">
            <Plus size={16} />
            Añadir Cliente
          </Button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, CIF/NIF o teléfono..."
          className="w-full pl-10 pr-4 py-2.5 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1162a6] focus:border-transparent text-sm"
        />
      </div>

      {/* Contenido */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        {!hasSearched ? (
          <div className="py-16 text-center">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              Escribe al menos 2 caracteres para buscar clientes
            </p>
          </div>
        ) : loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1162a6] mx-auto mb-3" />
            <p className="text-sm text-gray-500">Buscando...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500">
              Sin resultados para <strong>"{debouncedSearch}"</strong>
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#e2e8f0] bg-gray-50">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      CIF/NIF
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-[#e2e8f0] last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {client.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {client.cif_nif}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {client.contact_person || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {client.phone || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingClient(client)}
                            className="p-1.5 text-gray-400 hover:text-[#1162a6] hover:bg-[#1162a6]/5 rounded transition-colors"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeletingClient(client)}
                            className="p-1.5 text-gray-400 hover:text-[#dc2626] hover:bg-[#dc2626]/5 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 bg-gray-50 border-t border-[#e2e8f0] text-xs text-gray-400">
              {clients.length} resultado{clients.length !== 1 ? 's' : ''} · máximo 50 por búsqueda
            </div>
          </>
        )}
      </div>

      {/* Modales */}
      <NewClientModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onClientAdded={() => fetchClients(debouncedSearch)}
      />

      <ImportClientsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => fetchClients(debouncedSearch)}
      />

      {editingClient && (
        <ClientEditSheet
          client={editingClient}
          isOpen
          onClose={() => setEditingClient(null)}
          onSave={() => {
            setEditingClient(null);
            fetchClients(debouncedSearch);
          }}
        />
      )}

      <ConfirmModal
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        onConfirm={handleDelete}
        variant="danger"
        title="Eliminar cliente"
        description={
          deletingClient
            ? `¿Eliminar "${deletingClient.name}"? Si tiene órdenes asociadas, se marcará como inactivo.`
            : ''
        }
        confirmLabel="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  );
};
