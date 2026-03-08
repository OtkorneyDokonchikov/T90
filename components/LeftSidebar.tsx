import React, { useRef, useEffect, useState } from 'react';
import { Theme } from '../types';

interface LeftSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedPage: number;
  onPageSelect: (page: number) => void;
  theme: Theme;
}

interface Step {
  id: string;
  label: string;
  desc: string;
  status: 'done' | 'warning' | 'active' | 'pending';
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ isOpen, setIsOpen, selectedPage, onPageSelect, theme }) => {
  const isDark = theme === 'dark';
  const pageListRef = useRef<HTMLDivElement>(null);
  const [isStructureOpen, setIsStructureOpen] = useState(true);
  const [sidebarSections, setSidebarSections] = useState({ qualityControlOpen: false });

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['processed']));
  const [activeId, setActiveId] = useState<string>('processed');

  const steps: Step[] = [
    { id: '1', label: 'Анализ TIFF', desc: 'Загрузка и структура', status: 'done' },
    { id: '2', label: 'Качество OCR', desc: 'Оценка плотности текста', status: 'done' },
    { id: '3', label: 'Сегментация', desc: 'Текст / Изображения', status: 'warning' },
    { id: '4', label: 'Цвет и Режим', desc: 'Проверка профилей TIFF', status: 'active' },
    { id: '5', label: 'Дефекты скана', desc: 'Шум, перекос, пятна', status: 'pending' },
    { id: '6', label: 'Preflight', desc: 'Финальный контроль', status: 'pending' },
    { id: '7', label: 'Результат', desc: 'Отчёт и подсветка', status: 'pending' },
  ];

  const folders = [
    { id: 'root', name: 'Корневой проект', items: 124, subfolders: ['Дело №1', 'Дело №2', 'Дело №3'] },
    { id: 'source', name: 'Исходные данные', items: 45, subfolders: ['ZEUTSCHEL OS 12002', 'EPSON GT-S85', 'NUVERA 288 EA', 'KODAK i5850'] },
    { id: 'processed', name: 'Обработанные файлы', items: 12, subfolders: ['Пакет_v1.1', 'Черновики_А4', 'Финальные_сканы'] },
    { id: 'archive', name: 'Архив сессий', items: 3, subfolders: ['10 февраля 2026 года', '11 февраля 2026 года', '12 февраля 2026 года'] },
  ];

  const toggleFolder = (id: string) => {
    const next = new Set(expandedFolders);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedFolders(next);
    setActiveId(id);
  };

  const pages = Array.from({ length: 100 }, (_, i) => i + 1);

  useEffect(() => {
    if (isStructureOpen) {
      const activeEl = pageListRef.current?.querySelector(`[data-page="${selectedPage}"]`);
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedPage, isStructureOpen]);

  useEffect(() => {
    const handler = () => {
      setSidebarSections((prev) => ({ ...prev, qualityControlOpen: !prev.qualityControlOpen }));
    };

    window.addEventListener('t90:toggle-quality-control', handler as EventListener);
    return () => window.removeEventListener('t90:toggle-quality-control', handler as EventListener);
  }, []);

  return (
    <aside className={`border-r transition-all duration-300 flex flex-col ${isOpen ? 'w-72' : 'w-12'} ${isDark ? 'bg-[#111] border-white/5' : 'bg-white border-zinc-200'}`}>
      <div className={`h-11 flex items-center justify-between px-4 border-b ${isDark ? 'border-white/5' : 'border-zinc-100'}`}>
        {isOpen && <span className={`text-[10px] uppercase tracking-widest font-black ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Навигатор</span>}
        <button onClick={() => setIsOpen(!isOpen)} className="p-1 rounded text-zinc-600 hover:text-white transition-colors">
          {isOpen ? <CollapseIcon /> : <ExpandIcon />}
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {isOpen ? (
          <>
            <div className="py-2 overflow-y-auto custom-scrollbar max-h-[44%]">
              {folders.map((f) => (
                <div key={f.id} className="flex flex-col">
                  <div onClick={() => toggleFolder(f.id)} className={`px-4 py-1.5 flex items-center justify-between text-[11px] cursor-pointer group ${activeId === f.id ? (isDark ? 'bg-blue-600/20 text-white font-bold' : 'bg-blue-600 text-white') : (isDark ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-500 hover:bg-zinc-50')}`}>
                    <div className="flex items-center gap-2">
                      <span className={`transition-transform duration-200 ${expandedFolders.has(f.id) ? 'rotate-0' : '-rotate-90'}`}><ChevronDown size={8} /></span>
                      <FolderIcon />
                      <span className="truncate">{f.name}</span>
                    </div>
                    <span className="text-[8px] opacity-40">{f.items}</span>
                  </div>
                  {expandedFolders.has(f.id) && f.subfolders && (
                    <div className="flex flex-col bg-black/40">
                      {f.subfolders.map((sub, idx) => (
                        <div key={idx} className="pl-11 pr-4 py-1.5 text-[10px] cursor-pointer text-zinc-500 hover:text-white hover:bg-white/5 transition-all">{sub}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSidebarSections((prev) => ({ ...prev, qualityControlOpen: !prev.qualityControlOpen }))}
              className={`px-4 py-2 border-t mt-1 flex items-center justify-between cursor-pointer transition-colors ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-zinc-100 hover:bg-zinc-50'}`}
            >
              <div className="flex items-center gap-2">
                <span className={`transition-transform duration-150 ${sidebarSections.qualityControlOpen ? 'rotate-0' : '-rotate-90'}`}><ChevronDown size={10} /></span>
                <span className="text-[9px] uppercase font-black opacity-50">Контроль качества</span>
              </div>
              <span className="text-[8px] font-mono opacity-40">100%</span>
            </button>

            <div
              className="overflow-hidden transition-[max-height,opacity] duration-150 ease-out border-b border-white/5"
              style={{ maxHeight: sidebarSections.qualityControlOpen ? '260px' : '0px', opacity: sidebarSections.qualityControlOpen ? 1 : 0 }}
            >
              <div className="px-4 py-3 flex flex-col gap-3">
                {steps.map((step) => (
                  <div key={step.id} className="flex gap-3 group cursor-pointer">
                    <div className="relative flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1 flex items-center justify-center transition-all ${
                        step.status === 'done' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]' :
                        step.status === 'warning' ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]' :
                        step.status === 'active' ? 'border-2 border-blue-500 animate-pulse' : 'border-2 border-zinc-800'
                      }`}>
                        {step.status === 'active' && <div className="w-0.5 h-0.5 bg-blue-500 rounded-full" />}
                      </div>
                      <div className="w-px flex-1 bg-zinc-800/50 my-1 group-last:hidden" />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-bold ${step.status === 'pending' ? 'text-zinc-600' : 'text-zinc-300'}`}>{step.label}</span>
                      <span className="text-[9px] text-zinc-500 opacity-50">{step.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div onClick={() => setIsStructureOpen(!isStructureOpen)} className={`px-4 py-1.5 border-t mt-1 flex items-center justify-between cursor-pointer ${isDark ? 'border-white/5' : 'border-zinc-100'}`}>
              <div className="flex items-center gap-2">
                <span className={`transition-transform duration-150 ${isStructureOpen ? 'rotate-0' : '-rotate-90'}`}><ChevronDown size={10} /></span>
                <span className="text-[9px] uppercase font-black opacity-30">Структура документа</span>
              </div>
            </div>
            {isStructureOpen && (
              <div ref={pageListRef} className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-3 pt-1">
                {pages.map((p) => (
                  <div key={p} data-page={p} onClick={() => onPageSelect(p)} className={`px-4 py-1 text-[10px] rounded cursor-pointer flex items-center gap-3 ${selectedPage === p ? 'bg-blue-600/10 text-blue-400 font-bold' : 'text-zinc-500 hover:bg-white/5'}`}>
                    <span className="opacity-30 w-4 font-mono">{p}</span>
                    <span>Страница {p}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>

      <div className={`p-4 border-t ${isDark ? 'border-white/5' : 'border-zinc-100'}`}>
        <div className={`h-1 rounded-full bg-zinc-800/50 overflow-hidden ${!isOpen && 'hidden'}`}>
          <div className="h-full bg-blue-600/50 w-2/3" />
        </div>
        {isOpen && (
          <div className="mt-2.5 space-y-1">
            <div className="text-[9px] flex justify-between text-zinc-600 font-bold uppercase"><span>Хранилище</span><span>64%</span></div>
            <div className="text-[9px] flex justify-between text-zinc-700 font-mono">
              <span className="uppercase text-[8px] opacity-70">Размер:</span>
              <span className="opacity-50">138 МБ</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

const FolderIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const CollapseIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const ExpandIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const ChevronDown = ({ size = 10 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;

export default LeftSidebar;
