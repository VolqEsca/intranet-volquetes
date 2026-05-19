import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Plus, FileText, BarChart3, Filter, Users, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { vacationsAPI, CalendarData, Absence, Employee } from '../../api/vacations';
import { MonthlyCalendarGrid } from './components/MonthlyCalendarGrid';
import { NewAbsenceModal } from './components/NewAbsenceModal';
import { EditAbsenceModal } from './components/EditAbsenceModal';
import { AdjustBalanceModal } from './components/AdjustBalanceModal';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { BalancesReportModal } from './components/BalancesReportModal';
import { IndividualReportModal } from './components/IndividualReportModal';
import HolidaysConfigModal from './components/HolidaysConfigModal';

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

  // ======= Estados de filtros =======
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');

  // ======= Estados de datos =======
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ======= Estados de modales =======
  const [isNewAbsenceModalOpen, setIsNewAbsenceModalOpen] = useState(false);
  const [isEditAbsenceModalOpen, setIsEditAbsenceModalOpen] = useState(false);
  const [isAdjustBalanceModalOpen, setIsAdjustBalanceModalOpen] = useState(false);
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);
  const [isBalancesReportModalOpen, setIsBalancesReportModalOpen] = useState(false);
  const [isIndividualReportModalOpen, setIsIndividualReportModalOpen] = useState(false);
  const [showHolidaysModal, setShowHolidaysModal] = useState(false);

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
    } catch (err: any) {
      console.error('Error cargando calendario:', err);
      setError(err.response?.data?.error || 'Error al cargar el calendario');
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

  // ======= Datos filtrados por nave (optimizado con useMemo) =======
  const filteredCalendarData = useMemo(() => {
    if (!calendarData) return null;
    
    if (locationFilter === 'all') {
      return calendarData;
    }

    const filteredEmployees = calendarData.employees.filter(emp => emp.location === locationFilter);
    const filteredEmployeeIds = new Set(filteredEmployees.map(e => e.id));
    
    return {
      ...calendarData,
      employees: filteredEmployees,
      absences: calendarData.absences.filter(abs => filteredEmployeeIds.has(abs.employee_id)),
      balances: Object.fromEntries(
        Object.entries(calendarData.balances).filter(([empId]) => filteredEmployeeIds.has(Number(empId)))
      )
    };
  }, [calendarData, locationFilter]);

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

    const totalVacationDays = filteredCalendarData.absences
      .filter(abs => {
        const absDate = new Date(abs.start_date);
        return abs.absence_type === 'vacation' && 
               absDate.getFullYear() === year && 
               (absDate.getMonth() + 1) === month;
      })
      .reduce((sum, abs) => sum + abs.working_days_count, 0);

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
    setIsAdjustBalanceModalOpen(true);
  };

  const handleBalanceAdjustSuccess = () => {
    loadCalendarData();
    setIsAdjustBalanceModalOpen(false);
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

  // ✅ v13.1.4: Recargar calendario tras actualizar festivos
  const handleHolidaysUpdated = () => {
    loadCalendarData();
  };

  // ======= Datos derivados =======
  const selectedEmployeeForBalanceData = calendarData?.employees.find(
    emp => emp.id === selectedEmployeeForBalance
  );

  const selectedBalanceForAdjust = selectedEmployeeForBalance && calendarData?.balances
    ? calendarData.balances[selectedEmployeeForBalance]
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ======= Header Principal ======= */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Título */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#1162a6] flex items-center justify-center shadow-md">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Vacaciones</h1>
                <p className="text-sm text-gray-600">Convenio Metal de Valladolid 2025</p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={() => setIsMonthlyReportModalOpen(true)}
                className="hidden sm:flex"
                title="Generar reporte mensual para gestoría"
              >
                <FileText className="w-4 h-4 mr-2 text-gray-600" />
                Reporte Mensual
              </Button>

              <Button 
                variant="outline"
                onClick={() => setIsBalancesReportModalOpen(true)}
                className="hidden sm:flex"
                title="Ver estado global de saldos de todos los empleados"
              >
                <BarChart3 className="w-4 h-4 mr-2 text-gray-600" />
                Ver Saldos
              </Button>

              {/* ✅ NUEVO v13.1.4: Botón Festivos */}
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowHolidaysModal(true)}
                className="bg-white hover:bg-gray-50"
                title="Configurar festivos y días no laborables"
              >
                <Settings className="w-4 h-4 mr-2 text-gray-600" />
                Festivos
              </Button>

              <Button 
                onClick={() => {
                  setPrefilledDate(null);
                  setPrefilledEmployeeId(null);
                  setIsNewAbsenceModalOpen(true);
                }}
                className="bg-[#1162a6] text-white hover:bg-[#0d4d85]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Ausencia
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ======= Navegación Inteligente + Filtros + Métricas ======= */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          {/* Fila 1: Navegación + Filtros */}
          <div className="flex items-center justify-between gap-6 mb-4">
            {/* ✅ NAVEGACIÓN HÍBRIDA v13.0: Flechas + Selectores + Hoy */}
            <div className="flex items-center gap-2">
              {/* Flecha Anterior */}
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 border border-gray-300 bg-white transition-colors"
                title="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg text-base font-semibold text-gray-900 focus:ring-2 focus:ring-[#1162a6] focus:border-transparent bg-white hover:bg-gray-50 transition-colors cursor-pointer min-w-[140px]"
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
                className="px-4 py-2 border border-gray-300 rounded-lg text-base font-semibold text-gray-900 focus:ring-2 focus:ring-[#1162a6] focus:border-transparent bg-white hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              {/* Flecha Siguiente */}
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 border border-gray-300 bg-white transition-colors"
                title="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <Button
                variant="outline"
                onClick={goToToday}
                size="sm"
                className="font-semibold ml-2"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Hoy
              </Button>
            </div>

            {/* ✅ Filtros por Nave con contadores dinámicos */}
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setLocationFilter('all')}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                    locationFilter === 'all'
                      ? 'bg-[#1162a6] text-white shadow-sm'
                      : 'bg-transparent text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todas {calendarData && `(${calendarData.employees.length})`}
                </button>
                <button
                  onClick={() => setLocationFilter('Nave 01')}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                    locationFilter === 'Nave 01'
                      ? 'bg-[#1162a6] text-white shadow-sm'
                      : 'bg-transparent text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Nave 01 {calendarData && `(${calendarData.employees.filter(e => e.location === 'Nave 01').length})`}
                </button>
                <button
                  onClick={() => setLocationFilter('Nave 02')}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                    locationFilter === 'Nave 02'
                      ? 'bg-[#1162a6] text-white shadow-sm'
                      : 'bg-transparent text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Nave 02 {calendarData && `(${calendarData.employees.filter(e => e.location === 'Nave 02').length})`}
                </button>
              </div>
            </div>
          </div>

          {/* Fila 2: Panel de Métricas en tiempo real */}
          {metrics && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
              <div className="grid grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1162a6] flex items-center justify-center shadow-sm">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#1162a6]">{metrics.employeesWithAbsences}</div>
                    <div className="text-xs text-gray-600 font-medium">Con ausencias este mes</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{metrics.totalVacationDays}</div>
                    <div className="text-xs text-gray-600 font-medium">Días de vacaciones</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{metrics.employeesWithNegativeBalance}</div>
                    <div className="text-xs text-gray-600 font-medium">Con saldo negativo</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{metrics.employeesLowBalance}</div>
                    <div className="text-xs text-gray-600 font-medium">Saldo bajo (≤5 días)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======= Contenido Principal ======= */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1162a6] mb-4"></div>
              <p className="text-gray-600 font-medium">Cargando calendario...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold mb-2">Error al cargar datos</p>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <Button onClick={loadCalendarData} variant="outline">
              Reintentar
            </Button>
          </div>
        ) : filteredCalendarData ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <MonthlyCalendarGrid
              currentYear={year}
              currentMonth={month}
              data={filteredCalendarData}
              onBalanceClick={handleBalanceClick}
              onAbsenceClick={handleAbsenceClick}
              onCellClick={handleCellClick}
              activeLocationFilter={locationFilter}
              onIndividualReportClick={handleIndividualReportClick}
            />
          </div>
        ) : null}
      </div>

      {/* ======= Modales ======= */}

      {/* Modal Nueva Ausencia */}
      {calendarData && (
        <NewAbsenceModal
          isOpen={isNewAbsenceModalOpen}
          onClose={() => {
            setIsNewAbsenceModalOpen(false);
            setPrefilledDate(null);
            setPrefilledEmployeeId(null);
          }}
          onSuccess={handleNewAbsenceSuccess}
          employees={calendarData.employees}
          balances={calendarData.balances}
          calendarData={calendarData}
          prefilledDate={prefilledDate}
          prefilledEmployeeId={prefilledEmployeeId}
        />
      )}

      {/* Modal Editar Ausencia */}
      {selectedAbsenceForEdit && selectedEmployeeForEdit && calendarData && (
        <EditAbsenceModal
          isOpen={isEditAbsenceModalOpen}
          onClose={handleEditAbsenceClose}
          onSuccess={handleEditAbsenceSuccess}
          absence={selectedAbsenceForEdit}
          employee={selectedEmployeeForEdit}
          balance={calendarData.balances[selectedEmployeeForEdit.id] || null}
          calendarData={calendarData}
        />
      )}

      {/* Modal Ajustar Saldo */}
      {selectedEmployeeForBalanceData && selectedBalanceForAdjust && (
        <AdjustBalanceModal
          isOpen={isAdjustBalanceModalOpen}
          onClose={() => {
            setIsAdjustBalanceModalOpen(false);
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

      {/* ✅ NUEVO v13.1.4: Modal Configuración de Festivos */}
      {showHolidaysModal && (
        <HolidaysConfigModal
          isOpen={showHolidaysModal}
          onClose={() => setShowHolidaysModal(false)}
          onHolidaysUpdated={handleHolidaysUpdated}
        />
      )}
    </div>
  );
};
