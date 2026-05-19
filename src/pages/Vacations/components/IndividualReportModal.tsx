import React, { useState, useEffect } from 'react';
import { FileText, Copy, User, Calendar, Calculator, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Employee, VacationBalance, Absence, vacationsAPI } from '../../../api/vacations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  balance: VacationBalance;
  year: number;
}

export const IndividualReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  employee,
  balance,
  year
}) => {
  const [yearlyAbsences, setYearlyAbsences] = useState<Absence[]>([]);
  const [isLoadingAbsences, setIsLoadingAbsences] = useState(false);

  // Cargar ausencias del año completo al abrir modal
  useEffect(() => {
    const loadYearlyAbsences = async () => {
      if (!isOpen) return;

      setIsLoadingAbsences(true);

      try {
        const response = await vacationsAPI.getYearlyAbsences(year);
        const absencesData = response.data.absences || [];
        
        // Filtrar solo ausencias de este empleado
        const employeeAbsences = absencesData.filter(abs => abs.employee_id === employee.id);
        
        console.log(`🔍 DEBUG Individual - Ausencias de ${employee.full_name}:`, employeeAbsences.length);
        setYearlyAbsences(employeeAbsences);
      } catch (error: any) {
        console.error('❌ Error cargando ausencias individuales:', error);
        setYearlyAbsences([]);
        toast.error('Error al cargar detalle de vacaciones', {
          description: 'Se mostrarán solo los saldos sin detalle de fechas',
          duration: 4000
        });
      } finally {
        setIsLoadingAbsences(false);
      }
    };

    loadYearlyAbsences();
  }, [isOpen, year, employee.id]);

  // Calcular datos del balance
  const annual = balance.annual_days || 0;
  const carried = balance.carried_over_days || 0;
  const adjustments = balance.manual_adjustments || 0;
  const totalGenerated = annual + carried + adjustments;
  const consumed = balance.consumed_days || 0;
  const available = balance.available_days || 0;

  // Filtrar solo vacaciones aprobadas del año
  const employeeVacations = yearlyAbsences.filter(abs => {
    if (abs.absence_type !== 'vacation') return false;
    if (abs.status && abs.status !== 'approved') return false;

    const startYear = new Date(abs.start_date).getFullYear();
    const endYear = new Date(abs.end_date).getFullYear();
    
    return startYear === year || endYear === year;
  });

  // Ordenar por fecha
  employeeVacations.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  // Total días de vacaciones disfrutadas
  const totalVacationDays = employeeVacations.reduce((sum, abs) => sum + abs.working_days_count, 0);

  // ========================================
  // EXPORTACIÓN TEXTO PLANO (Para Email/Chat)
  // ========================================
  const copyAsText = () => {
    const lines = [
      '═══════════════════════════════════════════════════════════',
      '  REPORTE INDIVIDUAL DE VACACIONES',
      `  Año ${year} - Volquetes Escalante S.L.`,
      '═══════════════════════════════════════════════════════════',
      '',
      '📋 DATOS DEL EMPLEADO',
      '───────────────────────────────────────────────────────────',
      `  Nombre:      ${employee.full_name}`,
      `  Nave:        ${employee.location}`,
      `  Categoría:   ${employee.job_category}`,
      '',
      '💼 RESUMEN DE SALDOS',
      '───────────────────────────────────────────────────────────',
      `  Días Convenio ${year}:        ${annual} días`,
    ];

    if (carried !== 0) {
      lines.push(`  Arrastre ${year - 1}:           ${carried > 0 ? '+' : ''}${carried} días`);
    }

    if (adjustments !== 0) {
      lines.push(`  Ajustes Manuales:          ${adjustments > 0 ? '+' : ''}${adjustments} días`);
    }

    lines.push(
      '  ─────────────────────────────────────',
      `  Total Generado:            ${totalGenerated} días`,
      `  Días Consumidos:           ${consumed} días`,
      '  ═════════════════════════════════════',
      `  DISPONIBLE:                ${available} días`,
      ''
    );

    if (employeeVacations.length > 0) {
      lines.push(
        '📅 VACACIONES DISFRUTADAS',
        '───────────────────────────────────────────────────────────'
      );

      employeeVacations.forEach(vacation => {
        const startDate = new Date(vacation.start_date);
        const endDate = new Date(vacation.end_date);
        
        const formattedStart = startDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
        
        const formattedEnd = endDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });

        const isSameDay = vacation.start_date === vacation.end_date;
        const dateText = isSameDay 
          ? `  📅 ${formattedStart}`
          : `  📅 Del ${formattedStart}\n     al ${formattedEnd}`;

        lines.push(dateText);
        lines.push(`     → ${vacation.working_days_count} días laborales`);
        
        if (vacation.notes) {
          lines.push(`     Nota: ${vacation.notes}`);
        }
        
        lines.push('');
      });
    } else {
      lines.push(
        '📅 VACACIONES DISFRUTADAS',
        '───────────────────────────────────────────────────────────',
        `  Sin vacaciones registradas en ${year}`,
        ''
      );
    }

    lines.push(
      '═══════════════════════════════════════════════════════════',
      `  Generado: ${new Date().toLocaleDateString('es-ES')} | VERSO v12.8`,
      '═══════════════════════════════════════════════════════════'
    );

    const textContent = lines.join('\n');

    navigator.clipboard.writeText(textContent).then(() => {
      toast.success('Reporte copiado en formato texto', {
        description: `Listo para pegar en email o WhatsApp. ${employeeVacations.length} periodos incluidos`,
        duration: 5000,
      });
    }).catch(() => {
      toast.error('Error al copiar', {
        description: 'No se pudo acceder al portapapeles',
      });
    });
  };

  // ========================================
  // EXPORTACIÓN WORD (HTML Rico - Basado en tu BalancesReportModal)
  // ========================================
  const copyToWord = async () => {
    const availableColorClass = available < 0 
      ? 'balance-negative' 
      : available > 0 
      ? 'balance-positive' 
      : 'balance-neutral';

    let htmlContent = `
<html>
<head>
<meta charset="UTF-8">
<style>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.4;
    color: #374151;
    max-width: 700px;
    margin: 0 auto;
    padding: 25px;
    background-color: #ffffff;
  }
  
  /* ========================================
     HEADER - Estilo corporativo VERSO
     ======================================== */
  .header {
    text-align: center;
    border-bottom: 3px solid #1162a6;
    padding-bottom: 20px;
    margin-bottom: 30px;
  }
  .header h1 {
    color: #1162a6;
    font-size: 20pt;
    margin: 0 0 8px 0;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .header h2 {
    color: #4b5563;
    font-size: 14pt;
    margin: 0 0 8px 0;
    font-weight: 500;
  }
  .header .meta {
    color: #9ca3af;
    font-size: 9pt;
    font-weight: normal;
  }
  
  /* ========================================
     SECCIÓN EMPLEADO - Card destacada
     ======================================== */
  .employee-section {
    background: #f9fafb;
    border: 2px solid #1162a6;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 25px;
  }
  .employee-name {
    color: #1162a6;
    font-size: 16pt;
    font-weight: 700;
    margin: 0 0 12px 0;
  }
  .employee-details {
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 8px;
    font-size: 10pt;
  }
  .employee-details .label {
    color: #6b7280;
    font-weight: 600;
  }
  .employee-details .value {
    color: #1f2937;
    font-weight: 500;
  }
  
  /* ========================================
     TABLA DE SALDOS - Basada en tu diseño
     ======================================== */
  .balance-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }
  .balance-table th {
    background-color: #f3f4f6;
    color: #6b7280;
    padding: 10px 12px;
    text-align: left;
    font-size: 9pt;
    font-weight: 600;
    border-bottom: 2px solid #d1d5db;
  }
  .balance-table td {
    padding: 10px 12px;
    border-bottom: 1px solid #f3f4f6;
    font-size: 10pt;
    color: #374151;
  }
  .balance-table tr:last-child td {
    border-bottom: none;
  }
  
  .balance-highlight {
    background-color: #eff6ff;
    font-weight: 700;
  }
  
  .balance-positive {
    color: #059669;
    font-weight: 700;
  }
  .balance-negative {
    color: #dc2626;
    font-weight: 700;
  }
  .balance-neutral {
    color: #6b7280;
    font-weight: 600;
  }
  
  /* ========================================
     DETALLE VACACIONES - Lista limpia
     ======================================== */
  .vacation-detail {
    margin: 20px 0;
  }
  .vacation-detail h4 {
    color: #374151;
    font-size: 11pt;
    margin: 0 0 15px 0;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 6px;
  }
  
  .vacation-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .vacation-item {
    padding: 12px 15px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
    margin-bottom: 8px;
    border-radius: 6px;
    border-left: 4px solid #1162a6;
  }
  .vacation-item:last-child {
    margin-bottom: 0;
  }
  
  .vacation-dates {
    color: #1162a6;
    font-size: 10pt;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .vacation-days {
    color: #059669;
    font-size: 9pt;
    font-weight: 600;
  }
  
  .vacation-notes {
    color: #6b7280;
    font-size: 8.5pt;
    margin-top: 6px;
    font-style: italic;
    padding-left: 8px;
  }
  
  .no-vacations {
    color: #9ca3af;
    font-style: italic;
    font-size: 9.5pt;
    text-align: center;
    padding: 20px;
    background: #f9fafb;
    border-radius: 6px;
    border: 1px dashed #d1d5db;
  }
  
  /* ========================================
     FOOTER - Discreto
     ======================================== */
  .footer {
    margin-top: 35px;
    padding-top: 15px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    color: #d1d5db;
    font-size: 8pt;
  }
  .footer strong {
    font-weight: 600;
    color: #9ca3af;
  }
</style>
</head>
<body>
  <div class="header">
    <h1>VOLQUETES ESCALANTE S.L.</h1>
    <h2>Reporte Individual de Vacaciones - ${year}</h2>
    <div class="meta">
      Fecha de emisión: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
    </div>
  </div>

  <div class="employee-section">
    <div class="employee-name">${employee.full_name}</div>
    <div class="employee-details">
      <div class="label">Nave:</div>
      <div class="value">${employee.location}</div>
      <div class="label">Categoría:</div>
      <div class="value">${employee.job_category}</div>
    </div>
  </div>

  <table class="balance-table">
    <thead>
      <tr>
        <th>Concepto</th>
        <th style="text-align: right;">Días</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Días Convenio ${year}</td>
        <td style="text-align: right;">${annual}</td>
      </tr>
      ${carried !== 0 ? `
      <tr>
        <td>Arrastre ${year - 1}</td>
        <td style="text-align: right;">${carried > 0 ? '+' : ''}${carried}</td>
      </tr>
      ` : ''}
      ${adjustments !== 0 ? `
      <tr>
        <td>Ajustes Manuales</td>
        <td style="text-align: right;">${adjustments > 0 ? '+' : ''}${adjustments}</td>
      </tr>
      ` : ''}
      <tr class="balance-highlight">
        <td><strong>Total Generado</strong></td>
        <td style="text-align: right;"><strong>${totalGenerated}</strong></td>
      </tr>
      <tr>
        <td>Días Consumidos</td>
        <td style="text-align: right;">${consumed}</td>
      </tr>
      <tr class="balance-highlight">
        <td><strong>DISPONIBLE</strong></td>
        <td style="text-align: right;" class="${availableColorClass}"><strong>${available} días</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="vacation-detail">
    <h4>Detalle de Vacaciones Disfrutadas (${totalVacationDays} días)</h4>
`;

    if (employeeVacations.length === 0) {
      htmlContent += `<p class="no-vacations">Sin vacaciones registradas en ${year}</p>`;
    } else {
      htmlContent += `<ul class="vacation-list">`;
      
      employeeVacations.forEach(vacation => {
        const startDate = new Date(vacation.start_date);
        const endDate = new Date(vacation.end_date);
        
        const formattedStart = startDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
        
        const formattedEnd = endDate.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });

        const isSameDay = vacation.start_date === vacation.end_date;
        const dateText = isSameDay 
          ? formattedStart
          : `Del ${formattedStart} al ${formattedEnd}`;

        htmlContent += `
      <li class="vacation-item">
        <div class="vacation-dates">📅 ${dateText}</div>
        <div class="vacation-days">→ ${vacation.working_days_count} días laborales</div>
`;

        if (vacation.notes) {
          htmlContent += `        <div class="vacation-notes">Nota: ${vacation.notes}</div>\n`;
        }

        htmlContent += `      </li>\n`;
      });

      htmlContent += `    </ul>`;
    }

    htmlContent += `
  </div>

  <div class="footer">
    <p><strong>VERSO v12.8</strong> - Sistema de Gestión de Recursos Humanos</p>
    <p>Convenio Metal de Valladolid ${year} • Volquetes Escalante S.L.</p>
  </div>
</body>
</html>
`;

    try {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const clipboardItem = new ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([clipboardItem]);
      
      toast.success('Reporte Word copiado correctamente', {
        description: `Reporte de ${employee.full_name} listo. Pega en Word con Ctrl+V`,
        duration: 5000,
      });
    } catch (err) {
      // Fallback a texto plano
      const textBlob = new Blob([htmlContent], { type: 'text/plain' });
      const textItem = new ClipboardItem({ 'text/plain': textBlob });
      await navigator.clipboard.write([textItem]);
      
      toast.success('Reporte copiado como HTML', {
        description: 'Pega en Word y el formato se aplicará automáticamente',
        duration: 5000,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reporte Individual de Vacaciones"
      size="max-w-2xl"
    >
      <div className="p-6 space-y-5">
        
        {/* Loading State */}
        {isLoadingAbsences && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 text-sm text-blue-800">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Cargando detalle completo de vacaciones de {year}...</span>
          </div>
        )}

        {/* Datos del Empleado */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-lg border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-[#1162a6] flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
              {employee.full_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{employee.full_name}</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Nave:</span>
                  <span className="font-semibold text-gray-900">{employee.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Categoría:</span>
                  <span className="font-semibold text-gray-900">{employee.job_category}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de Saldos */}
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#1162a6]" />
            Resumen de Saldos {year}
          </h4>
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3 text-gray-600">Días Convenio {year}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{annual} días</td>
                </tr>
                {carried !== 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-600">Arrastre {year - 1}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${carried > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {carried > 0 ? '+' : ''}{carried} días
                    </td>
                  </tr>
                )}
                {adjustments !== 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-600">Ajustes Manuales</td>
                    <td className={`px-4 py-3 text-right font-semibold ${adjustments > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {adjustments > 0 ? '+' : ''}{adjustments} días
                    </td>
                  </tr>
                )}
                <tr className="bg-blue-50 border-b border-blue-200">
                  <td className="px-4 py-3 font-bold text-gray-900">Total Generado</td>
                  <td className="px-4 py-3 text-right font-bold text-[#1162a6] text-base">{totalGenerated} días</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-3 text-gray-600">Días Consumidos</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{consumed} días</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900 text-base">DISPONIBLE</td>
                  <td className={`px-4 py-3 text-right text-lg font-bold ${
                    available < 0 ? 'text-red-600' : available > 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {available} días
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Detalle de Vacaciones */}
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1162a6]" />
            Vacaciones Disfrutadas en {year} ({totalVacationDays} días)
          </h4>
          
          {employeeVacations.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">Sin vacaciones registradas en {year}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {employeeVacations.map((vacation, idx) => {
                const startDate = new Date(vacation.start_date);
                const endDate = new Date(vacation.end_date);
                
                const formattedStart = startDate.toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                });
                
                const formattedEnd = endDate.toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                });

                const isSameDay = vacation.start_date === vacation.end_date;

                return (
                  <div key={vacation.id || idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[#1162a6] mb-1">
                          {isSameDay ? (
                            <>📅 {formattedStart}</>
                          ) : (
                            <>📅 Del {formattedStart} al {formattedEnd}</>
                          )}
                        </div>
                        {vacation.notes && (
                          <div className="text-xs text-gray-600 italic mt-2 pl-3 border-l-2 border-blue-300">
                            {vacation.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-bold text-green-600 whitespace-nowrap bg-green-50 px-2 py-1 rounded">
                        {vacation.working_days_count} días
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Botones de Exportación */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cerrar
          </Button>
          
          <Button
            onClick={copyAsText}
            variant="outline"
            disabled={isLoadingAbsences}
          >
            <FileText className="w-4 h-4 mr-2" />
            Copiar Texto
          </Button>
          
          <Button
            onClick={copyToWord}
            disabled={isLoadingAbsences}
            className="bg-[#1162a6] text-white hover:bg-[#0d4d85] disabled:opacity-50"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar Word
          </Button>
        </div>
      </div>
    </Modal>
  );
};