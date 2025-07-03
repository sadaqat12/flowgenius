import { contextBridge, ipcRenderer } from 'electron';

// Define the API that will be exposed to the renderer process
const electronAPI = {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),

  // Service calls API
  serviceCalls: {
    create: (data: any) => ipcRenderer.invoke('service-calls:create', data),
    getAll: () => ipcRenderer.invoke('service-calls:get-all'),
    getById: (id: string) => ipcRenderer.invoke('service-calls:get-by-id', id),
    update: (id: string, data: any) =>
      ipcRenderer.invoke('service-calls:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('service-calls:delete', id),
    getStats: () => ipcRenderer.invoke('service-calls:get-stats'),
    getTodaysCalls: () => ipcRenderer.invoke('service-calls:get-todays-calls'),
    fixStatuses: () => ipcRenderer.invoke('service-calls:fix-statuses'),
  },

  // File operations
  exportPDF: (data: any) => ipcRenderer.invoke('export-pdf', data),
  showSaveDialog: (options: any) =>
    ipcRenderer.invoke('show-save-dialog', options),

  // Work logs API
  workLogs: {
    create: (data: any) => ipcRenderer.invoke('work-logs:create', data),
    getByCallId: (callId: string) => ipcRenderer.invoke('work-logs:get-by-call-id', callId),
    update: (id: string, data: any) => ipcRenderer.invoke('work-logs:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('work-logs:delete', id),
  },

  // Database operations
  database: {
    backup: () => ipcRenderer.invoke('database:backup'),
    restore: (filePath: string) =>
      ipcRenderer.invoke('database:restore', filePath),
  },

  // Parts Analysis (ChatGPT via n8n)
  callService: {
    analyzeParts: (modelNumber: string, problemDescription: string) =>
      ipcRenderer.invoke('parts:analyze-chatgpt', modelNumber, problemDescription),
  },

  // Workflow operations (to be implemented later)
  workflows: {
    trigger: (name: string, data: any) =>
      ipcRenderer.invoke('workflows:trigger', name, data),
    getStatus: (id: string) => ipcRenderer.invoke('workflows:get-status', id),
    checkStaleCalls: () => ipcRenderer.invoke('workflows:check-stale-calls'),
    // N8n integration
    n8nStatus: () => ipcRenderer.invoke('workflows:n8n-status'),
    n8nWorkflows: () => ipcRenderer.invoke('workflows:n8n-workflows'),
    openN8nEditor: () => ipcRenderer.invoke('workflows:open-n8n-editor'),
  },

  // Event listeners from main process
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
    // Return a cleanup function
    return () => {
      ipcRenderer.removeAllListeners(channel);
    };
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Debug logging
console.log('Preload script loaded successfully');
console.log('ElectronAPI exposed to renderer process');

// Define types for TypeScript
export type ElectronAPI = typeof electronAPI;
