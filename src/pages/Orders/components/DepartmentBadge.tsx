import React from 'react';
import { Wrench, Zap, Droplet } from 'lucide-react';

interface DepartmentBadgeProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md';
}

const DepartmentBadge: React.FC<DepartmentBadgeProps> = ({ name, color, size = 'md' }) => {
  const getIcon = () => {
    switch (name.toLowerCase()) {
      case 'hidráulica':
        return Droplet;
      case 'electricidad':
        return Zap;
      case 'taller':
      default:
        return Wrench;
    }
  };

  const Icon = getIcon();
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <span 
      className={`inline-flex items-center gap-1 font-medium rounded-full text-white ${sizeClasses}`}
      style={{ backgroundColor: color || '#6B7280' }}
    >
      <Icon size={iconSize} />
      {name}
    </span>
  );
};

export default DepartmentBadge;
