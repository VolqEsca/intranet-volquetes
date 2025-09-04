// src/services/dialog.service.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import AlertDialog from '../components/ui/AlertDialog';

interface DialogOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'info' | 'warning' | 'error' | 'success';
}

class DialogService {
  private createDialog(
    options: DialogOptions,
    showCancel: boolean = true
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      const root = ReactDOM.createRoot(div);

      const cleanup = () => {
        root.unmount();
        document.body.removeChild(div);
      };

      const DialogWrapper = () => {
        const [isOpen, setIsOpen] = React.useState(true);

        const handleConfirm = () => {
          setIsOpen(false);
          setTimeout(() => {
            cleanup();
            resolve(true);
          }, 300);
        };

        const handleCancel = () => {
          setIsOpen(false);
          setTimeout(() => {
            cleanup();
            resolve(false);
          }, 300);
        };

        return (
          <AlertDialog
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title={options.title}
            description={options.description}
            confirmText={options.confirmText}
            cancelText={options.cancelText}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            variant={options.variant}
            showCancel={showCancel}
          />
        );
      };

      root.render(<DialogWrapper />);
    });
  }

  alert(message: string, title: string = 'Alerta'): Promise<void> {
    return this.createDialog(
      {
        title,
        description: message,
        confirmText: 'Aceptar',
        variant: 'warning'
      },
      false
    ).then(() => undefined);
  }

  info(message: string, title: string = 'Información'): Promise<void> {
    return this.createDialog(
      {
        title,
        description: message,
        confirmText: 'Aceptar',
        variant: 'info'
      },
      false
    ).then(() => undefined);
  }

  confirm(
    message: string,
    title: string = 'Confirmar acción',
    options?: Partial<DialogOptions>
  ): Promise<boolean> {
    return this.createDialog(
      {
        title,
        description: message,
        confirmText: options?.confirmText || 'Confirmar',
        cancelText: options?.cancelText || 'Cancelar',
        variant: options?.variant || 'default'
      },
      true
    );
  }

  success(message: string, title: string = 'Operación Exitosa'): Promise<void> {
    return this.createDialog(
      {
        title,
        description: message,
        confirmText: 'Aceptar',
        variant: 'success'
      },
      false
    ).then(() => undefined);
  }

  error(message: string, title: string = 'Error'): Promise<void> {
    return this.createDialog(
      {
        title,
        description: message,
        confirmText: 'Aceptar',
        variant: 'error'
      },
      false
    ).then(() => undefined);
  }

  warning(message: string, title: string = 'Advertencia'): Promise<void> {
    return this.createDialog(
      {
        title,
        description: message,
        confirmText: 'Aceptar',
        variant: 'warning'
      },
      false
    ).then(() => undefined);
  }
}

export const dialog = new DialogService();
