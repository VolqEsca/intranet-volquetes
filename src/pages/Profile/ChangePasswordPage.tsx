import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Lock, Save, AlertCircle, Eye, EyeOff, Check, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { apiClient } from "../../api";
import { useNavigate } from "react-router-dom";

// Función para evaluar la fortaleza de la contraseña
const evaluatePasswordStrength = (password: string) => {
  let strength = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  // Calcular puntuación
  if (password.length >= 6) strength += 1;
  if (password.length >= 8) strength += 1;
  if (checks.lowercase && checks.uppercase) strength += 1;
  if (checks.numbers) strength += 1;
  if (checks.special) strength += 1;

  // Determinar nivel
  let level: "weak" | "medium" | "strong" | "very-strong" = "weak";
  let color = "bg-red-500";
  let text = "Débil";

  if (strength >= 5) {
    level = "very-strong";
    color = "bg-green-600";
    text = "Muy fuerte";
  } else if (strength >= 4) {
    level = "strong";
    color = "bg-green-500";
    text = "Fuerte";
  } else if (strength >= 3) {
    level = "medium";
    color = "bg-yellow-500";
    text = "Media";
  } else if (strength >= 2) {
    level = "weak";
    color = "bg-orange-500";
    text = "Débil";
  } else {
    level = "weak";
    color = "bg-red-500";
    text = "Muy débil";
  }

  return { strength, level, color, text, checks };
};

export const ChangePasswordPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<ReturnType<
    typeof evaluatePasswordStrength
  > | null>(null);

  // Evaluar fortaleza cuando cambie la contraseña
  useEffect(() => {
    if (formData.newPassword) {
      setPasswordStrength(evaluatePasswordStrength(formData.newPassword));
    } else {
      setPasswordStrength(null);
    }
  }, [formData.newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validaciones
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      await apiClient.put("/users/password.php", {
        id: user?.id,
        password: formData.newPassword,
      });

      setSuccess(true);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate("/perfil");
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.error || "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cambiar Contraseña</h1>
        <p className="mt-2 text-gray-600">Actualiza tu contraseña de acceso</p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              Contraseña actualizada correctamente. Redirigiendo...
            </div>
          )}

          {/* Contraseña actual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock size={16} className="inline mr-2" />
              Contraseña actual
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                required
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock size={16} className="inline mr-2" />
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                required
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Medidor de seguridad */}
            {passwordStrength && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Seguridad:</span>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength.level === "very-strong"
                        ? "text-green-600"
                        : passwordStrength.level === "strong"
                        ? "text-green-500"
                        : passwordStrength.level === "medium"
                        ? "text-yellow-500"
                        : "text-red-500"
                    }`}
                  >
                    {passwordStrength.text}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{
                      width: `${(passwordStrength.strength / 5) * 100}%`,
                    }}
                  />
                </div>

                {/* Requisitos */}
                <div className="space-y-1 mt-2">
                  <div
                    className={`flex items-center gap-2 text-xs ${
                      passwordStrength.checks.length
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {passwordStrength.checks.length ? (
                      <Check size={14} />
                    ) : (
                      <X size={14} />
                    )}
                    <span>Al menos 8 caracteres</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-xs ${
                      passwordStrength.checks.lowercase &&
                      passwordStrength.checks.uppercase
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {passwordStrength.checks.lowercase &&
                    passwordStrength.checks.uppercase ? (
                      <Check size={14} />
                    ) : (
                      <X size={14} />
                    )}
                    <span>Mayúsculas y minúsculas</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-xs ${
                      passwordStrength.checks.numbers
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {passwordStrength.checks.numbers ? (
                      <Check size={14} />
                    ) : (
                      <X size={14} />
                    )}
                    <span>Al menos un número</span>
                  </div>
                  <div
                    className={`flex items-center gap-2 text-xs ${
                      passwordStrength.checks.special
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {passwordStrength.checks.special ? (
                      <Check size={14} />
                    ) : (
                      <X size={14} />
                    )}
                    <span>Al menos un carácter especial</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock size={16} className="inline mr-2" />
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
            {formData.newPassword &&
              formData.confirmPassword &&
              formData.newPassword !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <X size={14} />
                  Las contraseñas no coinciden
                </p>
              )}
            {formData.newPassword &&
              formData.confirmPassword &&
              formData.newPassword === formData.confirmPassword && (
                <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                  <Check size={14} />
                  Las contraseñas coinciden
                </p>
              )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/perfil")}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={
                loading || (passwordStrength && passwordStrength.strength < 2)
              }
            >
              <Save size={16} className="mr-2" />
              {loading ? "Cambiando..." : "Cambiar Contraseña"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
