import React from 'react';

// Definimos qué propiedades puede recibir nuestro botón.
// Hereda todas las propiedades de un botón HTML normal.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode; // El texto o icono que va dentro del botón
  variant?: 'primary' | 'secondary'; // Una variante opcional para el estilo
}

export default function Button({ children, variant = 'primary', ...props }: ButtonProps) {
  // Clases de Tailwind CSS que son comunes a todos los botones.
  const baseClasses = "px-4 py-2 rounded-md font-semibold text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Clases específicas para cada variante.
  const variants = {
    primary: "bg-blue-700 hover:bg-blue-800 focus:ring-blue-500",
    secondary: "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500",
  };

  // Combinamos las clases base con las de la variante seleccionada.
  return (
    <button className={`${baseClasses} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
}