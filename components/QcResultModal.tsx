import React from 'react';
import { QcResultSummary, Theme } from '../types';

interface QcResultModalProps {
  isOpen: boolean;
  theme: Theme;
  resultSummary: QcResultSummary;
  onClose: () => void;
  onSaveReport: () => void;
  onSendResult: () => void;
}

const safeValue = (value?: string | number): string => {
  if (value === undefined || value === null || value === '') return 'Не указано';
  return String(value);
};

const statusMeta = {
  success: {
    label: 'Проверка завершена',
    className: 'text-green-300 border-green-500/40 bg-green-500/10',
  },
  warning: {
    label: 'Есть замечания',
    className: 'text-yellow-300 border-yellow-500/40 bg-yellow-500/10',
  },
  error: {
    label: 'Требуется ручная проверка',
    className: 'text-red-300 border-red-500/40 bg-red-500/10',
  },
};

const QcResultModal: React.FC<QcResultModalProps> = ({
  isOpen,
  theme,
  resultSummary,
  onClose,
  onSaveReport,
  onSendResult,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const currentStatus = statusMeta[resultSummary.status ?? 'warning'];

  const checks = [
    ['Анализ TIFF', resultSummary.checks?.tiffAnalysis],
    ['Качество OCR', resultSummary.checks?.ocrQuality],
    ['Сегментация', resultSummary.checks?.segmentation],
    ['Цвет и режим', resultSummary.checks?.colorMode],
    ['Дефекты скана', resultSummary.checks?.scanDefects],
    ['Preflight', resultSummary.checks?.preflight],
  ] as const;

  const pages = [
    ['Всего страниц', resultSummary.pages?.total],
    ['Выровнено страниц', resultSummary.pages?.aligned],
    ['Исправлено перекосов', resultSummary.pages?.deskewCorrected],
    ['Очищено от шумов', resultSummary.pages?.noiseCleaned],
    ['Страниц с замечаниями', resultSummary.pages?.withWarnings],
    ['Требуют ручной проверки', resultSummary.pages?.manualReview],
  ] as const;

  const issues = resultSummary.issues ?? [];

  return (
    <div className="fixed inset-0 z-[240] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Закрыть окно"
        className="absolute inset-0 bg-black/65 backdrop-blur-[1.5px]"
        onClick={onClose}
      />

      <section
        className={`relative w-full max-w-[720px] rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,0.62)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
          isDark ? 'bg-[#10141a] border-white/10 text-zinc-200' : 'bg-[#141922] border-white/10 text-zinc-200'
        }`}
      >
        <div className="border-b border-white/10 px-3.5 py-3">
          <h3 className="text-[13px] font-bold uppercase tracking-[0.14em] text-zinc-200">Результат проверки</h3>
          <div className="mt-1.5 text-[10px] text-zinc-500 leading-4">
            <div>Документ №{safeValue(resultSummary.documentNumber)}</div>
            <div>{safeValue(resultSummary.checkedAt)}</div>
            <div>Оператор: {safeValue(resultSummary.operator)}</div>
          </div>
        </div>

        <div className="p-3 space-y-2.5 max-h-[66vh] overflow-y-auto custom-scrollbar">
          <div className="rounded-md border border-white/10 bg-black/20 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Общий статус</div>
            <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${currentStatus.className}`}>
              {currentStatus.label}
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-black/20 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Ключевые проверки</div>
            <div className="space-y-1 text-[10px]">
              {checks.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[180px_1fr] gap-2">
                  <span className="text-zinc-500">{label}</span>
                  <span className="text-zinc-200 break-words">{safeValue(value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-black/20 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Обработка страниц</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
              {pages.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[1fr_auto] gap-2">
                  <span className="text-zinc-500">{label}</span>
                  <span className="text-zinc-200 font-mono">{safeValue(value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-black/20 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Замечания</div>
            {issues.length > 0 ? (
              <ul className="space-y-1 text-[10px] text-zinc-200">
                {issues.map((issue, index) => (
                  <li key={`${issue}-${index}`} className="leading-4">• {safeValue(issue)}</li>
                ))}
              </ul>
            ) : (
              <div className="text-[10px] text-zinc-400">Замечания не обнаружены</div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 px-3.5 py-2.5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onSaveReport}
            className="h-8 px-3 rounded-md bg-cyan-600 hover:bg-cyan-500 text-[10px] font-bold uppercase tracking-wider text-white"
          >
            Сохранить отчет
          </button>
          <button
            type="button"
            onClick={onSendResult}
            className="h-8 px-3 rounded-md border border-white/15 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:border-white/30"
          >
            Отправить
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded-md border border-white/15 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:border-white/30"
          >
            Закрыть
          </button>
        </div>
      </section>
    </div>
  );
};

export default QcResultModal;
