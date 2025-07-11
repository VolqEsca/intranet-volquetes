import React from 'react';

interface CardProps {
  children: React.ReactNode; // El contenido que irá dentro de la tarjeta
  className?: string; // Para añadir clases extra si es necesario
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      {children}
    </div>
  );
}