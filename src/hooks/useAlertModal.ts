// src/hooks/useAlertModal.ts
// Hook que reemplaza dialog.service.tsx — sin manipulación manual del DOM.
// El caller renderiza { modal } en su árbol React.
//
// Uso:
//   const { confirm, modal } = useAlertModal()
//   const ok = await confirm({ title: '...', description: '...', variant: 'danger' })
//   return <>{/* contenido */}{modal}</>
import { useState, useRef } from 'react'
import React from 'react'
import { ConfirmModal } from '../components/ui/ConfirmModal'

interface ConfirmOptions {
  title: string
  description: string
  variant?: 'danger' | 'warning' | 'info'
  confirmLabel?: string
  cancelLabel?: string
}

export function useAlertModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  // useRef evita problemas de stale closure con la Promise resolve
  const resolveRef = useRef<(value: boolean) => void>(() => {})

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setOptions(opts)
      setIsOpen(true)
    })
  }

  const handleConfirm = () => {
    setIsOpen(false)
    resolveRef.current(true)
  }

  const handleCancel = () => {
    setIsOpen(false)
    resolveRef.current(false)
  }

  // React.createElement en lugar de JSX para mantener extensión .ts
  const modal = options
    ? React.createElement(ConfirmModal, {
        isOpen,
        onClose: handleCancel,
        onConfirm: handleConfirm,
        title: options.title,
        description: options.description,
        variant: options.variant,
        confirmLabel: options.confirmLabel,
        cancelLabel: options.cancelLabel,
      })
    : null

  return { confirm, modal }
}
