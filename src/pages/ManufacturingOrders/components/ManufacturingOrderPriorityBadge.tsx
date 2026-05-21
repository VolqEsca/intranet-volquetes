import React from 'react';
import { Minus, AlertCircle, AlertTriangle } from 'lucide-react';

type ManufacturingPriority = 'low' | 'medium' | 'high';

interface ManufacturingOrderPriorityBadgeProps {
  priority: ManufacturingPriority;
  size?: 'sm' | 'md';
}

const ManufacturingOrderPriorityBadge: React.FC<ManufacturingOrderPriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const config: Record<ManufacturingPriority, { label: string; color: string; icon: React.ElementType }> = {
    low: {
      label: 'Baja',
      color: 'bg-[#a2bade]/10 text-[#5487c0]',
      icon: Minus
    },
    medium: {
      label: 'Media',
      color: 'bg-[#a2bade]/20 text-[#1162a6]',
      icon: AlertCircle
    },
    high: {
      label: 'Alta',
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

export default ManufacturingOrderPriorityBadge;
