import React from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "subtle" | "destructive" | "ghost" | "toggle";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  active?: boolean; // solo para variant="toggle"
};

export const Button = ({
  children,
  className = "",
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  active = false,
  disabled,
  ...props
}: ButtonProps) => {
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1162a6]/50 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<ButtonVariant, string> = {
    primary:     "bg-[#1162a6] text-white hover:bg-[#0d4d85]",
    secondary:   "border border-[#1162a6] text-[#1162a6] bg-white hover:bg-[#a2bade]/10",
    subtle:      "border border-[#e2e8f0] text-gray-500 bg-white hover:bg-gray-50",
    destructive: "border border-[#dc2626] text-[#dc2626] bg-white hover:bg-[#dc2626]/10",
    ghost:       "bg-transparent text-gray-500 hover:bg-gray-100",
    toggle:      active ? "bg-[#1162a6] text-white" : "border border-[#e2e8f0] text-[#1162a6] hover:bg-[#a2bade]/10",
  };
  const sizes: Record<ButtonSize, string> = {
    sm:   "text-xs px-3 py-1.5",
    md:   "text-sm px-4 py-2",
    lg:   "text-sm px-6 py-3",
    icon: "p-2",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
      {children}
    </button>
  );
};
