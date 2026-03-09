import React, { useEffect, useMemo, useState } from 'react';
import { Theme, UserRole } from '../types';

interface LockSessionSnapshot {
  page: number;
  zoom: number;
  scenario: string;
  hasInProgressTasks: boolean;
  panels: {
    leftSidebarOpen: boolean;
    voiceActive: boolean;
  };
  autosavedAt: string;
}

interface WorkstationLockOverlayProps {
  isOpen: boolean;
  theme: Theme;
  operatorName: string;
  role: UserRole;
  lockedAt: string;
  snapshot: LockSessionSnapshot | null;
  onUnlock: () => void;
  onSwitchUser: () => void;
  onFinishShift: () => void;
}

const roleLabelMap: Record<UserRole, string> = {
  OPERATOR: 'Оператор',
  OPERATOR_CONDOR_S: 'Оператор Кондарев С.А.',
  ADMINISTRATOR: 'Администратор',
};

const WorkstationLockOverlay: React.FC<WorkstationLockOverlayProps> = ({
  isOpen,
  theme,
  operatorName,
  role,
  lockedAt,
  snapshot,
  onUnlock,
  onSwitchUser,
  onFinishShift,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const isDark = theme === 'dark';

  const resolvedRole = useMemo(() => roleLabelMap[role] ?? 'Не указано', [role]);

  useEffect(() => {
    if (!showAccessDenied) return;
    const timer = window.setTimeout(() => setShowAccessDenied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [showAccessDenied]);

  if (!isOpen) return null;

  const handleUnlock = () => {
    if (pin.trim() === '1234') {
      setError(null);
      setPin('');
      setShowAccessDenied(false);
      onUnlock();
      return;
    }

    setError('Неверный PIN-код');
    setShowAccessDenied(true);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px]" />

      <section
        className={`relative w-full max-w-[520px] rounded-xl border shadow-[0_28px_96px_rgba(0,0,0,0.68)] ${
          isDark ? 'bg-[#0f1319] border-white/10 text-zinc-200' : 'bg-[#151b24] border-white/10 text-zinc-200'
        }`}
      >
        {showAccessDenied && (
          <div className="absolute left-1/2 top-4 -translate-x-1/2 z-10">
            <div className="rounded-md border border-red-500/40 bg-[#1a1214] px-3 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
              <span className="text-[11px] font-bold tracking-wide text-red-400">Доступ запрещен</span>
            </div>
          </div>
        )}

        <div className="border-b border-white/10 px-4 py-3">
          <h3 className="text-[14px] font-bold uppercase tracking-[0.14em]">Рабочее место заблокировано</h3>
          <div className="mt-1.5 text-[10px] text-zinc-500 leading-4">
            <div>Оператор: {operatorName}</div>
            <div>Роль: {resolvedRole}</div>
            <div>Время блокировки: {lockedAt}</div>
            <div>Статус: Доступ ограничен</div>
          </div>
        </div>

        <div className="px-4 py-3 space-y-3">
          <div className="rounded-md border border-white/10 bg-black/20 p-2.5 text-[10px] leading-4">
            <div className="text-zinc-500 uppercase tracking-wide mb-1">Состояние сессии сохранено</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-zinc-300">
              <div>Страница: <span className="font-mono">{snapshot?.page ?? 'Не указано'}</span></div>
              <div>Масштаб: <span className="font-mono">{snapshot?.zoom ?? 'Не указано'}%</span></div>
              <div>Режим: <span className="font-mono">{snapshot?.scenario ?? 'Не указано'}</span></div>
              <div>Автосохранение: <span className="font-mono">{snapshot?.autosavedAt ?? 'Не указано'}</span></div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wide text-zinc-500">PIN-код</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUnlock();
              }}
              className="w-full h-9 rounded-md border border-white/10 bg-black/25 px-3 text-[12px] font-mono text-zinc-100 outline-none focus:border-cyan-400/50"
              placeholder="Введите PIN"
            />
            {error && <div className="text-[10px] text-red-400">{error}</div>}
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleUnlock}
            className="h-8 px-3 rounded-md bg-cyan-600 hover:bg-cyan-500 text-[10px] font-bold uppercase tracking-wider text-white"
          >
            Разблокировать
          </button>
          <button
            type="button"
            onClick={onSwitchUser}
            className="h-8 px-3 rounded-md border border-white/15 hover:border-white/30 text-[10px] font-bold uppercase tracking-wider text-zinc-300"
          >
            Сменить пользователя
          </button>
          <button
            type="button"
            onClick={onFinishShift}
            className="h-8 px-3 rounded-md border border-white/15 hover:border-white/30 text-[10px] font-bold uppercase tracking-wider text-zinc-400 ml-auto"
          >
            Завершить смену
          </button>
        </div>
      </section>
    </div>
  );
};

export type { LockSessionSnapshot };
export default WorkstationLockOverlay;
