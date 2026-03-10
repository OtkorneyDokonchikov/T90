import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  UserRole,
  ToolType,
  AppScenario,
  WorkspaceState,
  DocumentTemplateConfig,
  DocumentOrientation,
  QcResultSummary,
  OperatorReportSummary,
  VoiceCommandId,
  VoiceNoticeTone,
  VoiceToast,
  OpenDocumentTabState,
} from './types';
import TopBar from './components/TopBar';
import LeftSidebar from './components/LeftSidebar';
import RightInspector from './components/RightInspector';
import Canvas from './components/Canvas';
import StatusBar from './components/StatusBar';
import DocumentTemplateModal from './components/DocumentTemplateModal';
import QcResultModal from './components/QcResultModal';
import WorkstationLockOverlay, { LockSessionSnapshot } from './components/WorkstationLockOverlay';
import ReportModal from './components/ReportModal';
import { useVoiceControl } from './hooks/useVoiceControl';

const cleanDisplayName = (value: string): string => value.replace(/\.[a-z0-9]+$/i, '').trim();

const initialOpenDocuments: OpenDocumentTabState[] = [
  {
    id: 'doc-666',
    displayName: 'Дело № 666',
    internalFileName: 'delo_666.indd',
    isDirty: false,
    scenario: AppScenario.CREATE,
    selectedPage: 1,
    pageOrientation: 'portrait',
    documentType: 'document',
    layoutMode: 'single',
    spreadMode: false,
    pageCount: 42,
    pageSize: 'A4',
    widthMm: 210,
    heightMm: 297,
    previewImage: 'https://picsum.photos/seed/delo666/1200/1600?grayscale',
    zoom: 100,
    structureNodes: ['Изображения', 'Текстовые блоки', 'Подписи', 'Объекты', 'Слои', 'Области редактирования'],
  },
  {
    id: 'award-19508',
    displayName: 'Наградной документ 19508',
    internalFileName: 'award_19508.pdf',
    isDirty: true,
    scenario: AppScenario.IMPORT,
    selectedPage: 7,
    pageOrientation: 'portrait',
    documentType: 'document',
    layoutMode: 'single',
    spreadMode: false,
    pageCount: 18,
    pageSize: 'A4',
    widthMm: 210,
    heightMm: 297,
    previewImage: 'https://picsum.photos/seed/award19508/1200/1600',
    zoom: 100,
    structureNodes: ['Изображения', 'Текстовые блоки', 'Подписи', 'Штампы', 'Слои'],
  },
  {
    id: 'brochure-a5',
    displayName: 'Брошюра A5',
    internalFileName: 'brochure_a5.tiff',
    isDirty: false,
    scenario: AppScenario.CREATE,
    selectedPage: 3,
    pageOrientation: 'landscape',
    documentType: 'brochure',
    layoutMode: 'spread',
    spreadMode: true,
    pageCount: 12,
    pageSize: 'A5',
    widthMm: 148,
    heightMm: 210,
    previewImage: 'https://picsum.photos/seed/brochurea5/1600/1200',
    zoom: 100,
    structureNodes: ['Левая страница разворота', 'Правая страница разворота', 'Текстовые блоки', 'Иллюстрации', 'Сетки'],
  },
];

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
  const [openDocuments, setOpenDocuments] = useState<OpenDocumentTabState[]>(initialOpenDocuments);
  const [activeDocumentId, setActiveDocumentId] = useState<string>(initialOpenDocuments[0].id);
  const [lockedAt, setLockedAt] = useState<string>('');
  const [lockSnapshot, setLockSnapshot] = useState<LockSessionSnapshot | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [voiceToast, setVoiceToast] = useState<VoiceToast | null>(null);
  const voiceToastSeqRef = useRef(1);

  const activeDocument = openDocuments.find((doc) => doc.id === activeDocumentId) ?? openDocuments[0];
  const pageOrientation: DocumentOrientation = activeDocument?.pageOrientation ?? 'portrait';
  const activePageCount = activeDocument?.pageCount ?? 1;

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

  const updateDocumentState = useCallback((documentId: string, updater: (prev: OpenDocumentTabState) => OpenDocumentTabState) => {
    setOpenDocuments((prev) => prev.map((doc) => (doc.id === documentId ? updater(doc) : doc)));
  }, []);

  const syncActiveDocument = useCallback((documentId: string) => {
    const target = openDocuments.find((doc) => doc.id === documentId);
    if (!target) return;

    setState((prev) => ({
      ...prev,
      selectedPage: 1,
    }));
    updateDocumentState(documentId, (prev) => ({ ...prev, selectedPage: 1 }));
  }, [openDocuments, updateDocumentState]);

  const activateDocument = useCallback((documentId: string) => {
    setActiveDocumentId(documentId);
    syncActiveDocument(documentId);
  }, [syncActiveDocument]);

  const closeDocumentTab = useCallback((documentId: string) => {
    setOpenDocuments((prev) => {
      const target = prev.find((doc) => doc.id === documentId);
      if (!target) return prev;

      if (target.isDirty) {
        const confirmed = window.confirm(`Закрыть «${target.displayName}» без сохранения изменений?`);
        if (!confirmed) return prev;
      }

      if (prev.length <= 1) {
        return prev;
      }

      const currentIndex = prev.findIndex((doc) => doc.id === documentId);
      const nextDocs = prev.filter((doc) => doc.id !== documentId);

      if (target.id === activeDocumentId) {
        const nextIndex = Math.max(0, currentIndex - 1);
        const nextActive = nextDocs[nextIndex] ?? nextDocs[0];
        if (nextActive) {
          setActiveDocumentId(nextActive.id);
          setState((statePrev) => ({
            ...statePrev,
            selectedPage: 1,
          }));
          setOpenDocuments((docsPrev) => docsPrev.map((doc) => (doc.id === nextActive.id ? { ...doc, selectedPage: 1 } : doc)));
        }
      }

      return nextDocs;
    });
  }, [activeDocumentId]);

  const openDocumentTab = useCallback((params: {
    displayName: string;
    internalFileName: string;
    scenario: AppScenario;
    selectedPage?: number;
    pageOrientation?: DocumentOrientation;
    isDirty?: boolean;
    pageCount?: number;
    documentType?: OpenDocumentTabState['documentType'];
    layoutMode?: OpenDocumentTabState['layoutMode'];
    spreadMode?: boolean;
    previewImage?: string;
    zoom?: number;
    structureNodes?: string[];
    pageSize?: OpenDocumentTabState['pageSize'];
    widthMm?: number;
    heightMm?: number;
  }) => {
    const displayName = cleanDisplayName(params.displayName);

    const newDoc: OpenDocumentTabState = {
      id: `doc-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      displayName,
      internalFileName: params.internalFileName,
      isDirty: params.isDirty ?? false,
      scenario: params.scenario,
      selectedPage: params.selectedPage ?? 1,
      pageOrientation: params.pageOrientation ?? 'portrait',
      documentType: params.documentType ?? 'document',
      layoutMode: params.layoutMode ?? 'single',
      spreadMode: params.spreadMode ?? false,
      pageCount: Math.max(1, params.pageCount ?? 24),
      pageSize: params.pageSize ?? 'A4',
      widthMm: params.widthMm ?? 210,
      heightMm: params.heightMm ?? 297,
      previewImage: params.previewImage ?? `https://picsum.photos/seed/${encodeURIComponent(displayName)}/1200/1600`,
      zoom: params.zoom ?? 100,
      structureNodes: params.structureNodes ?? ['Изображения', 'Текстовые блоки', 'Подписи', 'Объекты', 'Слои', 'Области редактирования'],
    };

    setOpenDocuments((prev) => [...prev, newDoc]);
    setActiveDocumentId(newDoc.id);
    setState((prev) => ({
      ...prev,
      selectedPage: 1,
    }));
    setOpenDocuments((prev) => prev.map((doc) => (doc.id === newDoc.id ? { ...doc, selectedPage: 1 } : doc)));
  }, []);

  const handleScenarioChange = useCallback((s: AppScenario) => {
    setState(prev => ({ ...prev, scenario: s }));
    if (activeDocument) {
      updateDocumentState(activeDocument.id, (prev) => ({ ...prev, scenario: s, isDirty: true }));
    }
  }, [activeDocument, updateDocumentState]);

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
    const clampedPage = Math.max(1, Math.min(activePageCount, newPage));
    setState(prev => ({ ...prev, selectedPage: clampedPage }));
    if (activeDocument) {
      updateDocumentState(activeDocument.id, (prev) => ({ ...prev, selectedPage: clampedPage }));
    }
  }, [activeDocument, activePageCount, updateDocumentState]);

  const handleCreateFromTemplate = useCallback((config: DocumentTemplateConfig) => {
    setDocumentConfig(config);
    openDocumentTab({
      displayName: config.name,
      internalFileName: `${config.name}.indd`,
      scenario: AppScenario.CREATE,
      selectedPage: config.startNumber,
      pageOrientation: config.orientation,
      isDirty: true,
      pageCount: config.pages,
      documentType: config.name.toLowerCase().includes('брошюра') ? 'brochure' : 'document',
      layoutMode: config.name.toLowerCase().includes('брошюра') ? 'spread' : 'single',
      spreadMode: config.name.toLowerCase().includes('брошюра'),
      pageSize: config.name.toLowerCase().includes('a5') ? 'A5' : 'Custom',
      widthMm: config.unit === 'мм' ? config.width : 210,
      heightMm: config.unit === 'мм' ? config.height : 297,
      previewImage: `https://picsum.photos/seed/${encodeURIComponent(config.name)}/1400/1000`,
      structureNodes: config.name.toLowerCase().includes('брошюра')
        ? ['Левая страница разворота', 'Правая страница разворота', 'Текстовые блоки', 'Иллюстрации', 'Сетки']
        : ['Изображения', 'Текстовые блоки', 'Подписи', 'Объекты', 'Слои', 'Области редактирования'],
    });
    addHistory(
      `Создан документ «${config.name}»: ${config.width}×${config.height} ${config.unit}, страниц ${config.pages}, колонки ${config.columns}`,
    );
    setIsTemplateModalOpen(false);
  }, [addHistory, openDocumentTab]);

  const formatVoiceHistoryEntry = useCallback((commandText: string) => {
    const now = new Date();
    return `${now.toLocaleDateString('ru-RU')} | ${now.toLocaleTimeString('ru-RU', { hour12: false })} | ${commandText}`;
  }, []);

  const nowLabel = useCallback(() => new Date().toLocaleString('ru-RU'), []);

  const pushVoiceToast = useCallback((message: string, tone: VoiceNoticeTone) => {
    setVoiceToast({
      id: voiceToastSeqRef.current,
      message,
      tone,
    });
    voiceToastSeqRef.current += 1;
  }, []);

  const requestLockWorkstation = () => {
    setIsLockConfirmOpen(true);
  };

  const lockWorkstationNow = useCallback(() => {
    if (isWorkstationLocked) return;

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
  }, [
    addHistory,
    isWorkstationLocked,
    nowLabel,
    state.isSidebarOpen,
    state.isVoiceActive,
    state.scenario,
    state.selectedPage,
    updateState,
  ]);

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

  const handleVoiceCommand = useCallback((commandId: VoiceCommandId) => {
    switch (commandId) {
      case 'open_document':
        openDocumentTab({
          displayName: `Документ ${openDocuments.length + 1}`,
          internalFileName: `document_${openDocuments.length + 1}.pdf`,
          scenario: AppScenario.IMPORT,
          selectedPage: 1,
          pageOrientation: 'portrait',
          isDirty: false,
        });
        addHistory('Голосовая команда: открыть документ');
        break;
      case 'hide_right_panel':
        setState((prev) => ({ ...prev, rightSidebarCollapsed: true }));
        addHistory('Голосовая команда: скрыта правая панель');
        break;
      case 'set_landscape_orientation':
        if (pageOrientation === 'landscape') {
          return {
            notice: {
              message: 'Документ уже в горизонтальной ориентации',
              tone: 'neutral' as const,
            },
          };
        }

        if (activeDocument) {
          updateDocumentState(activeDocument.id, (prev) => ({ ...prev, pageOrientation: 'landscape', isDirty: true }));
        }
        addHistory(formatVoiceHistoryEntry('Измени ориентацию документа с вертикальной на горизонтальную'));

        return {
          notice: {
            message: 'Ориентация изменена',
            tone: 'success' as const,
          },
        };
      case 'show_qc_result':
        setState((prev) => ({ ...prev, scenario: AppScenario.QUALITY_CONTROL }));
        setIsQcResultModalOpen(true);
        addHistory('Голосовая команда: открыт результат проверки');
        break;
      case 'lock_workstation':
        addHistory('Голосовая команда: заблокировать рабочее место');
        lockWorkstationNow();
        break;
      default:
        break;
    }
    return undefined;
  }, [
    activeDocument,
    addHistory,
    formatVoiceHistoryEntry,
    lockWorkstationNow,
    openDocumentTab,
    openDocuments.length,
    pageOrientation,
    updateDocumentState,
  ]);

  const handlePageOrientationChange = useCallback((orientation: DocumentOrientation) => {
    if (!activeDocument) return;
    updateDocumentState(activeDocument.id, (prev) => ({ ...prev, pageOrientation: orientation, isDirty: true }));
  }, [activeDocument, updateDocumentState]);

  const { voiceStatus, lastRecognizedCommand } = useVoiceControl({
    enabled: state.isVoiceActive,
    blocked: isWorkstationLocked || isLockConfirmOpen,
    onCommand: handleVoiceCommand,
    onNotice: pushVoiceToast,
  });

  useEffect(() => {
    if (!voiceToast) return;

    const timerId = window.setTimeout(() => {
      setVoiceToast((prev) => (prev?.id === voiceToast.id ? null : prev));
    }, 2400);

    return () => window.clearTimeout(timerId);
  }, [voiceToast]);

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
          pageCount={activePageCount}
          structureNodes={activeDocument?.structureNodes ?? []}
          activeDocumentName={activeDocument?.displayName ?? 'Документ'}
          spreadMode={activeDocument?.spreadMode ?? false}
          theme={state.theme}
        />

        <main className={`flex-1 flex flex-col relative ${isDark ? 'bg-[#0d0d0d]' : 'bg-zinc-100/50'}`}>
          <div className={`h-10 border-b flex items-center px-2 overflow-x-auto custom-scrollbar gap-1 ${isDark ? 'bg-[#101216] border-white/10' : 'bg-zinc-100 border-zinc-300'}`}>
            {openDocuments.map((doc) => {
              const active = doc.id === activeDocumentId;

              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => activateDocument(doc.id)}
                  className={`group h-8 max-w-[240px] min-w-[148px] px-3 rounded-md border flex items-center justify-between gap-2 transition-colors ${
                    active
                      ? (isDark ? 'bg-[#1a1f28] border-cyan-500/35 text-zinc-100' : 'bg-white border-blue-400/50 text-zinc-900')
                      : (isDark ? 'bg-[#0d1117] border-white/10 text-zinc-400 hover:text-zinc-200' : 'bg-zinc-200/70 border-zinc-300 text-zinc-600 hover:text-zinc-900')
                  }`}
                >
                  <span className="truncate text-[11px] font-semibold tracking-wide">
                    {doc.displayName}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {doc.isDirty ? <span className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-amber-400' : 'bg-amber-500'}`} /> : null}
                    <span
                      role="button"
                      aria-label={`Закрыть ${doc.displayName}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        closeDocumentTab(doc.id);
                      }}
                      className={`inline-flex h-4 w-4 items-center justify-center rounded text-[10px] ${isDark ? 'text-zinc-500 hover:bg-white/10 hover:text-zinc-100' : 'text-zinc-500 hover:bg-zinc-300/70 hover:text-zinc-900'}`}
                    >
                      ×
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <Canvas
            scenario={state.scenario}
            activeTool={state.activeTool}
            onToolSelect={(t) => updateState('activeTool', t)}
            onAction={addHistory}
            pageOrientation={pageOrientation}
            onPageOrientationChange={handlePageOrientationChange}
            pageCount={activePageCount}
            previewImage={activeDocument?.previewImage ?? ''}
            layoutMode={activeDocument?.layoutMode ?? 'single'}
            spreadMode={activeDocument?.spreadMode ?? false}
            documentType={activeDocument?.documentType ?? 'document'}
            pageSize={activeDocument?.pageSize ?? 'A4'}
            widthMm={activeDocument?.widthMm ?? 210}
            heightMm={activeDocument?.heightMm ?? 297}
            zoom={activeDocument?.zoom ?? 100}
            onZoomChange={(nextZoom) => {
              if (!activeDocument) return;
              updateDocumentState(activeDocument.id, (prev) => ({ ...prev, zoom: nextZoom, isDirty: true }));
            }}
            theme={state.theme}
          />
        </main>

        <RightInspector
          isVoiceActive={state.isVoiceActive}
          setIsVoiceActive={(v) => updateState('isVoiceActive', v)}
          voiceStatus={voiceStatus}
          lastRecognizedCommand={lastRecognizedCommand}
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
        currentPage={state.selectedPage}
        totalPages={activePageCount}
        onPageChange={handlePageChange}
        voiceToast={voiceToast}
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
                onClick={lockWorkstationNow}
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
