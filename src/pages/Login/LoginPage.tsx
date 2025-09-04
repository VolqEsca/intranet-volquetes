import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/Button";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import {
  User,
  Lock,
  AlertCircle,
  Calendar,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";

export const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string>("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar fecha y hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  // Formateo elegante de fecha en español
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formateo de hora con segundos
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // ✅ SALUDO PERSONALIZADO PARA VOLQUETES ESCALANTE
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 15) return "Buenos días";      // 00:00 - 14:59
    if (hour < 20) return "Buenas tardes";    // 15:00 - 19:59
    return "Buenas noches";                   // 20:00 - 23:59
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

      {/* Panel derecho - Solo información real y útil */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-dark via-secondary to-light-accent">
        <div className="flex-1 flex flex-col justify-center items-center p-12 text-white">
          <div className="max-w-lg text-center">
            
            {/* Saludo dinámico personalizado */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-4">
                {getGreeting()}
              </h2>
              <p className="text-xl text-white/90">
                Sistema VERSO - Volquetes Escalante
              </p>
            </div>

            {/* Solo fecha y hora - Información pura */}
            <div className="space-y-6">
              
              {/* Fecha */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-center mb-3">
                  <Calendar className="w-8 h-8 text-white/80 mr-4" />
                  <div className="text-left">
                    <div className="text-sm text-white/70 uppercase tracking-wide font-medium">
                      Fecha
                    </div>
                    <div className="text-2xl font-semibold capitalize">
                      {formatDate(currentTime)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hora en tiempo real */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-center mb-3">
                  <Clock className="w-8 h-8 text-white/80 mr-4" />
                  <div className="text-left">
                    <div className="text-sm text-white/70 uppercase tracking-wide font-medium">
                      Hora actual
                    </div>
                    <div className="text-3xl font-bold font-mono tabular-nums">
                      {formatTime(currentTime)}
                    </div>
                  </div>
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
