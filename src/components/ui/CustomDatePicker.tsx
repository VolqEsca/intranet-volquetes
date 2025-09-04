// src/components/ui/CustomDatePicker.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  error?: boolean;
  required?: boolean;
  label?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ 
  value, 
  onChange, 
  min, 
  max,
  placeholder = "dd/mm/aaaa",
  error = false,
  required = false,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const shortDaysOfWeek = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Ajustar el mes mostrado cuando cambia el valor
  useEffect(() => {
    if (value) {
      const date = parseDate(value);
      if (date) {
        setDisplayMonth(new Date(date.getFullYear(), date.getMonth()));
      }
    }
  }, [value]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = parseDate(dateString);
    if (!date) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };

  const handleDateClick = (date: Date) => {
    onChange(formatDate(date));
    setIsOpen(false);
    
    // Animar el cierre
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const selectedDate = parseDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = min ? parseDate(min) : null;
  const maxDate = max ? parseDate(max) : null;

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const changeMonth = (increment: number) => {
    const newMonth = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + increment);
    setDisplayMonth(newMonth);
  };

  const changeYear = (year: number) => {
    setDisplayMonth(new Date(year, displayMonth.getMonth()));
  };

  // Generar años para el selector
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 50 + i);

  // Navegación con teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-secondary">*</span>}
        </label>
      )}
      
      <div className="relative" ref={calendarRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={formatDisplayDate(value)}
            placeholder={placeholder}
            readOnly
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full px-3 py-2.5 pr-10 border rounded-lg cursor-pointer bg-white
              transition-all duration-200
              ${error 
                ? 'border-secondary focus:border-secondary focus:ring-secondary' 
                : 'border-gray-300 hover:border-gray-400 focus:border-primary-dark'
              }
              focus:outline-none focus:ring-2 focus:ring-primary-dark/20`}
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-0 top-0 h-full px-3 flex items-center justify-center
                     text-gray-400 hover:text-primary-dark transition-colors"
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>

        {/* Calendario desplegable */}
        {isOpen && (
          <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl 
                        animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="p-4">
              {/* Header con navegación */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors
                           text-gray-600 hover:text-primary-dark"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <div className="flex items-center gap-2">
                  <select
                    value={displayMonth.getMonth()}
                    onChange={(e) => setDisplayMonth(new Date(displayMonth.getFullYear(), parseInt(e.target.value)))}
                    className="text-sm font-medium text-gray-900 bg-transparent 
                             hover:bg-gray-100 rounded px-2 py-1 cursor-pointer
                             focus:outline-none focus:ring-2 focus:ring-primary-dark/20"
                  >
                    {months.map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                  
                  <select
                    value={displayMonth.getFullYear()}
                    onChange={(e) => changeYear(parseInt(e.target.value))}
                    className="text-sm font-medium text-gray-900 bg-transparent 
                             hover:bg-gray-100 rounded px-2 py-1 cursor-pointer
                             focus:outline-none focus:ring-2 focus:ring-primary-dark/20"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors
                           text-gray-600 hover:text-primary-dark"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {(window.innerWidth < 400 ? shortDaysOfWeek : daysOfWeek).map((day, index) => (
                  <div 
                    key={index} 
                    className="text-center text-xs font-medium text-gray-500 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(displayMonth).map((date, index) => {
                  if (!date) {
                    return <div key={index} className="p-2" />;
                  }

                  const isSelected = selectedDate && 
                    date.getDate() === selectedDate.getDate() &&
                    date.getMonth() === selectedDate.getMonth() &&
                    date.getFullYear() === selectedDate.getFullYear();

                  const isToday = date.toDateString() === today.toDateString();
                  const isDisabled = isDateDisabled(date);
                  const isHovered = hoveredDate && 
                    date.getDate() === hoveredDate.getDate() &&
                    date.getMonth() === hoveredDate.getMonth() &&
                    date.getFullYear() === hoveredDate.getFullYear();

                    return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => !isDisabled && handleDateClick(date)}
                          onMouseEnter={() => setHoveredDate(date)}
                          onMouseLeave={() => setHoveredDate(null)}
                          disabled={isDisabled}
                          className={`
                            relative p-2 text-sm rounded-lg transition-all duration-150
                            ${isSelected 
                              ? 'bg-primary-dark text-white font-semibold shadow-sm' 
                              : isToday
                              ? 'bg-primary-50 text-primary-dark font-semibold'
                              : isHovered && !isDisabled
                              ? 'bg-gray-100 text-gray-900'
                              : 'hover:bg-gray-100 text-gray-700'
                            }
                            ${isDisabled 
                              ? 'text-gray-300 cursor-not-allowed opacity-50' 
                              : 'cursor-pointer'
                            }
                            ${isSelected && isToday ? 'ring-2 ring-primary-dark ring-offset-2' : ''}
                          `}
                          aria-label={`${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`}
                          aria-selected={isSelected || undefined}  // 👈 Aquí está el cambio
                          aria-disabled={isDisabled}
                        >
                          {date.getDate()}
                          {isToday && !isSelected && (
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 
                                          w-1 h-1 bg-primary-dark rounded-full" />
                          )}
                        </button>
                      );
                })}
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    onChange(formatDate(today));
                    setDisplayMonth(today);
                    setIsOpen(false);
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-primary-dark 
                           hover:bg-primary-50 rounded-lg transition-colors"
                >
                  Hoy
                </button>
                
                <div className="flex gap-2">
                  {value && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange('');
                        setIsOpen(false);
                      }}
                      className="px-3 py-1.5 text-sm text-gray-600 
                               hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 text-sm text-gray-600 
                             hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Texto de ayuda */}
      {!value && !error && (
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <span className="inline-block w-1 h-1 bg-primary-dark rounded-full animate-pulse"></span>
          Haz clic para seleccionar una fecha
        </p>
      )}
    </div>
  );
};

export default CustomDatePicker;