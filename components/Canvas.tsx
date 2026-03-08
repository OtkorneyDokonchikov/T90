import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AppScenario, ToolType, Theme } from '../types';
import linerIcon from '../images/liner.png';

type Unit = 'mm' | 'cm' | 'in';
type Orientation = 'vertical' | 'horizontal';
type PageOrientation = 'portrait' | 'landscape';

interface Guide {
  id: string;
  orientation: Orientation;
  position: number;
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
const RULER_THICKNESS = 26;

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

const getUnitConfig = (unit: Unit) => {
  if (unit === 'mm') return { minorUnit: 1, majorEach: 10 };
  if (unit === 'cm') return { minorUnit: 0.5, majorEach: 2 };
  return { minorUnit: 0.125, majorEach: 8 };
};

const unitBadgeLabel: Record<Unit, string> = {
  cm: 'см',
  mm: 'мм',
  in: 'дюйм',
};

const getNextUnit = (current: Unit): Unit => {
  if (current === 'cm') return 'mm';
  if (current === 'mm') return 'in';
  return 'cm';
};

const Canvas: React.FC<CanvasProps> = ({ scenario, activeTool, onAction, theme }) => {
  const [zoom, setZoom] = useState(100);
  const [pageOrientation, setPageOrientation] = useState<PageOrientation>('portrait');

  const [rulerEnabled, setRulerEnabled] = useState(false);
  const [unit, setUnit] = useState<Unit>('cm');

  const [gridEnabled, setGridEnabled] = useState(false);
  const [gridStep, setGridStep] = useState(10);
  const [gridOpacity, setGridOpacity] = useState(0.2);
  const [snapToGrid, setSnapToGrid] = useState(false);

  const [guides, setGuides] = useState<Guide[]>([]);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const [workspaceSize, setWorkspaceSize] = useState({ width: 0, height: 0 });

  const rootRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';
  const isQC = scenario === AppScenario.QUALITY_CONTROL;

  const basePortrait = { width: 780, height: 1100 };
  const baseLandscape = { width: 1100, height: 780 };
  const basePage = pageOrientation === 'portrait' ? basePortrait : baseLandscape;
  const zoomScale = zoom / 100;

  const pageWidth = basePage.width * zoomScale;
  const pageHeight = basePage.height * zoomScale;

  const unitConfig = useMemo(() => getUnitConfig(unit), [unit]);

  const minorPxRaw = unitToPx(unitConfig.minorUnit, unit) * zoomScale;
  const tickDensity = minorPxRaw < 8 ? Math.ceil(8 / Math.max(minorPxRaw, 0.0001)) : 1;
  const rulerMinorUnit = unitConfig.minorUnit * tickDensity;
  const rulerStepPx = minorPxRaw * tickDensity;
  const rulerMajorEvery = Math.max(1, Math.round(unitConfig.majorEach / tickDensity));

  const gridStepPxBase = useMemo(() => Math.max(unitToPx(Math.max(gridStep, 1), unit), 1), [gridStep, unit]);
  const gridStepPxDisplay = gridStepPxBase * zoomScale;

  const workspaceOffset = rulerEnabled ? RULER_THICKNESS : 0;
  const workspaceInnerWidth = Math.max(0, workspaceSize.width - workspaceOffset);
  const workspaceInnerHeight = Math.max(0, workspaceSize.height - workspaceOffset);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const updateSize = () => {
      setWorkspaceSize({ width: node.clientWidth, height: node.clientHeight });
    };

    updateSize();

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const applySnap = (value: number): number => {
    if (!snapToGrid || !gridEnabled) return value;
    if (!Number.isFinite(gridStepPxDisplay) || gridStepPxDisplay <= 0) return value;
    return Math.round(value / gridStepPxDisplay) * gridStepPxDisplay;
  };

  const getWorkspacePositionFromClient = (clientX: number, clientY: number, orientation: Orientation): number | null => {
    const root = rootRef.current;
    if (!root) return null;

    const rect = root.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const x = clientX - rect.left - workspaceOffset;
    const y = clientY - rect.top - workspaceOffset;

    const raw = orientation === 'vertical' ? x : y;
    const max = orientation === 'vertical' ? workspaceInnerWidth : workspaceInnerHeight;

    const clamped = Math.max(0, Math.min(max, raw));
    return applySnap(clamped);
  };

  const startDragging = (id: string, orientation: Orientation) => {
    setDragState({ id, orientation });
  };

  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      const nextPosition = getWorkspacePositionFromClient(e.clientX, e.clientY, dragState.orientation);
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
  }, [dragState, gridEnabled, gridStepPxDisplay, snapToGrid, workspaceInnerHeight, workspaceInnerWidth, workspaceOffset]);

  const createGuideFromRuler = (orientation: Orientation, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const position = getWorkspacePositionFromClient(e.clientX, e.clientY, orientation);
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
    if (!rulerEnabled || rulerStepPx <= 0 || workspaceInnerWidth <= 0) return [];
    const count = Math.floor(workspaceInnerWidth / rulerStepPx);

    return Array.from({ length: count + 1 }, (_, i) => {
      const isMajor = i % rulerMajorEvery === 0;
      return {
        key: i,
        x: workspaceOffset + i * rulerStepPx,
        isMajor,
        label: formatTick(i * rulerMinorUnit, unit),
      };
    });
  }, [rulerEnabled, rulerStepPx, workspaceInnerWidth, rulerMajorEvery, workspaceOffset, rulerMinorUnit, unit]);

  const verticalTicks = useMemo(() => {
    if (!rulerEnabled || rulerStepPx <= 0 || workspaceInnerHeight <= 0) return [];
    const count = Math.floor(workspaceInnerHeight / rulerStepPx);

    return Array.from({ length: count + 1 }, (_, i) => {
      const isMajor = i % rulerMajorEvery === 0;
      return {
        key: i,
        y: workspaceOffset + i * rulerStepPx,
        isMajor,
        label: formatTick(i * rulerMinorUnit, unit),
      };
    });
  }, [rulerEnabled, rulerStepPx, workspaceInnerHeight, rulerMajorEvery, workspaceOffset, rulerMinorUnit, unit]);

  const handleRulerToggle = () => {
    setRulerEnabled((prev) => !prev);
  };

  const handleUnitCycle = () => {
    setUnit((prev) => getNextUnit(prev));
  };

  return (
    <div ref={rootRef} className={`flex-1 relative overflow-hidden flex flex-col transition-colors ${isDark ? 'canvas-bg bg-[#1a1a1a]' : 'bg-zinc-200'}`}>
      <div className="absolute left-1 top-1 z-[60] flex flex-col items-start">
        <button
          onClick={handleRulerToggle}
          className={`h-9 w-9 rounded-md border flex items-center justify-center transition-colors ${
            rulerEnabled
              ? 'bg-blue-600 text-white border-blue-500'
              : (isDark ? 'bg-[#181818]/90 border-white/10 text-zinc-400 hover:text-white' : 'bg-white/90 border-zinc-200 text-zinc-600')
          }`}
          title="Угловая линейка"
        >
          <img src={linerIcon} alt="Liner" className="w-5 h-5 object-contain" />
        </button>

        {rulerEnabled && (
          <button
            onClick={handleUnitCycle}
            className={`mt-1.5 w-9 h-5 rounded-md border text-[10px] font-semibold leading-none flex items-center justify-center transition-colors ${isDark ? 'bg-[#181818]/95 border-white/10 text-zinc-200 hover:bg-white/5' : 'bg-white/95 border-zinc-200 text-zinc-700 hover:bg-zinc-100'}`}
            title="Переключить единицу"
          >
            {unitBadgeLabel[unit]}
          </button>
        )}
      </div>

      {rulerEnabled && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          <div className={`absolute left-0 top-0 w-[26px] h-[26px] border ${isDark ? 'bg-[#131313] border-white/10' : 'bg-zinc-100 border-zinc-300'}`} />

          <div
            onPointerDown={(e) => createGuideFromRuler('vertical', e)}
            className={`absolute top-0 left-[26px] right-0 h-[26px] border-b cursor-col-resize pointer-events-auto overflow-hidden ${isDark ? 'bg-[#131313] border-white/10' : 'bg-zinc-100 border-zinc-300'}`}
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
            className={`absolute top-[26px] left-0 bottom-0 w-[26px] border-r cursor-row-resize pointer-events-auto overflow-hidden ${isDark ? 'bg-[#131313] border-white/10' : 'bg-zinc-100 border-zinc-300'}`}
          >
            {verticalTicks.map((tick) => (
              <div key={tick.key} className="absolute left-0" style={{ top: tick.y }}>
                <div className={`h-px ${tick.isMajor ? 'w-4' : 'w-2'} ${isDark ? 'bg-zinc-500' : 'bg-zinc-500'}`} />
                {tick.isMajor && (
                  <span
                    className={`absolute left-4 top-0 text-[8px] font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-600'}`}
                    style={{ transform: 'rotate(-90deg) translate(-8px, 0)', transformOrigin: 'left top' }}
                  >
                    {tick.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto custom-scrollbar flex flex-col items-center pt-[120px] pb-32 relative">
        <div
          className={`border transition-[width,height] duration-150 relative overflow-hidden flex flex-col flex-shrink-0 ${isDark ? 'bg-white border-zinc-400 shadow-[0_40px_100px_rgba(0,0,0,0.8)]' : 'bg-white border-zinc-300 shadow-2xl'}`}
          style={{ width: pageWidth, height: pageHeight }}
        >
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

      {rulerEnabled && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          {gridEnabled && (
            <div
              className="absolute"
              style={{
                left: workspaceOffset,
                top: workspaceOffset,
                right: 0,
                bottom: 0,
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
                  className="absolute top-[26px] bottom-0 w-[6px] -ml-[3px] pointer-events-auto cursor-col-resize"
                  style={{ left: workspaceOffset + guide.position }}
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
                className="absolute left-[26px] right-0 h-[6px] -mt-[3px] pointer-events-auto cursor-row-resize"
                style={{ top: workspaceOffset + guide.position }}
              >
                <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-cyan-400/90" />
              </button>
            );
          })}
        </div>
      )}

      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 backdrop-blur-3xl p-2 border rounded-3xl shadow-2xl z-40 ${isDark ? 'bg-[#181818]/90 border-white/10' : 'bg-white/90 border-zinc-200'}`}>
        <button onClick={() => setZoom((z) => Math.max(10, z - 10))} className="p-2 text-zinc-500 hover:text-white">-</button>
        <div className="text-[11px] font-black min-w-[50px] text-center">{zoom}%</div>
        <button onClick={() => setZoom((z) => Math.min(400, z + 10))} className="p-2 text-zinc-500 hover:text-white">+</button>
        <div className="w-px h-4 bg-zinc-700 mx-1" />

        <button
          onClick={() => setGridEnabled((v) => !v)}
          className={`px-2 py-1 rounded text-[10px] ${gridEnabled ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}
          title="Сетка"
        >
          GRID
        </button>

        <button
          onClick={() => setSnapToGrid((v) => !v)}
          className={`px-2 py-1 rounded text-[10px] ${snapToGrid ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}
          title="Snap to grid"
        >
          SNAP
        </button>

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
