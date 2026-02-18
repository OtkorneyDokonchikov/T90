
import React, { useState, useRef, useEffect } from 'react';
import { AppScenario, ToolType, Theme } from '../types';

interface CanvasProps {
  scenario: AppScenario;
  activeTool: ToolType;
  onAction: (log: string) => void;
  theme: Theme;
  showRulers: boolean;
  setShowRulers: (v: boolean) => void;
  isPortrait: boolean;
  onPortraitToggle: () => void;
}

const Canvas: React.FC<CanvasProps> = ({ 
  scenario, activeTool, onAction, theme, showRulers, setShowRulers, isPortrait, onPortraitToggle 
}) => {
  const [zoom, setZoom] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const baseSize = 75;
  const docWidth = isPortrait ? (baseSize / 1.414) : baseSize;
  const docHeight = isPortrait ? baseSize : (baseSize / 1.414);

  const isQC = scenario === AppScenario.QUALITY_CONTROL;

  return (
    <div ref={containerRef} className={`flex-1 relative overflow-hidden flex flex-col transition-colors ${isDark ? 'canvas-bg bg-[#1a1a1a]' : 'bg-zinc-200'}`} >
      <div className="flex-1 overflow-auto custom-scrollbar flex flex-col items-center pt-[120px] pb-32 relative">
        <div 
          className={`border transition-all duration-500 relative overflow-hidden flex flex-col flex-shrink-0 ${isDark ? 'bg-white border-zinc-400 shadow-[0_40px_100px_rgba(0,0,0,0.8)]' : 'bg-white border-zinc-300 shadow-2xl'}`}
          style={{ width: `${docWidth}vh`, height: `${docHeight}vh`, transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          <div className="absolute top-0 left-0 right-0 p-10 flex justify-between items-start z-10">
            <div className="flex flex-col gap-2">
              <span className="text-[14px] font-black uppercase tracking-[0.4em] text-zinc-400">MASTER VIEW</span>
              <span className="text-[10px] font-mono text-zinc-500 opacity-60">29.7 CM • ISO 216</span>
            </div>
            <button className="px-10 py-2.5 rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 text-blue-600 text-[12px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">ВЫБОР</button>
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
             </div>
          </div>
        </div>
      </div>

      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 backdrop-blur-3xl p-2 border rounded-3xl shadow-2xl z-40 ${isDark ? 'bg-[#181818]/90 border-white/10' : 'bg-white/90 border-zinc-200'}`}>
        <button onClick={() => setZoom(z => Math.max(10, z - 10))} className="p-2 text-zinc-500 hover:text-white">-</button>
        <div className="text-[11px] font-black min-w-[50px] text-center">{zoom}%</div>
        <button onClick={() => setZoom(z => Math.min(400, z + 10))} className="p-2 text-zinc-500 hover:text-white">+</button>
        <div className="w-px h-4 bg-zinc-700 mx-1" />
        <button onClick={() => setShowRulers(!showRulers)} className={`p-1.5 rounded ${showRulers ? 'bg-blue-600 text-white' : 'text-zinc-500'}`}>R</button>
      </div>
    </div>
  );
};

export default Canvas;
