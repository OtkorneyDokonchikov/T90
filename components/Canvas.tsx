import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AppScenario, ToolType, Theme } from '../types';

type Unit = 'mm' | 'cm' | 'in';
type Orientation = 'vertical' | 'horizontal';
type PageOrientation = 'portrait' | 'landscape';

interface Guide {
  id: string;
  orientation: Orientation;
  position: number; // позиция в "базовых" пикселях страницы
}

interface CanvasProps {
  scenario: AppScenario;
  activeTool: ToolType;
  onAction: (log: string) => void;
  theme: Theme;
}

interface DragState {
  id: string;
  orientation: Orientation;
}

const DPI = 96;

const unitToPx = (value: number, unit: Unit): number => {
  if (unit === 'mm') return value * (DPI / 25.4);
  if (unit === 'cm') return value * (DPI / 2.54);
  return value * DPI;
};

const formatTick = (value: number, unit: Unit): string => {
  if (unit === 'mm') return `${Math.round(value)}`;
  if (unit === 'cm') return value.toFixed(1).replace('.0', '');
  return value.toFixed(2).replace(/\.00$/, '');
};

const Canvas: React.FC<CanvasProps> = ({ scenario, activeTool, onAction, theme }) => {
  const [zoom, setZoom] = useState(100);
  const [pageOrientation, setPageOrientation] = useState<PageOrientation>('portrait');
  const [rulerEnabled, setRulerEnabled] = useState(false);
  const [unit, setUnit] = useState<Unit>('mm');
  const [gridEnabled, setGridEnabled] = useState(false);
  const [gridStep, setGridStep] = useState(10);
  const [gridOpacity, setGridOpacity] = useState(0.2);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [showRulerSettings, setShowRulerSettings] = useState(false);

  const pageRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const isDark = theme === 'dark';
  const isQC = scenario === AppScenario.QUALITY_CONTROL;

  const basePortrait = { width: 780, height: 1100 };
  const baseLandscape = { width: 1100, height: 780 };
  const basePage = pageOrientation === 'portrait' ? basePortrait : baseLandscape;
  const zoomScale = zoom / 100;

  const pageWidth = basePage.width * zoomScale;
  const pageHeight = basePage.height * zoomScale;

  const gridStepPxBase = useMemo(() => Math.max(unitToPx(Math.max(gridStep, 1), unit), 1), [gridStep, unit]);
  const gridStepPxDisplay = gridStepPxBase * zoomScale;

  const rulerConfig = useMemo(() => {
    if (unit === 'mm') return { minorUnit: 1, majorEach: 10 };
    if (unit === 'cm') return { minorUnit: 0.5, majorEach: 2 };
    return { minorUnit: 0.125, majorEach: 8 };
  }, [unit]);

  useEffect(() => {
    setGuides((prev) =>
      prev.map((g) => {
        const limit = g.orientation === 'vertical' ? basePage.width : basePage.height;
        return { ...g, position: Math.min(Math.max(g.position, 0), limit) };
      }),
    );
  }, [basePage.width, basePage.height]);

  const applySnap = (value: number): number => {
    if (!snapToGrid || !gridEnabled) return value;
    if (!Number.isFinite(gridStepPxBase) || gridStepPxBase <= 0) return value;
    return Math.round(value / gridStepPxBase) * gridStepPxBase;
  };

  const getPositionFromClient = (clientX: number, clientY: number, orientation: Orientation): number | null => {
    if (!pageRef.current) return null;
    const rect = pageRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const relativeX = ((clientX - rect.left) / rect.width) * basePage.width;
    const relativeY = ((clientY - rect.top) / rect.height) * basePage.height;

    const raw = orientation === 'vertical' ? relativeX : relativeY;
    const max = orientation === 'vertical' ? basePage.width : basePage.height;
    const clamped = Math.max(0, Math.min(max, raw));
    return applySnap(clamped);
  };

  const startDragging = (id: string, orientation: Orientation) => {
    setDragState({ id, orientation });
  };

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const nextPosition = getPositionFromClient(e.clientX, e.clientY, dragState.orientation);
      if (nextPosition === null) return;

      setGuides((prev) => prev.map((g) => (g.id === dragState.id ? { ...g, position: nextPosition } : g)));
    };

    const handlePointerUp = () => {
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, basePage.height, basePage.width, gridEnabled, gridStepPxBase, snapToGrid]);

  const createGuideFromRuler = (orientation: Orientation, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const position = getPositionFromClient(e.clientX, e.clientY, orientation);
    if (position === null) return;

    const id = `${orientation}-${Date.now()}-${Math.round(Math.random() * 10000)}`;
    setGuides((prev) => [...prev, { id, orientation, position }]);
    startDragging(id, orientation);
  };

  const onGuidePointerDown = (guide: Guide, e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    startDragging(guide.id, guide.orientation);
  };

  const horizontalTicks = useMemo(() => {
    const stepPx = unitToPx(rulerConfig.minorUnit, unit) * zoomScale;
    const count = Math.floor(pageWidth / stepPx);
    return Array.from({ length: count + 1 }, (_, i) => {
      const isMajor = i % rulerConfig.majorEach === 0;
      return {
        key: i,
        x: i * stepPx,
        isMajor,
        label: formatTick(i * rulerConfig.minorUnit, unit),
      };
    });
  }, [pageWidth, rulerConfig, unit, zoomScale]);

  const verticalTicks = useMemo(() => {
    const stepPx = unitToPx(rulerConfig.minorUnit, unit) * zoomScale;
    const count = Math.floor(pageHeight / stepPx);
    return Array.from({ length: count + 1 }, (_, i) => {
      const isMajor = i % rulerConfig.majorEach === 0;
      return {
        key: i,
        y: i * stepPx,
        isMajor,
        label: formatTick(i * rulerConfig.minorUnit, unit),
      };
    });
  }, [pageHeight, rulerConfig, unit, zoomScale]);

  return (
    <div className={`flex-1 relative overflow-hidden flex flex-col transition-colors ${isDark ? 'canvas-bg bg-[#1a1a1a]' : 'bg-zinc-200'}`}>
      <div className="absolute left-4 top-4 z-50 flex items-start gap-2">
        <button
          onClick={() => setRulerEnabled((v) => !v)}
          className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-colors ${rulerEnabled ? 'bg-blue-600 text-white border-blue-500' : (isDark ? 'bg-[#181818]/90 border-white/10 text-zinc-400 hover:text-white' : 'bg-white/90 border-zinc-200 text-zinc-600')}`}
          title="Линейки"
        >
          <RulerIcon />
        </button>

        {rulerEnabled && (
          <div className={`rounded-xl border p-2 backdrop-blur-2xl transition-all duration-150 ${isDark ? 'bg-[#181818]/95 border-white/10' : 'bg-white/95 border-zinc-200'}`}>
            <div className="flex items-center gap-2">
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className={`text-[11px] rounded px-2 py-1 border ${isDark ? 'bg-black/40 border-white/10 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-700'}`}
              >
                <option value="mm">мм</option>
                <option value="cm">см</option>
                <option value="in">in</option>
              </select>
              <button
                onClick={() => setShowRulerSettings((v) => !v)}
                className={`text-[10px] px-2 py-1 rounded border ${isDark ? 'border-white/10 text-zinc-300 hover:bg-white/5' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`}
              >
                Сетка
              </button>
            </div>

            {showRulerSettings && (
              <div className="mt-2 space-y-2 text-[10px] min-w-[220px]">
                <label className="flex items-center justify-between gap-2">
                  <span>Сетка</span>
                  <input type="checkbox" checked={gridEnabled} onChange={(e) => setGridEnabled(e.target.checked)} />
                </label>

                <div className="flex items-center justify-between gap-2">
                  <span>Шаг</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={gridStep}
                      onChange={(e) => setGridStep(Math.max(1, Number(e.target.value) || 1))}
                      className={`w-16 px-1.5 py-0.5 rounded border ${isDark ? 'bg-black/40 border-white/10' : 'bg-white border-zinc-300'}`}
                    />
                    <span className="font-mono uppercase opacity-70">{unit}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span>Opacity</span>
                  <input
                    type="range"
                    min={0.05}
                    max={0.8}
                    step={0.05}
                    value={gridOpacity}
                    onChange={(e) => setGridOpacity(Number(e.target.value))}
                  />
                </div>

                <label className="flex items-center justify-between gap-2">
                  <span>Snap-to-grid</span>
                  <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} />
                </label>

                <button
                  onClick={() => setGuides([])}
                  className={`w-full px-2 py-1 rounded border ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-zinc-300 hover:bg-zinc-50'}`}
                >
                  Очистить гайды
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar flex flex-col items-center pt-[120px] pb-32 relative">
        <div
          className="relative"
          style={{
            width: pageWidth + (rulerEnabled ? 32 : 0),
            height: pageHeight + (rulerEnabled ? 32 : 0),
          }}
        >
          {rulerEnabled && (
            <>
              <div className={`absolute left-0 top-0 h-8 w-8 border ${isDark ? 'border-white/10 bg-[#131313]' : 'border-zinc-300 bg-zinc-100'}`} />

              <div
                onPointerDown={(e) => createGuideFromRuler('vertical', e)}
                className={`absolute left-8 top-0 h-8 border cursor-col-resize overflow-hidden ${isDark ? 'bg-[#131313] border-white/10' : 'bg-zinc-100 border-zinc-300'}`}
                style={{ width: pageWidth }}
              >
                {horizontalTicks.map((tick) => (
                  <div key={tick.key} className="absolute top-0" style={{ left: tick.x }}>
                    <div className={`w-px ${tick.isMajor ? 'h-4' : 'h-2'} ${isDark ? 'bg-zinc-500' : 'bg-zinc-500'}`} />
                    {tick.isMajor && <span className={`absolute top-4 left-1 text-[8px] font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}>{tick.label}</span>}
                  </div>
                ))}
              </div>

              <div
                onPointerDown={(e) => createGuideFromRuler('horizontal', e)}
                className={`absolute left-0 top-8 w-8 border cursor-row-resize overflow-hidden ${isDark ? 'bg-[#131313] border-white/10' : 'bg-zinc-100 border-zinc-300'}`}
                style={{ height: pageHeight }}
              >
                {verticalTicks.map((tick) => (
                  <div key={tick.key} className="absolute left-0" style={{ top: tick.y }}>
                    <div className={`h-px ${tick.isMajor ? 'w-4' : 'w-2'} ${isDark ? 'bg-zinc-500' : 'bg-zinc-500'}`} />
                    {tick.isMajor && (
                      <span
                        className={`absolute left-4 top-0 text-[8px] font-mono origin-left -rotate-90 ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}
                        style={{ transform: 'rotate(-90deg) translate(-8px, 0)' }}
                      >
                        {tick.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <div
            ref={pageRef}
            className={`absolute border relative overflow-hidden flex flex-col flex-shrink-0 transition-[width,height] duration-150 ${isDark ? 'bg-white border-zinc-400 shadow-[0_40px_100px_rgba(0,0,0,0.8)]' : 'bg-white border-zinc-300 shadow-2xl'}`}
            style={{
              left: rulerEnabled ? 32 : 0,
              top: rulerEnabled ? 32 : 0,
              width: pageWidth,
              height: pageHeight,
            }}
          >
            <div className="absolute inset-0 pointer-events-none">
              {gridEnabled && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'linear-gradient(to right, rgba(59,130,246,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,1) 1px, transparent 1px)',
                    backgroundSize: `${Math.max(gridStepPxDisplay, 4)}px ${Math.max(gridStepPxDisplay, 4)}px`,
                    opacity: gridOpacity,
                  }}
                />
              )}

              {guides.map((guide) => {
                if (guide.orientation === 'vertical') {
                  return (
                    <button
                      key={guide.id}
                      type="button"
                      onPointerDown={(e) => onGuidePointerDown(guide, e)}
                      className="absolute top-0 bottom-0 w-[6px] -ml-[3px] pointer-events-auto cursor-col-resize"
                      style={{ left: guide.position * zoomScale }}
                    >
                      <span className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-cyan-400/90" />
                    </button>
                  );
                }

                return (
                  <button
                    key={guide.id}
                    type="button"
                    onPointerDown={(e) => onGuidePointerDown(guide, e)}
                    className="absolute left-0 right-0 h-[6px] -mt-[3px] pointer-events-auto cursor-row-resize"
                    style={{ top: guide.position * zoomScale }}
                  >
                    <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-cyan-400/90" />
                  </button>
                );
              })}
            </div>

            <div className="absolute top-0 left-0 right-0 p-10 flex justify-between items-start z-10 pointer-events-none">
              <div className="flex flex-col gap-2">
                <span className="text-[14px] font-black uppercase tracking-[0.4em] text-zinc-400">MASTER VIEW</span>
                <span className="text-[10px] font-mono text-zinc-500 opacity-60">29.7 CM • ISO 216</span>
              </div>
              <button className="px-10 py-2.5 rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 text-blue-600 text-[12px] font-black uppercase tracking-widest transition-all">ВЫБОР</button>
            </div>

            <div className="flex-1 relative p-12 flex flex-col items-center justify-center">
              <div className="relative w-full h-full max-h-[80%] aspect-[3/4] shadow-2xl overflow-hidden group">
                <img src="https://picsum.photos/1200/1600?grayscale" className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100" alt="Master" />
                {isQC && (
                  <>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-32 h-32 rounded-full border-2 border-red-500/40 bg-red-500/10 backdrop-blur-sm flex items-center justify-center animate-pulse">
                        <span className="text-[12px] font-black text-red-500 uppercase tracking-widest">Шум</span>
                      </div>
                    </div>
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
                      <div className="px-8 py-3 rounded-lg border-2 border-amber-500/40 bg-amber-500/10 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Перекос +2.4°</span>
                      </div>
                    </div>
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 backdrop-blur-3xl p-2 border rounded-3xl shadow-2xl z-40 ${isDark ? 'bg-[#181818]/90 border-white/10' : 'bg-white/90 border-zinc-200'}`}>
        <button onClick={() => setZoom((z) => Math.max(10, z - 10))} className="p-2 text-zinc-500 hover:text-white">-</button>
        <div className="text-[11px] font-black min-w-[50px] text-center">{zoom}%</div>
        <button onClick={() => setZoom((z) => Math.min(400, z + 10))} className="p-2 text-zinc-500 hover:text-white">+</button>
        <div className="w-px h-4 bg-zinc-700 mx-1" />
        <button
          onClick={() => setPageOrientation((p) => (p === 'portrait' ? 'landscape' : 'portrait'))}
          className={`p-1.5 rounded transition-colors duration-150 ${isDark ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-zinc-600 hover:bg-zinc-100'}`}
          title="Ориентация страницы"
        >
          {pageOrientation === 'portrait' ? <PortraitIcon /> : <LandscapeIcon />}
        </button>
      </div>
    </div>
  );
};

const RulerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 21 18-18" />
    <path d="M14 4 20 10" />
    <path d="M10 8 16 14" />
    <path d="m6 12 6 6" />
    <path d="M2 22h6" />
  </svg>
);

const PortraitIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="7" y="3" width="10" height="18" rx="2" />
  </svg>
);

const LandscapeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="18" height="10" rx="2" />
  </svg>
);

export default Canvas;
