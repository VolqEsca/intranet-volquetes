import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X } from 'lucide-react';
import { apiClient } from '../../../api';

interface ClientResult {
  id: number;
  name: string;
  cif_nif: string;
  phone: string;
}

interface ClientComboboxProps {
  value: string;
  initialName?: string;
  onChange: (id: string, name: string) => void;
  onCreateNew: (searchText: string) => void;
  error?: string;
}

export const ClientCombobox: React.FC<ClientComboboxProps> = ({
  value,
  initialName,
  onChange,
  onCreateNew,
  error,
}) => {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [results, setResults] = useState<ClientResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar selectedName con el valor externo (edición y reset)
  useEffect(() => {
    if (value && initialName) {
      // Pre-poblar solo si el nombre interno está vacío (no pisar selección del usuario)
      setSelectedName((prev) => prev || initialName);
    } else if (!value) {
      setSelectedName('');
      setSearchText('');
      setResults([]);
    }
  }, [value, initialName]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiClient
      .get(`/clients/?search=${encodeURIComponent(debouncedSearch)}`)
      .then((res) => {
        if (!cancelled) setResults(res.data.data || []);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  const handleSelect = (client: ClientResult) => {
    setSelectedName(client.name);
    setSearchText('');
    setIsOpen(false);
    setResults([]);
    onChange(String(client.id), client.name);
  };

  const handleDeselect = () => {
    setSelectedName('');
    setSearchText('');
    setResults([]);
    onChange('', '');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    onCreateNew(searchText);
  };

  const showDropdown = isOpen && searchText.length > 0;

  // Estado colapsado — cliente ya seleccionado
  if (value && selectedName) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cliente <span className="text-[#dc2626]">*</span>
        </label>
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${
          error ? 'border-[#dc2626] bg-red-50' : 'border-[#5487c0] bg-[#1162a6]/5'
        }`}>
          <User size={16} className="text-[#1162a6] shrink-0" />
          <span className="flex-1 text-sm font-medium text-gray-900">{selectedName}</span>
          <button
            type="button"
            onClick={handleDeselect}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1162a6] transition-colors"
          >
            <X size={12} />
            Cambiar
          </button>
        </div>
        {error && <p className="mt-1 text-sm text-[#dc2626]">{error}</p>}
      </div>
    );
  }

  // Estado búsqueda
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Cliente <span className="text-[#dc2626]">*</span>
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder="Buscar cliente por nombre, CIF/NIF o teléfono..."
          className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1162a6] focus:border-transparent ${
            error ? 'border-[#dc2626]' : 'border-gray-300'
          }`}
        />

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
            {searchText.length < 2 ? (
              <div className="px-4 py-3 text-sm text-gray-400">
                Escribe al menos 2 caracteres
              </div>
            ) : loading ? (
              <div className="px-4 py-3 text-sm text-gray-400">Buscando...</div>
            ) : (
              <>
                {results.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(client); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#1162a6]/5 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <span className="block text-sm font-medium text-gray-900">
                      {client.name}
                    </span>
                    <span className="block text-xs text-gray-400">
                      {client.cif_nif}{client.phone ? ` · ${client.phone}` : ''}
                    </span>
                  </button>
                ))}

                {results.length === 0 && (
                  <div className="px-4 py-2.5 text-sm text-gray-400 border-b border-gray-100">
                    Sin resultados
                  </div>
                )}

                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleCreateNew(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#1162a6] font-medium hover:bg-[#1162a6]/5 transition-colors flex items-center gap-2"
                >
                  <span className="text-lg leading-none">+</span>
                  Crear cliente &ldquo;{searchText}&rdquo;
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-[#dc2626]">{error}</p>}
    </div>
  );
};
