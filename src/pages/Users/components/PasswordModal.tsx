import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Check, AlertCircle, Save } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Sheet } from "../../../components/ui/Sheet";
import { apiErrorMessage } from '../../../utils/error';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (password: string) => Promise<void>;
  username: string;
}

export const PasswordModal = ({
  isOpen,
  onClose,
  onSave,
  username,
}: PasswordModalProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setConfirmPassword("");
      setError("");
      setPasswordStrength(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (password) {
      calculatePasswordStrength(password);
    } else {
      setPasswordStrength(0);
    }
  }, [password]);

  const calculatePasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.length >= 12) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return "Débil";
    if (passwordStrength <= 3) return "Media";
    return "Fuerte";
  };

  const passwordRequirements = [
    { met: password.length >= 8, text: "Al menos 8 caracteres" },
    { met: /[A-Z]/.test(password), text: "Una letra mayúscula" },
    { met: /[a-z]/.test(password), text: "Una letra minúscula" },
    { met: /\d/.test(password), text: "Un número" },
    { met: /[^a-zA-Z0-9]/.test(password), text: "Un carácter especial" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      await onSave(password);
      onClose();
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "Error al cambiar la contraseña"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Cambiar Contraseña"
      description={`Usuario: ${username}`}
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="subtle"
            onClick={onClose}
            disabled={loading}
            fullWidth
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="password-form"
            variant="primary"
            disabled={loading || password !== confirmPassword}
            fullWidth
          >
            <Save size={18} className="mr-2" />
            {loading ? "Cambiando..." : "Cambiar Contraseña"}
          </Button>
        </div>
      }
    >
      <form id="password-form" onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 p-4 bg-[#dc2626]/5 border border-[#dc2626]/30 rounded-lg text-[#dc2626]">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {password && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Fuerza de la contraseña</span>
                <span className="text-xs font-medium">{getPasswordStrengthText()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                />
              </div>
              <div className="mt-3 space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {req.met ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-300" />
                    )}
                    <span className={req.met ? "text-green-700" : "text-gray-500"}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1162a6] focus:border-transparent"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {confirmPassword && password !== confirmPassword && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Las contraseñas no coinciden
            </p>
          )}
        </div>
      </form>
    </Sheet>
  );
};
