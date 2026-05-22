import React, { useState } from "react";
import { X, Mail, ArrowLeft, AlertCircle } from "lucide-react";
import { apiClient } from "../../api";
import { apiErrorMessage } from "../../utils/error";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiClient.post("/forgot-password.php", { email });
      if (response.data.success) {
        setSuccess(true);
      }
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "Error al procesar la solicitud"));
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setEmail("");
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header coloreado */}
        <div className="bg-[#1162a6] px-6 py-5 flex items-start justify-between">
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/50 mb-1">
              VERSO · Acceso
            </p>
            <h2 className="text-lg font-bold text-white leading-tight">
              {success ? "Email enviado" : "Recuperar contraseña"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors mt-0.5"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-6">
          {!success ? (
            <>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña.
              </p>

              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="flex items-start gap-3 border-l-4 border-[#dc2626] bg-[#dc2626]/5 px-4 py-3 text-[#dc2626] text-sm mb-5">
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                    <span className="leading-snug">{error}</span>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#1162a6] focus:ring-1 focus:ring-[#1162a6] transition-colors"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-[#1162a6] hover:bg-[#5487c0] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      "Enviar instrucciones"
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#a2bade]/20 rounded-full mb-5">
                <Mail className="w-7 h-7 text-[#1162a6]" />
              </div>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed max-w-xs mx-auto">
                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
              </p>
              <button
                onClick={resetModal}
                className="w-full py-3 bg-[#1162a6] hover:bg-[#5487c0] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft size={15} />
                Volver al login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
