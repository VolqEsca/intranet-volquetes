// src/components/ui/AlertDialog.tsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'info' | 'warning' | 'error' | 'success';
  showCancel?: boolean;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'default',
  showCancel = true
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleConfirm = () => {
    onConfirm?.();
    handleClose();
  };

  const handleCancel = () => {
    onCancel?.();
    handleClose();
  };

  // Iconos según el tipo (todos usando azules corporativos)
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return (
          <div className="w-12 h-12 rounded-full bg-primary-dark/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="w-12 h-12 rounded-full bg-light-accent/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen && !isClosing) return null;

  return ReactDOM.createPortal(
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={showCancel ? handleCancel : undefined}
      />
      
      {/* Dialog */}
      <div className={`relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 ${isClosing ? 'animate-scaleOut' : 'animate-scaleIn'} max-h-[90vh] overflow-y-auto`}>
        {/* Icon */}
        <div className="flex justify-center">
          {getIcon()}
        </div>
        
        {/* Header */}
        <div className="mb-4 text-center">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        {/* Content */}
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-600 whitespace-pre-line">{description}</p>
        </div>
        
        {/* Footer */}
        <div className="flex justify-center gap-2">
          {showCancel && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-primary-dark bg-white border-2 border-primary-dark rounded-lg hover:bg-light-accent/20 hover:border-secondary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-all duration-200"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-dark rounded-lg hover:bg-secondary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-all duration-200"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AlertDialog;
