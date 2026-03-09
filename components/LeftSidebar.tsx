import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Theme } from '../types';
import { CollapsedIconRail, RailItem, SidebarTopToggle } from './SidebarControls';

interface LeftSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedPage: number;
  onPageSelect: (page: number) => void;
  theme: Theme;
}

type SectionId = 'scan_sources' | 'local_folders' | 'in_progress_tasks' | 'work_log';
type LeftRailSectionId = SectionId | 'document_structure' | 'local_storage';
type SortOrder = 'desc' | 'asc';
type JournalView = 'all' | 'today' | 'shift' | 'operator' | 'document';

interface ScanTask {
  id: string;
  title: string;
  number: string;
}

interface ScanDevice {
  id: string;
  name: string;
  status: 'connected' | 'inactive' | 'waiting';
  localAddress?: string;
  serialNumber?: string;
  deviceType?: string;
  lastSync?: string;
  tasksAvailable?: number;
  tasks: ScanTask[];
}

interface LocalFile {
  id: string;
  name: string;
  modifiedAt: string;
  type: string;
  size: string;
}

interface LocalSource {
  id: string;
  label: string;
  files: LocalFile[];
}

interface InProgressTask {
  id: string;
  docNumber: string;
  docName: string;
  operator: string;
  stage: string;
  source: string;
  page: number;
  updatedAt: string;
}

interface JournalRecord {
  id: string;
  docNumber: string;
  docName: string;
  operationType: string;
  operator: string;
  status: string;
  note?: string;
  createdAt: string;
}

const sectionMeta: Array<{ id: SectionId; label: string }> = [
  { id: 'scan_sources', label: 'Источники сканирования' },
  { id: 'local_folders', label: 'Локальные папки' },
  { id: 'in_progress_tasks', label: 'Задания в работе' },
  { id: 'work_log', label: 'Журнал выполненных работ' },
];

const scanDevices: ScanDevice[] = [
  {
    id: 'scan_1',
    name: 'Устройство сканирования 1',
    status: 'connected',
    localAddress: '192.168.1.24',
    serialNumber: 'SN-SCAN-001247',
    deviceType: 'Промышленный сканер',
    lastSync: '08.03.2026 17:51',
    tasksAvailable: 2,
    tasks: [
      { id: 'scan_1_task_1', title: 'Техническая редакция', number: '№126' },
      { id: 'scan_1_task_2', title: 'Паспортный лист', number: '№127' },
    ],
  },
  {
    id: 'scan_2',
    name: 'Устройство сканирования 2',
    status: 'waiting',
    localAddress: '192.168.1.25',
    serialNumber: 'SN-SCAN-001248',
    deviceType: 'Промышленный сканер',
    lastSync: '08.03.2026 17:49',
    tasksAvailable: 1,
    tasks: [{ id: 'scan_2_task_1', title: 'Материал формата A4', number: '№134' }],
  },
  {
    id: 'scan_3',
    name: 'Устройство сканирования 3',
    status: 'inactive',
    localAddress: '192.168.1.26',
    serialNumber: 'SN-SCAN-001249',
    deviceType: 'Промышленный сканер',
    lastSync: '08.03.2026 16:20',
    tasksAvailable: 0,
    tasks: [],
  },
];

const localSources: LocalSource[] = [
  {
    id: 'disk_c',
    label: 'Диск C:',
    files: [
      { id: 'c_1', name: 'scan_126.tiff', modifiedAt: '08.03.2026 16:12', type: 'TIFF', size: '34.2 MB' },
      { id: 'c_2', name: 'order_127.pdf', modifiedAt: '08.03.2026 16:15', type: 'PDF', size: '2.1 MB' },
    ],
  },
  {
    id: 'disk_d',
    label: 'Диск D:',
    files: [{ id: 'd_1', name: 'set_2026_03_08.zip', modifiedAt: '08.03.2026 15:40', type: 'ZIP', size: '88.5 MB' }],
  },
  { id: 'disk_e', label: 'Диск E:', files: [] },
  {
    id: 'desktop',
    label: 'Рабочий стол',
    files: [{ id: 'desk_1', name: 'task_local_131.docx', modifiedAt: '08.03.2026 12:17', type: 'DOCX', size: '0.6 MB' }],
  },
  {
    id: 'downloads',
    label: 'Загрузки',
    files: [{ id: 'down_1', name: 'input_batch_71.pdf', modifiedAt: '08.03.2026 11:03', type: 'PDF', size: '9.4 MB' }],
  },
  {
    id: 'local_tasks_folder',
    label: 'Локальная папка заданий',
    files: [{ id: 'tasks_1', name: 'package_140.tiff', modifiedAt: '07.03.2026 19:44', type: 'TIFF', size: '27.7 MB' }],
  },
];

