import { CSSProperties, ReactNode } from 'react';
import ReactDOM from 'react-dom';

export interface DropdownAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  rowClassName?: string;
  dividerBefore?: boolean;
}

interface PortalDropdownMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  actions: DropdownAction[];
  menuHeight?: number;
}

export function PortalDropdownMenu({ anchorEl, onClose, actions, menuHeight = 280 }: PortalDropdownMenuProps) {
  if (!anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();
  const menuWidth = 224;
  const padding = 10;

  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  let top = rect.bottom + 5;
  let left = rect.right - menuWidth;

  if (top + menuHeight > viewport.height - padding) {
    top = rect.top - menuHeight - 5;
    if (top < padding) {
      top = Math.max(padding, (viewport.height - menuHeight) / 2);
    }
  }

  if (left < padding) {
    left = rect.left;
  } else if (left + menuWidth > viewport.width - padding) {
    left = viewport.width - menuWidth - padding;
  }

  const style: CSSProperties = {
    position: 'fixed',
    top,
    left,
    zIndex: 9999,
  };

  return ReactDOM.createPortal(
    <div
      className="bg-white rounded-lg shadow-xl border border-gray-200 w-56 max-h-[80vh] overflow-y-auto"
      style={style}
    >
      <div className="py-1">
        {actions.map((action, index) => (
          <div key={action.label}>
            {action.dividerBefore && index > 0 && (
              <div className="border-t border-gray-100 my-1" />
            )}
            <button
              type="button"
              onClick={action.onClick}
              className={`group flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-600 transition-colors text-left ${action.rowClassName ?? 'hover:bg-[#a2bade]/10 hover:text-[#1162a6]'}`}
            >
              <span className="text-gray-400 group-hover:text-inherit transition-colors flex-shrink-0">
                {action.icon}
              </span>
              <span>{action.label}</span>
            </button>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}
