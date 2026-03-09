
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
  rightSidebarCollapsed: boolean;
  historyIndex: number;
  history: string[];
  theme: Theme;
  selectedPage: number;
}

export type DocumentUnit = 'мм' | 'дюймы';
export type DocumentOrientation = 'portrait' | 'landscape';

export interface DocumentMargins {
  top: number;
  bottom: number;
  inside: number;
  outside: number;
}

export interface DocumentTemplateConfig {
  presetId: string;
  name: string;
  width: number;
  height: number;
  unit: DocumentUnit;
  orientation: DocumentOrientation;
  pages: number;
  startNumber: number;
  columns: number;
  columnGap: number;
  margins: DocumentMargins;
  spread: boolean;
  primaryTextFrame: boolean;
  preview: boolean;
}

export type QcResultStatus = 'success' | 'warning' | 'error';

export interface QcResultChecks {
  tiffAnalysis?: string;
  ocrQuality?: string;
  segmentation?: string;
  colorMode?: string;
  scanDefects?: string;
  preflight?: string;
}

export interface QcResultPages {
  total?: number;
  aligned?: number;
  deskewCorrected?: number;
  noiseCleaned?: number;
  withWarnings?: number;
  manualReview?: number;
}

export interface QcResultSummary {
  documentNumber?: string;
  checkedAt?: string;
  operator?: string;
  status?: QcResultStatus;
  checks?: QcResultChecks;
  pages?: QcResultPages;
  issues?: string[];
}

export interface OperatorReportStats {
  volumesProcessed?: number;
  pagesProcessed?: number;
  awardMaterials?: number;
  incomingDocuments?: number;
  submissions?: number;
  otherDocuments?: number;
}

export interface OperatorReportSummary {
  operatorName?: string;
  reportDate?: string;
  timeFrom?: string;
  timeTo?: string;
  stats?: OperatorReportStats;
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
