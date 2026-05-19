import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Plane, Cake, LucideIcon } from 'lucide-react';
import { DashboardAlert } from '../../types/dashboard';

interface AlertCardProps {
  alert: DashboardAlert;
}

// Mapeo de iconos según backend
const ICON_MAP: Record<string, LucideIcon> = {
  'alert-triangle': AlertTriangle,
  'plane': Plane,
  'cake': Cake,
};

export const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const navigate = useNavigate();
  const Icon = ICON_MAP[alert.icon] || AlertTriangle;

  // Colores VERSO sagrados (del documento maestro)
  const colors = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      iconBg: 'bg-red-100',
      text: 'text-red-900',
      hover: 'hover:bg-red-100 hover:border-red-300'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200', 
      icon: 'text-[#1162a6]', // Azul corporativo VERSO exacto
      iconBg: 'bg-blue-100',
      text: 'text-gray-900',
      hover: 'hover:bg-blue-100 hover:border-blue-300'
    }
  };

  const style = colors[alert.type];

  return (
    <div
      onClick={() => navigate(alert.action_path)}
      className={`
        ${style.bg} ${style.border} ${style.hover}
        border-2 rounded-lg p-4 cursor-pointer
        transition-all duration-200 hover:shadow-md
        group
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`${style.iconBg} ${style.icon} p-2 rounded-lg`}>
          <Icon size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold text-sm ${style.text}`}>
              {alert.title}
            </h3>
            {alert.count > 0 && (
              <span className={`
                ${style.icon} text-xs font-bold px-2 py-0.5 
                rounded-full ${style.iconBg}
              `}>
                {alert.count}
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            {alert.message}
          </p>
          
          <p className="text-xs font-medium text-[#1162a6] group-hover:underline">
            Ver detalle →
          </p>
        </div>
      </div>
    </div>
  );
};
