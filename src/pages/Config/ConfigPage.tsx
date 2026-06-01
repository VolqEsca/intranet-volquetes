import React, { useState } from 'react';
import { Users, Building2, Calendar } from 'lucide-react';
import { UsersPage } from '../Users/UsersPage';
import { ClientsConfigSection } from './components/ClientsConfigSection';
import { VacacionesConfigSection } from './components/VacacionesConfigSection';

type Tab = 'usuarios' | 'clientes' | 'vacaciones';

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'usuarios', label: 'Usuarios', Icon: Users },
  { id: 'clientes', label: 'Clientes', Icon: Building2 },
  { id: 'vacaciones', label: 'Vacaciones', Icon: Calendar },
];

export const ConfigPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('usuarios');

  return (
    <div className="space-y-5">
      <div className="flex border-b border-[#e2e8f0]">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === id
                ? 'border-[#1162a6] text-[#1162a6]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'usuarios' && <UsersPage />}
      {activeTab === 'clientes' && <ClientsConfigSection />}
      {activeTab === 'vacaciones' && <VacacionesConfigSection />}
    </div>
  );
};
