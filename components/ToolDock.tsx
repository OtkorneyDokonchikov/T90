
import React from 'react';
import { ToolType, Theme } from '../types';

interface ToolDockProps {
  activeTool: ToolType;
  onToolSelect: (tool: ToolType) => void;
  theme: Theme;
  showRulers: boolean;
  isPortrait: boolean;
  onPortraitToggle: () => void;
}

const toolLabels: Record<ToolType, string> = {
  [ToolType.SELECT]: 'Выбор',
  [ToolType.SELECTION]: 'Выделение',
  [ToolType.CROP]: 'Обрезка',
  [ToolType.ROTATE]: 'Поворот',
  [ToolType.DODGE]: 'Осветление',
  [ToolType.BURN]: 'Затемнение',
  [ToolType.TEXT]: 'Текст'
};

const ToolDock: React.FC<ToolDockProps> = ({ 
  activeTool, 
  onToolSelect, 
  theme,
  showRulers,
  isPortrait,
  onPortraitToggle
}) => {
  const isDark = theme === 'dark';
  const tools = [
    { type: ToolType.SELECT, icon: <PointerIcon /> },
    { type: ToolType.SELECTION, icon: <SelectionIcon /> },
    { type: ToolType.CROP, icon: <CropIcon /> },
    { type: ToolType.ROTATE, icon: <RotateIcon /> },
    { type: ToolType.DODGE, icon: <HalfCircleIcon /> },
    { type: ToolType.BURN, icon: <MoonToolIcon /> },
    { type: ToolType.TEXT, icon: <TextIcon /> },
  ];

  const topPosition = 'top-[48px]';

  return (
    <div className={`absolute ${topPosition} left-1/2 -translate-x-1/2 flex items-center gap-1.5 backdrop-blur-2xl border p-1.5 rounded-2xl shadow-2xl z-40 transition-all duration-500 ease-in-out ${isDark ? 'bg-[#181818]/95 border-white/10' : 'bg-white/95 border-zinc-200'}`}>
      <div className="flex items-center gap-0.5">
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => onToolSelect(tool.type)}
            className={`p-1.5 rounded-xl transition-all group relative active:scale-90 ${
              activeTool === tool.type 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                : (isDark ? 'text-zinc-500 hover:text-white hover:bg-white/5' : 'text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100')
            }`}
          >
            {tool.icon}
            <div className={`absolute top-full mt-3 left-1/2 -translate-x-1/2 px-2 py-1 text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border z-50 ${isDark ? 'bg-zinc-800 text-white border-white/10' : 'bg-white text-zinc-800 border-zinc-200 shadow-xl'}`}>
              {toolLabels[tool.type]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const PointerIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>;
const SelectionIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3"/></svg>;
const CropIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>;
const RotateIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><polyline points="21 3 21 8 16 8"/></svg>;

const HalfCircleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/>
    <path d="M12 3v18" strokeWidth="2"/>
    <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>
  </svg>
);

const MoonToolIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" fillOpacity="0.2"/>
  </svg>
);

const TextIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>;

export default ToolDock;
