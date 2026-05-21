import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { User, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { getGreeting } from "../../utils/greeting";

const formatDate = (date: Date): string =>
  date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatHHMM = (date: Date): string =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

const formatSS = (date: Date): string =>
  String(date.getSeconds()).padStart(2, "0");

export const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string>("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const result = await login(username, password);
    if (!result.success) {
      if (result.errorType === "network") {
        setError("Error de conexión. Comprueba tu red e inténtalo de nuevo.");
      } else if (result.errorType === "credentials") {
        setError("Usuario o contraseña incorrectos.");
      } else {
        setError("Error inesperado. Inténtalo de nuevo más tarde.");
      }
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen">
      {/* ── Panel izquierdo (blanco) ────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white px-12 py-10">

        {/* Bloque central: logo + título + formulario */}
        <div className="flex-1 flex flex-col justify-center items-center">
          <div className="w-full max-w-lg">
            {/* Logo VERSO */}
            <div className="mb-8">
              <img
                src="https://medios.volquetesescalante.com/verso/logo_verso.svg"
                alt="VERSO"
                className="h-10 w-auto"
              />
            </div>

            <div className="mb-10">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight tracking-tight whitespace-nowrap">
                Bienvenido de vuelta
              </h1>
              <p className="mt-3 text-sm text-gray-500">
                Accede a tu espacio de trabajo
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-start gap-3 border-l-4 border-[#dc2626] bg-[#dc2626]/5 px-4 py-3 text-[#dc2626]">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span className="text-sm leading-snug">{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="username"
                  className="block text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-widest mb-2"
                >
                  Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#1162a6] focus:ring-1 focus:ring-[#1162a6] transition-colors"
                    placeholder="Tu nombre de usuario"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-widest mb-2"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#1162a6] focus:ring-1 focus:ring-[#1162a6] transition-colors"
                    placeholder="Tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs font-medium text-[#1162a6] hover:text-[#5487c0] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#1162a6] hover:bg-[#5487c0] text-white text-sm font-semibold tracking-wide rounded-lg transition-[background-color,transform] duration-200 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex justify-center">
          <p className="text-xs text-gray-400">
            © 2025{currentYear > 2025 ? ` – ${currentYear}` : ""} Volquetes Escalante. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* ── Panel derecho (#1162a6) ──────────────────────────── */}
      <div className="hidden lg:flex lg:flex-1 bg-[#1162a6] relative overflow-hidden flex-col">
        {/* Decoración geométrica */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-8rem", right: "-8rem",
            width: "26rem", height: "26rem",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-3rem", right: "-3rem",
            width: "16rem", height: "16rem",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-10rem", left: "-6rem",
            width: "30rem", height: "30rem",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        />

        {/* Bloque único centrado verticalmente */}
        <div className="relative flex flex-col justify-center h-full px-14">
          <img
            src="/assets/logo_horizontal.svg"
            alt="Escalante Carrocerías y Volquetes"
            style={{
              height: '6rem',
              width: 'auto',
              filter: 'brightness(0) invert(1)',
              display: 'block',
              alignSelf: 'flex-start',
              marginBottom: '2rem'
            }}
          />

          <p className="text-xs uppercase tracking-widest text-white/80">
            {getGreeting(currentTime)}
          </p>

          <div className="w-12 h-px bg-white/30 my-4" />

          <div className="flex items-end gap-2">
            <span className="text-8xl font-bold text-white tabular-nums leading-none font-mono">
              {formatHHMM(currentTime)}
            </span>
            <span className="text-3xl text-white/80 tabular-nums leading-none pb-2 font-mono">
              {formatSS(currentTime)}
            </span>
          </div>

          <p className="text-base text-white/80 capitalize font-medium mt-4">
            {formatDate(currentTime)}
          </p>

        </div>

        <p className="absolute bottom-10 left-14 text-xs tracking-widest text-white/50">
          SISTEMA VERSO
        </p>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};
