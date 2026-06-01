import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, Plus, FileText, BarChart3, Users, TrendingUp, TrendingDown, AlertTriangle, ChevronLeft, ChevronRight, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { vacationsAPI, CalendarData, Absence, Employee } from '../../api/vacations';
import { apiClient } from '../../api';
import { MonthlyCalendarGrid } from './components/MonthlyCalendarGrid';
import { NewAbsenceSheet } from './components/NewAbsenceSheet';
import { EditAbsenceSheet } from './components/EditAbsenceSheet';
import { AdjustBalanceSheet } from './components/AdjustBalanceSheet';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { BalancesReportModal } from './components/BalancesReportModal';
import { IndividualReportModal } from './components/IndividualReportModal';
import { apiErrorMessage } from '../../utils/error';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

type LocationFilter = 'all' | 'Nave 01' | 'Nave 02';

export const VacationsPage: React.FC = () => {
  // ======= Estados de fecha =======
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  // ======= Thresholds de conflicto (cargados desde /config/vacations.php) =======
  const [warningThreshold, setWarningThreshold] = useState(3);
  const [criticalRemaining, setCriticalRemaining] = useState(2);

  // ======= Estados de filtros =======
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
  const [filterEmployeeId, setFilterEmployeeId] = useState<number | null>(null);
  const [empSearch, setEmpSearch] = useState('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const empComboRef = useRef<HTMLDivElement>(null);

  // ======= Estados de datos =======
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ======= Estados de modales =======
  const [isNewAbsenceModalOpen, setIsNewAbsenceModalOpen] = useState(false);
  const [isEditAbsenceModalOpen, setIsEditAbsenceModalOpen] = useState(false);
  const [isAdjustBalanceSheetOpen, setIsAdjustBalanceSheetOpen] = useState(false);
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);
  const [isBalancesReportModalOpen, setIsBalancesReportModalOpen] = useState(false);
  const [isIndividualReportModalOpen, setIsIndividualReportModalOpen] = useState(false);

  // ======= Estados de selección =======
  const [selectedEmployeeForBalance, setSelectedEmployeeForBalance] = useState<number | null>(null);
  const [selectedAbsenceForEdit, setSelectedAbsenceForEdit] = useState<Absence | null>(null);
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<Employee | null>(null);
  const [selectedEmployeeForReport, setSelectedEmployeeForReport] = useState<Employee | null>(null);
  
  // ✅ v12.8: Click-to-create
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);
  const [prefilledEmployeeId, setPrefilledEmployeeId] = useState<number | null>(null);

  // ======= Carga de datos =======
  const loadCalendarData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await vacationsAPI.getCalendar(year, month);
      setCalendarData(response.data);
    } catch (err: unknown) {
      console.error('Error cargando calendario:', err);
      setError(apiErrorMessage(err, 'Error al cargar el calendario'));
      toast.error('Error al cargar datos', {
        description: 'No se pudieron cargar los datos del calendario'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [year, month]);

  // Carga thresholds de conflicto desde configuración del sistema (fallback a valores del convenio)
  useEffect(() => {
    apiClient.get<{ config: Record<string, { valor: string | number }> }>('/config/vacations.php')
      .then(res => {
        const c = res.data.config;
        if (c.vacation_conflict_warning_threshold) setWarningThreshold(Number(c.vacation_conflict_warning_threshold.valor));
        if (c.vacation_conflict_critical_remaining) setCriticalRemaining(Number(c.vacation_conflict_critical_remaining.valor));
      })
      .catch(() => { /* mantener defaults */ });
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (empComboRef.current && !empComboRef.current.contains(e.target as Node)) {
        setShowEmpDropdown(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // ======= Navegación inteligente =======
  const goToToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  };

  // ✅ NUEVO v13.0: Navegación secuencial con flechas
  const goToPreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  // Años disponibles para selector (±2 del actual)
  const availableYears = Array.from(
    { length: 5 }, 
    (_, i) => today.getFullYear() - 2 + i
  );

  // ======= Datos filtrados por nave y/o empleado =======
  const filteredCalendarData = useMemo(() => {
    if (!calendarData) return null;

    let employees = calendarData.employees;

    if (locationFilter !== 'all') {
      employees = employees.filter(emp => emp.location === locationFilter);
    }

    if (filterEmployeeId !== null) {
      employees = employees.filter(emp => emp.id === filterEmployeeId);
    }

    if (employees.length === calendarData.employees.length) {
      return calendarData;
    }

    const employeeIds = new Set(employees.map(e => e.id));
    return {
      ...calendarData,
      employees,
      absences: calendarData.absences.filter(abs => employeeIds.has(abs.employee_id)),
      balances: Object.fromEntries(
        Object.entries(calendarData.balances).filter(([empId]) => employeeIds.has(Number(empId)))
      )
    };
  }, [calendarData, locationFilter, filterEmployeeId]);

  // ======= Métricas mensuales en tiempo real =======
  const metrics = useMemo(() => {
    if (!filteredCalendarData) return null;

    const employeesWithAbsences = new Set(
      filteredCalendarData.absences
        .filter(abs => {
          const absStart = new Date(abs.start_date);
          const absEnd = new Date(abs.end_date);
          const monthStart = new Date(year, month - 1, 1);
          const monthEnd = new Date(year, month, 0);
          
          // Ausencia intersecta con el mes actual
          return absStart <= monthEnd && absEnd >= monthStart;
        })
        .map(abs => abs.employee_id)
    ).size;

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const totalVacationDays = filteredCalendarData.absences
      .filter(abs => abs.absence_type === 'vacation')
      .reduce((sum, abs) => {
        const absStart = new Date(abs.start_date + 'T00:00:00');
        const absEnd = new Date(abs.end_date + 'T00:00:00');
        if (absStart > monthEnd || absEnd < monthStart) return sum;
        const clampedStart = absStart < monthStart ? new Date(monthStart) : new Date(absStart);
        const clampedEnd = absEnd > monthEnd ? new Date(monthEnd) : new Date(absEnd);
        let days = 0;
        for (const d = new Date(clampedStart); d <= clampedEnd; d.setDate(d.getDate() + 1)) {
          const dow = d.getDay();
          if (dow !== 0 && dow !== 6) {
            const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!filteredCalendarData.holidays.some(h => h.holiday_date === ds)) days++;
          }
        }
        return sum + days;
      }, 0);

    const employeesWithNegativeBalance = filteredCalendarData.employees
      .filter(emp => {
        const balance = filteredCalendarData.balances[emp.id];
        return balance && balance.available_days < 0;
      }).length;

    const employeesLowBalance = filteredCalendarData.employees
      .filter(emp => {
        const balance = filteredCalendarData.balances[emp.id];
        return balance && balance.available_days > 0 && balance.available_days <= 5;
      }).length;

    return {
      employeesWithAbsences,
      totalVacationDays: Math.round(totalVacationDays),
      employeesWithNegativeBalance,
      employeesLowBalance,
      totalEmployees: filteredCalendarData.employees.length
    };
  }, [filteredCalendarData, year, month]);

  // ======= Handlers de modales =======
  const handleNewAbsenceSuccess = () => {
    loadCalendarData();
    setIsNewAbsenceModalOpen(false);
    setPrefilledDate(null);
    setPrefilledEmployeeId(null);
  };

  const handleBalanceClick = (employeeId: number) => {
    setSelectedEmployeeForBalance(employeeId);
    setIsAdjustBalanceSheetOpen(true);
  };

  const handleBalanceAdjustSuccess = () => {
    loadCalendarData();
    setIsAdjustBalanceSheetOpen(false);
    setSelectedEmployeeForBalance(null);
  };

  const handleAbsenceClick = (absence: Absence, employee: Employee) => {
    setSelectedAbsenceForEdit(absence);
    setSelectedEmployeeForEdit(employee);
    setIsEditAbsenceModalOpen(true);
  };

  const handleEditAbsenceSuccess = () => {
    loadCalendarData();
    setIsEditAbsenceModalOpen(false);
    setSelectedAbsenceForEdit(null);
    setSelectedEmployeeForEdit(null);
  };

  const handleEditAbsenceClose = () => {
    setIsEditAbsenceModalOpen(false);
    setSelectedAbsenceForEdit(null);
    setSelectedEmployeeForEdit(null);
  };

  // ✅ v12.8: Click-to-create en celdas vacías
  const handleCellClick = (employeeId: number, date: string) => {
    setPrefilledEmployeeId(employeeId);
    setPrefilledDate(date);
    setIsNewAbsenceModalOpen(true);
  };

  // ✅ v12.8: Reporte individual por empleado
  const handleIndividualReportClick = (employee: Employee) => {
    setSelectedEmployeeForReport(employee);
    setIsIndividualReportModalOpen(true);
  };

  // ======= Datos derivados =======
  const selectedEmployeeForBalanceData = calendarData?.employees.find(
    emp => emp.id === selectedEmployeeForBalance
  );

  const selectedBalanceForAdjust = selectedEmployeeForBalance && calendarData?.balances
    ? calendarData.balances[selectedEmployeeForBalance]
    : null;

  return (
    <div className="space-y-5">
      {/* ======= Header Principal — patrón estándar ======= */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1162a6] flex items-center justify-center shadow-sm flex-shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Vacaciones</h1>
            <p className="text-sm text-gray-500">Convenio Metal de Valladolid 2025</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => setIsMonthlyReportModalOpen(true)}
            className="hidden sm:flex"
            title="Generar reporte mensual para gestoría"
          >
            <FileText className="w-4 h-4 mr-2" />
            Reporte Mensual
          </Button>

          <Button
            variant="secondary"
            onClick={() => setIsBalancesReportModalOpen(true)}
            className="hidden sm:flex"
            title="Ver estado global de saldos de todos los empleados"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Ver Saldos
          </Button>

          <Button
            onClick={() => {
              setPrefilledDate(null);
              setPrefilledEmployeeId(null);
              setIsNewAbsenceModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Ausencia
          </Button>
        </div>
      </div>

      {/* ======= Métricas — grid de 4 cards (mismo Card que OR/Empleados) ======= */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1162a6]/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-[#1162a6]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{metrics.employeesWithAbsences}</div>
              <div className="text-xs text-gray-400">Con ausencias este mes</div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#5487c0]/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-[#5487c0]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{metrics.totalVacationDays}</div>
              <div className="text-xs text-gray-400">Días de vacaciones</div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#dc2626]/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-[#dc2626]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{metrics.employeesWithNegativeBalance}</div>
              <div className="text-xs text-gray-400">Con saldo negativo</div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#a2bade]/30 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-4 h-4 text-[#dc2626]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{metrics.employeesLowBalance}</div>
              <div className="text-xs text-gray-400">Saldo bajo (≤5 días)</div>
            </div>
          </Card>
        </div>
      )}

      {/* ======= Navegación + Filtros — card compacta, fila única ======= */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] px-4 py-3">
        <div className="flex items-center flex-wrap gap-3">
          {/* Navegación mes/año */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-gray-50 text-gray-600 border border-[#e2e8f0] bg-white transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#1162a6] focus:border-transparent bg-white cursor-pointer min-w-[130px]"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#1162a6] focus:border-transparent bg-white cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-gray-50 text-gray-600 border border-[#e2e8f0] bg-white transition-colors"
              title="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <Button
              variant="secondary"
              onClick={goToToday}
              size="sm"
              className="font-semibold ml-1"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Hoy
            </Button>
          </div>

          <div className="w-px h-5 bg-[#e2e8f0] flex-shrink-0" />

          {/* Filtros: empleado + nave */}
          <div className="flex items-center gap-2 flex-1">

            {/* Combobox empleado — mismo contenedor pill que los toggles de nave */}
            {calendarData && (
              <div className="relative flex-1" ref={empComboRef}>
                <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg border border-[#e2e8f0]">
                  <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-1.5" />
                  <input
                    type="text"
                    className="text-sm font-semibold text-gray-700 outline-none min-w-[200px] max-w-[220px] placeholder:text-gray-400 bg-transparent px-1.5 py-1"
                    placeholder="Todos"
                    value={filterEmployeeId
                      ? (calendarData.employees.find(e => e.id === filterEmployeeId)?.full_name ?? '')
                      : empSearch}
                    onChange={(e) => { setEmpSearch(e.target.value); setFilterEmployeeId(null); setShowEmpDropdown(true); }}
                    onFocus={() => setShowEmpDropdown(true)}
                  />

                  {filterEmployeeId && (
                    <button
                      onClick={() => { setFilterEmployeeId(null); setEmpSearch(''); }}
                      className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {showEmpDropdown && (
                  <ul className="absolute top-full mt-1 left-0 z-20 w-full min-w-[220px] bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    <li
                      className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer border-b border-[#e2e8f0]"
                      onMouseDown={() => { setFilterEmployeeId(null); setEmpSearch(''); setShowEmpDropdown(false); }}
                    >
                      Todos los empleados
                    </li>
                    {calendarData.employees
                      .filter(emp => emp.full_name.toLowerCase().includes(empSearch.toLowerCase()))
                      .map(emp => (
                        <li
                          key={emp.id}
                          className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#1162a6]/5 hover:text-[#1162a6] ${
                            filterEmployeeId === emp.id ? 'bg-[#1162a6]/10 text-[#1162a6] font-semibold' : 'text-gray-700'
                          }`}
                          onMouseDown={() => { setFilterEmployeeId(emp.id); setEmpSearch(''); setShowEmpDropdown(false); }}
                        >
                          {emp.full_name}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}

            {/* Toggle por nave */}
            <div className="flex gap-1 p-1 bg-gray-50 rounded-lg border border-[#e2e8f0] ml-auto">
              <Button
                variant="toggle"
                active={locationFilter === 'all'}
                size="sm"
                onClick={() => setLocationFilter('all')}
                className="font-semibold"
              >
                Todas {calendarData && `(${calendarData.employees.length})`}
              </Button>
              <Button
                variant="toggle"
                active={locationFilter === 'Nave 01'}
                size="sm"
                onClick={() => setLocationFilter('Nave 01')}
                className="font-semibold"
              >
                Nave 01 {calendarData && `(${calendarData.employees.filter(e => e.location === 'Nave 01').length})`}
              </Button>
              <Button
                variant="toggle"
                active={locationFilter === 'Nave 02'}
                size="sm"
                onClick={() => setLocationFilter('Nave 02')}
                className="font-semibold"
              >
                Nave 02 {calendarData && `(${calendarData.employees.filter(e => e.location === 'Nave 02').length})`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ======= Calendario ======= */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1162a6] mb-4"></div>
              <p className="text-gray-600 font-medium">Cargando calendario...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white border-l-4 border-[#dc2626] rounded-r-xl p-5 shadow-sm">
            <p className="text-gray-900 font-semibold mb-1">Error al cargar datos</p>
            <p className="text-gray-600 text-sm mb-3">{error}</p>
            <Button onClick={loadCalendarData} variant="subtle" size="sm">
              Reintentar
            </Button>
          </div>
        ) : filteredCalendarData ? (
          <MonthlyCalendarGrid
            currentYear={year}
            currentMonth={month}
            data={filteredCalendarData}
            onBalanceClick={handleBalanceClick}
            onAbsenceClick={handleAbsenceClick}
            onCellClick={handleCellClick}
            activeLocationFilter={locationFilter}
            onIndividualReportClick={handleIndividualReportClick}
            warningThreshold={warningThreshold}
          />
        ) : null}
      </div>

      {/* ======= Modales ======= */}

      {/* Sheet Nueva Ausencia */}
      {calendarData && (
        <NewAbsenceSheet
          isOpen={isNewAbsenceModalOpen}
          onClose={() => {
            setIsNewAbsenceModalOpen(false);
            setPrefilledDate(null);
            setPrefilledEmployeeId(null);
          }}
          onSuccess={handleNewAbsenceSuccess}
          calendarData={calendarData}
          prefilledDate={prefilledDate}
          prefilledEmployeeId={prefilledEmployeeId}
          warningThreshold={warningThreshold}
          criticalRemaining={criticalRemaining}
        />
      )}

      {/* Sheet Editar Ausencia */}
      {selectedAbsenceForEdit && selectedEmployeeForEdit && calendarData && (
        <EditAbsenceSheet
          isOpen={isEditAbsenceModalOpen}
          onClose={handleEditAbsenceClose}
          onSuccess={handleEditAbsenceSuccess}
          absence={selectedAbsenceForEdit}
          employee={selectedEmployeeForEdit}
          balance={calendarData.balances[selectedEmployeeForEdit.id] || null}
          calendarData={calendarData}
          warningThreshold={warningThreshold}
          criticalRemaining={criticalRemaining}
        />
      )}

      {/* Modal Ajustar Saldo */}
      {selectedEmployeeForBalanceData && selectedBalanceForAdjust && (
        <AdjustBalanceSheet
          isOpen={isAdjustBalanceSheetOpen}
          onClose={() => {
            setIsAdjustBalanceSheetOpen(false);
            setSelectedEmployeeForBalance(null);
          }}
          onSuccess={handleBalanceAdjustSuccess}
          employee={selectedEmployeeForBalanceData}
          currentBalance={selectedBalanceForAdjust}
          year={year}
        />
      )}

      {/* Modal Reporte Mensual */}
      {calendarData && (
        <MonthlyReportModal
          isOpen={isMonthlyReportModalOpen}
          onClose={() => setIsMonthlyReportModalOpen(false)}
          year={year}
          month={month}
        />
      )}

      {/* Modal Reporte Global de Saldos */}
      {calendarData && (
        <BalancesReportModal
          isOpen={isBalancesReportModalOpen}
          onClose={() => setIsBalancesReportModalOpen(false)}
          year={year}
          employees={calendarData.employees}
          balances={calendarData.balances}
          absences={calendarData.absences}
        />
      )}

      {/* Modal Reporte Individual */}
      {selectedEmployeeForReport && calendarData && (
        <IndividualReportModal
          isOpen={isIndividualReportModalOpen}
          onClose={() => {
            setIsIndividualReportModalOpen(false);
            setSelectedEmployeeForReport(null);
          }}
          employee={selectedEmployeeForReport}
          balance={calendarData.balances[selectedEmployeeForReport.id]}
          year={year}
        />
      )}

    </div>
  );
};
