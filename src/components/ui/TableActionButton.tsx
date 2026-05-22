import { ReactNode } from 'react';
import { Button } from './Button';

type ActionVariant = 'primary' | 'danger';

interface TableActionButtonProps {
  variant?: ActionVariant;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: ReactNode;
}

export function TableActionButton({
  variant = 'primary',
  onClick,
  title,
  disabled,
  children,
}: TableActionButtonProps) {
  const cls = variant === 'danger'
    ? 'text-gray-400 hover:text-[#dc2626] hover:bg-[#dc2626]/10'
    : 'text-gray-400 hover:text-[#1162a6] hover:bg-[#a2bade]/10';

  return (
    <Button variant="ghost" size="icon" onClick={onClick} title={title} disabled={disabled} className={cls}>
      {children}
    </Button>
  );
}
