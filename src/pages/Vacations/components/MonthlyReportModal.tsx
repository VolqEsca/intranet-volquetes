import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { vacationsAPI, MonthlyReportData, WeeklyRange } from '../../../api/vacations';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
}

export const MonthlyReportModal: React.FC<Props> = ({ isOpen, onClose, year, month }) => {
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadReport();
    }
  }, [isOpen, year, month]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const response = await vacationsAPI.getMonthlyReport(year, month);
      if (response.data.success) {
        setReportData(response.data.data);
      } else {
        toast.error('Error al cargar el reporte');
      }
    } catch (error) {
      toast.error('Error al generar el reporte');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (start: string, end: string): string => {
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T00:00:00');
    
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const monthName = monthNames[startDate.getMonth()];
    
    if (start === end) {
      return `${String(startDay).padStart(2, '0')} ${monthName}`;
    }
    
    return `${String(startDay).padStart(2, '0')}-${String(endDay).padStart(2, '0')} ${monthName}`;
  };

  const generateReportText = (): string => {
    if (!reportData) return '';

    const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
                        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    
    const lines: string[] = [];
    
    // Header limpio y profesional
    lines.push(`REPORTE DE INCIDENCIAS LABORALES - ${monthNames[month - 1]} ${year}`);
    lines.push('Volquetes Escalante S.L.');
    lines.push('');

    // Sección Vacaciones
    lines.push('--- VACACIONES DISFRUTADAS ---');
    lines.push('');
    
    if (Object.keys(reportData.vacations).length === 0) {
      lines.push('• No hay vacaciones registradas en este período.');
    } else {
      Object.entries(reportData.vacations).forEach(([employeeName, ranges]) => {
        lines.push(`• ${employeeName}`);
        ranges.forEach((range: WeeklyRange) => {
          const dateStr = formatDateRange(range.start_date, range.end_date);
          const daysStr = range.working_days === 1 ? '1 día' : `${range.working_days} días`;
          lines.push(`  - ${dateStr} (${daysStr})`);
        });
        lines.push(''); // Espacio entre empleados
      });
    }
    
    lines.push('');

    // Sección Permisos no retribuidos
    lines.push('--- PERMISOS NO RETRIBUIDOS (DESCUENTO NÓMINA) ---');
    lines.push('');
    
    if (Object.keys(reportData.unpaid_leaves).length === 0) {
      lines.push('• No hay permisos no retribuidos registrados en este período.');
    } else {
      Object.entries(reportData.unpaid_leaves).forEach(([employeeName, ranges]) => {
        lines.push(`• ${employeeName}`);
        ranges.forEach((range: WeeklyRange) => {
          const dateStr = formatDateRange(range.start_date, range.end_date);
          const daysStr = range.working_days === 1 ? '1 día' : `${range.working_days} días`;
          lines.push(`  - ${dateStr} (${daysStr})`);
        });
        lines.push('');
      });
    }

    lines.push('------------------------------------------------');
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    lines.push(`Generado: ${dateStr} | Sistema VERSO v12.5`);

    return lines.join('\n');
  };

  const handleCopy = async () => {
    const text = generateReportText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Reporte copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar');
    }
  };

  const handleSelectAll = () => {
    const textArea = document.getElementById('report-text-area') as HTMLTextAreaElement;
    if (textArea) {
      textArea.select();
      toast.success('Texto seleccionado - Usa Ctrl+C para copiar');
    }
  };

  if (!isOpen) return null;

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header corporativo */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#1162a6] text-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Reporte para Gestoría</h2>
              <p className="text-sm text-blue-100">
                {monthNames[month - 1]} {year} - Formato optimizado para email
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content - Estilo documento de oficina */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#1162a6] mx-auto mb-4" />
                <p className="text-gray-600">Generando reporte...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <textarea
                id="report-text-area"
                readOnly
                value={generateReportText()}
                className="w-full h-[500px] p-4 text-sm text-gray-800 whitespace-pre-wrap overflow-auto resize-none focus:outline-none focus:ring-2 focus:ring-[#1162a6] rounded border border-gray-200 leading-relaxed"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }}
              />
            </div>
          )}
        </div>

        {/* Footer con botones mejorados */}
        <div className="px-6 py-4 border-t bg-white rounded-b-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded border bg-gray-100 text-xs font-mono">A</span>
              <span>Selecciona el texto y copia con Ctrl+C</span>
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleSelectAll}
                disabled={loading}
              >
                Seleccionar Todo
              </Button>
              <Button
                variant="primary"
                onClick={handleCopy}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar Reporte
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};