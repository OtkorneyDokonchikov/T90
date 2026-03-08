import React, { useState } from 'react';
import { DocumentOrientation, DocumentTemplateConfig, DocumentUnit, Theme } from '../types';

interface DocumentTemplateModalProps {
  isOpen: boolean;
  theme: Theme;
  onClose: () => void;
  onCreate: (config: DocumentTemplateConfig) => void;
}

interface PresetCard {
  id: string;
  title: string;
  note: string;
  width: number;
  height: number;
  unit: DocumentUnit;
  isCustom?: boolean;
}

const presetCards: PresetCard[] = [
  { id: 'a5', title: 'A5', note: '148 × 210 мм', width: 148, height: 210, unit: 'мм' },
  { id: 'a4', title: 'A4', note: '210 × 297 мм', width: 210, height: 297, unit: 'мм' },
  { id: 'a3', title: 'A3', note: '297 × 420 мм', width: 297, height: 420, unit: 'мм' },
  { id: 'letter', title: 'Letter', note: '8.5 × 11 дюйм', width: 8.5, height: 11, unit: 'дюймы' },
  { id: 'legal', title: 'Legal', note: '8.5 × 14 дюйм', width: 8.5, height: 14, unit: 'дюймы' },
  { id: 'b5', title: 'B5', note: '176 × 250 мм', width: 176, height: 250, unit: 'мм' },
  { id: 'business_card', title: 'Визитка', note: '90 × 50 мм', width: 90, height: 50, unit: 'мм' },
  { id: 'custom', title: 'Свой шаблон', note: 'Создать новый формат', width: 210, height: 297, unit: 'мм', isCustom: true },
];

const toDraft = (preset: PresetCard): DocumentTemplateConfig => {
  if (preset.isCustom) {
    return {
      presetId: preset.id,
      name: 'Новый шаблон',
      width: 210,
      height: 297,
      unit: 'мм',
      orientation: 'portrait',
      pages: 1,
      startNumber: 1,
      columns: 1,
      columnGap: 5,
      margins: {
        top: 10,
        bottom: 10,
        inside: 10,
        outside: 10,
      },
      spread: false,
      primaryTextFrame: false,
      preview: false,
    };
  }

  return {
    presetId: preset.id,
    name: `Документ ${preset.title}`,
    width: preset.width,
    height: preset.height,
    unit: preset.unit,
    orientation: preset.width > preset.height ? 'landscape' : 'portrait',
    pages: 1,
    startNumber: 1,
    columns: 1,
    columnGap: preset.unit === 'мм' ? 5 : 0.2,
    margins: {
      top: preset.unit === 'мм' ? 10 : 0.4,
      bottom: preset.unit === 'мм' ? 10 : 0.4,
      inside: preset.unit === 'мм' ? 10 : 0.4,
      outside: preset.unit === 'мм' ? 10 : 0.4,
    },
    spread: false,
    primaryTextFrame: false,
    preview: false,
  };
};

