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
      color: 'bg-[#a2bade]/20 text-[#1162a6]',
      icon: Clock
    },
    in_progress: {
      label: 'En Proceso',
      color: 'bg-[#5487c0]/15 text-[#1162a6]',
      icon: PlayCircle
    },
    completed: {
      label: 'Completada',
      color: 'bg-[#a2bade]/20 text-[#1162a6]',
      icon: CheckCircle
    },
    cancelled: {
      label: 'Cancelada',
      color: 'bg-[#dc2626]/10 text-[#dc2626]',
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
