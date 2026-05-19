import React, { useState, useEffect } from "react";
import { Calendar, Wrench, Factory, Users, Calendar as CalendarIcon, Settings, RefreshCw, AlertCircle, ArrowRight, ExternalLink } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { useNavigate } from "react-router-dom";
import { ModuleCard } from "../../components/dashboard/ModuleCard";

export const DashboardPage = () => {
  const { user } = useAuth();
  const { stats, loading, error, refresh } = useDashboardStats();
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const getDisplayName = () => {
    if (user?.nombre) return user.nombre;
    return user?.username || "";
  };

  // 🆕 Helper para generar contexto de empleados con navegación dual
  const getEmployeesContext = () => {
    if (!stats || stats.kpis.employees_absent_today === 0) {
      return ["0 ausentes hoy"];
    }

    const detail = stats.kpis.employees_absent_detail;
    if (!detail || detail.length === 0) {
      return [`${stats.kpis.employees_absent_today} ausentes hoy`];
    }

    // Crear elementos interactivos para cada ausencia
    const contextItems: (string | React.ReactNode)[] = [
      `${stats.kpis.employees_absent_today} ausentes hoy:`
    ];

    // Añadir cada empleado como elemento clicable
    detail.forEach((absence, index) => {
      const firstName = absence.full_name.split(' ')[0]; // Solo primer nombre para brevedad
      contextItems.push(
        <div 
          key={`absence-${index}`}
          onClick={(e) => {
            e.stopPropagation(); // 🛑 Prevenir navegación principal
            navigate('/vacations'); // 🚀 Ir al calendario de vacaciones
          }}
          className="flex items-center gap-2 cursor-pointer hover:text-[#1162a6] transition-colors group/absence p-1 -mx-1 rounded"
          title="Ver en calendario de vacaciones"
        >
          <div className="w-1 h-1 rounded-full bg-[#1162a6] group-hover/absence:bg-[#0d4d85]"></div>
          <span className="font-medium">
            {firstName} ({absence.tipo_legible})
          </span>
          <ExternalLink size={12} className="opacity-0 group-hover/absence:opacity-100 transition-opacity text-[#1162a6]" />
        </div>
      );
    });

    return contextItems;
  };

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
      <div className="max-w-[1800px] mx-auto px-8 py-10">
        
        {/* Header - PRESERVADO INTACTO */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-[#0f172a] tracking-tight mb-3">
              {getGreeting()}, {getDisplayName()} 👋
            </h1>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 text-sm font-medium shadow-sm">
                <Calendar size={14} className="text-[#1162a6]" />
                <span className="capitalize">
                  {currentTime.toLocaleDateString("es-ES", { 
                    weekday: "long", 
                    day: "numeric", 
                    month: "long" 
                  })}
                </span>
              </span>
              <span className="text-sm text-gray-500 font-medium">
                Panel de control de operaciones
              </span>
            </div>
          </div>
          
          <button 
            onClick={refresh} 
            disabled={loading} 
            className="group p-3 bg-white hover:bg-[#1162a6] border border-gray-200 hover:border-[#1162a6] rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
            title="Actualizar datos"
          >
            <RefreshCw 
              size={20} 
              className={`text-gray-400 group-hover:text-white transition-colors ${loading ? 'animate-spin' : ''}`} 
            />
          </button>
        </div>

        {/* Estados de carga/error - PRESERVADOS */}
        {loading && !stats && (
          <div className="flex justify-center py-20">
            <div className="relative">
              <RefreshCw className="w-8 h-8 text-[#1162a6] animate-spin" />
            </div>
          </div>
        )}

        {error && (
          <div className="relative overflow-hidden bg-white border-l-4 border-[#1162a6] rounded-r-xl p-5 shadow-sm flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-[#1162a6]/10 rounded-lg">
                <AlertCircle size={20} className="text-[#1162a6]" />
              </div>
              <p className="text-gray-700 font-medium">{error}</p>
            </div>
            <button 
              onClick={refresh} 
              className="px-4 py-2 text-sm font-bold text-white bg-[#1162a6] hover:bg-[#0d4d85] rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Contenido principal */}
        {stats && (
          <div className="space-y-10">
            
            {/* Alertas críticas - PRESERVADAS INTACTAS */}
            {stats.alerts.length > 0 && (
              <div className="space-y-4">
                {stats.alerts.map((alert, index) => {
                  const isCritical = alert.type === 'critical';
                  return (
                    <div 
                      key={index}
                      onClick={() => navigate(alert.action_path)}
                      className="group relative overflow-hidden bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#1162a6]/30 transition-all cursor-pointer"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isCritical ? 'bg-red-500' : 'bg-[#1162a6]'}`}></div>
                      
                      <div className="flex items-center gap-4 pl-3">
                        <div className={`p-2.5 rounded-lg ${isCritical ? 'bg-red-50' : 'bg-[#1162a6]/5'} group-hover:scale-105 transition-transform`}>
                          <AlertCircle size={20} className={isCritical ? 'text-red-600' : 'text-[#1162a6]'} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-bold text-base ${isCritical ? 'text-red-600' : 'text-[#1162a6]'}`}>
                              {alert.title}
                            </span>
                            {alert.count > 0 && (
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isCritical ? 'bg-red-100 text-red-700' : 'bg-[#1162a6]/10 text-[#1162a6]'}`}>
                                {alert.count}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                        </div>
                        <ArrowRight size={18} className="text-gray-300 group-hover:text-[#1162a6] group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 🆕 Grid Cards Inteligentes v14.3.2 con navegación dual */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              
              {/* Card 1: Órdenes de Reparación - SIN CAMBIOS */}
              <ModuleCard 
                title="Órdenes de Reparación" 
                description="Gestión de taller y mecánica" 
                icon={Wrench} 
                path="/orders" 
                kpiValue={stats.kpis.or_active} 
                kpiLabel="ACTIVAS"
                context={[
                  `${stats.kpis.or_critical} críticas ${stats.kpis.or_critical > 0 ? '⚠️' : ''}`,
                  `${stats.kpis.or_in_progress} en progreso`
                ]}
              />

              {/* Card 2: Órdenes de Fabricación - SIN CAMBIOS */}
              <ModuleCard 
                title="Órdenes de Fabricación" 
                description="Carrocería y proyectos" 
                icon={Factory} 
                path="/manufacturing-orders" 
                kpiValue={stats.kpis.of_active} 
                kpiLabel="ACTIVAS"
                context={[
                  `${stats.kpis.of_pending} pendientes`,
                  `${stats.kpis.of_in_progress} en progreso`
                ]}
              />

              {/* 🆕 Card 3: Empleados con navegación dual inteligente */}
              <ModuleCard 
                title="Empleados" 
                description="Plantilla activa" 
                icon={Users} 
                path="/employees"
                kpiValue={stats.kpis.employees_total} 
                kpiLabel="ACTIVOS"
                context={getEmployeesContext()}
              />

              {/* 🆕 Card 4: Vacaciones con descripción limpia */}
              <ModuleCard 
                title="Gestión de Vacaciones" 
                description="Calendario y ausencias" 
                icon={CalendarIcon} 
                path="/vacations"
                kpiValue={stats.kpis.employees_absent_today}
                kpiLabel="HOY"
                context={[
                  `${stats.kpis.employees_negative_balance} saldos negativos`,
                  `${stats.kpis.vacations_historical_total} históricas`
                ]}
              />

              {/* Card 5: Configuración - SIN CAMBIOS */}
              <ModuleCard 
                title="Configuración" 
                description="Ajustes del sistema" 
                icon={Settings} 
                path="/configuracion" 
              />

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
