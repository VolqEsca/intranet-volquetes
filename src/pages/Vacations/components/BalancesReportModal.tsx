import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Copy, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Employee, VacationBalance, Absence, vacationsAPI } from '../../../api/vacations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  employees: Employee[];
  balances: Record<number, VacationBalance>;
  absences: Absence[];
}

type LocationFilter = 'all' | 'Nave 01' | 'Nave 02';

export const BalancesReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  year,
  employees,
  balances,
  absences: _absencesFromProps
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'excel' | 'word'>('excel');
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
  
  const [yearlyAbsences, setYearlyAbsences] = useState<Absence[]>([]);
  const [isLoadingAbsences, setIsLoadingAbsences] = useState(false);

  useEffect(() => {
    const loadYearlyAbsences = async () => {
      if (!isOpen) return;

      setIsLoadingAbsences(true);

      try {
        const response = await vacationsAPI.getYearlyAbsences(year);
        const absencesData = response.data.absences || [];
        
        console.log('🔍 DEBUG Modal - Ausencias anuales cargadas:', absencesData.length);
        setYearlyAbsences(absencesData);
      } catch (error: any) {
        console.error('❌ Error cargando ausencias anuales:', error);
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
  }, [isOpen, year]);

  const filteredEmployees = employees.filter(emp => {
    if (locationFilter === 'all') return true;
    return emp.location === locationFilter;
  });

  const stats = {
    totalEmployees: filteredEmployees.length,
    employeesWithDebt: filteredEmployees.filter(emp => {
      const balance = balances[emp.id];
      return balance && balance.available_days < 0;
    }).length,
    totalDebtDays: filteredEmployees.reduce((sum, emp) => {
      const balance = balances[emp.id];
      if (balance && balance.available_days < 0) {
        return sum + Math.abs(balance.available_days);
      }
      return sum;
    }, 0),
    employeesLowBalance: filteredEmployees.filter(emp => {
      const balance = balances[emp.id];
      return balance && balance.available_days > 0 && balance.available_days <= 5;
    }).length
  };

  const copyToExcel = () => {
    const rows = filteredEmployees.map(emp => {
      const balance = balances[emp.id];
      if (!balance) return null;

      const annual = balance.annual_days || 0;
      const carried = balance.carried_over_days || 0;
      const adjustments = balance.manual_adjustments || 0;
      const consumed = balance.consumed_days || 0;
      const available = balance.available_days || 0;

      return [
        emp.full_name,
        emp.location,
        annual.toString(),
        carried !== 0 ? (carried > 0 ? `+${carried}` : carried.toString()) : '—',
        adjustments !== 0 ? (adjustments > 0 ? `+${adjustments}` : adjustments.toString()) : '—',
        consumed.toString(),
        available.toString()
      ];
    }).filter(Boolean);

    const tsvContent = [
      ['Empleado', 'Nave', 'Base', 'Arrastre', 'Ajustes', 'Consumido', 'Disponible'].join('\t'),
      ...rows.map(row => row!.join('\t'))
    ].join('\n');

    navigator.clipboard.writeText(tsvContent).then(() => {
      toast.success('Datos copiados en formato Excel', {
        description: `${rows.length} empleados listos para pegar en Excel`,
        duration: 4000,
      });
    }).catch(() => {
      toast.error('Error al copiar', {
        description: 'No se pudo acceder al portapapeles',
      });
    });
  };

  const copyToWord = async () => {
    const filterText = locationFilter === 'all' 
      ? 'Todas las Naves' 
      : locationFilter;

    let htmlContent = `
<html>
<head>
<meta charset="UTF-8">
<style>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.4;
    color: #374151;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: #ffffff;
  }
  
  /* ========================================
     HEADER - Limpio y Profesional
     ======================================== */
  .header {
    text-align: center;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 20px;
    margin-bottom: 35px;
  }
  .header h1 {
    color: #1162a6;
    font-size: 18pt;
    margin: 0 0 8px 0;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .header h2 {
    color: #4b5563;
    font-size: 13pt;
    margin: 0 0 8px 0;
    font-weight: 500; /* ✅ OPTIMIZADO: De bold a medium */
  }
  .header .meta {
    color: #9ca3af;
    font-size: 9pt;
    font-weight: normal;
  }
  
  /* ========================================
     SECCIÓN EMPLEADO - Diseño Card Minimalista
     ======================================== */
  .employee-section {
    margin-bottom: 30px;
    page-break-inside: avoid;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  
  /* ✅ NIVEL 1: Solo nombre empleado (ÚNICO elemento crítico) */
  .employee-name {
    color: #1162a6;
    background: #ffffff;
    padding: 14px 16px;
    font-size: 13pt;
    font-weight: 700; /* ✅ MANTENER: Es el único elemento Nivel 1 */
    border-bottom: 2px solid #1162a6;
    letter-spacing: 0.3px;
  }
  
  /* ✅ CATEGORÍA ELIMINADA COMPLETAMENTE */
  
  /* ========================================
     TABLA - Header Limpio, Sin Fondos Pesados
     ======================================== */
  .balance-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
  }
  
  /* ✅ HEADER OPTIMIZADO: Fondo neutro, sin gritos */
  .balance-table th {
    background-color: #f9fafb; /* ✅ Gris muy suave vs azul corporativo */
    color: #6b7280; /* ✅ Gris medio vs blanco */
    padding: 8px 8px;
    text-align: center;
    font-size: 8.5pt;
    font-weight: 600; /* ✅ Semibold vs Bold */
    text-transform: capitalize; /* ✅ Capitalización normal vs MAYÚSCULAS */
    letter-spacing: 0.2px; /* ✅ Espaciado sutil vs agresivo */
    border-bottom: 1px solid #d1d5db;
  }
  
  .balance-table td {
    padding: 8px 8px;
    text-align: center;
    border-bottom: 1px solid #f3f4f6; /* ✅ Líneas muy sutiles */
    font-size: 9.5pt;
    font-weight: normal; /* ✅ OPTIMIZADO: Datos en peso normal */
    color: #374151;
  }
  
  /* ✅ NEGRITA ESTRATÉGICA: Solo en valores críticos */
  .balance-table td:nth-child(4) { /* Total Generado */
    font-weight: 600;
    color: #1f2937;
  }
  .balance-table td:last-child { /* Saldo Actual */
    font-weight: 700;
    font-size: 10pt;
  }
  
  .balance-positive {
    color: #059669;
    font-weight: 600;
  }
  .balance-negative {
    color: #dc2626;
    font-weight: bold; /* ✅ MANTENER: Saldos negativos deben alertar */
  }
  .balance-neutral {
    color: #6b7280;
    font-weight: 500;
  }
  
  /* ========================================
     DETALLE VACACIONES - Lista Limpia
     ======================================== */
  .vacation-detail {
    margin: 0;
    padding: 16px;
    background: #f9fafb;
  }
  .vacation-detail h4 {
    color: #6b7280; /* ✅ Gris discreto vs azul fuerte */
    font-size: 8.5pt;
    margin: 0 0 10px 0;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  
  .vacation-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .vacation-item {
    padding: 6px 0;
    border-bottom: 1px dotted #e5e7eb; /* ✅ Línea punteada sutil */
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .vacation-item:last-child {
    border-bottom: none;
  }
  
  /* ✅ NIVEL 2: Fechas importantes pero no críticas */
  .vacation-dates {
    color: #374151;
    font-size: 9.5pt;
    font-weight: 500; /* ✅ OPTIMIZADO: De bold a medium */
    flex: 1;
  }
  
  /* ✅ NIVEL 3: Información complementaria */
  .vacation-days {
    color: #059669;
    font-size: 9pt;
    font-weight: normal; /* ✅ OPTIMIZADO: De 600 a normal */
    text-align: right;
    min-width: 70px;
  }
  
  .vacation-notes {
    color: #9ca3af;
    font-size: 8pt;
    margin-top: 3px;
    font-style: italic;
    font-weight: normal;
    display: block;
    padding-left: 8px;
  }
  
  .no-vacations {
    color: #d1d5db;
    font-style: italic;
    font-size: 9pt;
    font-weight: normal;
    text-align: center;
    padding: 8px 0;
  }
  
  /* ========================================
     FOOTER - Discreto
     ======================================== */
  .footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    color: #d1d5db;
    font-size: 8pt;
    font-weight: normal;
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
    <h2>Informe Detallado de Vacaciones - Año ${year}</h2>
    <div class="meta">
      Fecha de emisión: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} | 
      Filtro: ${filterText} | 
      Empleados incluidos: ${filteredEmployees.length}
    </div>
  </div>
`;

    filteredEmployees.forEach(employee => {
      const balance = balances[employee.id];
      if (!balance) return;

      const annual = balance.annual_days || 0;
      const carried = balance.carried_over_days || 0;
      const adjustments = balance.manual_adjustments || 0;
      const totalGenerated = annual + carried + adjustments;
      const consumed = balance.consumed_days || 0;
      const available = balance.available_days || 0;

      const employeeVacations = yearlyAbsences.filter(abs => {
        if (abs.employee_id !== employee.id) return false;
        if (abs.absence_type !== 'vacation') return false;
        if (abs.status && abs.status !== 'approved') return false;

        const startYear = new Date(abs.start_date).getFullYear();
        const endYear = new Date(abs.end_date).getFullYear();
        
        return startYear === year || endYear === year;
      });

      employeeVacations.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

      const availableClass = available < 0 
        ? 'balance-negative' 
        : available > 0 
        ? 'balance-positive' 
        : 'balance-neutral';

      htmlContent += `
  <div class="employee-section">
    <div class="employee-name">${employee.full_name}</div>
    <!-- ✅ CATEGORÍA ELIMINADA - Menos ruido visual -->
    
    <table class="balance-table">
      <thead>
        <tr>
          <th>Días Base</th>
          <th>Arrastre</th>
          <th>Ajustes</th>
          <th>Total Generado</th>
          <th>Días Consumidos</th>
          <th>Saldo Actual</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${annual}</td>
          <td>${carried !== 0 ? (carried > 0 ? `+${carried}` : carried) : '—'}</td>
          <td>${adjustments !== 0 ? (adjustments > 0 ? `+${adjustments}` : adjustments) : '—'}</td>
          <td>${totalGenerated}</td>
          <td>${consumed}</td>
          <td class="${availableClass}">${available} días</td>
        </tr>
      </tbody>
    </table>

    <div class="vacation-detail">
      <h4>Detalle de Vacaciones Disfrutadas:</h4>
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

          // Formato optimizado para días únicos
          const isSameDay = vacation.start_date === vacation.end_date;
          const dateText = isSameDay 
            ? formattedStart
            : `Del ${formattedStart} al ${formattedEnd}`;

          htmlContent += `
        <li class="vacation-item">
          <div class="vacation-dates">${dateText}</div>
          <div class="vacation-days">${vacation.working_days_count} días</div>
        </li>
`;

          if (vacation.notes) {
            htmlContent += `        <div class="vacation-notes">Nota: ${vacation.notes}</div>\n`;
          }
        });

        htmlContent += `</ul>`;
      }

      htmlContent += `
    </div>
  </div>
`;
    });

    htmlContent += `
  <div class="footer">
    <p><strong>VERSO v12.7</strong> - Sistema de Gestión de Recursos Humanos</p>
    <p>Convenio Metal de Valladolid ${year} • Volquetes Escalante S.L.</p>
  </div>
</body>
</html>
`;

    try {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const clipboardItem = new ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([clipboardItem]);
      
      toast.success('Informe Word optimizado copiado', {
        description: `${filteredEmployees.length} empleados con diseño limpio y legible. Pega en Word con Ctrl+V`,
        duration: 5000,
      });
    } catch (err) {
      const textBlob = new Blob([htmlContent], { type: 'text/plain' });
      const textItem = new ClipboardItem({ 'text/plain': textBlob });
      await navigator.clipboard.write([textItem]);
      
      toast.success('Informe copiado como HTML', {
        description: 'Pega en Word y el formato se aplicará automáticamente',
        duration: 5000,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reporte de Saldos de Vacaciones"
      size="max-w-3xl"
    >
      <div className="p-6 space-y-6">
        
        {isLoadingAbsences && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 text-sm text-blue-800">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Cargando detalle completo de vacaciones del año {year}...</span>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Filtrar por Ubicación
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setLocationFilter('all')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                locationFilter === 'all'
                  ? 'bg-[#1162a6] text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Todas ({employees.length})
            </button>
            <button
              onClick={() => setLocationFilter('Nave 01')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                locationFilter === 'Nave 01'
                  ? 'bg-[#1162a6] text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Nave 01 ({employees.filter(e => e.location === 'Nave 01').length})
            </button>
            <button
              onClick={() => setLocationFilter('Nave 02')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                locationFilter === 'Nave 02'
                  ? 'bg-[#1162a6] text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Nave 02 ({employees.filter(e => e.location === 'Nave 02').length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-xs text-gray-600 mb-1 font-medium">Total Empleados</div>
            <div className="text-2xl font-bold text-[#1162a6]">{stats.totalEmployees}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-xs text-gray-600 mb-1 font-medium">Con Deuda</div>
            <div className="text-2xl font-bold text-red-600">{stats.employeesWithDebt}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="text-xs text-gray-600 mb-1 font-medium">Días Deuda Total</div>
            <div className="text-2xl font-bold text-red-600">{stats.totalDebtDays}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-xs text-gray-600 mb-1 font-medium">Saldo Bajo (≤5)</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.employeesLowBalance}</div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Formato de Exportación
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedFormat('excel')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                selectedFormat === 'excel'
                  ? 'border-[#1162a6] bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <FileSpreadsheet className={`w-6 h-6 mx-auto mb-2 ${
                selectedFormat === 'excel' ? 'text-[#1162a6]' : 'text-gray-400'
              }`} />
              <div className="font-semibold text-sm">Excel (TSV)</div>
              <div className="text-xs text-gray-600 mt-1">Tabla resumida para análisis rápido</div>
            </button>
            
            <button
              onClick={() => setSelectedFormat('word')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                selectedFormat === 'word'
                  ? 'border-[#1162a6] bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <FileText className={`w-6 h-6 mx-auto mb-2 ${
                selectedFormat === 'word' ? 'text-[#1162a6]' : 'text-gray-400'
              }`} />
              <div className="font-semibold text-sm">Word (HTML)</div>
              <div className="text-xs text-gray-600 mt-1">Informe limpio con fechas específicas</div>
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-start gap-3">
            {selectedFormat === 'excel' ? (
              <FileSpreadsheet className="w-5 h-5 text-[#1162a6] flex-shrink-0 mt-0.5" />
            ) : (
              <FileText className="w-5 h-5 text-[#1162a6] flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-semibold text-sm text-gray-900 mb-1">
                {selectedFormat === 'excel' ? 'Formato Excel (TSV)' : 'Formato Word (Diseño Optimizado)'}
              </div>
              <div className="text-xs text-gray-600 leading-relaxed">
                {selectedFormat === 'excel' ? (
                  <>
                    Genera una tabla con columnas: Empleado, Nave, Base, Arrastre, Ajustes, Consumido, Disponible.
                    Ideal para pegar en Excel y crear gráficos o filtros adicionales.
                  </>
                ) : (
                  <>
                    Genera un documento profesional con <strong>diseño limpio y legible</strong>:
                    tabla de saldos sin fondos pesados + detalle de fechas con jerarquía visual optimizada.
                    Perfecto para lectura rápida y archivo de RRHH.
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cerrar
          </Button>
          
          {selectedFormat === 'excel' ? (
            <Button
              onClick={copyToExcel}
              className="bg-[#1162a6] text-white hover:bg-[#0d4d85]"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar para Excel
            </Button>
          ) : (
            <Button
              onClick={copyToWord}
              disabled={isLoadingAbsences}
              className="bg-[#1162a6] text-white hover:bg-[#0d4d85] disabled:opacity-50"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Informe Word
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
