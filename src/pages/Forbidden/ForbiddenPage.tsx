import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';

export const ForbiddenPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <ShieldOff size={48} className="text-[#a2bade]" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-[#1162a6]">Sin acceso</h1>
        <p className="text-gray-500 text-sm max-w-sm">
          No tienes permiso para acceder a este módulo. Contacta con un administrador si crees que es un error.
        </p>
      </div>
      <button
        onClick={() => navigate('/')}
        className="text-sm font-medium text-[#5487c0] hover:text-[#1162a6] hover:underline transition-colors"
      >
        Volver al Dashboard
      </button>
    </div>
  );
};
