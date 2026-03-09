import React from 'react';
import { Theme } from '../types';

export interface RailItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface RailAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tone?: 'default' | 'danger';
}

interface SidebarEdgeToggleProps {
  side: 'left' | 'right';
  isCollapsed: boolean;
  theme: Theme;
  onToggle: () => void;
}

interface CollapsedIconRailProps {
  items: RailItem[];
  activeId: string;
  theme: Theme;
  onItemClick: (id: string) => void;
  bottomActions?: RailAction[];
}

interface SidebarTopToggleProps {
  side: 'left' | 'right';
  isCollapsed: boolean;
  theme: Theme;
  onToggle: () => void;
}

export const SidebarEdgeToggle: React.FC<SidebarEdgeToggleProps> = ({ side, isCollapsed, theme, onToggle }) => {
  const isDark = theme === 'dark';
  const isLeft = side === 'left';

  const icon = isLeft
    ? (isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />)
    : (isCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />);

  return (
    <button
      type="button"
      aria-label={isCollapsed ? 'Развернуть боковую панель' : 'Свернуть боковую панель'}
      onClick={onToggle}
      className={`absolute top-1/2 z-20 h-16 w-5 -translate-y-1/2 border flex items-center justify-center transition-colors ${
        isLeft
          ? 'right-0 translate-x-full rounded-r-md border-l-0'
          : 'left-0 -translate-x-full rounded-l-md border-r-0'
      } ${
        isDark
          ? 'bg-[#121821] border-white/10 text-zinc-400 hover:text-zinc-200'
          : 'bg-white border-zinc-300 text-zinc-500 hover:text-zinc-800'
      }`}
    >
      {icon}
    </button>
  );
};

export const CollapsedIconRail: React.FC<CollapsedIconRailProps> = ({ items, activeId, theme, onItemClick, bottomActions = [] }) => {
  const isDark = theme === 'dark';

  return (
    <nav className="h-full w-full flex flex-col items-center px-2 py-3">
      <div className="w-full flex flex-col items-center gap-2">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              title={item.label}
              onClick={() => onItemClick(item.id)}
              className={`h-9 w-9 rounded-md border flex items-center justify-center transition-colors ${
                isActive
                  ? 'text-blue-400 border-blue-500/40 bg-blue-500/10'
                  : isDark
                    ? 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/5'
                    : 'text-zinc-500 border-transparent hover:text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              {item.icon}
            </button>
          );
        })}
      </div>

      {bottomActions.length > 0 && (
        <div className={`mt-auto w-full border-t pt-3 flex flex-col items-center gap-2 ${isDark ? 'border-white/10' : 'border-zinc-200'}`}>
          {bottomActions.map((action) => (
            <button
              key={action.id}
              type="button"
              aria-label={action.label}
              title={action.label}
              onClick={action.onClick}
              className={`h-9 w-9 rounded-md border flex items-center justify-center transition-colors ${
                action.tone === 'danger'
                  ? isDark
                    ? 'text-zinc-500 border-transparent hover:text-red-300 hover:bg-red-500/10'
                    : 'text-zinc-500 border-transparent hover:text-red-600 hover:bg-red-50'
                  : isDark
                    ? 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/5'
                    : 'text-zinc-500 border-transparent hover:text-zinc-800 hover:bg-zinc-100'
              }`}
            >
              {action.icon}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

export const SidebarTopToggle: React.FC<SidebarTopToggleProps> = ({ side, isCollapsed, theme, onToggle }) => {
  const isDark = theme === 'dark';
  const isLeft = side === 'left';

  const icon = isLeft
    ? isCollapsed
      ? <ChevronRightIcon />
      : <ChevronLeftIcon />
    : isCollapsed
      ? <ChevronLeftIcon />
      : <ChevronRightIcon />;

  return (
    <button
      type="button"
      aria-label={isCollapsed ? 'Развернуть боковую панель' : 'Свернуть боковую панель'}
      onClick={onToggle}
      className={`h-7 w-7 rounded border flex items-center justify-center transition-colors ${
        isDark
          ? 'border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
          : 'border-zinc-300 text-zinc-500 hover:text-zinc-800 hover:border-zinc-400'
      }`}
    >
      {icon}
    </button>
  );
};

const ChevronLeftIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);
