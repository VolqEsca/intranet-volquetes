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
      color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
      icon: Minus
    },
    normal: {
      label: 'Normal',
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
      icon: Info
    },
    high: {
      label: 'Alta',
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
      icon: AlertCircle
    },
    urgent: {
      label: 'Urgente',
      color: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400',
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
