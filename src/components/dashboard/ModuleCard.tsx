import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon, Star, ArrowUpRight } from 'lucide-react';
import { useFavorites } from '../../hooks/useFavorites';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  kpiValue?: number;
  kpiLabel?: string;
  context?: (string | React.ReactNode)[]; // 🆕 Soporte para elementos interactivos
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  icon: Icon,
  path,
  kpiValue,
  kpiLabel,
  context
}) => {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(path);

  return (
    <div 
      onClick={() => navigate(path)} // 🔄 Navegación principal (ej: /employees)
      className="group relative bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm hover:shadow-sm hover:border-[#1162a6]/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      {/* Header: Icono y Estrella - SIN CAMBIOS */}
      <div className="flex justify-between items-start mb-5">
        <div className="p-3 rounded-xl bg-gray-50 group-hover:bg-[#1162a6] transition-all duration-300 shadow-sm">
          <Icon size={24} className="text-[#1162a6] group-hover:text-white transition-colors" />
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); toggleFavorite(path); }} 
          className="p-2 rounded-full hover:bg-gray-50 transition-all hover:scale-110"
          title={favorite ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <Star 
            size={18} 
            className={`transition-all ${favorite ? 'fill-[#1162a6] text-[#1162a6] scale-110' : 'text-gray-300 group-hover:text-gray-400'}`} 
          />
        </button>
      </div>

      {/* KPI prominente - SIN CAMBIOS */}
      {kpiValue !== undefined && (
        <div className="mb-5">
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-bold text-gray-900 group-hover:text-[#1162a6] transition-colors tracking-tight">
              {kpiValue}
            </div>
            <div className="px-2 py-1 bg-gray-100 group-hover:bg-[#1162a6]/10 rounded-lg transition-colors">
              <span className="text-xs font-bold text-gray-500 group-hover:text-[#1162a6] uppercase tracking-wider transition-colors">
                {kpiLabel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Contexto con soporte para elementos interactivos */}
      {context && context.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {context.map((line, index) => (
            <div key={index} className="text-sm">
              {/* Si es string, renderizado simple con punto */}
              {typeof line === 'string' ? (
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover:bg-[#1162a6] transition-colors"></div>
                  <span className="text-gray-600 group-hover:text-gray-700 font-medium transition-colors">
                    {line}
                  </span>
                </div>
              ) : (
                // Si es ReactNode, renderizado directo (con navegación propia)
                line
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer - SIN CAMBIOS */}
      <div className="flex items-end justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#1162a6] transition-colors mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-500 font-medium leading-relaxed">
            {description}
          </p>
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          <ArrowUpRight size={20} className="text-[#1162a6]" />
        </div>
      </div>
    </div>
  );
};
