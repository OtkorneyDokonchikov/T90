import React, { useState, useEffect, useRef } from 'react';
import { Theme, VoiceToast } from '../types';

interface StatusBarProps {
  isVoiceActive: boolean;
  setIsVoiceActive: (active: boolean) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  voiceToast: VoiceToast | null;
  theme: Theme;
}

type MemoryState = string;

type BrowserMemory = {
  usedJSHeapSize: number;
};

type WindowWithMemory = Window & {
  performance: Performance & {
    memory?: BrowserMemory;
  };
};

type ProcessWithMemory = {
  memoryUsage?: () => { rss?: number; heapUsed?: number };
};

type MetricsMode = 'real' | 'mock';

interface RuntimeMetrics {
  latencyMs: number;
  gpuPercent: number;
  ramLabel: string;
  ramPercent: number;
  mode: MetricsMode;
}

interface RealMetricsPayload {
  latencyMs?: number;
  gpuPercent?: number;
  ramBytes?: number;
  ramPercent?: number;
  ramTotalBytes?: number;
}

const formatMemory = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${Math.round(mb)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
};

const readMemoryUsage = (): MemoryState => {
  try {
    const processCandidate = (globalThis as unknown as { process?: ProcessWithMemory }).process;
    if (processCandidate?.memoryUsage) {
      const usage = processCandidate.memoryUsage();
      const bytes = usage.heapUsed ?? usage.rss;
      if (typeof bytes === 'number' && Number.isFinite(bytes)) {
        return formatMemory(bytes);
      }
    }

    const win = window as WindowWithMemory;
    const browserBytes = win.performance?.memory?.usedJSHeapSize;
    if (typeof browserBytes === 'number' && Number.isFinite(browserBytes)) {
      return formatMemory(browserBytes);
    }

    return 'N/A';
  } catch {
    return 'N/A';
  }
};

const readMemoryBytes = (): number | null => {
  try {
    const processCandidate = (globalThis as unknown as { process?: ProcessWithMemory }).process;
    if (processCandidate?.memoryUsage) {
      const usage = processCandidate.memoryUsage();
      const bytes = usage.heapUsed ?? usage.rss;
      if (typeof bytes === 'number' && Number.isFinite(bytes)) return bytes;
    }

    const win = window as WindowWithMemory;
    const browserBytes = win.performance?.memory?.usedJSHeapSize;
    if (typeof browserBytes === 'number' && Number.isFinite(browserBytes)) return browserBytes;

    return null;
  } catch {
    return null;
  }
};

