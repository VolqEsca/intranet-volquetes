import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Key,
  MoreVertical,
  UserCheck,
  UserX,
  Shield,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { apiClient } from "../../api";
import { UserModal } from "./components/UserModal";
import { PasswordModal } from "./components/PasswordModal";

interface User {
  id: number;
  username: string;
  email?: string;
  rol: "admin" | "operador" | "viewer";
  created_at: string;
}

const roleConfig = {
  admin: {
    label: "Administrador",
    color: "bg-purple-100 text-purple-800",
    icon: Shield,
  },
  operador: {
    label: "Operador",
    color: "bg-blue-100 text-blue-800",
    icon: UserCheck,
  },
  viewer: {
    label: "Solo Consulta",
    color: "bg-gray-100 text-gray-800",
    icon: UserX,
  },
};

export const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Solo admins pueden acceder
  const canManageUsers = currentUser?.rol === "admin";

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsCreating(true);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsCreating(false);
    setIsUserModalOpen(true);
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setIsPasswordModalOpen(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
      await apiClient.delete("/users/delete.php", {
        data: { id: userId },
      });
      fetchUsers();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      alert("Error al eliminar el usuario");
    }
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      if (isCreating) {
        await apiClient.post("/users/create.php", userData);
      } else if (selectedUser) {
        await apiClient.put("/users/update.php", {
          ...userData,
          id: selectedUser.id,
        });
      }
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      throw error;
    }
  };

  const handleSavePassword = async (password: string) => {
    if (!selectedUser) return;

    try {
      await apiClient.put("/users/password.php", {
        id: selectedUser.id,
        password,
      });
      setIsPasswordModalOpen(false);
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      throw error;
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-gray-600">
            No tienes permisos para gestionar usuarios.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Usuarios
          </h1>
          <p className="mt-2 text-gray-600">
            Administra los usuarios del sistema
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={handleCreateUser}>
          <Plus size={20} className="mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Buscador */}
      <Card className="p-6 border-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent"
          />
        </div>
      </Card>

      {/* Lista de usuarios */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Cargando usuarios...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const roleInfo = roleConfig[user.rol];
            const RoleIcon = roleInfo.icon;

            return (
              <Card
                key={user.id}
                className="p-6 hover:shadow-xl transition-all duration-300 border-0"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-dark rounded-full flex items-center justify-center text-white font-medium text-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {user.username}
                      </h3>
                      {user.email && (
                        <p className="text-sm text-gray-500">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="p-1">
                    <MoreVertical size={20} />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <RoleIcon size={16} />
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}
                    >
                      {roleInfo.label}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500">
                    Creado el{" "}
                    {new Date(user.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                    className="flex-1"
                  >
                    <Edit size={16} className="mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleChangePassword(user)}
                    className="flex-1"
                  >
                    <Key size={16} className="mr-1" />
                    Contraseña
                  </Button>
                  {user.id !== currentUser?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modales */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        user={selectedUser}
        isCreating={isCreating}
      />

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSave={handleSavePassword}
        username={selectedUser?.username || ""}
      />
    </div>
  );
};
