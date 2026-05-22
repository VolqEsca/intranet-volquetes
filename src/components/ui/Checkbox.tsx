import { Check, Minus } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  className?: string;
}

export function Checkbox({ checked, indeterminate, onChange, className }: CheckboxProps) {
  const isActive = checked || indeterminate;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      onClick={onChange}
      className={`
        w-4 h-4 rounded border-2 flex items-center justify-center
        flex-shrink-0 transition-colors duration-150 bg-white
        ${isActive
          ? 'border-[#1162a6]'
          : 'border-[#1162a6]/25 hover:border-[#1162a6]/60'
        }
        ${className ?? ''}
      `}
    >
      {indeterminate
        ? <Minus size={8} className="text-[#1162a6]" strokeWidth={3} />
        : checked
        ? <Check size={8} className="text-[#1162a6]" strokeWidth={3} />
        : null}
    </button>
  );
}
