import { ipcMain } from 'electron';
import { databaseService } from './database/database';
import { ServiceCallModel, WorkLogModel } from './database/models';
import { IPC_CHANNELS } from '../../shared/types/ipc';
import type { ServiceCall, ServiceCallCreateData, ServiceCallUpdateData } from '../../shared/types/ipc';

export class CallService {
  private serviceCallModel: ServiceCallModel | null = null;
  private workLogModel: WorkLogModel | null = null;

  async initialize(): Promise<void> {
    // Initialize database
    await databaseService.initialize();
    
    // Initialize models with Supabase client
    const supabaseClient = databaseService.getClient();
    this.serviceCallModel = new ServiceCallModel(supabaseClient);
    this.workLogModel = new WorkLogModel(supabaseClient);

    // Register IPC handlers
    this.registerIPCHandlers();

    console.log('CallService initialized successfully');
  }

  private registerIPCHandlers(): void {
    // Service call CRUD operations
    ipcMain.handle(IPC_CHANNELS.SERVICE_CALLS_CREATE, async (_, data: ServiceCallCreateData) => {
      return this.createServiceCall(data);
    });

    ipcMain.handle(IPC_CHANNELS.SERVICE_CALLS_GET_ALL, async () => {
      return this.getAllServiceCalls();
    });

    ipcMain.handle(IPC_CHANNELS.SERVICE_CALLS_GET_BY_ID, async (_, id: string) => {
      return this.getServiceCallById(id);
    });

    ipcMain.handle(IPC_CHANNELS.SERVICE_CALLS_UPDATE, async (_, id: string, data: ServiceCallUpdateData) => {
      return this.updateServiceCall(id, data);
    });

    ipcMain.handle(IPC_CHANNELS.SERVICE_CALLS_DELETE, async (_, id: string) => {
      return this.deleteServiceCall(id);
    });

    // Dashboard stats
    ipcMain.handle('service-calls:get-stats', async () => {
      return this.getStats();
    });

    // Today's calls for daily sheet
    ipcMain.handle('service-calls:get-todays-calls', async () => {
      return this.getTodaysCalls();
    });

    // Work log operations
    ipcMain.handle('work-logs:create', async (_, data: { callId: string; notes: string; partsUsed?: string }) => {
      return this.createWorkLog(data);
    });

    ipcMain.handle('work-logs:get-by-call-id', async (_, callId: string) => {
      return this.getWorkLogsByCallId(callId);
    });

    ipcMain.handle('work-logs:update', async (_, id: string, data: { notes?: string; partsUsed?: string }) => {
      return this.updateWorkLog(id, data);
    });

    ipcMain.handle('work-logs:delete', async (_, id: string) => {
      return this.deleteWorkLog(id);
    });

    console.log('IPC handlers registered');
  }

  // Service call operations
  private async createServiceCall(data: ServiceCallCreateData): Promise<ServiceCall> {
    if (!this.serviceCallModel) {
      throw new Error('Service not initialized');
    }

    try {
      return await this.serviceCallModel.create(data);
    } catch (error) {
      console.error('Error creating service call:', error);
      throw error;
    }
  }

  private async getAllServiceCalls(): Promise<ServiceCall[]> {
    if (!this.serviceCallModel) {
      throw new Error('Service not initialized');
    }

    try {
      return await this.serviceCallModel.getAll();
    } catch (error) {
      console.error('Error getting all service calls:', error);
      throw error;
    }
  }

  private async getServiceCallById(id: string): Promise<ServiceCall | null> {
    if (!this.serviceCallModel) {
      throw new Error('Service not initialized');
    }

    try {
      return await this.serviceCallModel.getById(id);
    } catch (error) {
      console.error('Error getting service call by id:', error);
      throw error;
    }
  }

  private async updateServiceCall(id: string, data: ServiceCallUpdateData): Promise<ServiceCall> {
    if (!this.serviceCallModel) {
      throw new Error('Service not initialized');
    }

    try {
      const result = await this.serviceCallModel.update(id, data);
      if (!result) {
        throw new Error('Service call not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating service call:', error);
      throw error;
    }
  }

  private async deleteServiceCall(id: string): Promise<boolean> {
    if (!this.serviceCallModel) {
      throw new Error('Service not initialized');
    }

    try {
      return await this.serviceCallModel.delete(id);
    } catch (error) {
      console.error('Error deleting service call:', error);
      throw error;
    }
  }

  private async getStats() {
    if (!this.serviceCallModel) {
      throw new Error('Service not initialized');
    }

    try {
      return await this.serviceCallModel.getStats();
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }

  private async getTodaysCalls(): Promise<ServiceCall[]> {
    if (!this.serviceCallModel) {
      throw new Error('Service not initialized');
    }

    try {
      return await this.serviceCallModel.getTodaysCalls();
    } catch (error) {
      console.error('Error getting today\'s calls:', error);
      throw error;
    }
  }

  // Work log operations
  private async createWorkLog(data: { callId: string; notes: string; partsUsed?: string }) {
    if (!this.workLogModel) {
      throw new Error('Service not initialized');
    }

    try {
      return await this.workLogModel.create(data);
    } catch (error) {
      console.error('Error creating work log:', error);
      throw error;
    }
  }

  private async getWorkLogsByCallId(callId: string) {
    if (!this.workLogModel) {
      throw new Error('Service not initialized');
    }

    try {
      return await this.workLogModel.getByCallId(callId);
    } catch (error) {
      console.error('Error getting work logs by call ID:', error);
      throw error;
    }
  }

  private async updateWorkLog(id: string, data: { notes?: string; partsUsed?: string }) {
    if (!this.workLogModel) {
      throw new Error('Service not initialized');
    }

    try {
      const result = await this.workLogModel.update(id, data);
      if (!result) {
        throw new Error('Work log not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating work log:', error);
      throw error;
    }
  }

  private async deleteWorkLog(id: string) {
    if (!this.workLogModel) {
      throw new Error('Service not initialized');
    }

    try {
      return await this.workLogModel.delete(id);
    } catch (error) {
      console.error('Error deleting work log:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    // Clean up IPC handlers
    ipcMain.removeAllListeners(IPC_CHANNELS.SERVICE_CALLS_CREATE);
    ipcMain.removeAllListeners(IPC_CHANNELS.SERVICE_CALLS_GET_ALL);
    ipcMain.removeAllListeners(IPC_CHANNELS.SERVICE_CALLS_GET_BY_ID);
    ipcMain.removeAllListeners(IPC_CHANNELS.SERVICE_CALLS_UPDATE);
    ipcMain.removeAllListeners(IPC_CHANNELS.SERVICE_CALLS_DELETE);
    ipcMain.removeAllListeners('service-calls:get-stats');
    ipcMain.removeAllListeners('service-calls:get-todays-calls');
    ipcMain.removeAllListeners('work-logs:create');
    ipcMain.removeAllListeners('work-logs:get-by-call-id');
    ipcMain.removeAllListeners('work-logs:update');
    ipcMain.removeAllListeners('work-logs:delete');

    // Close database
    await databaseService.close();

    console.log('CallService shut down');
  }
}

// Export singleton instance
export const callService = new CallService(); 