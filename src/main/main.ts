// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { callService } from './services/call-service';
import { pdfService } from './services/pdf-service';
import { workflowService } from './services/workflow-service';
import { addSampleData } from './utils/sample-data';

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Function to send messages to the renderer process
export function sendToRenderer(channel: string, ...args: any[]) {
  if (mainWindow) {
    mainWindow.webContents.send(channel, ...args);
  }
}

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'default',
    show: false, // Don't show until ready-to-show
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Initialize services
  try {
    await callService.initialize();
    await pdfService.initialize();
    await workflowService.initialize();
    console.log('Services initialized successfully');
    
    // Add sample data in development mode
    if (isDev) {
      await addSampleData();
    }
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }

  createWindow();

  app.on('activate', () => {
    // On macOS, re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app protocol for production
if (!isDev) {
  app.setAsDefaultProtocolClient('service-call-manager');
}

// Security: Prevent new window creation
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});

// Basic IPC handlers for testing
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Handle graceful shutdown
app.on('before-quit', async () => {
  try {
    await callService.shutdown();
    await pdfService.shutdown();
    await workflowService.shutdown();
    console.log('Services shut down successfully');
  } catch (error) {
    console.error('Error shutting down services:', error);
  }
});

process.on('SIGTERM', () => {
  app.quit();
});

process.on('SIGINT', () => {
  app.quit();
});
