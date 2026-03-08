import { ModuleManifest, ModulePassportResolved, ModuleVersionStatusKind } from '../types';

const FALLBACK_STATUS_TEXT: Record<ModuleVersionStatusKind, string> = {
  actual: 'Актуальная версия',
  update_available: 'Доступно обновление',
  conflict: 'Версия устарела или не подтверждена',
  offline: 'Оффлайн / используются локальные сведения',
};

const MODULE_REGISTRY: Record<string, ModuleManifest> = {
  't90-tirazh-editor': {
    moduleId: 't90-tirazh-editor',
    moduleName: 'Тираж Редактор Т-90 Турбо',
    status: 'Оффлайн / используются локальные сведения',
    version: 'v1.2.4',
    lastModified: '08.03.2026 15:42',
    build: 'build 126',
    source: 'localhost / основной контур',
    designBureau: 'Трудовые резервы',
    integration: 'Список совместимых модулей',
    integrations: [
      { name: 'Тираж награды', version: 'v1.2.4' },
      { name: 'АПДП', version: 'v2.0.1' },
      { name: 'Выпуск', version: 'v1.8.3' },
    ],
    approvalBadge: 'УТВЕРЖДЕНО',
    iconPath: 'images/111.png',
    responsibles: {
      owner: 'Откорней Докончиков',
      designEngineer: 'Сергей Кондарев',
      leadDeveloper: 'Вавилон Говядинов',
      technicalCurator: 'Виталий Сингатулин',
    },
    description:
      'Программный модуль предназначен для обработки персональных данных, подготовки наградных и иных служебных документов, а также для выполнения технической редакции, проверки и сопровождения тиражных материалов в составе программного контура Т-90 Турбо.',
    iconGlyph: 'T90',
  },
};

type RemoteModulePayload = Partial<ModuleManifest> & {
  statusKind?: ModuleVersionStatusKind;
  status?: string;
  contourState?: 'ok' | 'conflict' | 'unverified';
};

const versionToParts = (version?: string): number[] | null => {
  if (!version) return null;
  const normalized = version.trim().replace(/^v/i, '');
  if (!normalized) return null;
  const parts = normalized.split('.').map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => Number.isNaN(part))) return null;
  return parts;
};

const compareVersions = (localVersion?: string, remoteVersion?: string): number | null => {
  const local = versionToParts(localVersion);
  const remote = versionToParts(remoteVersion);
  if (!local || !remote) return null;

  const maxLength = Math.max(local.length, remote.length);
  for (let i = 0; i < maxLength; i += 1) {
    const l = local[i] ?? 0;
    const r = remote[i] ?? 0;
    if (l < r) return -1;
    if (l > r) return 1;
  }

  return 0;
};

const fetchRemoteModuleManifest = async (moduleId: string): Promise<RemoteModulePayload | null> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 1200);

  try {
    const response = await fetch(`/api/module-passport/${moduleId}`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as RemoteModulePayload;
    return payload;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
};

const resolveStatusKind = (
  localManifest: ModuleManifest,
  remoteManifest: RemoteModulePayload,
): ModuleVersionStatusKind => {
  if (remoteManifest.statusKind) return remoteManifest.statusKind;

  if (remoteManifest.contourState === 'conflict' || remoteManifest.contourState === 'unverified') {
    return 'conflict';
  }

  const versionCompare = compareVersions(localManifest.version, remoteManifest.version ?? localManifest.version);
  if (versionCompare === 0) return 'actual';
  if (versionCompare === -1) return 'update_available';
  if (versionCompare === 1) return 'conflict';

  return 'conflict';
};

export const getLocalModuleManifest = (moduleId: string): ModuleManifest => {
  const local = MODULE_REGISTRY[moduleId];
  if (local) return local;

  return {
    moduleId,
    moduleName: 'Не указано',
    status: 'Не указано',
    iconGlyph: 'MOD',
  };
};

export const loadModulePassport = async (moduleId: string): Promise<ModulePassportResolved> => {
  const localManifest = getLocalModuleManifest(moduleId);
  const remoteManifest = await fetchRemoteModuleManifest(moduleId);
  const lastSyncAt = new Date().toLocaleString('ru-RU');

  if (!remoteManifest) {
    return {
      manifest: localManifest,
      statusKind: 'offline',
      statusText: FALLBACK_STATUS_TEXT.offline,
      sourceMode: 'local',
      remoteVersion: undefined,
      lastSyncAt,
    };
  }

  const mergedManifest: ModuleManifest = {
    ...localManifest,
    ...remoteManifest,
    responsibles: {
      ...localManifest.responsibles,
      ...remoteManifest.responsibles,
    },
  };

  const statusKind = resolveStatusKind(localManifest, remoteManifest);

  return {
    manifest: mergedManifest,
    statusKind,
    statusText: remoteManifest.status ?? FALLBACK_STATUS_TEXT[statusKind],
    sourceMode: 'remote',
    remoteVersion: remoteManifest.version,
    lastSyncAt,
  };
};
