import React, { useState, useEffect } from "react";
import { User, Mail, Shield, Lock, Save, AlertCircle, Eye, EyeOff, LayoutDashboard, Wrench, Factory, Users, Calendar } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Sheet } from "../../../components/ui/Sheet";
import { ROLES_OPTIONS } from "../../../config/roles";
import { apiClient } from "../../../api";
import { apiErrorMessage } from '../../../utils/error';

interface UserData {
  id: number;
  username: string;
  email?: string;
  nombre?: string;
  apellidos?: string;
  rol: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<UserData>) => Promise<void>;
  user: UserData | null;
  isCreating: boolean;
}

interface ModuleOption {
  slug: string;
  label: string;
  icon: React.ElementType;
}

const MODULE_OPTIONS: ModuleOption[] = [
  { slug: 'dashboard',            label: 'Dashboard',               icon: LayoutDashboard },
  { slug: 'orders',               label: 'Órdenes de Reparación',   icon: Wrench },
  { slug: 'manufacturing-orders', label: 'Órdenes de Fabricación',  icon: Factory },
  { slug: 'employees',            label: 'Empleados',               icon: Users },
  { slug: 'vacations',            label: 'Gestión de Vacaciones',   icon: Calendar },
];

export const UserModal = ({
  isOpen,
  onClose,
  onSave,
  user,
  isCreating,
}: UserModalProps) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    nombre: "",
    apellidos: "",
    rol: "operador",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Permisos — solo relevante para usuarios operador en modo edición
  const [grantedModules, setGrantedModules] = useState<string[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email || "",
        nombre: user.nombre || "",
        apellidos: user.apellidos || "",
        rol: user.rol,
        password: "",
      });

      // Cargar permisos actuales si es operador (excluye ambos formatos de admin)
      if (user.rol !== 'admin' && user.rol !== 'Administrador') {
        setLoadingPerms(true);
        apiClient
          .get<{ success: boolean; permissions: { module: string; action: string }[] }>(
            `/users/permissions.php?user_id=${user.id}`
          )
          .then(res => {
            const slugs = (res.data.permissions ?? [])
              .filter(p => p.action === 'access')
              .map(p => p.module);
            setGrantedModules(slugs);
          })
          .catch(() => setGrantedModules([]))
          .finally(() => setLoadingPerms(false));
      } else {
        setGrantedModules([]);
      }
    } else {
      setFormData({ username: "", email: "", nombre: "", apellidos: "", rol: "operador", password: "" });
      setGrantedModules([]);
    }
    setError("");
    setShowPassword(false);
  }, [user, isOpen]);

  const toggleModule = (slug: string) => {
    setGrantedModules(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const dataToSave: Record<string, unknown> = {
        username: formData.username,
        email: formData.email || null,
        nombre: formData.nombre || null,
        apellidos: formData.apellidos || null,
        rol: formData.rol,
      };

      if (isCreating && formData.password) {
        dataToSave.password = formData.password;
      }

      // Incluir permisos en la creación de operadores
      if (isCreating && formData.rol === 'operador') {
        dataToSave.permissions = grantedModules;
      }

      await onSave(dataToSave);

      // Guardar permisos en modo edición para operadores
      if (!isCreating && user && formData.rol !== 'admin' && formData.rol !== 'Administrador') {
        const grants = grantedModules.map(slug => ({ module: slug, action: 'access' }));
        await apiClient.put(`/users/permissions.php?user_id=${user.id}`, { grants });
      }

      onClose();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "Error al guardar el usuario"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={isCreating ? "Crear Usuario" : "Editar Usuario"}
      description={isCreating
        ? "Completa la información del nuevo usuario"
        : "Actualiza la información del usuario"}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="subtle" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save size={18} />
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Información Personal */}
        <div className="space-y-5">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <User size={20} className="text-gray-400" />
            Información Personal
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellidos
              </label>
              <input
                type="text"
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
                placeholder="Pérez García"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario *
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
              placeholder="usuario123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
                placeholder="usuario@ejemplo.com"
              />
            </div>
          </div>
        </div>

        {/* Seguridad */}
        <div className="space-y-5 border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Lock size={20} className="text-gray-400" />
            Seguridad
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Shield className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
              >
                {ROLES_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isCreating && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required={isCreating}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">Mínimo 6 caracteres</p>
            </div>
          )}
        </div>

        {/* Permisos de módulo — visible para operadores en creación y edición */}
        {formData.rol === 'operador' && (
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Shield size={20} className="text-gray-400" />
              Acceso a módulos
            </h3>

            {loadingPerms ? (
              <div className="text-sm text-gray-400 py-2">Cargando permisos...</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {MODULE_OPTIONS.map(({ slug, label, icon: Icon }) => {
                  const checked = grantedModules.includes(slug);
                  return (
                    <label
                      key={slug}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors select-none
                        ${checked
                          ? 'border-[#5487c0] bg-[#1162a6]/5'
                          : 'border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleModule(slug)}
                        className="rounded border-gray-300 text-[#1162a6] focus:ring-[#1162a6]"
                      />
                      <Icon size={16} className={checked ? 'text-[#1162a6]' : 'text-gray-400'} />
                      <span className={`text-sm font-medium ${checked ? 'text-[#1162a6]' : 'text-gray-600'}`}>
                        {label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
};
