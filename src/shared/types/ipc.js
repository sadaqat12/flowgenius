"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = void 0;
// IPC Channel Names
exports.IPC_CHANNELS = {
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
};
