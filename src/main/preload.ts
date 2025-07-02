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

  // Workflow operations (to be implemented later)
  workflows: {
    trigger: (name: string, data: any) =>
      ipcRenderer.invoke('workflows:trigger', name, data),
    getStatus: (id: string) => ipcRenderer.invoke('workflows:get-status', id),
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Debug logging
console.log('Preload script loaded successfully');
console.log('ElectronAPI exposed to renderer process');

// Define types for TypeScript
export type ElectronAPI = typeof electronAPI;
