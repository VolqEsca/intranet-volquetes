// src/components/ui/Sheet.tsx
import React, { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { X } from 'lucide-react'

interface SheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  footer?: React.ReactNode
}

const SIZE_CLASSES: Record<NonNullable<SheetProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
}

export const Sheet: React.FC<SheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
}) => {
  // mounted controla si el DOM existe; visible controla la posición animada
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      // Doble RAF: primer frame monta el DOM, segundo frame activa la transición
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true)
          panelRef.current?.focus()
        })
      })
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!mounted) return null

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex justify-end" style={{ zIndex: 50 }}>
      {/* Overlay oscuro — click cierra */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Panel lateral — desliza desde la derecha */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          'relative flex flex-col bg-white shadow-xl h-full',
          'w-full', SIZE_CLASSES[size],
          'transform transition-transform duration-300 ease-in-out outline-none',
          visible ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        style={{ zIndex: 51 }}
      >
        {/* Header fijo */}
        <div className="flex-shrink-0 flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 leading-tight">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar panel"
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1.5 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo con scroll propio */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer fijo — solo si se pasa el prop */}
        {footer && (
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
