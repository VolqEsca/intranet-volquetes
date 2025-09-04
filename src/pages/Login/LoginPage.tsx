import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/Button";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import {
  User,
  Lock,
  AlertCircle,
  Truck,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string>("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const slides = [
    {
      icon: Truck,
      title: "Sistema de Gestión Integral",
      description:
        "Optimiza las operaciones de tu flota con nuestra plataforma intuitiva y potente.",
      stats: { label: "Vehículos Activos", value: "45+" },
    },
    {
      icon: TrendingUp,
      title: "Aumenta tu Productividad",
      description:
        "Reduce tiempos muertos y maximiza la eficiencia de tus recursos.",
      stats: { label: "Mejora Promedio", value: "32%" },
    },
    {
      icon: Users,
      title: "Gestión de Equipos",
      description:
        "Coordina conductores, mecánicos y administrativos desde un solo lugar.",
      stats: { label: "Usuarios Activos", value: "120+" },
    },
    {
      icon: Clock,
      title: "Reportes en Tiempo Real",
      description:
        "Toma decisiones informadas con datos actualizados al instante.",
      stats: { label: "Actualizaciones", value: "24/7" },
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const success = await login(username, password);
    if (!success) {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Panel izquierdo - Formulario */}
      <div className="flex-1 flex items-center justify-center px-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <img
              src="https://medios.volquetesescalante.com/verso/logo_verso.svg"
              alt="Logo Verso"
              className="h-14 w-auto mb-8"
            />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bienvenido de vuelta
            </h1>
            <p className="text-gray-600">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent transition-all duration-200"
                  placeholder="Ingresa tu usuario"
                  defaultValue="admin"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent transition-all duration-200"
                  placeholder="Ingresa tu contraseña"
                  defaultValue="password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-dark border-gray-300 rounded focus:ring-primary-dark"
                />
                <span className="ml-2 text-sm text-gray-600">Recordarme</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary-dark hover:text-secondary transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-dark hover:bg-secondary"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2025 Volquetes Escalante. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Panel derecho - Visual dinámico */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-dark via-secondary to-light-accent">
        <div className="flex-1 flex flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md text-center">
            {/* Contenido dinámico */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-6 transition-all duration-500">
                {React.createElement(slides[currentSlide].icon, {
                  className: "w-10 h-10 text-white",
                })}
              </div>
            </div>

            <h2 className="text-4xl font-bold mb-4 transition-all duration-500">
              {slides[currentSlide].title}
            </h2>

            <p className="text-lg text-white/90 leading-relaxed mb-8 transition-all duration-500">
              {slides[currentSlide].description}
            </p>

            {/* Estadística destacada */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-8">
              <div className="text-3xl font-bold mb-1">
                {slides[currentSlide].stats.value}
              </div>
              <div className="text-sm text-white/80">
                {slides[currentSlide].stats.label}
              </div>
            </div>

            {/* Indicadores de slides */}
            <div className="flex justify-center gap-3">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "bg-white w-8"
                      : "bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>

            {/* Features destacados */}
            <div className="mt-12 grid grid-cols-2 gap-4 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-white/80 mt-0.5" />
                <div>
                  <div className="font-semibold">100% Cloud</div>
                  <div className="text-sm text-white/70">
                    Acceso desde cualquier lugar
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-white/80 mt-0.5" />
                <div>
                  <div className="font-semibold">Seguro</div>
                  <div className="text-sm text-white/70">Datos encriptados</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de recuperación de contraseña */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};
