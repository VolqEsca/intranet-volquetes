// src/components/ui/Button.tsx
import React from "react";
import { Loader2 } from "lucide-react"; // ✅ NUEVO: Import para spinner

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean; // ✅ NUEVO: Prop opcional para estado de carga
};

export const Button = ({
  children,
  className = "",
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false, // ✅ NUEVO: Default false
  disabled,
  ...props
}: ButtonProps) => {
  // Estilos base (SIN CAMBIOS)
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  // Variantes usando solo los colores corporativos azules (SIN CAMBIOS)
  const variants = {
    primary: `
      bg-primary-dark text-white shadow-sm
      hover:bg-secondary hover:shadow-md
      focus:ring-primary-dark
    `,
    secondary: `
      bg-secondary text-white shadow-sm
      hover:bg-light-accent hover:text-primary-dark hover:shadow-md
      focus:ring-secondary
    `,
    outline: `
      bg-white text-primary-dark border-2 border-primary-dark
      hover:bg-light-accent/20 hover:border-secondary hover:shadow-md
      focus:ring-primary-dark
    `,
    ghost: `
      bg-transparent text-gray-600
      hover:bg-light-accent/20 hover:text-primary-dark
      focus:ring-gray-500
    `,
  };

  // Tamaños (SIN CAMBIOS)
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const widthClass = fullWidth ? "w-full" : "";

  const combinedClasses = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${widthClass}
    ${className}
  `;

  return (
    <button
      className={combinedClasses}
      disabled={disabled || isLoading} // ✅ NUEVO: Auto-deshabilitar durante carga
      {...props}
    >
      {/* ✅ NUEVO: Spinner condicional */}
      {isLoading && (
        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
      )}
      {/* Contenido original mantenido */}
      {children}
    </button>
  );
};