const readTotalMemoryBytes = (): number | null => {
  try {
    const nav = navigator as Navigator & { deviceMemory?: number };
    if (typeof nav.deviceMemory === 'number' && Number.isFinite(nav.deviceMemory) && nav.deviceMemory > 0) {
      return nav.deviceMemory * 1024 * 1024 * 1024;
    }

    return null;
  } catch {
    return null;
  }
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const withJitter = (current: number, delta: number, min: number, max: number): number => {
  const shift = (Math.random() * 2 - 1) * delta;
  return Math.round(clamp(current + shift, min, max));
};

const resolveRamPercent = (usedBytes: number | null, explicitPercent?: number, explicitTotalBytes?: number): number | null => {
  if (typeof explicitPercent === 'number' && Number.isFinite(explicitPercent)) {
    return Math.round(clamp(explicitPercent, 0, 100));
  }

  if (typeof usedBytes !== 'number' || !Number.isFinite(usedBytes) || usedBytes < 0) return null;

  const totalBytes =
    typeof explicitTotalBytes === 'number' && Number.isFinite(explicitTotalBytes) && explicitTotalBytes > 0
      ? explicitTotalBytes
      : readTotalMemoryBytes();

  if (!totalBytes) return null;

  return Math.round(clamp((usedBytes / totalBytes) * 100, 0, 100));
};

const buildMockMetrics = (prev: RuntimeMetrics): RuntimeMetrics => {
  const latencyMs = withJitter(prev.latencyMs, 6, 12, 45);
  const gpuPercent = withJitter(prev.gpuPercent, 5, 14, 48);
  const ramPercent = withJitter(prev.ramPercent, 5, 50, 84);
  const mockTotalBytes = 2 * 1024 * 1024 * 1024;
  const ramLabel = formatMemory((mockTotalBytes * ramPercent) / 100);

  return {
    latencyMs,
    gpuPercent,
    ramLabel,
    ramPercent,
    mode: 'mock',
  };
};

const readRealMetrics = (): Partial<RuntimeMetrics> | null => {
  try {
    const candidate = (globalThis as unknown as { __T90_REAL_METRICS__?: RealMetricsPayload }).__T90_REAL_METRICS__;
    if (!candidate) return null;

    const next: Partial<RuntimeMetrics> = { mode: 'real' };

    if (typeof candidate.latencyMs === 'number' && Number.isFinite(candidate.latencyMs)) {
      next.latencyMs = Math.round(clamp(candidate.latencyMs, 1, 999));
    }

    if (typeof candidate.gpuPercent === 'number' && Number.isFinite(candidate.gpuPercent)) {
      next.gpuPercent = Math.round(clamp(candidate.gpuPercent, 0, 100));
    }

    if (typeof candidate.ramBytes === 'number' && Number.isFinite(candidate.ramBytes)) {
      next.ramLabel = formatMemory(candidate.ramBytes);
    }

    const ramPercent = resolveRamPercent(candidate.ramBytes ?? null, candidate.ramPercent, candidate.ramTotalBytes);
    if (typeof ramPercent === 'number') {
      next.ramPercent = ramPercent;
    }

    return next;
  } catch {
    return null;
  }
};

const StatusBar: React.FC<StatusBarProps> = ({
  isVoiceActive,
  setIsVoiceActive,
  currentPage,
  totalPages,
  onPageChange,
  voiceToast,
  theme,
}) => {
  const isDark = theme === 'dark';
  const [saveCountdown, setSaveCountdown] = useState(10);
  const [isSaving, setIsSaving] = useState(false);
  const [runtimeMetrics, setRuntimeMetrics] = useState<RuntimeMetrics>({
    latencyMs: 18,
    gpuPercent: 22,
    ramLabel: 'N/A',
    ramPercent: 52,
    mode: 'mock',
  });

  const metricsSeededRef = useRef(false);

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

  useEffect(() => {
    if (!metricsSeededRef.current) {
      const realMemoryBytes = readMemoryBytes();
      const ramPercent = resolveRamPercent(realMemoryBytes);
      setRuntimeMetrics((prev) => ({
        ...prev,
        ramLabel: realMemoryBytes ? formatMemory(realMemoryBytes) : readMemoryUsage(),
        ramPercent: ramPercent ?? prev.ramPercent,
      }));
      metricsSeededRef.current = true;
    }

    const metricsTimer = setInterval(() => {
      setRuntimeMetrics((prev) => {
        const real = readRealMetrics();
        const realMemoryBytes = readMemoryBytes();
        const detectedRamPercent = resolveRamPercent(realMemoryBytes);

        if (real) {
          return {
            latencyMs: real.latencyMs ?? prev.latencyMs,
            gpuPercent: real.gpuPercent ?? prev.gpuPercent,
            ramLabel: real.ramLabel ?? (realMemoryBytes ? formatMemory(realMemoryBytes) : prev.ramLabel),
            ramPercent: real.ramPercent ?? detectedRamPercent ?? prev.ramPercent,
            mode: 'real',
          };
        }

        const mockBase = buildMockMetrics(prev.mode === 'mock' ? prev : { ...prev, mode: 'mock' });
        const ramLabel = realMemoryBytes ? formatMemory(realMemoryBytes) : mockBase.ramLabel;
        const ramPercent = detectedRamPercent ?? mockBase.ramPercent;

        return {
          ...mockBase,
          ramLabel,
          ramPercent,
        };
      });
    }, 1500);

    return () => clearInterval(metricsTimer);
  }, []);

  const ramValueColorClass = runtimeMetrics.ramPercent > 70 ? 'text-yellow-400' : 'text-green-500';
  const voiceToastToneClass =
    voiceToast?.tone === 'success'
      ? isDark
        ? 'text-emerald-300 border-emerald-500/35 bg-emerald-500/10'
        : 'text-emerald-700 border-emerald-300/70 bg-emerald-50'
      : voiceToast?.tone === 'warning'
        ? isDark
          ? 'text-amber-300 border-amber-500/35 bg-amber-500/10'
          : 'text-amber-700 border-amber-300/70 bg-amber-50'
        : voiceToast?.tone === 'error'
          ? isDark
            ? 'text-red-300 border-red-500/35 bg-red-500/10'
            : 'text-red-700 border-red-300/70 bg-red-50'
          : voiceToast?.tone === 'info'
            ? isDark
              ? 'text-blue-300 border-blue-500/35 bg-blue-500/10'
              : 'text-blue-700 border-blue-300/70 bg-blue-50'
            : isDark
              ? 'text-zinc-300 border-white/15 bg-white/5'
              : 'text-zinc-700 border-zinc-300 bg-white';

  return (
    <footer className={`h-8 border-t flex items-center justify-between px-3 text-[10px] font-medium z-50 transition-colors relative ${isDark ? 'bg-[#111] border-white/10 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-500'}`}>
      <div className="flex items-center gap-4 min-w-[200px]">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          <span className="uppercase tracking-tighter font-bold">Система готова</span>
        </div>

        <div className={`h-3 w-px flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />

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

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        {voiceToast ? (
          <div className={`h-6 px-3 rounded-md border flex items-center text-[9px] font-bold tracking-wide ${voiceToastToneClass}`}>
            {voiceToast.message}
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      <div className="flex items-center gap-4 min-w-[200px] justify-end">
        <button
          onClick={() => setIsVoiceActive(!isVoiceActive)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all active:scale-95 ${
            isVoiceActive ? 'bg-blue-500/10 text-blue-400 font-bold' : (isDark ? 'hover:bg-white/5 text-zinc-500 hover:text-zinc-300' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800')
          }`}
        >
          <MicIcon active={isVoiceActive} />
          <span className="uppercase tracking-widest">{isVoiceActive ? 'Голос: Активен' : 'Голос: Выкл'}</span>
        </button>

        <div className={`h-3 w-px ${isDark ? 'bg-white/10' : 'bg-zinc-200'}`} />

        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <span className={isDark ? 'text-zinc-600' : 'text-zinc-400'}>Задержка:</span>
            <span className="font-mono tabular-nums min-w-[46px] text-right text-green-500">{runtimeMetrics.latencyMs}мс</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={isDark ? 'text-zinc-600' : 'text-zinc-400'}>GPU:</span>
            <span className="font-mono tabular-nums min-w-[36px] text-right text-green-500">{runtimeMetrics.gpuPercent}%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className={isDark ? 'text-zinc-600' : 'text-zinc-400'}>RAM</span>
            <span className={`font-mono tabular-nums min-w-[66px] text-right ${ramValueColorClass}`}>{runtimeMetrics.ramLabel}</span>
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
