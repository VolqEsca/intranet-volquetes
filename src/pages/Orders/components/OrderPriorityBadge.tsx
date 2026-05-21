import React from 'react';
import { AlertTriangle, AlertCircle, Info, Minus } from 'lucide-react';

interface OrderPriorityBadgeProps {
  priority: 'low' | 'normal' | 'high' | 'urgent';
  size?: 'sm' | 'md';
}

const OrderPriorityBadge: React.FC<OrderPriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const config = {
    low: {
      label: 'Baja',
      color: 'bg-gray-100 text-gray-600',
      icon: Minus
    },
    normal: {
      label: 'Normal',
      color: 'bg-[#a2bade]/20 text-[#5487c0]',
      icon: Info
    },
    high: {
      label: 'Alta',
      color: 'bg-[#a2bade]/20 text-[#1162a6]',
      icon: AlertCircle
    },
    urgent: {
      label: 'Urgente',
      color: 'bg-[#dc2626]/10 text-[#dc2626]',
      icon: AlertTriangle
    }
  };

  const { label, color, icon: Icon } = config[priority];
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${color} ${sizeClasses}`}>
      <Icon size={size === 'sm' ? 12 : 14} />
      {label}
    </span>
  );
};

export default OrderPriorityBadge;
