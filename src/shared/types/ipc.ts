// IPC Channel Names
export const IPC_CHANNELS = {
  // App
  GET_APP_VERSION: 'get-app-version',

  // Window controls
  WINDOW_MINIMIZE: 'window-minimize',
  WINDOW_MAXIMIZE: 'window-maximize',
  WINDOW_CLOSE: 'window-close',

  // Service calls
  SERVICE_CALLS_CREATE: 'service-calls:create',
  SERVICE_CALLS_GET_ALL: 'service-calls:get-all',
  SERVICE_CALLS_GET_BY_ID: 'service-calls:get-by-id',
  SERVICE_CALLS_UPDATE: 'service-calls:update',
  SERVICE_CALLS_DELETE: 'service-calls:delete',

  // File operations
  EXPORT_PDF: 'export-pdf',
  SHOW_SAVE_DIALOG: 'show-save-dialog',

  // Database
  DATABASE_BACKUP: 'database:backup',
  DATABASE_RESTORE: 'database:restore',

  // Workflows
  WORKFLOWS_TRIGGER: 'workflows:trigger',
  WORKFLOWS_GET_STATUS: 'workflows:get-status',
} as const;

// Service call statistics
export interface ServiceCallStats {
  total: number;
  new: number;
  scheduled: number;
  inProgress: number;
  onHold: number;
  completed: number;
  todaysTotal: number;
}

// Electron API Interface
export interface ElectronAPI {
  getAppVersion: () => Promise<string>;

  // Window controls
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;

  // Service calls
  serviceCalls: {
    create: (data: ServiceCallCreateData) => Promise<ServiceCall>;
    getAll: () => Promise<ServiceCall[]>;
    getById: (id: string) => Promise<ServiceCall | null>;
    update: (id: string, data: ServiceCallUpdateData) => Promise<ServiceCall>;
    delete: (id: string) => Promise<boolean>;
    getStats: () => Promise<ServiceCallStats>;
    getTodaysCalls: () => Promise<ServiceCall[]>;
  };

  // File operations
  exportPDF: (data: PDFExportData) => Promise<string>;
  showSaveDialog: (options: SaveDialogOptions) => Promise<string | null>;

  // Database
  database: {
    backup: () => Promise<string>;
    restore: (filePath: string) => Promise<boolean>;
  };

  // Work logs
  workLogs: {
    create: (data: WorkLogCreateData) => Promise<WorkLog>;
    getByCallId: (callId: string) => Promise<WorkLog[]>;
    update: (id: string, data: WorkLogUpdateData) => Promise<WorkLog>;
    delete: (id: string) => Promise<boolean>;
  };

  // Workflows
  workflows: {
    trigger: (name: string, data: any) => Promise<WorkflowResult>;
    getStatus: (id: string) => Promise<WorkflowStatus>;
  };
}

// Service Call Types
export interface ServiceCall {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  problemDesc: string;
  callType: 'Landlord' | 'Extra' | 'Warranty';
  landlordName?: string;
  status: 'New' | 'Scheduled' | 'InProgress' | 'OnHold' | 'Completed';
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceCallCreateData {
  customerName: string;
  phone: string;
  address: string;
  problemDesc: string;
  callType: 'Landlord' | 'Extra' | 'Warranty';
  landlordName?: string;
  scheduledAt?: Date;
}

export interface ServiceCallUpdateData extends Partial<ServiceCallCreateData> {
  status?: 'New' | 'Scheduled' | 'InProgress' | 'OnHold' | 'Completed';
}

// Work Log Types
export interface WorkLog {
  id: string;
  callId: string;
  notes: string;
  partsUsed?: string;
  loggedAt: Date;
}

export interface WorkLogCreateData {
  callId: string;
  notes: string;
  partsUsed?: string;
}

export interface WorkLogUpdateData {
  notes?: string;
  partsUsed?: string;
}

// PDF Export Types
export interface PDFExportData {
  date: Date;
  calls: ServiceCall[];
  title: string;
}

// Dialog Types
export interface SaveDialogOptions {
  title: string;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

// Workflow Types
export interface WorkflowResult {
  id: string;
  success: boolean;
  message?: string;
  data?: any;
}

export interface WorkflowStatus {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  message?: string;
}

// Global Window Interface Extension
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
