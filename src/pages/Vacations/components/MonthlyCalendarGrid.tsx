import React from 'react';
import { FileText } from 'lucide-react';
import { 
  CalendarData,
  Absence,
  Holiday,
  Employee,
  getAbsencesForDate,
  getHolidayForDate,
  getAbsenceColor,
  ABSENCE_TYPES,
  getBalanceBadgeColor
} from '../../../api/vacations';

interface Props {
  currentYear: number;
  currentMonth: number;
  data: CalendarData;
  onBalanceClick: (employeeId: number) => void;
  onAbsenceClick: (absence: Absence, employee: Employee) => void;
  onCellClick: (employeeId: number, date: string) => void;
  activeLocationFilter: 'all' | 'Nave 01' | 'Nave 02';
  onIndividualReportClick?: (employee: Employee) => void;
  warningThreshold: number;
}

export const MonthlyCalendarGrid: React.FC<Props> = ({
  currentYear,
  currentMonth,
  data,
  onBalanceClick,
  onAbsenceClick,
  onCellClick,
  activeLocationFilter,
  onIndividualReportClick,
  warningThreshold
}) => {
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
  };
  
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const todayString = new Date().toISOString().split('T')[0];

  const calculateMonthDays = (employeeId: number): number => {
    const employeeAbsences = data.absences.filter(
      (abs: Absence) => abs.employee_id === employeeId && 
                        abs.absence_type === 'vacation'
    );

    let totalDays = 0;

    employeeAbsences.forEach((absence: Absence) => {
      const start = new Date(absence.start_date + 'T00:00:00');
      const end = new Date(absence.end_date + 'T00:00:00');
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dYear = d.getFullYear();
        const dMonth = d.getMonth() + 1;
        const dDay = d.getDate();
        
        const dateString = `${dYear}-${String(dMonth).padStart(2, '0')}-${String(dDay).padStart(2, '0')}`;
        
        if (dYear === currentYear && dMonth === currentMonth) {
          const dayOfWeek = d.getDay();
          const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
          const isHoliday = data.holidays.some((h: Holiday) => h.holiday_date === dateString);
          
          if (!isWeekendDay && !isHoliday) {
            totalDays++;
          }
        }
      }
    });

    return totalDays;
  };

  const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const monthShort = monthNames[currentMonth - 1];

  const VERSO_COLORS = {
    header: '#1162a6',
    weekend: '#f1f5f9',
    holiday: '#bfdbfe',
    available: '#ffffff',
    border: '#f1f5f9',
    zebraRow: '#f8fafc'
  };

  const currentYearMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const getEmployeeAbsencesForMonth = (employeeId: number): Absence[] => {
    return data.absences.filter((a: Absence) =>
      a.employee_id === employeeId &&
      a.start_date.slice(0, 7) <= currentYearMonth &&
      a.end_date.slice(0, 7)   >= currentYearMonth
    );
  };

  const getBarGeometry = (absence: Absence) => {
    const startYM = absence.start_date.slice(0, 7);
    const endYM   = absence.end_date.slice(0, 7);
    const startDay = startYM < currentYearMonth ? 1 : parseInt(absence.start_date.slice(8), 10);
    const endDay   = endYM   > currentYearMonth ? daysInMonth : parseInt(absence.end_date.slice(8), 10);
    const left  = ((startDay - 1) / daysInMonth) * 100;
    const width = ((endDay - startDay + 1) / daysInMonth) * 100;
    const isStartInMonth = startYM === currentYearMonth;
    const isEndInMonth   = endYM   === currentYearMonth;
    return { startDay, endDay, left, width, isStartInMonth, isEndInMonth };
  };

  return (
    <div className="overflow-x-auto border border-gray-300 rounded-xl bg-white shadow-sm">
      <div className="flex items-center justify-end gap-4 px-4 py-2 border-b border-[#e2e8f0]">
        {[
          { type: 'vacation',       label: 'Vacaciones' },
          { type: 'special_permit', label: 'Permiso Especial' },
          { type: 'sick_leave',     label: 'Baja Médica' },
          { type: 'unpaid_leave',   label: 'Permiso No Retribuido' },
        ].map(({ type, label }) => (
          <div key={type} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: getAbsenceColor(type) + '55' }}
            />
            <span className="text-xs text-gray-500 whitespace-nowrap">{label}</span>
          </div>
        ))}
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-white border-b-2 border-[#e2e8f0]">
            <th className="sticky left-0 z-30 px-4 py-2 text-left min-w-[160px] border-r border-[#e2e8f0] shadow-[2px_0_10px_rgba(0,0,0,0.04)] bg-white">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Empleado</span>
                {activeLocationFilter !== 'all' && (
                  <span className="ml-2 px-2 py-0.5 bg-[#1162a6]/10 text-[#1162a6] rounded-full text-[10px] font-semibold">
                    {activeLocationFilter}
                  </span>
                )}
              </div>
            </th>

            {daysArray.map((day: number) => {
              const date = new Date(currentYear, currentMonth - 1, day);
              const dayOfWeek = date.getDay();
              const isWeekendHeader = dayOfWeek === 0 || dayOfWeek === 6;
              const isSunday = dayOfWeek === 0;
              const dayName = ['D','L','M','X','J','V','S'][dayOfWeek];
              const dateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateString === todayString;
              const conflictCount = data.employees.filter(
                (emp: Employee) => getAbsencesForDate(emp.id, dateString, data.absences)
              ).length;

              return (
                <th key={`head-${day}`}
                    className={`min-w-[32px] w-[32px] px-0 py-1.5 text-center font-medium ${
                      conflictCount >= warningThreshold ? 'bg-[#dc2626]/10' : 'bg-white'
                    } ${isSunday ? 'border-r-2 border-[#e2e8f0]' : 'border-r border-[#e2e8f0]'
                    }`}>
                  <div className={`text-[11px] font-medium mb-0.5 ${
                    isToday ? 'text-[#1162a6] font-semibold' : 'text-gray-400'
                  }`}>
                    {dayName}
                  </div>
                  {isToday ? (
                    <div className="w-7 h-7 rounded-full border border-[#1162a6] bg-transparent flex items-center justify-center mx-auto">
                      <span className="text-xs font-bold text-[#1162a6]">{day}</span>
                    </div>
                  ) : (
                    <div className={`text-sm font-semibold ${isWeekendHeader ? 'text-gray-400' : 'text-gray-600'}`}>
                      {day}
                    </div>
                  )}
                </th>
              );
            })}

            <th className="sticky right-[85px] z-30 px-3 py-2 text-center min-w-[75px] border-x border-[#e2e8f0] bg-white">
              <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Días</div>
              <div className="text-xs font-semibold text-gray-500">{monthShort}</div>
            </th>

            <th className="sticky right-0 z-30 px-3 py-2 text-center min-w-[95px] shadow-[-4px_0_15px_rgba(0,0,0,0.08)] bg-white">
              <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Saldo</div>
              <div className="text-xs font-semibold text-gray-500">{currentYear}</div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: VERSO_COLORS.border }}>
          {data.employees.map((employee: Employee, idx: number) => {
            const balance = data.balances[employee.id];
            const annual = balance ? balance.annual_days : 22;
            const carried = balance ? balance.carried_over_days : 0;
            const manual = balance ? (balance.manual_adjustments || 0) : 0;
            
            // ✅ CORRECCIÓN CRÍTICA v13.1.4: DENOMINADOR = SOLO DERECHOS POSITIVOS
            // La deuda (arrastres/ajustes negativos) se refleja en el numerador, NO en el denominador
            let total = annual; // Base siempre (22 o proporcional)
            
            // Solo sumamos elementos que AUMENTAN los derechos
            if (carried > 0) total += carried;   // Arrastres positivos
            if (manual > 0) total += manual;     // Ajustes positivos
            
            // Los negativos (deuda) ya están reflejados en available_days del backend

            const available = balance ? Math.floor(balance.available_days) : 0;
            const monthDays = calculateMonthDays(employee.id);

            const isEvenRow = idx % 2 === 0;
            const rowBg = isEvenRow ? 'bg-white' : 'bg-slate-50/30';

            return (
              <tr key={employee.id} className={`group transition-all duration-200 ${rowBg} hover:bg-blue-50/40`}>
                <td className={`sticky left-0 z-20 px-4 py-2.5 border-r transition-all duration-200 shadow-[2px_0_8px_rgba(0,0,0,0.04)] min-w-[160px] ${rowBg} group-hover:bg-blue-50/40`}
                    style={{ borderColor: VERSO_COLORS.border }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                         style={{ backgroundColor: VERSO_COLORS.header }}>
                      {employee.full_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 leading-tight whitespace-nowrap overflow-hidden text-ellipsis"
                           title={employee.full_name}>
                        {employee.full_name}
                      </div>
                      <div className={`text-[10px] font-medium tracking-wide uppercase mt-0.5 ${
                        activeLocationFilter !== 'all' ? 'text-[#1162a6] font-bold' : 'text-gray-600'
                      }`}>
                        {employee.location}
                      </div>
                    </div>
                    
                    {onIndividualReportClick && (
                      <button 
                        onClick={() => onIndividualReportClick(employee)}
                        className="p-1.5 text-gray-400 hover:text-[#1162a6] hover:bg-blue-100 rounded-md transition-all opacity-0 group-hover:opacity-100"
                        title="Ver reporte individual"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>

                {/* Zona de días: única celda con CSS Grid interior */}
                <td
                  colSpan={daysInMonth}
                  className="p-0 h-10"
                >
                  <div
                    className="relative w-full h-full grid"
                    style={{ gridTemplateColumns: `repeat(${daysInMonth}, minmax(32px, 1fr))` }}
                  >
                    {daysArray.map((day: number) => {
                      const dateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const dateObj = new Date(dateString + 'T00:00:00');
                      const dayOfWeek = dateObj.getDay();
                      const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
                      const isSunday = dayOfWeek === 0;
                      const holiday = getHolidayForDate(dateString, data.holidays);
                      const absence = getAbsencesForDate(employee.id, dateString, data.absences);
                      const isToday = dateString === todayString;

                      let cellBg: string;
                      if (holiday) {
                        cellBg = VERSO_COLORS.holiday;
                      } else if (isWeekendDay) {
                        cellBg = VERSO_COLORS.weekend;
                      } else {
                        cellBg = 'transparent';
                      }

                      const borderClass = isSunday ? 'border-r-2 border-slate-300' : 'border-r';
                      const todayClass = isToday ? 'ring-1 ring-inset ring-[#1162a6]/40' : '';

                      let tooltipText = 'Click para crear ausencia';
                      if (absence) {
                        tooltipText = `${employee.full_name} - ${ABSENCE_TYPES[absence.absence_type]}\nDel ${absence.start_date} al ${absence.end_date}\n${absence.working_days_count} días laborales\n\n✏️ Click para editar`;
                      } else if (holiday) {
                        tooltipText = `🎉 ${holiday.description}`;
                      } else if (isWeekendDay) {
                        tooltipText = 'Fin de semana';
                      }

                      return (
                        <div
                          key={`${employee.id}-${day}`}
                          className={`relative h-full transition-all duration-200 ${borderClass} ${todayClass} ${
                            !absence && !holiday && !isWeekendDay ? 'cursor-pointer hover:bg-blue-50/50' : ''
                          }`}
                          style={{ backgroundColor: cellBg, borderColor: VERSO_COLORS.border }}
                          title={tooltipText}
                          onClick={() => {
                            if (!absence && !holiday && !isWeekendDay) {
                              onCellClick(employee.id, dateString);
                            }
                          }}
                        >
                          {holiday && (
                            <div className="absolute top-1 right-1">
                              <div className="w-1.5 h-1.5 rounded-full opacity-70"
                                   style={{ backgroundColor: VERSO_COLORS.header }} />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Barras de ausencia — overlay absoluto sobre el grid */}
                    {getEmployeeAbsencesForMonth(employee.id).map((absence: Absence) => {
                      const { left, width, isStartInMonth, isEndInMonth } = getBarGeometry(absence);
                      const color = getAbsenceColor(absence.absence_type);
                      const borderRadius = isStartInMonth && isEndInMonth
                        ? '9999px'
                        : isStartInMonth
                        ? '9999px 0 0 9999px'
                        : isEndInMonth
                        ? '0 9999px 9999px 0'
                        : '0';
                      return (
                        <React.Fragment key={absence.id}>
                          {/* Número de días — a la izquierda del inicio, sobre fondo blanco */}
                          {isStartInMonth && (
                            <div
                              className="absolute z-20 pointer-events-none"
                              style={{
                                left: `${left}%`,
                                top: '50%',
                                transform: 'translate(calc(-100% - 6px), -50%)',
                              }}
                            >
                              <span
                                className="text-sm font-semibold whitespace-nowrap"
                                style={{ color }}
                              >
                                {absence.working_days_count}d
                              </span>
                            </div>
                          )}
                          {/* Barra sólida sin texto */}
                          <div
                            className="absolute z-10 cursor-pointer transition-all duration-200 hover:brightness-90"
                            style={{
                              top: '13px',
                              bottom: '13px',
                              left: `${left}%`,
                              width: `${width}%`,
                              backgroundColor: color + '55',
                              borderRadius,
                            }}
                            title={`${employee.full_name} - ${ABSENCE_TYPES[absence.absence_type]}\nDel ${absence.start_date} al ${absence.end_date}\n${absence.working_days_count} días laborales\n\n✏️ Click para editar`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAbsenceClick(absence, employee);
                            }}
                          />
                        </React.Fragment>
                      );
                    })}
                  </div>
                </td>

                <td className={`sticky right-[85px] z-20 px-3 py-2.5 text-center border-x transition-all duration-200 shadow-[-2px_0_8px_rgba(0,0,0,0.04)] ${rowBg} group-hover:bg-blue-50/40`}
                    style={{ borderColor: VERSO_COLORS.border }}>
                  {monthDays > 0 ? (
                    <span className="text-base font-bold" style={{ color: VERSO_COLORS.header }}>
                      {monthDays}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>

                <td className={`sticky right-0 z-20 px-3 py-2.5 text-center transition-all duration-200 shadow-[-4px_0_12px_rgba(0,0,0,0.08)] ${rowBg} group-hover:bg-blue-50/40`}>
                  <button 
                    onClick={() => onBalanceClick(employee.id)}
                    className={`inline-flex items-center justify-center min-w-[4rem] px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all duration-200 hover:scale-105 cursor-pointer hover:shadow-md ${getBalanceBadgeColor(available, total)}`}
                    title="Click para ajustar saldo (arrastre 2024 / vacaciones pagadas)"
                  >
                    {/* ✅ CORRECCIÓN v13.1.4: Denominador = Solo Derechos Positivos */}
                    {available} <span className="mx-1 opacity-50">/</span> {total}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
