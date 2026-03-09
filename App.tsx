import React, { useState, useCallback, useEffect } from 'react';
import { UserRole, ToolType, AppScenario, WorkspaceState, DocumentTemplateConfig, QcResultSummary, OperatorReportSummary } from './types';
import TopBar from './components/TopBar';
import LeftSidebar from './components/LeftSidebar';
import RightInspector from './components/RightInspector';
import Canvas from './components/Canvas';
import StatusBar from './components/StatusBar';
import DocumentTemplateModal from './components/DocumentTemplateModal';
import QcResultModal from './components/QcResultModal';
import WorkstationLockOverlay, { LockSessionSnapshot } from './components/WorkstationLockOverlay';
import ReportModal from './components/ReportModal';

const App: React.FC = () => {
  const [state, setState] = useState<WorkspaceState>({
    role: UserRole.OPERATOR,
    scenario: AppScenario.CREATE,
    activeTool: ToolType.SELECT,
    isVoiceActive: false,
    isSidebarOpen: true,
    rightSidebarCollapsed: false,
    historyIndex: 0,
    history: ['Сессия успешно инициализирована'],
    theme: 'dark',
    selectedPage: 1,
  });
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [documentConfig, setDocumentConfig] = useState<DocumentTemplateConfig | null>(null);
  const [isQcResultModalOpen, setIsQcResultModalOpen] = useState(false);
  const [isLockConfirmOpen, setIsLockConfirmOpen] = useState(false);
  const [isWorkstationLocked, setIsWorkstationLocked] = useState(false);
  const [lockedAt, setLockedAt] = useState<string>('');
  const [lockSnapshot, setLockSnapshot] = useState<LockSessionSnapshot | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const qcResult: QcResultSummary = {
    documentNumber: '126',
    checkedAt: '08.03.2026 19:10',
    operator: 'Кондарев С.А.',
    status: 'warning',
    checks: {
      tiffAnalysis: 'выполнено',
      ocrQuality: '98%',
      segmentation: 'выполнено',
      colorMode: 'соответствует требованиям',
      scanDefects: '2 замечания',
      preflight: 'успешно',
    },
    pages: {
      total: 42,
      aligned: 38,
      deskewCorrected: 6,
      noiseCleaned: 12,
      withWarnings: 3,
      manualReview: 2,
    },
    issues: [
      'Стр. 12 — перекос изображения',
      'Стр. 19 — пониженная контрастность',
      'Стр. 27 — артефакт сканирования',
    ],
  };

  const operatorReport: OperatorReportSummary = {
    operatorName: 'Кондарев С.А.',
    reportDate: '09.02.2026',
    timeFrom: '09:00',
    timeTo: '18:00',
    stats: {
      volumesProcessed: 3,
      pagesProcessed: 248,
      awardMaterials: 16,
      incomingDocuments: 21,
      submissions: 7,
      otherDocuments: 5,
    },
  };

  const updateState = useCallback(<K extends keyof WorkspaceState>(key: K, value: WorkspaceState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleScenarioChange = useCallback((s: AppScenario) => {
    setState(prev => ({ ...prev, scenario: s }));
  }, []);

  const toggleTheme = () => {
    updateState('theme', state.theme === 'dark' ? 'light' : 'dark');
  };

  const addHistory = useCallback((entry: string) => {
    setState(prev => ({
      ...prev,
      history: [...prev.history, entry],
      historyIndex: prev.history.length,
    }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setState(prev => ({ ...prev, selectedPage: Math.max(1, Math.min(100, newPage)) }));
  }, []);

  const handleCreateFromTemplate = useCallback((config: DocumentTemplateConfig) => {
    setDocumentConfig(config);
    setState(prev => ({ ...prev, scenario: AppScenario.CREATE, selectedPage: config.startNumber }));
    addHistory(
      `Создан документ «${config.name}»: ${config.width}×${config.height} ${config.unit}, страниц ${config.pages}, колонки ${config.columns}`,
    );
    setIsTemplateModalOpen(false);
  }, [addHistory]);

  const nowLabel = () => new Date().toLocaleString('ru-RU');

  const requestLockWorkstation = () => {
    setIsLockConfirmOpen(true);
  };

  const confirmLockWorkstation = () => {
    const snapshot: LockSessionSnapshot = {
      page: state.selectedPage,
      zoom: 100,
      scenario: state.scenario,
      hasInProgressTasks: true,
      panels: {
        leftSidebarOpen: state.isSidebarOpen,
        voiceActive: state.isVoiceActive,
      },
      autosavedAt: nowLabel(),
    };

    setLockSnapshot(snapshot);
    setLockedAt(nowLabel());
    setIsLockConfirmOpen(false);
    setIsWorkstationLocked(true);
    setIsTemplateModalOpen(false);
    setIsQcResultModalOpen(false);

    addHistory(`Автосохранение перед блокировкой: стр. ${snapshot.page}, сценарий ${snapshot.scenario}`);
    addHistory('Рабочее место заблокировано');
    updateState('isVoiceActive', false);
  };

  const unlockWorkstation = () => {
    setIsWorkstationLocked(false);
    addHistory('Рабочее место разблокировано');
  };

  const handleSwitchUser = () => {
    setIsWorkstationLocked(false);
    setIsLockConfirmOpen(false);
    addHistory('Открыт экран входа другого пользователя');
    updateState('role', UserRole.OPERATOR);
  };

  const handleFinishShift = () => {
    const confirmed = window.confirm('Завершить смену и закрыть текущую рабочую сессию?');
    if (!confirmed) return;
    setIsWorkstationLocked(false);
    setIsLockConfirmOpen(false);
    addHistory('Смена завершена');
  };

  const handleLogout = () => {
    setIsWorkstationLocked(false);
    setIsLockConfirmOpen(false);
    addHistory('Выполнен выход из системы');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'v') updateState('isVoiceActive', !state.isVoiceActive);
      if (e.key === 'ArrowDown') handlePageChange(state.selectedPage + 1);
      if (e.key === 'ArrowUp') handlePageChange(state.selectedPage - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedPage, state.isVoiceActive, handlePageChange, updateState]);

  const isDark = state.theme === 'dark';

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden select-none transition-colors duration-300 ${isDark ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-900'}`}>
      <TopBar
        role={state.role}
        onRoleChange={(r) => updateState('role', r)}
        scenario={state.scenario}
        onScenarioChange={handleScenarioChange}
        onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
        onOpenQcResultModal={() => setIsQcResultModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onLockWorkstation={requestLockWorkstation}
        onSwitchUser={handleSwitchUser}
        onSelectRole={() => addHistory('Открыт выбор роли')}
        onFinishShift={handleFinishShift}
        onLogout={handleLogout}
        theme={state.theme}
        toggleTheme={toggleTheme}
      />

      <div className={`flex flex-1 relative overflow-hidden ${isWorkstationLocked ? 'pointer-events-none select-none' : ''}`}>
        <LeftSidebar
          isOpen={state.isSidebarOpen}
          setIsOpen={(v) => updateState('isSidebarOpen', v)}
          selectedPage={state.selectedPage}
          onPageSelect={handlePageChange}
          theme={state.theme}
        />

        <main className={`flex-1 flex flex-col relative ${isDark ? 'bg-[#0d0d0d]' : 'bg-zinc-100/50'}`}>
          <Canvas
            scenario={state.scenario}
            activeTool={state.activeTool}
            onToolSelect={(t) => updateState('activeTool', t)}
            onAction={addHistory}
            theme={state.theme}
          />
        </main>

        <RightInspector
          isVoiceActive={state.isVoiceActive}
          setIsVoiceActive={(v) => updateState('isVoiceActive', v)}
          history={state.history}
          theme={state.theme}
          isCollapsed={state.rightSidebarCollapsed}
          onToggleCollapse={() => updateState('rightSidebarCollapsed', !state.rightSidebarCollapsed)}
          onLogout={handleLogout}
        />
      </div>

      <StatusBar
        isVoiceActive={state.isVoiceActive}
        setIsVoiceActive={(v) => updateState('isVoiceActive', v)}
        lastAction={state.history[state.historyIndex]}
        currentPage={state.selectedPage}
        totalPages={100}
        onPageChange={handlePageChange}
        theme={state.theme}
      />

      {isLockConfirmOpen && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center px-4">
          <button type="button" className="absolute inset-0 bg-black/70" onClick={() => setIsLockConfirmOpen(false)} />
          <section className="relative w-full max-w-[460px] rounded-xl border border-white/10 bg-[#121821] text-zinc-200 shadow-[0_30px_100px_rgba(0,0,0,0.68)] p-4">
            <h3 className="text-[13px] font-bold uppercase tracking-[0.14em]">Заблокировать рабочее место?</h3>
            <p className="mt-2 text-[11px] leading-5 text-zinc-400">
              Текущее состояние документа и интерфейса будет сохранено. Доступ к рабочей области будет временно ограничен.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLockConfirmOpen(false)}
                className="h-8 px-3 rounded-md border border-white/15 text-[10px] font-bold uppercase tracking-wider text-zinc-300"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmLockWorkstation}
                className="h-8 px-3 rounded-md bg-cyan-600 hover:bg-cyan-500 text-[10px] font-bold uppercase tracking-wider text-white"
              >
                Заблокировать
              </button>
            </div>
          </section>
        </div>
      )}

      <DocumentTemplateModal
        isOpen={isTemplateModalOpen}
        theme={state.theme}
        onClose={() => setIsTemplateModalOpen(false)}
        onCreate={handleCreateFromTemplate}
      />

      <QcResultModal
        isOpen={isQcResultModalOpen}
        theme={state.theme}
        resultSummary={qcResult}
        onClose={() => setIsQcResultModalOpen(false)}
        onSaveReport={() => {
          addHistory(`Отчёт сохранён: документ №${qcResult.documentNumber ?? 'Не указано'}`);
          setIsQcResultModalOpen(false);
        }}
        onSendResult={() => {
          addHistory(`Результат отправлен: документ №${qcResult.documentNumber ?? 'Не указано'}`);
          setIsQcResultModalOpen(false);
        }}
      />

      <WorkstationLockOverlay
        isOpen={isWorkstationLocked}
        theme={state.theme}
        operatorName="Кондарев С.А."
        role={state.role}
        lockedAt={lockedAt || nowLabel()}
        snapshot={lockSnapshot}
        onUnlock={unlockWorkstation}
        onSwitchUser={handleSwitchUser}
        onFinishShift={handleFinishShift}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        theme={state.theme}
        report={operatorReport}
        onClose={() => setIsReportModalOpen(false)}
        onSave={() => {
          addHistory(`Отчёт сохранён: ${operatorReport.reportDate ?? 'дата не указана'}`);
          setIsReportModalOpen(false);
        }}
        onPrint={() => {
          addHistory(`Отчёт отправлен на печать: ${operatorReport.reportDate ?? 'дата не указана'}`);
          setIsReportModalOpen(false);
        }}
        onSend={(payload) => {
          addHistory(`Отчёт отправлен по маршруту: ${operatorReport.reportDate ?? 'дата не указана'}`);
          addHistory(`Источник отправки: официальный шаблон (${payload.text.slice(0, 42)}...)`);
          setIsReportModalOpen(false);
        }}
      />
    </div>
  );
};

export default App;
