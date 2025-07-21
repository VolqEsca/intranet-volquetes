import React from 'react';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card = ({ children, className = '' }: CardProps) => {
  const baseClasses = "bg-white rounded-xl shadow-lifted border border-gray-200/80 transition-all duration-300";
  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
};