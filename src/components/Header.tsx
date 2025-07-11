import { Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useDarkMode } from '../hooks/useDarkMode';
import Button from './ui/Button';

export default function Header() {
  const { user, logout } = useAuth();
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  return (
    <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
      <div>
        {/* Podríamos poner aquí el título de la página actual en el futuro */}
        <h1 className="text-xl font-semibold">Panel Principal</h1>
      </div>
      <div className="flex items-center space-x-4">
        {/* Interruptor de Tema */}
        <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Información del usuario y botón de logout */}
        <span>Hola, {user?.nombre || 'Usuario'}</span>
        <Button onClick={logout} variant="secondary">
          <LogOut size={20} />
        </Button>
      </div>
    </header>
  );
}