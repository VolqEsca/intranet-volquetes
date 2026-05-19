import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Minus, AlertCircle, Calendar, History } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { vacationsAPI, VacationBalance, Employee } from '../../../api/vacations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee | null;
  currentBalance: VacationBalance | null;
  year: number;
}

export const AdjustBalanceModal: React.FC<Props> = ({
  isOpen, onClose, onSuccess, employee, currentBalance, year
}) => {
  const [annualDays, setAnnualDays] = useState(22);
  const [carriedOverDays, setCarriedOverDays] = useState(0);
  const [manualAdjustments, setManualAdjustments] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && currentBalance) {
      setAnnualDays(currentBalance.annual_days);
      setCarriedOverDays(currentBalance.carried_over_days);
      setManualAdjustments(currentBalance.manual_adjustments || 0);
      setAdjustmentReason('');
    } else {
      setAnnualDays(22);
      setCarriedOverDays(0);
      setManualAdjustments(0);
      setAdjustmentReason('');
    }
  }, [isOpen, currentBalance]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adjustmentReason.trim() && manualAdjustments !== 0) {
      alert('⚠️ Por favor indica el motivo del ajuste para trazabilidad');
      return;
    }

    setIsSubmitting(true);

    try {
      await vacationsAPI.updateBalance({
        employee_id: employee.id,
        year,
        annual_days: annualDays,
        carried_over_days: carriedOverDays,
        manual_adjustments: manualAdjustments,
        adjustment_reason: adjustmentReason || `Ajuste saldo - ${new Date().toLocaleDateString('es-ES')}`
      });
      
      alert(`✅ Saldo actualizado para ${employee.full_name}\nNuevo disponible: ${finalAvailable} días`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('❌ Error al actualizar el saldo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalGenerated = annualDays + carriedOverDays + manualAdjustments;
  const consumed = currentBalance?.consumed_days || 0;
  const finalAvailable = totalGenerated - consumed;

  // Color dinámico solo para el número, no para los controles
  const adjustmentNumberColor = manualAdjustments > 0 ? 'text-green-600' : manualAdjustments < 0 ? 'text-red-600' : 'text-gray-700';
  const adjustmentBg = manualAdjustments > 0 ? 'bg-green-50' : manualAdjustments < 0 ? 'bg-red-50' : 'bg-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        
        {/* Header Corporativo VERSO */}
        <div className="bg-[#1162a6] px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-white font-bold text-lg">Ajustar Saldo de Vacaciones</h2>
            <p className="text-blue-100 text-xs mt-1">Gestión de arrastre y vacaciones pagadas • {year}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Info empleado con avatar corporativo */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-[#1162a6] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {employee.full_name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{employee.full_name}</p>
              <p className="text-xs text-gray-500">{employee.location}</p>
            </div>
          </div>

          {/* Grid con colores corporativos */}
          <div className="grid grid-cols-2 gap-4">
            {/* Días Convenio - Azul corporativo */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-[#1162a6] uppercase mb-2">
                <Calendar className="w-4 h-4" />
                Convenio {year}
              </label>
              <input
                type="number" min="0" max="30" value={annualDays}
                onChange={(e) => setAnnualDays(Number(e.target.value))}
                className="w-full px-4 py-2.5 border-2 border-[#1162a6] rounded-lg focus:ring-2 focus:ring-[#1162a6] focus:border-[#1162a6] font-medium text-center"
              />
              <p className="text-[10px] text-gray-500 mt-1 text-center">Días generados este año</p>
            </div>

            {/* Arrastre - Azul secundario corporativo */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-[#5487c0] uppercase mb-2">
                <History className="w-4 h-4" />
                Arrastre {year - 1}
              </label>
              <input
                type="number" min="0" max="30" value={carriedOverDays}
                onChange={(e) => setCarriedOverDays(Number(e.target.value))}
                className="w-full px-4 py-2.5 border-2 border-[#5487c0] rounded-lg bg-blue-50/30 focus:ring-2 focus:ring-[#5487c0] focus:border-[#5487c0] font-medium text-center"
              />
              <p className="text-[10px] text-[#5487c0] mt-1 text-center font-medium">Pendientes año anterior</p>
            </div>
          </div>

          {/* Ajustes manuales - Diseño elegante */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              Ajustes Manuales (Vacaciones Pagadas / Correcciones)
            </label>
            
            {/* Control unificado elegante */}
            <div className="flex items-center gap-0 bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
              <button type="button" onClick={() => setManualAdjustments(prev => prev - 1)}
                className="w-12 h-12 hover:bg-gray-200 text-gray-600 hover:text-red-600 transition-colors flex items-center justify-center">
                <Minus className="w-5 h-5" />
              </button>
              
              <div className={`flex-1 h-12 flex items-center justify-center border-x border-gray-200 transition-colors ${adjustmentBg}`}>
                <span className={`text-xl font-bold ${adjustmentNumberColor}`}>
                  {manualAdjustments > 0 ? '+' : ''}{manualAdjustments}
                </span>
              </div>
              
              <button type="button" onClick={() => setManualAdjustments(prev => prev + 1)}
                className="w-12 h-12 hover:bg-gray-200 text-gray-600 hover:text-green-600 transition-colors flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Explicación visual mejorada */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span><strong>Positivo (+):</strong> Días arrastrados</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span><strong>Negativo (-):</strong> Días pagados</span>
              </div>
            </div>
          </div>

          {/* Motivo con estado visual */}
          <div className={`transition-all duration-300 ${manualAdjustments !== 0 ? 'opacity-100' : 'opacity-70'}`}>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase mb-2">
              <AlertCircle className="w-4 h-4 text-[#1162a6]" />
              Motivo del Ajuste {manualAdjustments !== 0 && <span className="text-red-600">(Obligatorio)</span>}
            </label>
            <textarea 
              value={adjustmentReason} 
              onChange={(e) => setAdjustmentReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1162a6] focus:border-[#1162a6] text-sm resize-none"
              rows={2} 
              required={manualAdjustments !== 0}
              placeholder="Ej: Arrastre 5 días 2024 | Pago 3 días nómina dic-2024"
            />
          </div>

          {/* Resumen con jerarquía visual clara */}
          <div className="bg-gradient-to-r from-blue-50 to-white border-2 border-[#1162a6] rounded-lg p-4">
            <h3 className="text-sm font-bold text-[#1162a6] uppercase mb-3">Resumen del Ajuste</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">Total Generado:</span>
                <span className="font-bold text-[#1162a6]">{totalGenerated} días</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">Ya Consumido:</span>
                <span className="font-bold text-red-600">-{consumed} días</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-[#1162a6]">
                <span className="font-bold text-base text-gray-900">Nuevo Disponible:</span>
                <span className="font-bold text-2xl text-[#1162a6]">{finalAvailable} días</span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              Guardar Ajuste
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};