const inProgressTasks: InProgressTask[] = [
  {
    id: 'progress_1',
    docNumber: '№126',
    docName: 'Техническая редакция',
    operator: 'Кондарев С.А.',
    stage: 'Подготовка OCR',
    source: 'Устройство сканирования 1',
    page: 12,
    updatedAt: '2026-03-08T17:12:04+03:00',
  },
  {
    id: 'progress_2',
    docNumber: '№127',
    docName: 'Протокол проверки',
    operator: 'Кондарев С.А.',
    stage: 'Ручная верификация',
    source: 'Локальная папка заданий',
    page: 27,
    updatedAt: '2026-03-08T14:42:36+03:00',
  },
];

const workLog: JournalRecord[] = [
  {
    id: 'log_1',
    docNumber: '№126',
    docName: 'Техническая редакция',
    operationType: 'Техническая редакция',
    operator: 'Кондарев С.А.',
    status: 'Выполнено',
    note: 'Передано в каталог выполненных заданий',
    createdAt: '2026-03-08T17:12:04+03:00',
  },
  {
    id: 'log_2',
    docNumber: '№127',
    docName: 'Протокол проверки',
    operationType: 'Проверка/верификация',
    operator: 'Кондарев С.А.',
    status: 'Выполнено',
    createdAt: '2026-03-08T14:42:36+03:00',
  },
  {
    id: 'log_3',
    docNumber: '№119',
    docName: 'Сопроводительный лист',
    operationType: 'Формирование итогового файла',
    operator: 'Оператор смены Б',
    status: 'Выполнено',
    note: 'Архивная запись',
    createdAt: '2026-03-07T18:10:05+03:00',
  },
];

const dateText = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU');
};

const timeText = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString('ru-RU');
};

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const statusLabelMap: Record<ScanDevice['status'], string> = {
  connected: 'Подключено',
  waiting: 'Ожидание',
  inactive: 'Неактивно',
};

const statusToneMap: Record<ScanDevice['status'], string> = {
  connected: 'bg-green-400',
  waiting: 'bg-yellow-400',
  inactive: 'bg-zinc-400',
};

