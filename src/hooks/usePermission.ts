import { useAuth } from './useAuth';

/**
 * Comprueba si el usuario tiene permiso para un módulo y acción dados.
 * Admin siempre retorna true. Operador consulta su lista de permisos.
 */
export const usePermission = (module: string, action = 'access'): boolean => {
  const { user } = useAuth();
  if (!user) return false;
  if (user.rol === 'admin') return true;
  return user.permissions.includes(`${module}:${action}`);
};
