// src/pages/Orders/components/ClientsManagementModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { X, Upload, Search, Trash2, Edit2, Download, Users, FileSpreadsheet, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { apiClient } from '../../../api';
import { ClientEditModal } from './ClientEditModal';
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

interface ClientsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated?: () => void;
}

export const ClientsManagementModal: React.FC<ClientsManagementModalProps> = ({
  isOpen,
  onClose,
  onClientCreated
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'import'>('list');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [creatingClient, setCreatingClient] = useState(false);
  
  // Estados para importación
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    updated: number;
    errors: string[];
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Cargar clientes
  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/clients/');
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'list') {
      loadClients();
    }
  }, [isOpen, activeTab, loadClients]);

  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    const search = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(search) ||
      client.cif_nif.toLowerCase().includes(search) ||
      client.phone.includes(search)
    );
  });

  // Manejar selección
  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(c => c.id));
    }
  };

  const handleSelectClient = (id: number) => {
    setSelectedClients(prev => 
      prev.includes(id) 
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  // Crear nuevo cliente
  const handleCreateClient = () => {
    // Crear un cliente vacío para el modal de edición
    const newClient: Client = {
      id: 0, // ID temporal para indicar que es nuevo
      name: '',
      cif_nif: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      active: true
    };
    setEditingClient(newClient);
    setCreatingClient(true);
  };

  // Borrar clientes
  const handleDeleteSelected = async () => {
    const confirmed = await dialog.confirm(
      `¿Estás seguro de que quieres eliminar ${selectedClients.length} cliente${selectedClients.length !== 1 ? 's' : ''}?`,
      'Eliminar clientes',
      { 
        confirmText: 'Eliminar', 
        cancelText: 'Cancelar',
        variant: 'warning' 
      }
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      await apiClient.post('/clients/delete-bulk', { ids: selectedClients });
      await loadClients();
      setSelectedClients([]);
      await dialog.success(`${selectedClients.length} cliente${selectedClients.length !== 1 ? 's' : ''} eliminado${selectedClients.length !== 1 ? 's' : ''} correctamente`);
    } catch (error) {
      console.error('Error eliminando clientes:', error);
      await dialog.error('Error al eliminar los clientes. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSingle = async (id: number) => {
    const confirmed = await dialog.confirm(
      '¿Estás seguro de que quieres eliminar este cliente?',
      'Eliminar cliente',
      { 
        confirmText: 'Eliminar', 
        cancelText: 'Cancelar',
        variant: 'warning' 
      }
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      await apiClient.delete(`/clients/${id}`);
      await loadClients();
      await dialog.success('Cliente eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      await dialog.error('Error al eliminar el cliente. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Manejo de drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    console.log('Procesando archivo:', file.name);
    
    // Verificar tipo de archivo
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.xlsx?$/i)) {
      await dialog.error('Por favor selecciona un archivo Excel (.xls o .xlsx)');
      return;
    }

    setImportFile(file);
    setImportResult(null);
    setImporting(true);

    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Enviando archivo al servidor...');
      const response = await apiClient.post('/clients/import.php', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Respuesta del servidor:', response.data);
      
      if (response.data.success) {
        setImportResult({
          success: response.data.imported || 0,
          updated: response.data.updated || 0,
          errors: response.data.warnings || []
        });
        
        // Mostrar mensaje de éxito
        const message = `Se han importado ${response.data.imported} cliente${response.data.imported !== 1 ? 's' : ''} nuevo${response.data.imported !== 1 ? 's' : ''}${response.data.updated > 0 ? ` y actualizado ${response.data.updated} cliente${response.data.updated !== 1 ? 's' : ''} existente${response.data.updated !== 1 ? 's' : ''}` : ''}.`;
        await dialog.success(message, '✅ Importación Exitosa');
        
        // Recargar lista de clientes si se importó algo
        if (response.data.imported > 0 || response.data.updated > 0) {
          await loadClients();
          // Cambiar a la pestaña de listado después de 2 segundos
          setTimeout(() => {
            setActiveTab('list');
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error('Error completo:', error);
      console.error('Respuesta de error:', error.response);
      await dialog.error(
        error.response?.data?.error || 'Error desconocido al importar el archivo',
        '❌ Error de Importación'
      );
    } finally {
      setImporting(false);
      setImportFile(null);
    }
  };

  // Descargar plantilla
  const handleDownloadTemplate = () => {
    const baseUrl = window.location.origin;
    window.location.href = `${baseUrl}/api/clients/template.php`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="max-w-6xl">
      <div className="flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary-dark" />
            <h2 className="text-xl font-semibold">Gestión de Clientes</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'list'
                ? 'text-primary-dark border-b-2 border-primary-dark'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Listado de Clientes
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-primary-dark border-b-2 border-primary-dark'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Importar Clientes
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'list' ? (
            <div className="h-full flex flex-col">
              {/* Barra de herramientas */}
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, CIF/NIF o teléfono..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleCreateClient}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo Cliente
                  </Button>
                  {selectedClients.length > 0 && (
                    <Button
                      variant="secondary"
                      onClick={handleDeleteSelected}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar ({selectedClients.length})
                    </Button>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Tabla */}
              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nombre</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">CIF/NIF</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Contacto</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Teléfono</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Notas</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          Cargando clientes...
                        </td>
                      </tr>
                    ) : filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No se encontraron clientes
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedClients.includes(client.id)}
                              onChange={() => handleSelectClient(client.id)}
                              className="rounded"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium">{client.name}</td>
                          <td className="px-4 py-3 text-gray-600">{client.cif_nif}</td>
                          <td className="px-4 py-3">{client.contact_person || '-'}</td>
                          <td className="px-4 py-3">{client.phone || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {client.notes ? (
                              <span className="truncate block max-w-xs" title={client.notes}>
                                {client.notes}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingClient(client);
                                  setCreatingClient(false);
                                }}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteSingle(client.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4 text-secondary" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Tab de importación */}
              <div className="max-w-4xl mx-auto">
                {/* Botón descargar plantilla */}
                <div className="mb-6 flex justify-end">
                  <Button
                    variant="primary"
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Plantilla Excel
                  </Button>
                </div>

                {/* Dropzone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragActive ? 'border-primary-dark bg-blue-50' : 'border-gray-300 hover:border-primary-dark'
                  } ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".xls,.xlsx"
                    onChange={handleFileInput}
                    disabled={importing}
                  />
                  <label htmlFor="file-upload" className={`cursor-pointer ${importing ? 'cursor-not-allowed' : ''}`}>
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-primary-dark" />
                    {importing ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-dark border-t-transparent" />
                        <p className="text-lg font-medium text-gray-700">Importando clientes...</p>
                      </div>
                    ) : dragActive ? (
                      <p className="text-lg font-medium text-primary-dark">Suelta el archivo aquí...</p>
                    ) : (
                      <>
                        <p className="text-lg font-medium text-gray-700">
                          Arrastra y suelta tu archivo Excel aquí
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          o haz clic para seleccionar un archivo (.xls, .xlsx)
                        </p>
                      </>
                    )}
                  </label>
                </div>

                {/* Resultado de importación */}
                {importResult && (
                  <div className="mt-6 p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-green-900">Importación completada</h4>
                        <p className="text-sm text-green-700 mt-1">
                          {importResult.success} clientes nuevos importados
                          {importResult.updated > 0 && `, ${importResult.updated} actualizados`}
                        </p>
                        {importResult.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-red-700">Advertencias:</p>
                            <ul className="text-sm text-red-600 mt-1">
                              {importResult.errors.slice(0, 5).map((error, index) => (
                                <li key={index}>• {error}</li>
                              ))}
                              {importResult.errors.length > 5 && (
                                <li>• ... y {importResult.errors.length - 5} más</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Información */}
                {!importing && !importResult && (
                  <div className="mt-6 bg-light-accent bg-opacity-20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-primary-dark mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-gray-900 mb-2">Formato del archivo Excel:</p>
                        <div className="space-y-1 text-gray-700">
                          <div><span className="font-semibold">Columna A:</span> Nombre del cliente *</div>
                          <div><span className="font-semibold">Columna B:</span> CIF/NIF *</div>
                          <div><span className="font-semibold">Columna C:</span> Persona de contacto</div>
                          <div><span className="font-semibold">Columna D:</span> Teléfono</div>
                          <div><span className="font-semibold">Columna E:</span> Notas</div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          * Campos obligatorios. Los clientes existentes se actualizarán automáticamente por CIF/NIF.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de edición/creación */}
      {editingClient && (
        <ClientEditModal
          client={editingClient}
          isOpen={!!editingClient}
          onClose={() => {
            setEditingClient(null);
            setCreatingClient(false);
          }}
          onSave={() => {
            loadClients();
            setEditingClient(null);
            setCreatingClient(false);
            if (creatingClient && onClientCreated) {
              onClientCreated();
            }
          }}
          isCreating={creatingClient}
        />
      )}
    </Modal>
  );
};
