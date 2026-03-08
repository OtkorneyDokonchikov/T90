import React, { useEffect, useMemo, useState } from 'react';
import { ModulePassportResolved, Theme } from '../types';

interface ModulePassportModalProps {
  isOpen: boolean;
  loading: boolean;
  theme: Theme;
  passport: ModulePassportResolved | null;
  onClose: () => void;
  onOpenModule: () => void;
  onOpenHistory: () => void;
  onCopyDetails: () => void;
}

const statusToneMap: Record<ModulePassportResolved['statusKind'], string> = {
  actual: 'text-green-400 border-green-500/40 bg-green-500/10',
  update_available: 'text-yellow-300 border-yellow-500/40 bg-yellow-500/10',
  conflict: 'text-red-400 border-red-500/40 bg-red-500/10',
  offline: 'text-zinc-300 border-zinc-500/40 bg-zinc-500/15',
};

const fieldValue = (value?: string): string => {
  if (!value || !value.trim()) return 'Не указано';
  return value;
};

const lineValue = (label: string, value?: string) => (
  <div className="grid grid-cols-[136px_1fr] gap-2">
    <span className="text-zinc-500">{label}</span>
    <span className="text-zinc-200 break-words">{fieldValue(value)}</span>
  </div>
);

const ModulePassportModal: React.FC<ModulePassportModalProps> = ({
  isOpen,
  loading,
  theme,
  passport,
  onClose,
  onOpenModule,
  onOpenHistory,
  onCopyDetails,
}) => {
  const isDark = theme === 'dark';
  const [isIconBroken, setIsIconBroken] = useState(false);

  useEffect(() => {
    setIsIconBroken(false);
  }, [passport?.manifest.iconPath]);

  const toneClass = passport ? statusToneMap[passport.statusKind] : statusToneMap.offline;
  const moduleName = fieldValue(passport?.manifest.moduleName);
  const badgeTitle = fieldValue(passport?.manifest.approvalBadge);
  const iconGlyph = fieldValue(passport?.manifest.iconGlyph).slice(0, 3).toUpperCase();
  const iconPath = passport?.manifest.iconPath
    ? `${import.meta.env.BASE_URL}${passport.manifest.iconPath.replace(/^\/+/, '')}`
    : null;

  const integrations = passport?.manifest.integrations ?? [];

  const responsibles = useMemo(
    () => [
      ['Владелец модуля', passport?.manifest.responsibles?.owner],
      ['Дизайн-инженер', passport?.manifest.responsibles?.designEngineer],
      ['Ведущий разработчик', passport?.manifest.responsibles?.leadDeveloper],
      ['Технический куратор', passport?.manifest.responsibles?.technicalCurator],
    ],
    [passport],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Закрыть окно"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <section
        className={`relative w-full max-w-[680px] rounded-2xl border shadow-[0_30px_120px_rgba(0,0,0,0.65)] p-4 md:p-5 transition-all duration-200 ${
          isDark ? 'bg-[#121417] border-white/10 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'
        }`}
      >
        <div className="absolute right-5 top-5">
          <div className="rounded-md border border-zinc-500/50 bg-gradient-to-b from-zinc-300/20 via-zinc-500/20 to-zinc-700/25 px-3 py-1.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
            <div className="text-[9px] tracking-[0.22em] font-black text-zinc-100">{badgeTitle}</div>
          </div>
        </div>

        <div className="pr-[150px]">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-lg border border-white/10 bg-black/20 overflow-hidden text-blue-300 text-[11px] font-black flex items-center justify-center tracking-wider">
              {iconPath && !isIconBroken ? (
                <img
                  src={iconPath}
                  alt={moduleName}
                  className="w-full h-full object-contain"
                  onError={() => setIsIconBroken(true)}
                />
              ) : (
                <span>{iconGlyph}</span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] font-bold leading-tight tracking-wide">{moduleName}</h3>
              <div className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${toneClass}`}>
                {fieldValue(passport?.statusText)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/15 p-3">
          <div className="grid grid-cols-1 gap-2.5 text-[11px] leading-5 md:grid-cols-2">
            {lineValue('Версия', passport?.manifest.version)}
            {lineValue('Последнее изменение', passport?.manifest.lastModified)}
            {lineValue('Сборка', passport?.manifest.build)}
            {lineValue('Источник', passport?.manifest.source)}
            <div className="md:col-span-2">{lineValue('Дизайн бюро', passport?.manifest.designBureau)}</div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-black/15 p-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-semibold">Интеграция</div>
          {integrations.length > 0 ? (
            <div className="mt-2 space-y-1.5 text-[11px] leading-5">
              {integrations.map((integration, index) => (
                <div key={`${integration.name ?? 'module'}-${index}`} className="grid grid-cols-[1fr_auto] gap-2">
                  <span className="text-zinc-200 break-words">{fieldValue(integration.name)}</span>
                  <span className="text-zinc-400 font-mono">{fieldValue(integration.version)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-[11px] text-zinc-400">Не указано</div>
          )}
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-black/15 p-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-semibold">Ответственные</div>
          <div className="mt-2 space-y-1 text-[11px]">
            {responsibles.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[136px_1fr] gap-2">
                <span className="text-zinc-500">{label}</span>
                <span className="text-zinc-200">{fieldValue(value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-black/15 p-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-semibold">Описание</div>
          <p className="mt-2 text-[11px] leading-5 text-zinc-300">{fieldValue(passport?.manifest.description)}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenModule}
            className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider"
          >
            Открыть модуль
          </button>
          <button
            type="button"
            onClick={onOpenHistory}
            className="h-8 px-3 rounded-md border border-white/15 hover:border-white/30 text-[10px] font-bold uppercase tracking-wider"
          >
            История версий
          </button>
          <button
            type="button"
            onClick={onCopyDetails}
            className="h-8 px-3 rounded-md border border-white/15 hover:border-white/30 text-[10px] font-bold uppercase tracking-wider"
          >
            Копировать сведения
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded-md border border-white/15 hover:border-white/30 text-[10px] font-bold uppercase tracking-wider ml-auto"
          >
            Закрыть
          </button>
        </div>

        {loading && (
          <div className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden rounded-b-2xl">
            <div className="h-full w-full animate-pulse bg-blue-500/60" />
          </div>
        )}
      </section>
    </div>
  );
};

export default ModulePassportModal;
