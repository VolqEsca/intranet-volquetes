import React from 'react';
import { Clock, PlayCircle, CheckCircle, Truck } from 'lucide-react';

type ManufacturingStatus = 'pending' | 'in_progress' | 'completed' | 'delivered';

interface ManufacturingOrderStatusBadgeProps {
  status: ManufacturingStatus;
  size?: 'sm' | 'md';
}

const ManufacturingOrderStatusBadge: React.FC<ManufacturingOrderStatusBadgeProps> = ({ status, size = 'md' }) => {
  const config: Record<ManufacturingStatus, { label: string; color: string; icon: React.ElementType }> = {
    pending: {
      label: 'Pendiente',
      color: 'bg-[#a2bade]/20 text-[#1162a6]',
      icon: Clock
    },
    in_progress: {
      label: 'En Progreso',
      color: 'bg-[#5487c0]/20 text-[#1162a6]',
      icon: PlayCircle
    },
    completed: {
      label: 'Completada',
      color: 'bg-[#a2bade]/30 text-[#1162a6]',
      icon: CheckCircle
    },
    delivered: {
      label: 'Entregada',
      color: 'bg-[#1162a6]/10 text-[#1162a6]',
      icon: Truck
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

export default ManufacturingOrderStatusBadge;
