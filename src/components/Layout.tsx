import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Barra lateral oscura y fija */}
      <Sidebar />

      {/* Área de contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Cabecera superior */}
        <Header />

        {/* Contenido de la página (aquí se renderizarán el Dashboard, Órdenes, etc.) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">
            <Outlet /> {/* Outlet es donde React Router renderiza las páginas anidadas */}
          </div>
        </main>
      </div>
    </div>
  );
}