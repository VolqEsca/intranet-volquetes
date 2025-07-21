import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export const Button = ({
  children,
  className = "",
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) => {
  // Estilos base
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  // Variantes usando los colores corporativos
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
    danger: `
      bg-red-600 text-white shadow-sm
      hover:bg-red-700 hover:shadow-md
      focus:ring-red-600
    `,
  };

  // Tamaños
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
    <button className={combinedClasses} disabled={disabled} {...props}>
      {children}
    </button>
  );
};
