import React, { useState, useEffect } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Truck,
  Users,
  BarChart3,
  Plus,
  TrendingUp,
  Calendar,
  Clock,
  MoreVertical,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const kpis = [
  {
    title: "Órdenes Activas",
    value: "73",
    change: "+12%",
    trend: "up",
    icon: <Truck className="w-6 h-6 text-primary-dark" />,
    bgColor: "bg-blue-50",
  },
  {
    title: "Clientes Totales",
    value: "321",
    change: "+8",
    trend: "up",
    icon: <Users className="w-6 h-6 text-green-600" />,
    bgColor: "bg-green-50",
  },
  {
    title: "Rendimiento Mes",
    value: "+5.2%",
    change: "vs mes anterior",
    trend: "up",
    icon: <BarChart3 className="w-6 h-6 text-purple-600" />,
    bgColor: "bg-purple-50",
  },
];

const recentOrders = [
  {
    id: "ORD-001",
    cliente: "Constructora ABC",
    tipo: "Arena",
    estado: "En ruta",
    tiempo: "Hace 5 min",
  },
  {
    id: "ORD-002",
    cliente: "Obras Civiles XYZ",
    tipo: "Escombros",
    estado: "Completado",
    tiempo: "Hace 1 hora",
  },
  {
    id: "ORD-003",
    cliente: "Demoliciones 2000",
    tipo: "Mixto",
    estado: "Pendiente",
    tiempo: "Hace 2 horas",
  },
];

const statusColors = {
  "En ruta": "bg-blue-100 text-blue-800",
  Completado: "bg-green-100 text-green-800",
  Pendiente: "bg-yellow-100 text-yellow-800",
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar la hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const getDisplayName = () => {
    if (user?.nombre) {
      return user.nombre;
    }
    return user?.username || "";
  };

  return (
    <div className="space-y-8">
      {/* Header con saludo personalizado */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {getDisplayName()} 👋
          </h1>
          <p className="mt-2 text-gray-600 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {currentTime.toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            -{" "}
            {currentTime.toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Button variant="primary" size="lg">
          <Plus size={20} className="mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi) => (
          <Card
            key={kpi.title}
            className="p-6 hover:shadow-xl transition-all duration-300 border-0"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${kpi.bgColor}`}>{kpi.icon}</div>
              <Button variant="ghost" size="sm" className="p-1">
                <MoreVertical size={20} />
              </Button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {kpi.title}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
                <span
                  className={`text-sm font-medium ${
                    kpi.trend === "up" ? "text-green-600" : "text-red-600"
                  } flex items-center gap-1`}
                >
                  <TrendingUp size={16} />
                  {kpi.change}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {kpi.change.includes("vs")
                  ? kpi.change
                  : `Desde el último período`}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Órdenes Recientes */}
      <Card className="overflow-hidden border-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Órdenes Recientes
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Últimas actualizaciones de tu flota
              </p>
            </div>
            <Button variant="outline" size="md">
              Ver todas
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Orden
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actualización
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {order.cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {order.tipo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[order.estado as keyof typeof statusColors]
                      }`}
                    >
                      {order.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {order.tiempo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary-dark hover:text-secondary"
                    >
                      Ver detalles
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Gráficos y estadísticas adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Actividad Semanal
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Gráfico de actividad aquí...</p>
          </div>
        </Card>

        <Card className="p-6 border-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución por Tipo
          </h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Gráfico de distribución aquí...</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
