import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X } from 'lucide-react';
import { apiClient } from '../../../api';

interface EmployeeResult {
  id: number;
  full_name: string;
  location: string;
}

interface EmployeeComboboxProps {
  value: string;
  initialName?: string;
  onChange: (id: string, name: string, location: string) => void;
  error?: string;
}

export const EmployeeCombobox: React.FC<EmployeeComboboxProps> = ({
  value,
  initialName,
  onChange,
  error,
}) => {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [results, setResults] = useState<EmployeeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value && initialName) {
      setSelectedName(prev => prev || initialName);
    } else if (!value) {
      setSelectedName('');
      setSelectedLocation('');
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
      .get(`/vacations/employees-search.php?search=${encodeURIComponent(debouncedSearch)}&limit=10`)
      .then(res => {
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

  const handleSelect = (emp: EmployeeResult) => {
    setSelectedName(emp.full_name);
    setSelectedLocation(emp.location);
    setSearchText('');
    setIsOpen(false);
    setResults([]);
    onChange(String(emp.id), emp.full_name, emp.location);
  };

  const handleDeselect = () => {
    setSelectedName('');
    setSelectedLocation('');
    setSearchText('');
    setResults([]);
    onChange('', '', '');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const showDropdown = isOpen && searchText.length > 0;

  if (value && selectedName) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Empleado <span className="text-[#dc2626]">*</span>
        </label>
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${
          error ? 'border-[#dc2626] bg-red-50' : 'border-[#5487c0] bg-[#1162a6]/5'
        }`}>
          <User size={16} className="text-[#1162a6] shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-medium text-gray-900 truncate">{selectedName}</span>
            {selectedLocation && (
              <span className="block text-xs text-gray-500">{selectedLocation}</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleDeselect}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1162a6] transition-colors shrink-0"
          >
            <X size={12} />
            Cambiar
          </button>
        </div>
        {error && <p className="mt-1 text-sm text-[#dc2626]">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Empleado <span className="text-[#dc2626]">*</span>
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={e => { setSearchText(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder="Buscar empleado por nombre..."
          className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1162a6] focus:border-transparent ${
            error ? 'border-[#dc2626]' : 'border-gray-300'
          }`}
        />

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
            {searchText.length < 2 ? (
              <div className="px-4 py-3 text-sm text-gray-400">Escribe al menos 2 caracteres</div>
            ) : loading ? (
              <div className="px-4 py-3 text-sm text-gray-400">Buscando...</div>
            ) : results.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400">Sin resultados</div>
            ) : (
              results.map(emp => (
                <button
                  key={emp.id}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); handleSelect(emp); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#1162a6]/5 transition-colors border-b border-gray-100 last:border-0"
                >
                  <span className="block text-sm font-medium text-gray-900">{emp.full_name}</span>
                  <span className="block text-xs text-gray-400">{emp.location}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-[#dc2626]">{error}</p>}
    </div>
  );
};
