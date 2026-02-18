
import React, { useState, useEffect } from 'react';
import { Theme } from '../types';

interface StatusBarProps {
  isVoiceActive: boolean;
  setIsVoiceActive: (active: boolean) => void;
  lastAction: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  theme: Theme;
}

const StatusBar: React.FC<StatusBarProps> = ({ 
  isVoiceActive, 
  setIsVoiceActive, 
  lastAction, 
  currentPage, 
  totalPages,
  onPageChange,
  theme 
}) => {
  const isDark = theme === 'dark';
  const [saveCountdown, setSaveCountdown] = useState(10);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSaveCountdown((prev) => {
        if (prev <= 1) {
          setIsSaving(true);
          setTimeout(() => setIsSaving(false), 2000);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <footer className={`h-8 border-t flex items-center justify-between px-3 text-[10px] font-medium z-50 transition-colors relative ${isDark ? 'bg-[#111] border-white/10 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-500'}`}>
      {/* Левая часть: Статус системы и Автосохранение */}
      <div className="flex items-center gap-4 min-w-[200px]">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          <span className="uppercase tracking-tighter font-bold">Система готова</span>
        </div>
        
        <div className={`h-3 w-px flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />
        
        {/* Блок автосохранения */}
        <div className={`flex items-center gap-2 transition-all duration-500 ${isSaving ? 'text-blue-500' : ''}`}>
          <div className={`relative ${isSaving ? 'animate-bounce' : ''}`}>
            <SaveIcon active={isSaving} />
            {isSaving && <div className="absolute inset-0 animate-ping opacity-50"><SaveIcon active /></div>}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`uppercase tracking-tighter text-[9px] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
              {isSaving ? 'Сохранение...' : 'Автосохранение:'}
            </span>
            <span className={`font-mono font-black ${isDark ? (isSaving ? 'text-blue-400' : 'text-zinc-400') : (isSaving ? 'text-blue-600' : 'text-zinc-700')}`}>
              {isSaving ? 'OK' : `${saveCountdown}с`}
            </span>
          </div>
        </div>
      </div>

      {/* Центральная часть: Навигация по страницам */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-1 text-[9px] uppercase font-bold tracking-tight ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          <FileIcon />
          <span>Документ, страница</span>
        </div>

        <div className={`flex items-center rounded-md border overflow-hidden h-6 shadow-sm transition-all ${isDark ? 'bg-zinc-900 border-white/10 hover:border-blue-500/30' : 'bg-white border-zinc-300 hover:border-blue-400'}`}>
          <button 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            title="Предыдущая страница"
            className={`px-2 h-full border-r transition-colors flex items-center justify-center ${isDark ? 'border-white/5 hover:bg-zinc-800 disabled:opacity-20 text-zinc-400' : 'border-zinc-200 hover:bg-zinc-100 disabled:opacity-30 text-zinc-500'}`}
          >
            <ChevronLeftIcon />
          </button>
          
          <div className={`px-4 h-full flex items-center text-[10px] font-mono font-black min-w-[70px] justify-center tracking-tighter ${isDark ? 'text-blue-400 bg-blue-500/5' : 'text-blue-600 bg-blue-50/50'}`}>
            {currentPage} / {totalPages}
          </div>

          <button 
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            title="Следующая страница"
            className={`px-2 h-full border-l transition-colors flex items-center justify-center ${isDark ? 'border-white/5 hover:bg-zinc-800 disabled:opacity-20 text-zinc-400' : 'border-zinc-200 hover:bg-zinc-100 disabled:opacity-30 text-zinc-500'}`}
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {/* Правая часть: Голос и Метрики */}
      <div className="flex items-center gap-4 min-w-[200px] justify-end">
        <button 
          onClick={() => setIsVoiceActive(!isVoiceActive)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all active:scale-95 ${
            isVoiceActive ? 'bg-red-500/10 text-red-500 font-bold' : (isDark ? 'hover:bg-white/5 text-zinc-500 hover:text-zinc-300' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800')
          }`}
        >
          <MicIcon active={isVoiceActive} />
          <span className="uppercase tracking-widest">{isVoiceActive ? 'СЛУШАЮ И ПОВИНУЮСЬ' : 'Голос: Ожидание'}</span>
        </button>

        <div className={`h-3 w-px ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className={isDark ? 'text-zinc-600' : 'text-zinc-400'}>Задержка:</span>
            <span className={`font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-800'}`}>14мс</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={isDark ? 'text-zinc-600' : 'text-zinc-400'}>GPU:</span>
            <span className="font-mono text-green-500">22%</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SaveIcon = ({ active }: { active?: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={active ? 'text-blue-500' : 'opacity-40'}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const FileIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const MicIcon = ({ active }: { active: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? 'animate-pulse' : ''}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);

export default StatusBar;
