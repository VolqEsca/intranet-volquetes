// src/pages/Config/ConfigPage.tsx
import React, { useState } from "react";
import { UsersManagement } from "./components/UsersManagement";
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
      component: UsersManagement,
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
    tabs.find((tab) => tab.id === activeTab)?.component || UsersManagement;

  return (
    <div className="h-full flex flex-col">
      {/* Header mejorado */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          Gestiona la configuración del sistema y usuarios
        </p>
      </div>

      {/* Tabs mejorados */}
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

// Componente de configuración del sistema (ejemplo)
const SystemSettings = () => {
  const systemOptions = [
    {
      icon: Database,
      title: "Base de Datos",
      description: "Configuración de respaldos y mantenimiento",
      status: "Último respaldo: hace 2 horas",
    },
    {
      icon: Shield,
      title: "Seguridad",
      description: "Políticas de contraseñas y acceso",
      status: "Nivel: Alto",
    },
    {
      icon: Mail,
      title: "Correo Electrónico",
      description: "Servidor SMTP y plantillas",
      status: "Configurado",
    },
    {
      icon: Palette,
      title: "Personalización",
      description: "Temas y configuración visual",
      status: "Tema: Predeterminado",
    },
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {systemOptions.map((option, index) => {
          const Icon = option.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-dark/10 rounded-lg">
                  <Icon className="w-6 h-6 text-primary-dark" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {option.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {option.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">{option.status}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Placeholder para otras secciones
const NotificationSettings = () => (
  <div className="p-6">
    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
      <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900">
        Configuración de Notificaciones
      </h3>
      <p className="text-gray-600 mt-2">
        Próximamente podrás configurar las notificaciones del sistema
      </p>
    </div>
  </div>
);

const SectionsSettings = () => (
  <div className="p-6">
    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
      <Grid3x3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900">
        Gestión de Apartados
      </h3>
      <p className="text-gray-600 mt-2">
        Próximamente podrás personalizar los módulos del sistema
      </p>
    </div>
  </div>
);
