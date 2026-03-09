import React from 'react';
import { OperatorReportSummary, Theme } from '../types';

interface OfficialReportPayload {
  text: string;
  html: string;
}

interface ReportModalProps {
  isOpen: boolean;
  theme: Theme;
  report: OperatorReportSummary;
  onClose: () => void;
  onSave: () => void;
  onPrint: () => void;
  onSend: (payload: OfficialReportPayload) => void;
}

const valueOrZero = (value?: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return value;
};

const textOrDefault = (value?: string): string => {
  if (!value || !value.trim()) return 'Не указано';
  return value;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, theme, report, onClose, onSave, onPrint, onSend }) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const pagePalette = isDark
    ? {
        pageBg: '#1b2430',
        pageText: '#e5e7eb',
        metaBorder: '#475569',
        dots: '#64748b',
        line: '#94a3b8',
        surface: '#0f1720',
        surfaceBorder: 'rgba(148, 163, 184, 0.28)',
      }
    : {
        pageBg: '#ffffff',
        pageText: '#1f2937',
        metaBorder: '#d1d5db',
        dots: '#9ca3af',
        line: '#6b7280',
        surface: '#f4f7fb',
        surfaceBorder: 'rgba(15, 23, 42, 0.12)',
      };

  const stats = {
    volumesProcessed: valueOrZero(report.stats?.volumesProcessed),
    pagesProcessed: valueOrZero(report.stats?.pagesProcessed),
    awardMaterials: valueOrZero(report.stats?.awardMaterials),
    incomingDocuments: valueOrZero(report.stats?.incomingDocuments),
    submissions: valueOrZero(report.stats?.submissions),
    otherDocuments: valueOrZero(report.stats?.otherDocuments),
  };

  const operator = textOrDefault(report.operatorName);
  const reportDate = textOrDefault(report.reportDate);
  const from = textOrDefault(report.timeFrom);
  const to = textOrDefault(report.timeTo);

  const officialText = `ОТЧЕТ О ВЫПОЛНЕННЫХ РАБОТАХ | Оператор: ${operator} | Дата: ${reportDate} | Период: ${from}-${to} | Томов: ${stats.volumesProcessed} | Страниц: ${stats.pagesProcessed} | Наградных материалов: ${stats.awardMaterials} | Входящих документов: ${stats.incomingDocuments} | Представлений: ${stats.submissions} | Других документов: ${stats.otherDocuments}`;

  const buildStatsRows = (): string =>
    [
      ['Обработано томов', stats.volumesProcessed],
      ['Обработано страниц', stats.pagesProcessed],
      ['Наградных материалов', stats.awardMaterials],
      ['Входящих документов', stats.incomingDocuments],
      ['Представлений', stats.submissions],
      ['Других документов', stats.otherDocuments],
    ]
      .map(
        ([label, value]) =>
          `<tr><td class="label">${escapeHtml(String(label))}</td><td class="dots"></td><td class="value">${escapeHtml(String(value))}</td></tr>`,
      )
      .join('');

  const buildA4ContentHtml = (): string => `
    <main class="page">
      <h1>ОТЧЕТ О ВЫПОЛНЕННЫХ РАБОТАХ</h1>
      <section class="meta">
        <div>Оператор: ${escapeHtml(operator)}</div>
        <div>Дата: ${escapeHtml(reportDate)}</div>
        <div>Период: с ${escapeHtml(from)} до ${escapeHtml(to)}</div>
      </section>
      <table aria-label="Показатели отчета"><tbody>${buildStatsRows()}</tbody></table>
      <div class="footer-text">Отчет сформирован по результатам выполненных работ за указанный период.</div>
      <section class="sign">
        <div>Ответственный оператор: <span class="line"></span></div>
        <div>Дата формирования: <span class="line"></span></div>
        <div>Подпись: <span class="line"></span></div>
      </section>
    </main>
  `;

  const buildA4Styles = (): string => `
    .page {
      box-sizing: border-box;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 18mm 16mm 16mm;
      background: ${pagePalette.pageBg};
      color: ${pagePalette.pageText};
      font-family: Arial, 'Segoe UI', sans-serif;
      box-shadow: 0 20px 40px rgba(0,0,0,0.22);
    }
    h1 { text-align: center; font-size: 20px; letter-spacing: 0.08em; margin: 0 0 20px; text-transform: uppercase; }
    .meta { border: 1px solid ${pagePalette.metaBorder}; padding: 12px 14px; margin-bottom: 18px; font-size: 14px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    td { font-size: 14px; padding: 4px 0; vertical-align: bottom; }
    td.label { white-space: nowrap; }
    td.dots { width: 100%; border-bottom: 1px dotted ${pagePalette.dots}; }
    td.value { width: 64px; text-align: right; font-weight: 700; }
    .footer-text { margin-top: 12px; font-size: 13px; }
    .sign { margin-top: 28px; font-size: 13px; line-height: 2.1; }
    .line { display: inline-block; min-width: 220px; border-bottom: 1px solid ${pagePalette.line}; transform: translateY(-2px); }
  `;

  const buildOfficialPrintHtml = (): string => {
    return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Отчет о выполненных работах</title>
    <style>
      body { margin: 0; background: ${isDark ? '#0b1220' : '#eef3f8'}; }
      ${buildA4Styles()}
      @page { size: A4 portrait; margin: 0; }
      @media print {
        body { background: #fff; }
        .page {
          margin: 0;
          box-shadow: none;
          background: #fff !important;
          color: #1f2937 !important;
        }
        .meta { border-color: #d1d5db !important; }
        td.dots { border-bottom-color: #9ca3af !important; }
        .line { border-bottom-color: #6b7280 !important; }
      }
    </style>
  </head>
  <body>
    ${buildA4ContentHtml()}
  </body>
</html>`;
  };

  const openPrintLayout = (withPrintDialog: boolean) => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=980,height=720');
    if (!printWindow) return;
    const html = buildOfficialPrintHtml();
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    if (withPrintDialog) {
      printWindow.focus();
      printWindow.print();
    }
  };

  const saveOfficialReport = () => {
    const html = buildOfficialPrintHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeDate = reportDate.replace(/[^0-9.]/g, '').replace(/\./g, '-');
    link.href = objectUrl;
    link.download = `report_${safeDate || 'document'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Закрыть окно"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      <section
        className={`relative w-full max-w-[720px] rounded-xl border shadow-[0_30px_100px_rgba(0,0,0,0.65)] overflow-hidden ${
          isDark ? 'bg-[#10151d] border-white/10 text-zinc-200' : 'bg-[#f2f5fa] border-slate-300 text-slate-800'
        }`}
      >
        <div className={`px-4 py-3 ${isDark ? 'border-b border-white/10' : 'border-b border-slate-300'}`}>
          <h3 className={`text-[13px] font-bold uppercase tracking-[0.14em] ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>Отчет о выполненных работах</h3>
        </div>

        <div className="px-4 py-3 max-h-[68vh] overflow-y-auto custom-scrollbar">
          <div className="mx-auto w-full max-w-[510px]">
            <div
              className="mx-auto aspect-[210/297] w-full shadow-[0_20px_36px_rgba(0,0,0,0.35)]"
              style={{
                background: pagePalette.pageBg,
                color: pagePalette.pageText,
                border: `1px solid ${pagePalette.surfaceBorder}`,
                transformOrigin: 'top center',
              }}
            >
              <div className="box-border h-full" style={{ padding: '8.7% 7.6% 7.6%' }}>
              <h4 className="text-center text-[20px] tracking-[0.08em] font-bold uppercase m-0 mb-5">ОТЧЕТ О ВЫПОЛНЕННЫХ РАБОТАХ</h4>
              <section className="px-3.5 py-3 mb-4 text-[14px] leading-6" style={{ border: `1px solid ${pagePalette.metaBorder}` }}>
                <div>Оператор: {operator}</div>
                <div>Дата: {reportDate}</div>
                <div>Период: с {from} до {to}</div>
              </section>

              <table className="w-full border-collapse mb-4 text-[14px]">
                <tbody>
                  {[
                    ['Обработано томов', stats.volumesProcessed],
                    ['Обработано страниц', stats.pagesProcessed],
                    ['Наградных материалов', stats.awardMaterials],
                    ['Входящих документов', stats.incomingDocuments],
                    ['Представлений', stats.submissions],
                    ['Других документов', stats.otherDocuments],
                  ].map(([label, value]) => (
                    <tr key={String(label)}>
                      <td className="py-1 whitespace-nowrap">{label}</td>
                      <td className="w-full border-b border-dotted" style={{ borderBottomColor: pagePalette.dots }} />
                      <td className="py-1 w-16 text-right font-bold">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-3 text-[13px]">Отчет сформирован по результатам выполненных работ за указанный период.</div>
              <section className="mt-7 text-[13px] leading-8">
                <div>
                  Ответственный оператор:{' '}
                  <span className="inline-block min-w-[220px] border-b translate-y-[-2px]" style={{ borderBottomColor: pagePalette.line }} />
                </div>
                <div>
                  Дата формирования:{' '}
                  <span className="inline-block min-w-[220px] border-b translate-y-[-2px]" style={{ borderBottomColor: pagePalette.line }} />
                </div>
                <div>
                  Подпись: <span className="inline-block min-w-[220px] border-b translate-y-[-2px]" style={{ borderBottomColor: pagePalette.line }} />
                </div>
              </section>
            </div>
            </div>
          </div>
        </div>

        <div className={`px-4 py-3 flex flex-wrap items-center justify-end gap-2 ${isDark ? 'border-t border-white/10' : 'border-t border-slate-300'}`}>
          <button
            type="button"
            onClick={() => {
              saveOfficialReport();
              onSave();
            }}
            className="h-8 px-3 rounded-md bg-cyan-600 hover:bg-cyan-500 text-[10px] font-bold uppercase tracking-wider text-white"
          >
            Сохранить
          </button>
          <button
            type="button"
            onClick={() => {
              openPrintLayout(true);
              onPrint();
            }}
            className={`h-8 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              isDark
                ? 'border border-white/15 text-zinc-300 hover:border-white/30'
                : 'border border-slate-400 text-slate-700 hover:border-slate-500'
            }`}
          >
            Печать
          </button>
          <button
            type="button"
            onClick={() =>
              onSend({
                text: officialText,
                html: buildOfficialPrintHtml(),
              })
            }
            className={`h-8 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              isDark
                ? 'border border-white/15 text-zinc-300 hover:border-white/30'
                : 'border border-slate-400 text-slate-700 hover:border-slate-500'
            }`}
          >
            Отправить
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`h-8 px-3 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              isDark
                ? 'border border-white/15 text-zinc-400 hover:border-white/30'
                : 'border border-slate-300 text-slate-600 hover:border-slate-400'
            }`}
          >
            Закрыть
          </button>
        </div>
      </section>
    </div>
  );
};

export default ReportModal;
