
export enum UserRole {
  OPERATOR = 'OPERATOR',
  OPERATOR_CONDOR_S = 'OPERATOR_CONDOR_S',
  ADMINISTRATOR = 'ADMINISTRATOR'
}

export enum ToolType {
  SELECT = 'SELECT',
  SELECTION = 'SELECTION',
  CROP = 'CROP',
  ROTATE = 'ROTATE',
  DODGE = 'DODGE',
  BURN = 'BURN',
  TEXT = 'TEXT'
}

export enum AppScenario {
  CREATE = 'CREATE',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  REVIEW = 'REVIEW',
  ANNOTATION = 'ANNOTATION',
  QUALITY_CONTROL = 'QUALITY_CONTROL'
}

export type Theme = 'dark' | 'light';

export interface WorkspaceState {
  role: UserRole;
  scenario: AppScenario;
  activeTool: ToolType;
  isVoiceActive: boolean;
  isSidebarOpen: boolean;
  historyIndex: number;
  history: string[];
  theme: Theme;
  selectedPage: number;
}

export type ModuleVersionStatusKind = 'actual' | 'update_available' | 'conflict' | 'offline';

export interface ModuleResponsibles {
  owner?: string;
  designEngineer?: string;
  leadDeveloper?: string;
  technicalCurator?: string;
}

export interface ModuleManifest {
  moduleId: string;
  moduleName?: string;
  status?: string;
  version?: string;
  lastModified?: string;
  build?: string;
  source?: string;
  designBureau?: string;
  integration?: string;
  approvalBadge?: string;
  approvalNote?: string;
  iconPath?: string;
  integrations?: Array<{
    name?: string;
    version?: string;
  }>;
  responsibles?: ModuleResponsibles;
  description?: string;
  iconGlyph?: string;
}

export interface ModulePassportResolved {
  manifest: ModuleManifest;
  statusKind: ModuleVersionStatusKind;
  statusText: string;
  sourceMode: 'local' | 'remote';
  remoteVersion?: string;
  lastSyncAt: string;
}
