// src/components/ui/ConfirmModal.tsx
import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { AlertTriangle, Info } from 'lucide-react'
import { Button } from './Button'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  variant?: 'danger' | 'warning' | 'info'
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
}

type VariantCfg = {
  Icon: React.ElementType
  iconColor: string
  iconBg: string
  btnVariant: 'primary' | 'destructive'
}

// Configuración visual por variante
const VARIANTS: Record<NonNullable<ConfirmModalProps['variant']>, VariantCfg> = {
  danger: {
    Icon: AlertTriangle,
    iconColor: 'text-[#dc2626]',
    iconBg:    'bg-[#dc2626]/10',
    btnVariant: 'destructive',
  },
  warning: {
    Icon: AlertTriangle,
    iconColor: 'text-[#dc2626]/70',
    iconBg:    'bg-[#dc2626]/5',
    btnVariant: 'primary',
  },
  info: {
    Icon: Info,
    iconColor: 'text-[#1162a6]',
    iconBg:    'bg-[#1162a6]/10',
    btnVariant: 'primary',
  },
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  variant = 'info',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isLoading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose, isLoading])

  if (!isOpen) return null

  const { Icon, iconColor, iconBg, btnVariant } = VARIANTS[variant]

  return ReactDOM.createPortal(
    // z-[60] — siempre por encima de Sheet (z-[51]) y Modal (z-50)
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 60 }}>
      {/* Overlay — click cierra si no hay operación en curso */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Panel centrado */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Icono con fondo tonal */}
        <div className="flex justify-center mb-4">
          <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={2} />
          </div>
        </div>

        {/* Título */}
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          {title}
        </h3>

        {/* Descripción */}
        <p className="text-sm text-gray-600 text-center mb-6 whitespace-pre-line">
          {description}
        </p>

        {/* Acciones */}
        <div className="flex justify-center gap-3">
          <Button variant="subtle" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={btnVariant} onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
