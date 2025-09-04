import React, { useState } from "react";
import { UsersPage } from "../Users/UsersPage";
import {
  Users,
  Settings,
  Bell,
  Grid3x3,
  Shield,
  Database,
  Mail,
  Palette,
} from "lucide-react";

export const ConfigPage = () => {
  const [activeTab, setActiveTab] = useState("usuarios");

  const tabs = [
    {
      id: "usuarios",
      label: "Usuarios",
      icon: Users,
      component: UsersPage,
    },
    {
      id: "sistema",
      label: "Sistema",
      icon: Settings,
      component: SystemSettings,
    },
    {
      id: "notificaciones",
      label: "Notificaciones",
      icon: Bell,
      component: NotificationSettings,
    },
    {
      id: "apartados",
      label: "Apartados",
      icon: Grid3x3,
      component: SectionsSettings,
    },
  ];

  const ActiveComponent =
    tabs.find((tab) => tab.id === activeTab)?.component || UsersPage;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          Gestiona la configuración del sistema y usuarios
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                    transition-colors duration-200
                    ${
                      activeTab === tab.id
                        ? "border-primary-dark text-primary-dark"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 bg-gray-50 overflow-auto">
        <ActiveComponent />
      </div>
    </div>
  );
};

// Los componentes de sistema, notificaciones y apartados igual que antes...
const SystemSettings = () => <div>Sistema</div>;
const NotificationSettings = () => <div>Notificaciones</div>;
const SectionsSettings = () => <div>Apartados</div>;