const numberValue = (v: string): number => {
  const parsed = Number(v.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const DocumentTemplateModal: React.FC<DocumentTemplateModalProps> = ({ isOpen, theme, onClose, onCreate }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('a4');
  const [draft, setDraft] = useState<DocumentTemplateConfig>(() => toDraft(presetCards[1]));
  const isDark = theme === 'dark';

  const setOrientation = (nextOrientation: DocumentOrientation) => {
    setDraft((prev) => {
      let nextWidth = prev.width;
      let nextHeight = prev.height;

      if (nextOrientation === 'portrait' && prev.width > prev.height) {
        nextWidth = prev.height;
        nextHeight = prev.width;
      }

      if (nextOrientation === 'landscape' && prev.height > prev.width) {
        nextWidth = prev.height;
        nextHeight = prev.width;
      }

      return {
        ...prev,
        orientation: nextOrientation,
        width: nextWidth,
        height: nextHeight,
      };
    });
  };

  const handlePresetSelect = (preset: PresetCard) => {
    setSelectedPresetId(preset.id);
    setDraft(toDraft(preset));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Закрыть окно"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      <section
        className={`relative w-full max-w-[860px] rounded-xl border shadow-[0_24px_72px_rgba(0,0,0,0.62)] overflow-hidden ${
          isDark ? 'bg-[#0e1116] border-white/10 text-zinc-200' : 'bg-[#12161d] border-white/10 text-zinc-200'
        }`}
      >
        <div className="border-b border-white/10 px-3 py-2.5">
          <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-zinc-300">Создать документ по шаблону</h3>
          <p className="mt-0.5 text-[10px] text-zinc-500">Выберите формат и задайте параметры документа</p>
        </div>

        <div className="grid grid-cols-[0.95fr_1.05fr] min-h-[430px] max-h-[62vh]">
          <div className="border-r border-white/10 p-2.5 overflow-y-auto custom-scrollbar">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Пресеты форматов</div>
            <div className="grid grid-cols-2 gap-1.5">
              {presetCards.map((preset) => {
                const active = preset.id === selectedPresetId;

                if (preset.isCustom) {
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={`rounded-md border px-2 py-2 text-left transition-all min-h-[76px] ${
                        active
                          ? 'border-cyan-400/50 bg-cyan-500/10 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.16)]'
                          : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/35'
                      }`}
                    >
                      <div className="flex h-full flex-col items-center justify-center text-center gap-1">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-cyan-400/30 text-cyan-300">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                            <path d="M12 5v14" />
                            <path d="M5 12h14" />
                          </svg>
                        </span>
                        <div className="text-[12px] font-semibold text-zinc-100">{preset.title}</div>
                        <div className="text-[9px] text-zinc-500">{preset.note}</div>
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`rounded-md border px-2 py-2 text-left transition-all min-h-[76px] ${
                      active
                        ? 'border-cyan-400/50 bg-cyan-500/10 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.16)]'
                        : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/35'
                    }`}
                  >
                    <div className="text-[12px] font-semibold text-zinc-100">{preset.title}</div>
                    <div className="mt-0.5 text-[9px] text-zinc-500">{preset.note}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-2.5 overflow-y-auto custom-scrollbar">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Параметры шаблона</div>
            <div className="space-y-1.5 text-[10px]">
              <label className="grid grid-cols-[154px_1fr] gap-1.5 items-center">
                <span className="text-zinc-500">Наименование</span>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-7 rounded-md border border-white/10 bg-black/25 px-2 text-zinc-100 outline-none focus:border-cyan-400/50"
                />
              </label>

              <label className="grid grid-cols-[154px_1fr] gap-1.5 items-center">
                <span className="text-zinc-500">Ширина</span>
                <input
                  type="number"
                  step="0.1"
                  value={draft.width}
                  onChange={(e) => setDraft((prev) => ({ ...prev, width: numberValue(e.target.value) }))}
                  className="h-7 rounded-md border border-white/10 bg-black/25 px-2 text-zinc-100 outline-none focus:border-cyan-400/50"
                />
              </label>

              <label className="grid grid-cols-[154px_1fr] gap-1.5 items-center">
                <span className="text-zinc-500">Высота</span>
                <input
                  type="number"
                  step="0.1"
                  value={draft.height}
                  onChange={(e) => setDraft((prev) => ({ ...prev, height: numberValue(e.target.value) }))}
                  className="h-7 rounded-md border border-white/10 bg-black/25 px-2 text-zinc-100 outline-none focus:border-cyan-400/50"
                />
              </label>

              <label className="grid grid-cols-[154px_1fr] gap-1.5 items-center">
                <span className="text-zinc-500">Единицы измерения</span>
                <select
                  value={draft.unit}
                  onChange={(e) => setDraft((prev) => ({ ...prev, unit: e.target.value as DocumentUnit }))}
                  className="h-7 rounded-md border border-white/10 bg-black/25 px-2 text-zinc-100 outline-none focus:border-cyan-400/50"
                >
                  <option value="мм">мм</option>
                  <option value="дюймы">дюймы</option>
                </select>
              </label>

              <div className="grid grid-cols-[154px_1fr] gap-1.5 items-center">
                <span className="text-zinc-500">Ориентация</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`h-7 rounded-md border text-[9px] font-semibold uppercase tracking-wide ${
                      draft.orientation === 'portrait'
                        ? 'border-cyan-400/50 bg-cyan-500/12 text-cyan-200'
                        : 'border-white/10 bg-black/20 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Книжная
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`h-7 rounded-md border text-[9px] font-semibold uppercase tracking-wide ${
                      draft.orientation === 'landscape'
                        ? 'border-cyan-400/50 bg-cyan-500/12 text-cyan-200'
                        : 'border-white/10 bg-black/20 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Альбомная
                  </button>
                </div>
              </div>

              <label className="grid grid-cols-[154px_1fr] gap-1.5 items-center">
                <span className="text-zinc-500">Количество страниц</span>
                <input
                  type="number"
                  min={1}
                  value={draft.pages}
                  onChange={(e) => setDraft((prev) => ({ ...prev, pages: Math.max(1, Math.floor(numberValue(e.target.value))) }))}
                  className="h-7 rounded-md border border-white/10 bg-black/25 px-2 text-zinc-100 outline-none focus:border-cyan-400/50"
                />
              </label>

              <label className="grid grid-cols-[154px_1fr] gap-1.5 items-center">
                <span className="text-zinc-500">Начальный номер</span>
                <input
                  type="number"
                  min={1}
                  value={draft.startNumber}
                  onChange={(e) => setDraft((prev) => ({ ...prev, startNumber: Math.max(1, Math.floor(numberValue(e.target.value))) }))}
                  className="h-7 rounded-md border border-white/10 bg-black/25 px-2 text-zinc-100 outline-none focus:border-cyan-400/50"
                />
              </label>

              <label className="grid grid-cols-[154px_1fr] gap-1.5 items-center">
                <span className="text-zinc-500">Колонки</span>
                <input
                  type="number"
                  min={1}
                  value={draft.columns}
                  onChange={(e) => setDraft((prev) => ({ ...prev, columns: Math.max(1, Math.floor(numberValue(e.target.value))) }))}
                  className="h-7 rounded-md border border-white/10 bg-black/25 px-2 text-zinc-100 outline-none focus:border-cyan-400/50"
                />
              </label>

              <label className="grid grid-cols-[154px_1fr] gap-1.5 items-center">
                <span className="text-zinc-500">Межколоночный интервал</span>
                <input
                  type="number"
                  step="0.1"
                  value={draft.columnGap}
                  onChange={(e) => setDraft((prev) => ({ ...prev, columnGap: numberValue(e.target.value) }))}
                  className="h-7 rounded-md border border-white/10 bg-black/25 px-2 text-zinc-100 outline-none focus:border-cyan-400/50"
                />
              </label>

              <div className="rounded-md border border-white/10 bg-black/20 p-2">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1.5">Поля</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    ['top', 'Верхнее'],
                    ['bottom', 'Нижнее'],
                    ['inside', 'Внутреннее'],
                    ['outside', 'Внешнее'],
                  ].map(([key, label]) => (
                    <label key={key} className="grid grid-cols-[1fr_78px] items-center gap-1.5">
                      <span className="text-zinc-500">{label}</span>
                      <input
                        type="number"
                        step="0.1"
                        value={draft.margins[key as keyof DocumentTemplateConfig['margins']]}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            margins: {
                              ...prev.margins,
                              [key]: numberValue(e.target.value),
                            },
                          }))
                        }
                        className="h-7 rounded-md border border-white/10 bg-black/25 px-2 text-zinc-100 outline-none focus:border-cyan-400/50"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[154px_1fr] gap-1.5 items-start">
                <span className="text-zinc-500 mt-0.5">Параметры</span>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-zinc-300">
                    <input
                      type="checkbox"
                      checked={draft.spread}
                      onChange={(e) => setDraft((prev) => ({ ...prev, spread: e.target.checked }))}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-black/30"
                    />
                    Разворот
                  </label>
                  <label className="flex items-center gap-2 text-zinc-300">
                    <input
                      type="checkbox"
                      checked={draft.primaryTextFrame}
                      onChange={(e) => setDraft((prev) => ({ ...prev, primaryTextFrame: e.target.checked }))}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-black/30"
                    />
                    Основной текстовый фрейм
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 px-3 py-2.5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3 rounded-md border border-white/15 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:border-white/30"
          >
            Закрыть
          </button>
          <button
            type="button"
            onClick={() => onCreate(draft)}
            className="h-8 px-3 rounded-md bg-cyan-600 hover:bg-cyan-500 text-[10px] font-bold uppercase tracking-wider text-white"
          >
            Создать
          </button>
        </div>
      </section>
    </div>
  );
};

export default DocumentTemplateModal;
