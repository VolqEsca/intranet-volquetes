import React from 'react';
import { PaginationData } from '../../types/pagination';

interface PaginationNavProps {
  data: PaginationData;
  onChange: (page: number) => void;
  entityLabel?: string;
}

const BTN_BASE =
  'px-4 py-2 bg-white text-sm font-medium text-[#1162a6] hover:bg-[#a2bade]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

export const PaginationNav: React.FC<PaginationNavProps> = ({
  data,
  onChange,
  entityLabel = 'registros',
}) => {
  const { currentPage, totalPages, total, limit } = data;
  const visibleCount = Math.min(limit, Math.max(0, total - (currentPage - 1) * limit));

  const prev = () => onChange(Math.max(1, currentPage - 1));
  const next = () => onChange(Math.min(totalPages, currentPage + 1));

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border border-[#e2e8f0] rounded-xl sm:px-6">
      {/* Mobile */}
      <div className="flex-1 flex justify-between sm:hidden">
        <span className="text-sm text-gray-700">
          Página {currentPage} de {totalPages}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              disabled={currentPage <= 1}
              className="inline-flex items-center px-4 py-2 border border-[#e2e8f0] rounded-lg bg-white text-sm font-medium text-[#1162a6] hover:bg-[#a2bade]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={next}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center px-4 py-2 border border-[#e2e8f0] rounded-lg bg-white text-sm font-medium text-[#1162a6] hover:bg-[#a2bade]/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          Mostrando{' '}
          <span className="font-medium">{visibleCount}</span> de{' '}
          <span className="font-medium">{total}</span> {entityLabel}
        </p>
        {totalPages > 1 && (
          <nav className="inline-flex rounded-lg border border-[#e2e8f0] overflow-hidden">
            <button onClick={prev} disabled={currentPage <= 1} className={`${BTN_BASE} border-r border-[#e2e8f0]`}>
              Anterior
            </button>
            <div className="px-4 py-2 bg-white text-sm font-medium text-gray-700 border-r border-[#e2e8f0] select-none">
              {currentPage} / {totalPages}
            </div>
            <button onClick={next} disabled={currentPage >= totalPages} className={BTN_BASE}>
              Siguiente
            </button>
          </nav>
        )}
      </div>
    </div>
  );
};
