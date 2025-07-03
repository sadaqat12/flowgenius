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
    fixStatuses: () => Promise<{ updated: number; errors: number }>;
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
    autoTag: (callId: string) => Promise<any>;
    checkStaleCalls: () => Promise<ServiceCall[]>;
    // N8n integration
    n8nStatus: () => Promise<N8nStatus>;
    n8nWorkflows: () => Promise<N8nWorkflow[]>;
    openN8nEditor: () => Promise<{ success: boolean; error?: string }>;
  };
  
  // Parts Analysis (ChatGPT via n8n)
  callService: {
    analyzeParts: (modelNumber: string, problemDescription: string) => Promise<{
      success: boolean;
      analysis?: PartsAnalysis;
      error?: string;
      summary: string;
    }>;
  };

  // Allow renderer to listen to main process events
  on: (channel: string, callback: (...args: any[]) => void) => () => void;
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
  modelNumber?: string;
  status: 'New' | 'Scheduled' | 'InProgress' | 'OnHold' | 'Completed';
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // AI-generated fields
  aiAnalysisResult?: AutoTagResult;
  likelyProblem?: string;
  suggestedParts?: string[];
}

export interface ServiceCallCreateData {
  customerName: string;
  phone: string;
  address: string;
  problemDesc: string;
  callType: 'Landlord' | 'Extra' | 'Warranty';
  landlordName?: string;
  modelNumber?: string;
  scheduledAt?: Date;
}

export interface ServiceCallUpdateData extends Partial<ServiceCallCreateData> {
  status?: 'New' | 'Scheduled' | 'InProgress' | 'OnHold' | 'Completed';
  // AI-generated fields
  aiAnalysisResult?: AutoTagResult;
  likelyProblem?: string;
  suggestedParts?: string[];
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

// AI Analysis Types
export interface AutoTagResult {
  category?: string;
  urgency?: 'Low' | 'Medium' | 'High' | 'Emergency';
  estimatedDuration?: string;
  suggestedParts?: string[];
  confidence?: number;
  likelyProblem?: string;
  
  // New ChatGPT analysis properties
  modelNumber?: string;
  appliance?: string;
  brand?: string;
  recommendedParts?: Array<{
    name: string;
    partNumber: string;
    category: string;
    priority: string;
    price: number;
    description: string;
  }>;
  analysisNotes?: string[];
  timestamp?: string;
  source?: string;
}

// N8n Integration Types
export interface N8nStatus {
  isReady: boolean;
  serverUrl: string;
}

// Parts Analysis Types from call-service
export interface PartsAnalysis {
  modelNumber: string;
  appliance: string;
  brand: string;
  confidence: number;
  recommendedParts: Array<{
    name: string;
    partNumber: string;
    category: string;
    priority: string;
    price: number;
    description: string;
  }>;
  analysisNotes: string[];
  timestamp?: string;
  source?: string;
}

export interface N8nWorkflow {
  id?: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
  settings?: any;
  staticData?: any;
}

// Global Window Interface Extension
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
