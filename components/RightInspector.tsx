import React, { useEffect, useRef, useState } from 'react';
import { Theme } from '../types';
import { CollapsedIconRail, RailItem, SidebarTopToggle } from './SidebarControls';

type RightSectionId = 'voice' | 'commands' | 'recognition' | 'operations';

interface RightInspectorProps {
  isVoiceActive: boolean;
  setIsVoiceActive: (active: boolean) => void;
  history: string[];
  theme: Theme;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

const RightInspector: React.FC<RightInspectorProps> = ({
  isVoiceActive,
  setIsVoiceActive,
  history,
  theme,
  isCollapsed,
  onToggleCollapse,
  onLogout,
}) => {
  const isDark = theme === 'dark';
  const [activeSection, setActiveSection] = useState<RightSectionId>('voice');

  const voiceSliderRef = useRef<HTMLDivElement>(null);
  const opsSliderRef = useRef<HTMLDivElement>(null);
  const sectionRefs: Record<RightSectionId, React.RefObject<HTMLDivElement | null>> = {
    voice: useRef<HTMLDivElement>(null),
    commands: useRef<HTMLDivElement>(null),
    recognition: useRef<HTMLDivElement>(null),
    operations: useRef<HTMLDivElement>(null),
  };

  const focusSection = (section: RightSectionId) => {
    setActiveSection(section);
    if (isCollapsed) {
      onToggleCollapse();
      return;
    }

    sectionRefs[section].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (isCollapsed) return;
    const id = window.requestAnimationFrame(() => {
      sectionRefs[activeSection].current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [isCollapsed, activeSection]);

  const voiceCommands = [
    { time: '12:15', text: 'Повернуть на 90 градусов, увеличить яркость на 20 градусов следующей страницы', status: 'ВЫПОЛНЕНО', progress: 100 },
    { time: '12:14', text: 'Увеличить яркость на 20%', status: 'ВЫПОЛНЕНО', progress: 100 },
    { time: '12:12', text: 'Следующая страница', status: 'ВЫПОЛНЕНО', progress: 100 },
    { time: '12:10', text: 'Обрезать по выделению', status: 'ОШИБКА', progress: 0 },
    { time: '12:08', text: 'Масштаб 150%', status: 'ВЫПОЛНЕНО', progress: 100 },
    { time: '12:05', text: 'Включить сетку', status: 'ВЫПОЛНЕНО', progress: 100 },
    { time: '12:02', text: 'Экспорт в PDF', status: 'ОЖИДАНИЕ', progress: 30 },
  ];

  const recentOps = [
    { time: '12:15', text: 'Повернуть на 90 градусов, увеличить яркость на 20 градусов следующей страницы', type: 'system' },
    { time: '12:13', text: 'Применение фильтра "Чёткость"', type: 'edit' },
    { time: '12:10', text: 'Ручная правка аннотации #4', type: 'edit' },
    { time: '12:08', text: 'Автоматическое выравнивание горизонта', type: 'system' },
    { time: '12:05', text: 'Сохранение временной копии', type: 'save' },
    { time: '12:00', text: 'Инициализация сессии TURBO Т90', type: 'system' },
  ];

  const railItems: RailItem[] = [
    { id: 'voice', label: 'Голосовое управление', icon: <MicRailIcon /> },
    { id: 'commands', label: 'История команд', icon: <HistoryRailIcon /> },
    { id: 'recognition', label: 'Настройки распознавания', icon: <SlidersHorizontalIcon /> },
    { id: 'operations', label: 'История операций', icon: <ScrollTextIcon /> },
  ];

  const collapsedBottomActions = [
    {
      id: 'logout',
      label: 'Выход из системы',
      icon: <LogoutRailIcon />,
      onClick: onLogout,
      tone: 'danger' as const,
    },
  ];

  return (
    <aside
      className={`relative border-l flex flex-col shrink-0 transition-[width,background-color,border-color] duration-300 ${
        isCollapsed ? 'w-14' : 'w-72'
      } ${isDark ? 'bg-[#111] border-white/5' : 'bg-white border-zinc-200'}`}
    >
      <div className={`h-11 flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-start px-1'} border-b ${isDark ? 'border-white/5' : 'border-zinc-100'}`}>
        <SidebarTopToggle side="right" isCollapsed={isCollapsed} theme={theme} onToggle={onToggleCollapse} />
      </div>

      {isCollapsed ? (
        <CollapsedIconRail
          items={railItems}
          activeId={activeSection}
          theme={theme}
          onItemClick={(id) => focusSection(id as RightSectionId)}
          bottomActions={collapsedBottomActions}
        />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
            <div className="space-y-3" ref={sectionRefs.voice}>
              <section
                className={`border rounded-xl p-2.5 shadow-inner transition-colors ${
                  activeSection === 'voice'
                    ? 'ring-1 ring-blue-500/40'
                    : ''
                } ${isDark ? 'bg-zinc-900/50 border-white/5' : 'bg-zinc-50 border-zinc-200/50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection('voice')}
                    className={`text-[11px] font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}
                  >
                    Голосовое управление
                  </button>
                  <div
                    onClick={() => setIsVoiceActive(!isVoiceActive)}
                    className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-all duration-300 flex items-center relative ${
                      isVoiceActive
                        ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]'
                        : isDark
                          ? 'bg-zinc-700'
                          : 'bg-zinc-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${
                        isVoiceActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                <div
                  className={`flex flex-col items-center justify-center py-2.5 border border-dashed rounded-lg transition-all duration-300 ${
                    isVoiceActive
                      ? 'border-green-500/40 bg-green-500/5 shadow-[inset_0_0_12px_rgba(34,197,94,0.05)]'
                      : isDark
                        ? 'border-zinc-800 bg-zinc-800/20'
                        : 'border-zinc-200 bg-white'
                  }`}
                >
                  <div className={`relative mb-1.5 transition-colors duration-300 ${isVoiceActive ? 'text-green-500' : isDark ? 'text-zinc-600' : 'text-zinc-300'}`}>
                    <MicIcon large active={isVoiceActive} />
                    {isVoiceActive && (
                      <div className="absolute inset-0 animate-ping opacity-25 text-green-500">
                        <MicIcon large active={false} />
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[8px] px-2 text-center uppercase font-black tracking-[0.14em] transition-colors duration-300 ${
                      isVoiceActive ? 'text-green-500' : isDark ? 'text-zinc-500' : 'text-zinc-400'
                    }`}
                  >
                    {isVoiceActive ? 'СЛУШАЮ И ПОВИНУЮСЬ' : 'ОЖИДАНИЕ'}
                  </span>
                </div>
              </section>

              <section
                ref={sectionRefs.commands}
                className={`space-y-2 rounded-xl p-1 ${activeSection === 'commands' ? 'ring-1 ring-blue-500/40' : ''}`}
              >
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => setActiveSection('commands')}
                    className={`text-[9px] uppercase font-bold block ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}
                  >
                    История команд
                  </button>
                  <span className={`text-[8px] font-mono opacity-50 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Слайдер ↓</span>
                </div>

                <div
                  ref={voiceSliderRef}
                  className={`h-[140px] overflow-y-auto scroll-smooth snap-y snap-mandatory custom-scrollbar rounded-xl border ${
                    isDark ? 'bg-black/20 border-white/5' : 'bg-zinc-50 border-zinc-100 shadow-inner'
                  }`}
                >
                  <div className="space-y-1 p-1.5">
                    {voiceCommands.map((cmd, i) => (
                      <div
                        key={i}
                        className={`snap-start px-3 py-2.5 rounded-lg flex flex-col gap-2 transition-all border ${
                          isDark
                            ? 'bg-zinc-900/50 border-white/5 hover:border-white/10'
                            : 'bg-white border-zinc-200/50 shadow-sm hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col min-w-0">
                            <span className={`text-[10px] font-medium leading-tight mb-0.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                              "{cmd.text}"
                            </span>
                            <span className="text-[8px] font-mono opacity-40">{cmd.time}</span>
                          </div>
                          <span
                            className={`text-[8px] flex-shrink-0 font-black tracking-tighter px-1.5 py-0.5 rounded ${
                              cmd.status === 'ОШИБКА'
                                ? 'bg-red-500/10 text-red-500'
                                : isDark
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-green-50 text-green-600'
                            }`}
                          >
                            {cmd.status}
                          </span>
                        </div>
                        <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                          <div
                            className={`h-full transition-all duration-700 ${cmd.status === 'ОШИБКА' ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${cmd.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <section
              ref={sectionRefs.recognition}
              className={`space-y-3 border rounded-xl p-3 shadow-inner transition-colors ${
                activeSection === 'recognition' ? 'ring-1 ring-blue-500/40' : ''
              } ${isDark ? 'bg-zinc-900/45 border-white/5' : 'bg-zinc-50 border-zinc-200/60'}`}
            >
              <button
                type="button"
                onClick={() => setActiveSection('recognition')}
                className={`text-[9px] uppercase font-bold block ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}
              >
                Настройки распознавания
              </button>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className={`flex justify-between text-[9px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <span className="font-medium">Чувствительность</span>
                    <span className={`font-mono ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>75%</span>
                  </div>
                  <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                    <div className="h-full bg-blue-600 w-3/4 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className={`flex justify-between text-[9px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <span className="font-medium">Бинаризация</span>
                    <span className={`font-mono ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>128</span>
                  </div>
                  <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                    <div className="h-full bg-indigo-500 w-1/2 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div
            ref={sectionRefs.operations}
            className={`p-4 border-t space-y-3 flex-shrink-0 ${
              activeSection === 'operations' ? 'ring-1 ring-blue-500/40' : ''
            } ${isDark ? 'bg-black/20 border-white/5' : 'bg-zinc-50 border-zinc-100'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <button
                type="button"
                onClick={() => setActiveSection('operations')}
                className={`text-[9px] uppercase font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}
              >
                История операций
              </button>
              <HistoryRailIcon />
            </div>

            <div
              ref={opsSliderRef}
              className={`h-[160px] overflow-y-auto scroll-smooth snap-y snap-mandatory custom-scrollbar rounded-xl border transition-all duration-300 ${
                isDark ? 'bg-zinc-900/40 border-white/10' : 'bg-white border-zinc-200 shadow-sm'
              }`}
            >
              <div className="divide-y divide-zinc-800/50">
                {recentOps.map((op, i) => (
                  <div
                    key={i}
                    className={`snap-start flex flex-col gap-1 px-3 py-3 transition-all group cursor-default ${
                      i === 0 ? (isDark ? 'bg-blue-600/10' : 'bg-blue-50/50') : 'hover:bg-zinc-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${
                            i === 0
                              ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                              : isDark
                                ? 'bg-zinc-700'
                                : 'bg-zinc-300'
                          }`}
                        />
                        <span className={`text-[8px] font-mono opacity-40 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{op.time}</span>
                      </div>
                      <div
                        className={`px-1 rounded-[2px] text-[7px] font-black uppercase ${
                          op.type === 'system' ? 'text-purple-500 bg-purple-500/10' : 'text-zinc-500 bg-zinc-500/10'
                        }`}
                      >
                        {op.type}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] leading-tight transition-colors ${
                        isDark
                          ? i === 0
                            ? 'text-blue-400 font-medium'
                            : 'text-zinc-500 group-hover:text-zinc-300'
                          : i === 0
                            ? 'text-blue-700 font-bold'
                            : 'text-zinc-600 group-hover:text-zinc-900'
                      }`}
                    >
                      {op.text}
                    </span>
                  </div>
                ))}
                {history.slice(-2).map((item, i) => (
                  <div key={`history-${i}`} className="snap-start px-3 py-2 text-[10px] text-zinc-500 truncate">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`p-4 border-t transition-colors ${isDark ? 'bg-[#141414] border-white/5' : 'bg-zinc-50 border-zinc-100'}`}>
            <button
              className={`w-full flex items-center justify-center gap-2 py-3 text-[10px] font-bold rounded uppercase tracking-widest transition-all border group relative overflow-hidden ${
                isDark
                  ? 'bg-blue-600/10 text-blue-400 border-blue-600/20 hover:bg-blue-600 hover:text-white hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                  : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white shadow-sm hover:shadow-lg'
              }`}
            >
              <span>Завершить документ</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
          </div>
        </>
      )}
    </aside>
  );
};

const HistoryRailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

const MicRailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

const SlidersHorizontalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="2" y1="14" x2="6" y2="14" />
    <line x1="10" y1="8" x2="14" y2="8" />
    <line x1="18" y1="16" x2="22" y2="16" />
  </svg>
);

const ScrollTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8" />
    <path d="M8 3a2 2 0 0 0-2 2v14a2 2 0 1 0 0 4" />
    <path d="M12 7h4" />
    <path d="M12 11h4" />
    <path d="M12 15h4" />
  </svg>
);

const LogoutRailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

const MicIcon = ({ active, large }: { active: boolean; large?: boolean }) => (
  <svg width={large ? '24' : '12'} height={large ? '24' : '12'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
    {active && <line x1="8" y1="3" x2="16" y2="3" opacity="0.35" />}
  </svg>
);

export default RightInspector;
