import React from 'react';
import { Clock, PlayCircle, CheckCircle, XCircle } from 'lucide-react';

interface OrderStatusBadgeProps {
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  size?: 'sm' | 'md';
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = {
    pending: {
      label: 'Pendiente',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      icon: Clock
    },
    in_progress: {
      label: 'En Proceso',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      icon: PlayCircle
    },
    completed: {
      label: 'Completada',
      color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      icon: CheckCircle
    },
    cancelled: {
      label: 'Cancelada',
      color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      icon: XCircle
    }
  };

  const { label, color, icon: Icon } = config[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${color} ${sizeClasses}`}>
      <Icon size={size === 'sm' ? 12 : 14} />
      {label}
    </span>
  );
};

export default OrderStatusBadge;