const LeftSidebar: React.FC<LeftSidebarProps> = ({ isOpen, setIsOpen, selectedPage, onPageSelect, theme }) => {
  const isDark = theme === 'dark';

  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
    new Set(['scan_sources', 'local_folders', 'in_progress_tasks', 'work_log']),
  );
  const [activeSection, setActiveSection] = useState<LeftRailSectionId>('scan_sources');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedLocalSourceId, setSelectedLocalSourceId] = useState<string>(localSources[0].id);
  const [journalView, setJournalView] = useState<JournalView>('all');
  const [journalSort, setJournalSort] = useState<SortOrder>('desc');
  const [detailCard, setDetailCard] = useState<Array<{ label: string; value: string }>>([]);
  const [detailType, setDetailType] = useState<'none' | 'device' | 'task' | 'file' | 'page' | 'journal'>('none');
  const [isDocumentStructureOpen, setIsDocumentStructureOpen] = useState(true);
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set([selectedPage]));

  const scanRef = useRef<HTMLDivElement>(null);
  const localRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const workLogRef = useRef<HTMLDivElement>(null);
  const structureRef = useRef<HTMLDivElement>(null);
  const storageRef = useRef<HTMLDivElement>(null);

  const selectedDevice = useMemo(
    () => (selectedDeviceId ? scanDevices.find((device) => device.id === selectedDeviceId) ?? null : null),
    [selectedDeviceId],
  );
  const selectedLocalSource = useMemo(
    () => localSources.find((source) => source.id === selectedLocalSourceId) ?? localSources[0],
    [selectedLocalSourceId],
  );

  const inProgressCount = inProgressTasks.length;

  const journalRecords = useMemo(() => {
    const now = new Date();
    const shiftStart = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    const filtered = workLog.filter((record) => {
      const created = new Date(record.createdAt);
      if (journalView === 'today') return isSameDay(created, now);
      if (journalView === 'shift') return created >= shiftStart;
      if (journalView === 'operator') return record.operator === 'Кондарев С.А.';
      if (journalView === 'document') return record.docNumber === '№126';
      return true;
    });

    return [...filtered].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return journalSort === 'desc' ? -diff : diff;
    });
  }, [journalSort, journalView]);

  const resetDetails = () => {
    setDetailType('none');
    setDetailCard([]);
  };

  const toggleSection = (sectionId: SectionId) => {
    resetDetails();
    setActiveSection(sectionId);
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const documentPages = useMemo(() => Array.from({ length: 100 }, (_, i) => i + 1), []);
  const activePageId = selectedPage;

  const togglePageStructure = (page: number) => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(page)) next.delete(page);
      else next.add(page);
      return next;
    });
  };

  const handlePageClick = (page: number) => {
    onPageSelect(page);
    resetDetails();
  };

  const panelTone = isDark
    ? 'bg-[#111] border-white/5 text-zinc-300'
    : 'bg-white border-zinc-200 text-zinc-700';

  const railItems: RailItem[] = [
    { id: 'scan_sources', label: 'Источники сканирования', icon: <ScannerRailIcon /> },
    { id: 'local_folders', label: 'Локальные папки', icon: <FolderRailIcon /> },
    { id: 'in_progress_tasks', label: 'Задания в работе', icon: <ClipboardListIcon /> },
    { id: 'work_log', label: 'Журнал выполненных работ', icon: <FileTextIcon /> },
    { id: 'document_structure', label: 'Структура документа', icon: <FilesIcon /> },
    { id: 'local_storage', label: 'Локальное хранилище', icon: <HardDriveIcon /> },
  ];

  const focusSection = (sectionId: LeftRailSectionId) => {
    setActiveSection(sectionId);

    if (sectionId === 'scan_sources' || sectionId === 'local_folders' || sectionId === 'in_progress_tasks' || sectionId === 'work_log') {
      setExpandedSections((prev) => {
        if (prev.has(sectionId)) return prev;
        const next = new Set(prev);
        next.add(sectionId);
        return next;
      });
    }

    if (sectionId === 'document_structure') {
      setIsDocumentStructureOpen(true);
    }

    if (!isOpen) {
      setIsOpen(true);
      return;
    }

    const refs: Record<LeftRailSectionId, React.RefObject<HTMLDivElement | null>> = {
      scan_sources: scanRef,
      local_folders: localRef,
      in_progress_tasks: progressRef,
      work_log: workLogRef,
      document_structure: structureRef,
      local_storage: storageRef,
    };

    refs[sectionId].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    if (!isOpen) return;
    const id = window.requestAnimationFrame(() => focusSection(activeSection));
    return () => window.cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeSection]);

  return (
    <aside className={`border-r transition-all duration-300 flex flex-col ${isOpen ? 'w-80' : 'w-14'} ${panelTone}`}>
      <div className={`h-11 flex items-center justify-between px-4 border-b ${isDark ? 'border-white/5' : 'border-zinc-100'}`}>
        {isOpen && <span className={`text-[10px] uppercase tracking-widest font-black ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Навигатор</span>}
        <SidebarTopToggle side="left" isCollapsed={!isOpen} theme={theme} onToggle={() => setIsOpen(!isOpen)} />
      </div>

      {isOpen ? (
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="shrink-0 overflow-y-auto custom-scrollbar py-2 max-h-[52%]">
            {sectionMeta.map((section) => {
              const isExpanded = expandedSections.has(section.id);
              const isActive = activeSection === section.id;

              return (
                <div
                  key={section.id}
                  ref={
                    section.id === 'scan_sources'
                      ? scanRef
                      : section.id === 'local_folders'
                        ? localRef
                        : section.id === 'in_progress_tasks'
                          ? progressRef
                          : workLogRef
                  }
                  className="mb-1"
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className={`w-full px-4 py-2 flex items-center justify-between text-[11px] transition-all ${
                      isActive ? (isDark ? 'bg-blue-600/20 text-white' : 'bg-blue-600 text-white') : isDark ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-semibold">
                      <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}><ChevronDown size={9} /></span>
                      <FolderIcon />
                      <span className="truncate">{section.label}</span>
                    </span>
                    {section.id === 'in_progress_tasks' && (
                      <span className={`min-w-5 px-1.5 h-4 inline-flex items-center justify-center rounded border text-[9px] font-mono ${isDark ? 'border-white/15 text-zinc-400 bg-black/25' : 'border-zinc-300 text-zinc-600 bg-zinc-100'}`}>
                        {inProgressCount}
                      </span>
                    )}
                  </button>

                  {isExpanded && section.id === 'scan_sources' && (
                    <div className="px-4 pt-2 pb-1 space-y-1.5">
                      {scanDevices.map((device) => (
                        <button
                          key={device.id}
                          type="button"
                          onClick={() => {
                            setSelectedDeviceId(device.id);
                            setDetailType('device');
                            setDetailCard([
                              { label: 'Наименование', value: device.name || 'Не указано' },
                              { label: 'Статус', value: statusLabelMap[device.status] || 'Не указано' },
                              { label: 'Локальный адрес', value: device.localAddress ?? 'Не указано' },
                              { label: 'Серийный номер', value: device.serialNumber ?? 'Не указано' },
                              { label: 'Тип устройства', value: device.deviceType ?? 'Не указано' },
                              { label: 'Последняя синхронизация', value: device.lastSync ?? 'Не указано' },
                              { label: 'Доступно заданий', value: String(device.tasksAvailable ?? device.tasks.length ?? 'Не указано') },
                            ]);
                          }}
                            className={`w-full text-left rounded-md px-3 py-2 text-[10px] transition-all ${
                              selectedDeviceId === device.id ? (isDark ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-900') : 'text-zinc-400 hover:bg-white/5'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{device.name}</span>
                            <span className={`text-[9px] ${device.status === 'connected' ? 'text-green-400' : device.status === 'waiting' ? 'text-yellow-400' : 'text-zinc-500'}`}>{device.tasksAvailable ?? device.tasks.length}</span>
                          </div>
                        </button>
                      ))}

                      <div className="mt-2 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-[10px]">
                        <div className="text-zinc-500 mb-1">Задания устройства</div>
                        {selectedDevice ? selectedDevice.tasks.length > 0 ? (
                          <div className="space-y-1.5">
                            {selectedDevice.tasks.map((task) => (
                              <button
                                key={task.id}
                                type="button"
                              onClick={() =>
                                {
                                  setDetailType('task');
                                  setDetailCard([
                                    { label: 'Источник', value: selectedDevice.name },
                                    { label: 'Номер документа', value: task.number },
                                    { label: 'Наименование', value: task.title },
                                  ]);
                                }
                              }
                                className="w-full text-left rounded px-2 py-1 text-zinc-300 hover:bg-white/5"
                              >
                                {task.number} • {task.title}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-zinc-500">Записи отсутствуют</div>
                        ) : (
                          <div className="text-zinc-500">Выберите устройство</div>
                        )}
                      </div>
                    </div>
                  )}

                  {isExpanded && section.id === 'local_folders' && (
                    <div className="px-4 pt-2 pb-1 space-y-2">
                      <div className="space-y-1.5">
                        {localSources.map((source) => (
                          <button
                            key={source.id}
                            type="button"
                            onClick={() => setSelectedLocalSourceId(source.id)}
                            className={`w-full rounded-md px-3 py-1.5 text-left text-[10px] transition-all ${
                              selectedLocalSourceId === source.id ? (isDark ? 'bg-white/10 text-white' : 'bg-zinc-100 text-zinc-900') : 'text-zinc-400 hover:bg-white/5'
                            }`}
                          >
                            {source.label}
                          </button>
                        ))}
                      </div>

                      <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-[10px]">
                        <div className="text-zinc-500 mb-1">Файлы для обработки</div>
                        {selectedLocalSource.files.length > 0 ? (
                          <div className="space-y-1.5">
                            {selectedLocalSource.files.map((file) => (
                              <button
                                key={file.id}
                                type="button"
                              onClick={() =>
                                {
                                  setDetailType('file');
                                  setDetailCard([
                                    { label: 'Файл', value: file.name },
                                    { label: 'Изменён', value: file.modifiedAt },
                                    { label: 'Тип', value: file.type },
                                    { label: 'Размер', value: file.size },
                                  ]);
                                }
                              }
                                className="w-full grid grid-cols-[1fr_auto] gap-2 rounded px-2 py-1 text-left hover:bg-white/5"
                              >
                                <span className="text-zinc-300 truncate">{file.name}</span>
                                <span className="text-zinc-500">{file.size}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-zinc-500">Записи отсутствуют</div>
                        )}
                      </div>
                    </div>
                  )}

                  {isExpanded && section.id === 'in_progress_tasks' && (
                    <div className="px-4 pt-2 pb-1 space-y-2">
                      <div className="rounded-md border border-white/10 bg-black/20 px-2 py-2 text-[10px] space-y-1.5">
                        {inProgressTasks.length > 0 ? (
                          inProgressTasks.map((task) => (
                            <button
                              key={task.id}
                              type="button"
                              onClick={() => {
                                handlePageClick(task.page);
                                setDetailType('task');
                                setDetailCard([
                                  { label: 'Номер документа', value: task.docNumber },
                                  { label: 'Документ', value: task.docName },
                                  { label: 'Этап обработки', value: task.stage },
                                  { label: 'Источник', value: task.source },
                                  { label: 'Оператор', value: task.operator },
                                  { label: 'Обновлено', value: `${dateText(task.updatedAt)} | ${timeText(task.updatedAt)}` },
                                ]);
                              }}
                              className="w-full rounded px-2 py-1.5 text-left hover:bg-white/5"
                            >
                              <div className="text-zinc-300 truncate">{task.docNumber} • {task.docName}</div>
                              <div className="text-zinc-500 truncate">{task.stage} | стр. {task.page} | {timeText(task.updatedAt)}</div>
                            </button>
                          ))
                        ) : (
                          <div className="px-2 py-1 text-zinc-500">Записи отсутствуют</div>
                        )}
                      </div>
                    </div>
                  )}

                  {isExpanded && section.id === 'work_log' && (
                    <div className="px-4 pt-2 pb-1 space-y-2">
                      <div className="flex items-center gap-1.5 text-[9px]">
                        <select
                          value={journalView}
                          onChange={(e) => setJournalView(e.target.value as JournalView)}
                          className={`flex-1 rounded border px-2 py-1 ${isDark ? 'bg-black/30 border-white/10 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'}`}
                        >
                          <option value="all">Все записи</option>
                          <option value="today">За сегодня</option>
                          <option value="shift">За смену</option>
                          <option value="operator">По оператору</option>
                          <option value="document">По номеру документа</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setJournalSort((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                          className="rounded border border-white/10 px-2 py-1 text-zinc-400"
                        >
                          {journalSort === 'desc' ? '↓ Дата' : '↑ Дата'}
                        </button>
                      </div>

                      <div className="rounded-md border border-white/10 bg-black/20 px-2 py-2 text-[10px] space-y-1.5">
                        {journalRecords.length > 0 ? (
                          journalRecords.map((record) => (
                            <button
                              key={record.id}
                              type="button"
                              onClick={() =>
                                {
                                  setDetailType('journal');
                                  setDetailCard([
                                    { label: 'Дата', value: dateText(record.createdAt) },
                                    { label: 'Время', value: timeText(record.createdAt) },
                                    { label: 'Номер документа', value: record.docNumber },
                                    { label: 'Наименование', value: record.docName },
                                    { label: 'Тип операции', value: record.operationType },
                                    { label: 'Оператор', value: record.operator },
                                    { label: 'Статус', value: record.status },
                                    { label: 'Комментарий', value: record.note ?? 'Не указано' },
                                  ]);
                                }
                              }
                              className="w-full rounded px-2 py-1.5 text-left hover:bg-white/5"
                            >
                              <div className="text-zinc-300 truncate">
                                {dateText(record.createdAt)} | {timeText(record.createdAt)} | {record.docNumber}
                              </div>
                              <div className="text-zinc-500 truncate">
                                {record.operationType} | {record.operator} | {record.status}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-2 py-1 text-zinc-500">Записи отсутствуют</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          </div>

          <div ref={structureRef} className={`mx-4 border-t ${isDark ? 'border-white/10' : 'border-zinc-200'} pt-2 flex-1 min-h-0 flex flex-col`}>
              <button
                type="button"
                onClick={() => setIsDocumentStructureOpen((prev) => !prev)}
                className={`w-full px-2 py-1.5 flex items-center justify-between text-[10px] uppercase tracking-wide font-black ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                <span className="flex items-center gap-2">
                  <span className={`transition-transform duration-200 ${isDocumentStructureOpen ? 'rotate-0' : '-rotate-90'}`}><ChevronDown size={9} /></span>
                  Структура документа
                </span>
              </button>

              {isDocumentStructureOpen && (
                <div className="mt-1 rounded-md border border-white/10 bg-black/20 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                  {documentPages.map((page) => {
                    const isPageExpanded = expandedPages.has(page);
                    const isPageActive = activePageId === page;

                    return (
                      <div key={page} className="border-b border-white/5 last:border-b-0">
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              togglePageStructure(page);
                            }}
                            className={`w-7 h-7 flex items-center justify-center focus:outline-none ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-800'}`}
                            title={isPageExpanded ? 'Свернуть структуру страницы' : 'Развернуть структуру страницы'}
                          >
                            <span className={`transition-transform duration-150 ${isPageExpanded ? 'rotate-0' : '-rotate-90'}`}><ChevronDown size={8} /></span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePageClick(page)}
                            className={`flex-1 text-left px-2 py-1.5 text-[10px] ${
                              isPageActive
                                ? (isDark ? 'text-cyan-300 bg-cyan-500/12 font-semibold border-l border-cyan-400/40' : 'text-blue-700 bg-blue-50 font-semibold border-l border-blue-400/50')
                                : (isDark ? 'text-zinc-400 hover:text-zinc-300 hover:bg-white/[0.03]' : 'text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100/60')
                            }`}
                          >
                            <span className="font-mono opacity-70 mr-2">{page}</span>
                            Страница {page}
                          </button>
                        </div>

                        {isPageExpanded && (
                          <div className="pl-9 pr-2 pb-1.5 space-y-1">
                            {['Изображения', 'Текстовые блоки', 'Подписи', 'Объекты', 'Слои', 'Области редактирования'].map((node) => (
                              <button
                                key={`${page}-${node}`}
                                type="button"
                                onClick={() => handlePageClick(page)}
                                className={`w-full text-left rounded px-2 py-1 text-[9px] ${isDark ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'}`}
                              >
                                {node}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
          </div>

          {detailType !== 'none' && detailType !== 'page' && detailCard.length > 0 && (
            <div className={`px-3 pb-2 ${isDark ? 'border-white/5' : 'border-zinc-100'}`}>
              <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2">
                <div className="text-[9px] uppercase tracking-widest text-zinc-500 mb-1">Карточка сведений</div>
                {detailType === 'device' && selectedDevice && (
                  <div className="mb-1.5 flex items-center gap-2 text-[9px]">
                    <span className={`w-2 h-2 rounded-full ${statusToneMap[selectedDevice.status]}`} />
                    <span className="text-zinc-300">{statusLabelMap[selectedDevice.status] ?? 'Не указано'}</span>
                  </div>
                )}
                <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                  {detailCard.map((row) => (
                    <div key={row.label} className="grid grid-cols-[108px_1fr] gap-2 text-[9px]">
                      <span className="text-zinc-500">{row.label}</span>
                      <span className="text-zinc-300 break-words">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={storageRef} className={`p-3 border-t ${isDark ? 'border-white/5' : 'border-zinc-100'}`}>
            <div className="text-[9px] uppercase tracking-widest text-zinc-500 mb-2">Локальное хранилище</div>
            <div className="text-[10px] flex items-center justify-between font-mono">
              <span className="text-zinc-500">Размер файла</span>
              <span className="text-cyan-300 font-semibold">138 МБ</span>
            </div>
          </div>
        </div>
      ) : (
        <CollapsedIconRail
          items={railItems}
          activeId={activeSection}
          theme={theme}
          onItemClick={(id) => focusSection(id as LeftRailSectionId)}
        />
      )}
    </aside>
  );
};

const FolderIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);
const ChevronDown = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ScannerRailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7V4h4" />
    <path d="M20 7V4h-4" />
    <path d="M4 17v3h4" />
    <path d="M20 17v3h-4" />
    <path d="M7 12h10" />
  </svg>
);

const FolderRailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const ClipboardListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
    <path d="M5 6h14v14H5z" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

const FilesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
    <path d="M8 8h8" />
    <path d="M4 6v14a2 2 0 0 0 2 2h10" />
  </svg>
);

const HardDriveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M3 16h18v4H3z" />
    <path d="M7 20h.01" />
    <path d="M11 20h.01" />
  </svg>
);

export default LeftSidebar;
