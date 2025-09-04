import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, size = 'max-w-2xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center py-8 px-4">
        {/* Backdrop con un toque de blur sutil */}
        <div 
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-[2px] transition-opacity" 
          onClick={onClose} 
        />
        
        {/* Modal con bordes redondeados CONSISTENTES */}
        <div className={`relative bg-white rounded-xl shadow-xl ${size} w-full transform transition-all ring-1 ring-black/5 overflow-hidden`}>
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1.5 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
