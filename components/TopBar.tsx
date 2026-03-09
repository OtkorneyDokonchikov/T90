import React, { useState, useRef, useEffect } from 'react';
import { UserRole, AppScenario, Theme, ModulePassportResolved } from '../types';
import ModulePassportModal from './ModulePassportModal';
import { loadModulePassport } from '../config/moduleManifest';

interface TopBarProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  scenario: AppScenario;
  onScenarioChange: (scenario: AppScenario) => void;
  onOpenTemplateModal: () => void;
  onOpenQcResultModal: () => void;
  onOpenReportModal: () => void;
  onLockWorkstation: () => void;
  onSwitchUser: () => void;
  onSelectRole: () => void;
  onFinishShift: () => void;
  onLogout: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

const ChevronDownIcon = ({ small }: { small?: boolean }) => (
  <svg width={small ? '8' : '12'} height={small ? '8' : '12'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);
const SunIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8l1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>;
const MoonIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const SettingsIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const ProfileIcon = ({ size = 12 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

const PlusIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const TemplateIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>;
const ScanIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>;
const PackageIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const FileIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const CloudIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19c3 0 3.5-2 3.5-3.5 0-2.5-1.5-3.5-3.5-3.5-.5-2.5-2.5-4-5-4-2 0-3.5 1-4.5 2.5-2.5 0-4 1.5-4 4 0 2.5 1.5 4.5 4.5 4.5"/></svg>;
const DbIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>;
const ArchiveIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>;
const PdfIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>;
const TiffIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>;
const CodeIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const PrintIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;
const ShieldIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>;
const AlertIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const StatsIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const CompareIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M12 12L21 3"/><path d="M12 12L3 21"/></svg>;
const WandIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 22 5-5"/><path d="M9.5 14.5 16 8"/><path d="m14 2 2 2"/><path d="m20 8 2 2"/><path d="m7.5 4.5 2 2"/><path d="m15.5 12.5 2 2"/></svg>;
const HandIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/></svg>;
const CheckIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const ExportIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>;
const KeyboardIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M6 12h.01"/><path d="M18 12h.01"/><path d="M10 12h4"/><path d="M10 16h4"/></svg>;
const MicIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>;
const HistoryMiniIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>;
const SwitchUserIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M21 3 9 15"/><path d="M3 21 15 9"/></svg>;
const RoleIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 3 7l9 5 9-5-9-5Z"/><path d="m3 17 9 5 9-5"/><path d="m3 12 9 5 9-5"/></svg>;
const LockIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const ReportIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/></svg>;
const ShiftEndIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>;
const LogoutIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>;

const scenarioLabels: Record<AppScenario, string> = {
  [AppScenario.CREATE]: 'СОЗДАТЬ',
  [AppScenario.IMPORT]: 'ИМПОРТ',
  [AppScenario.EXPORT]: 'ЭКСПОРТ',
  [AppScenario.REVIEW]: 'ПРОВЕРКА',
  [AppScenario.ANNOTATION]: 'НОТАЦИЯ',
  [AppScenario.QUALITY_CONTROL]: 'КОНТРОЛЬ КАЧЕСТВА',
};

const scenarioMenus: Record<AppScenario, { label: string; icon: React.ReactNode; desc: string; shortcut?: string }[]> = {
  [AppScenario.CREATE]: [
    { label: 'Новый проект', icon: <PlusIcon />, desc: 'Создать чистую обл...' },
    { label: 'По шаблону', icon: <TemplateIcon />, desc: 'Пресеты Т90' },
    { label: 'Сканировать', icon: <ScanIcon />, desc: 'Захват...' },
    { label: 'Пакетная сборка', icon: <PackageIcon />, desc: 'Объединение...' },
  ],
  [AppScenario.IMPORT]: [
    { label: 'Локальные файлы', icon: <FileIcon />, desc: 'Загрузить (TIFF, PDF)' },
    { label: 'Облако', icon: <CloudIcon />, desc: 'S3, Azure, Google' },
    { label: 'База данных', icon: <DbIcon />, desc: 'Импорт SQL/NoS...' },
    { label: 'Архив сессий', icon: <ArchiveIcon />, desc: 'Восстановить...' },
  ],
  [AppScenario.EXPORT]: [
    { label: 'Мастер PDF', icon: <PdfIcon />, desc: 'Экспорт с текстом' },
    { label: 'Пакет TIFF', icon: <TiffIcon />, desc: 'Без потери качества' },
    { label: 'JSON Метаданные', icon: <CodeIcon />, desc: 'Структура...' },
    { label: 'Очередь печати', icon: <PrintIcon />, desc: 'На принтер...' },
  ],
  [AppScenario.REVIEW]: [
    { label: 'Авто-проверка', icon: <PlusIcon />, desc: 'Автоматический анализ' },
    { label: 'Визуальная проверка', icon: <HandIcon />, desc: 'Ручной просмотр документа' },
    { label: 'Проверка структуры', icon: <StatsIcon />, desc: 'Страницы, порядок, состав' },
    { label: 'Проверка реквизитов', icon: <CheckIcon />, desc: 'Поля, номера, подписи' },
    { label: 'Сравнение', icon: <CompareIcon />, desc: 'Сопоставление версий' },
  ],
  [AppScenario.ANNOTATION]: [
    { label: 'Умная разметка', icon: <WandIcon />, desc: 'Авто-выделение' },
    { label: 'Ручной режим', icon: <HandIcon />, desc: 'Попиксельно' },
    { label: 'Верификация', icon: <CheckIcon />, desc: 'Подтверждение' },
    { label: 'Экспорт меток', icon: <ExportIcon />, desc: 'Отдельно' },
  ],
  [AppScenario.QUALITY_CONTROL]: [
    { label: 'Анализ TIFF', icon: <StatsIcon />, desc: 'Загрузка и структура', shortcut: '100%' },
    { label: 'Качество OCR', icon: <CheckIcon />, desc: 'Оценка плотности текста', shortcut: '100%' },
    { label: 'Сегментация', icon: <AlertIcon />, desc: 'Текст / Изображения', shortcut: '67%' },
    { label: 'Цвет и Режим', icon: <ShieldIcon />, desc: 'Проверка профилей TIFF', shortcut: 'В работе' },
    { label: 'Дефекты скана', icon: <AlertIcon />, desc: 'Шум, перекос, пятна', shortcut: 'Ожидание' },
    { label: 'Preflight', icon: <CompareIcon />, desc: 'Финальный контроль', shortcut: 'Ожидание' },
    { label: 'Результат', icon: <ExportIcon />, desc: 'Отчёт и подсветка', shortcut: 'Ожидание' },
  ],
};

const TopBar: React.FC<TopBarProps> = ({
  role,
  onRoleChange,
  scenario,
  onScenarioChange,
  onOpenTemplateModal,
  onOpenQcResultModal,
  onOpenReportModal,
  onLockWorkstation,
  onSwitchUser,
  onSelectRole,
  onFinishShift,
  onLogout,
  theme,
  toggleTheme,
}) => {
  const isDark = theme === 'dark';
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<AppScenario | null>(null);
  const [isLogoBroken, setIsLogoBroken] = useState(false);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
  const [isPassportLoading, setIsPassportLoading] = useState(false);
  const [passportData, setPassportData] = useState<ModulePassportResolved | null>(null);

  const settingsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const moduleLabelClickTimeoutRef = useRef<number | null>(null);

  const moduleId = 't90-tirazh-editor';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) setIsSettingsOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPassportOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (moduleLabelClickTimeoutRef.current) {
        window.clearTimeout(moduleLabelClickTimeoutRef.current);
      }
    };
  }, []);

  const handleScenarioClick = (s: AppScenario) => {
    if (openMenu === s) setOpenMenu(null);
    else {
      setOpenMenu(s);
      onScenarioChange(s);
    }
  };

  const refreshPassport = async () => {
    setIsPassportLoading(true);
    const nextData = await loadModulePassport(moduleId);
    setPassportData(nextData);
    setIsPassportLoading(false);
  };

  const openModuleNow = () => {
    setIsPassportOpen(false);
    onScenarioChange(AppScenario.CREATE);
  };

  const handleModuleLabelSingleClick = () => {
    setIsPassportOpen(true);
    refreshPassport();
  };

  const handleModuleLabelClick = () => {
    if (moduleLabelClickTimeoutRef.current) {
      window.clearTimeout(moduleLabelClickTimeoutRef.current);
    }

    moduleLabelClickTimeoutRef.current = window.setTimeout(() => {
      handleModuleLabelSingleClick();
      moduleLabelClickTimeoutRef.current = null;
    }, 220);
  };

  const handleModuleLabelDoubleClick = () => {
    if (moduleLabelClickTimeoutRef.current) {
      window.clearTimeout(moduleLabelClickTimeoutRef.current);
      moduleLabelClickTimeoutRef.current = null;
    }
    openModuleNow();
  };

  const handleCopyPassport = async () => {
    if (!passportData) return;

    const payload = {
      moduleName: passportData.manifest.moduleName,
      status: passportData.statusText,
      version: passportData.manifest.version,
      lastModified: passportData.manifest.lastModified,
      build: passportData.manifest.build,
      source: passportData.manifest.source,
      designBureau: passportData.manifest.designBureau,
      integration: passportData.manifest.integration,
      integrations: passportData.manifest.integrations,
      approvalBadge: passportData.manifest.approvalBadge,
      iconPath: passportData.manifest.iconPath,
      approvalNote: passportData.manifest.approvalNote,
      responsibles: passportData.manifest.responsibles,
      description: passportData.manifest.description,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    } catch {
      // no-op: UI stays stable even when clipboard is unavailable
    }
  };

  const handleOpenHistory = () => {
    onScenarioChange(AppScenario.REVIEW);
  };

  const configMenuItems = [
    { label: 'Общие настройки', icon: <SettingsIcon />, shortcut: 'Ctrl+,' },
    { label: 'Горячие клавиши', icon: <KeyboardIcon />, shortcut: 'Alt+K' },
    { label: 'Голосовое управление', icon: <MicIcon />, shortcut: 'Alt+V' },
    { label: 'Профили', icon: <ProfileIcon size={12} />, shortcut: 'Alt+P' },
    { label: 'Экспорт', icon: <ExportIcon />, shortcut: 'Ctrl+E' },
    { label: 'Ошибки', icon: <AlertIcon />, shortcut: 'F12', color: 'text-red-500' },
  ];

  const userMenuItems = [
    { label: 'Профиль оператора', icon: <ProfileIcon size={12} />, action: () => setOpenMenu(null) },
    { label: 'Журнал действий', icon: <HistoryMiniIcon />, action: () => onScenarioChange(AppScenario.REVIEW) },
    { label: 'Сменить пользователя', icon: <SwitchUserIcon />, action: onSwitchUser },
    { label: 'Выбрать роль', icon: <RoleIcon />, action: onSelectRole },
    { label: 'Заблокировать рабочее место', icon: <LockIcon />, action: onLockWorkstation },
    { label: 'Сформировать отчет', icon: <ReportIcon />, action: onOpenReportModal },
    { label: 'Выход', icon: <LogoutIcon />, action: onLogout, tone: 'text-red-400' },
  ];

  return (
    <header className={`h-11 border-b flex items-center px-3 z-[100] transition-colors relative ${isDark ? 'bg-[#121212] border-white/5' : 'bg-white border-zinc-200 shadow-sm'}`}>
      <div className="flex items-center gap-2 flex-shrink-0 z-10">
        <div className="w-7 h-7 rounded flex items-center justify-center shadow-lg overflow-hidden">
          {isLogoBroken ? (
            <div className="w-full h-full bg-blue-600 flex items-center justify-center font-black text-base text-white">
              T
            </div>
          ) : (
            <img
              src={`${import.meta.env.BASE_URL}images/111.png`}
              alt="T-90 Logo"
              className="w-full h-full object-contain"
              onError={() => setIsLogoBroken(true)}
            />
          )}
        </div>
        <button
          type="button"
          onClick={handleModuleLabelClick}
          onDoubleClick={handleModuleLabelDoubleClick}
          className={`text-[9px] font-black uppercase tracking-wider leading-none whitespace-nowrap rounded px-1.5 py-0.5 transition-colors ${isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5' : 'text-zinc-700 hover:bg-zinc-100'}`}
          title="Одинарный клик: паспорт модуля • Двойной клик: открыть модуль"
        >
          Тираж Редактор Т-90 Турбо
        </button>
      </div>

      <nav ref={navRef} className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 whitespace-nowrap">
        {Object.keys(AppScenario).map((key) => {
          const s = AppScenario[key as keyof typeof AppScenario];

          return (
            <div key={s} className="relative">
              <button
                onClick={() => handleScenarioClick(s)}
                className={`px-2 py-1 text-[9px] rounded transition-all uppercase tracking-wide font-bold flex items-center gap-1 ${
                  scenario === s
                    ? (isDark ? 'bg-white/10 text-white' : 'bg-blue-600 text-white')
                    : (isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700')
                }`}
              >
                {scenarioLabels[s]}
                <ChevronDownIcon small />
              </button>

              {openMenu === s && (
                <div className={`absolute top-full left-0 mt-1.5 w-56 rounded-lg border p-1 shadow-2xl backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200 z-[110] ${isDark ? 'bg-[#1a1a1a] border-white/10 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'}`}>
                  {scenarioMenus[s].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (s === AppScenario.CREATE && item.label === 'По шаблону') {
                          onOpenTemplateModal();
                        }
                        if (s === AppScenario.QUALITY_CONTROL && item.label === 'Результат') {
                          onOpenQcResultModal();
                        }
                        setOpenMenu(null);
                      }}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-all hover:bg-white/5 group"
                    >
                      <div className="text-zinc-500 group-hover:text-blue-400">{item.icon}</div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[11px] font-bold group-hover:text-white leading-tight">{item.label}</span>
                        <span className="text-[9px] opacity-40 truncate">{item.desc}</span>
                      </div>
                      {item.shortcut && <span className="text-[9px] font-mono opacity-40">{item.shortcut}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 ml-auto z-10">
        <div className="relative" ref={userMenuRef}>
          <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className={`px-2 py-1 text-[9px] rounded-md transition-all uppercase tracking-wide font-bold flex items-center gap-1.5 ${isDark ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>
            <ProfileIcon size={10} />
            <span className="whitespace-nowrap leading-none">Оператор Кондарев С.А.</span>
            <ChevronDownIcon small />
          </button>

          {isUserMenuOpen && (
            <div className={`absolute top-full right-0 mt-1.5 w-64 rounded-lg border p-1 shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-200 z-[120] ${isDark ? 'bg-[#1a1a1a] border-white/10 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'}`}>
              {userMenuItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    item.action();
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-all hover:bg-white/5 group ${item.tone ?? ''}`}
                >
                  <span className="opacity-70 group-hover:opacity-100">{item.icon}</span>
                  <span className="text-[11px] font-semibold leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 relative" ref={settingsRef}>
          <button onClick={toggleTheme} className={`p-1 rounded transition-all ${isDark ? 'bg-white/5 text-blue-400' : 'bg-zinc-100 text-amber-500'}`}>
            {isDark ? <MoonIcon /> : <SunIcon />}
          </button>
          <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className={`p-1 rounded transition-all ${isSettingsOpen ? 'bg-blue-600 text-white' : (isDark ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500')}`}>
            <SettingsIcon />
          </button>
          {isSettingsOpen && (
            <div className={`absolute top-full right-0 mt-1.5 w-60 rounded-lg border p-1 shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-200 z-[110] ${isDark ? 'bg-[#1a1a1a] border-white/10 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'}`}>
              {configMenuItems.map((item, idx) => (
                <button key={idx} className={`w-full flex items-center justify-between px-2 py-2 rounded-md text-[11px] font-bold transition-all hover:bg-white/5 group ${item.color || ''}`}>
                  <div className="flex items-center gap-2"><span className="opacity-60 group-hover:opacity-100">{item.icon}</span><span>{item.label}</span></div>
                  <span className="text-[9px] font-mono opacity-30 font-medium">{item.shortcut}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ModulePassportModal
        isOpen={isPassportOpen}
        loading={isPassportLoading}
        theme={theme}
        passport={passportData}
        onClose={() => setIsPassportOpen(false)}
        onOpenModule={openModuleNow}
        onOpenHistory={handleOpenHistory}
        onCopyDetails={handleCopyPassport}
      />
    </header>
  );
};

export default TopBar;
