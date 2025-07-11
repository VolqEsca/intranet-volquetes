import React from 'react';
import { X } from 'lucide-react'; // Importamos el icono de la 'X' que instalamos

interface ModalProps {
  isOpen: boolean; // Para controlar si el modal está visible o no
  onClose: () => void; // La función que se ejecuta al cerrar
  title: string; // El título que aparecerá en la cabecera del modal
  children: React.ReactNode; // El contenido del modal (ej. un formulario)
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null; // Si no está abierto, no renderiza nada.

  return (
    // Contenedor principal que ocupa toda la pantalla
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      {/* El panel del modal en sí */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg m-4">
        {/* Cabecera del modal con título y botón de cerrar */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        {/* El cuerpo del modal donde irá nuestro contenido */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}