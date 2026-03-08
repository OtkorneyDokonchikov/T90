
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
