import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Settings } from 'lucide-react'; // Iconos

export default function Sidebar() {
  const navLinkClasses = "flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md";
  const activeLinkClasses = "bg-blue-700 text-white";

  // Función para determinar las clases del enlace
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    isActive ? `${navLinkClasses} ${activeLinkClasses}` : navLinkClasses;
  
  return (
    <div className="flex flex-col w-64 bg-gray-800 text-white">
      <div className="flex items-center justify-center h-20 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Volquetes E.</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        <NavLink to="/" className={getNavLinkClass}>
          <LayoutDashboard className="mr-3" />
          Panel Principal
        </NavLink>
        <NavLink to="/ordenes" className={getNavLinkClass}>
          <FileText className="mr-3" />
          Órdenes
        </NavLink>
        <NavLink to="/clientes" className={getNavLinkClass}>
          <Users className="mr-3" />
          Clientes
        </NavLink>
        <NavLink to="/configuracion" className={getNavLinkClass}>
          <Settings className="mr-3" />
          Configuración
        </NavLink>
      </nav>
    </div>
  );
}