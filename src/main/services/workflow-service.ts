import { ipcMain, Notification } from 'electron';
import { databaseService } from './database/database';
import { ServiceCallModel } from './database/models';
import { n8nService } from './n8n-service';
import type { ServiceCall, AutoTagResult } from '../../shared/types/ipc';

// To enable SMS functionality:
// 1. Run: npm install twilio
// 2. Add your Twilio credentials to the .env file:
//    TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//    TWILIO_AUTH_TOKEN=your_auth_token
//    TWILIO_PHONE_NUMBER=+15017122661
let twilioClient: any;
try {
  const twilio = require('twilio');
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken);
    console.log('Twilio client initialized successfully.');
  } else {
    console.warn('Twilio credentials not found in .env file. SMS functionality will be disabled.');
  }
} catch (error) {
  console.warn('Twilio package not found. To enable SMS, run: npm install twilio');
  twilioClient = null;
}

interface StaleCallConfig {
  newCallThresholdHours: number;
  inProgressThresholdHours: number; 
  onHoldThresholdHours: number;
}

export class WorkflowService {
  private serviceCallModel: ServiceCallModel | null = null;
  private staleCallTimer: NodeJS.Timeout | null = null;
  private staleCallConfig: StaleCallConfig = {
    newCallThresholdHours: 24,
    inProgressThresholdHours: 24,
    onHoldThresholdHours: 48
  };

  async initialize(): Promise<void> {
    // Initialize n8n service first
    try {
      await n8nService.initialize();
      console.log('N8n service initialized successfully');
    } catch (error) {
      console.error('N8n service initialization failed, falling back to local workflows:', error);
    }

    // Initialize database connection
    const supabaseClient = databaseService.getClient();
    this.serviceCallModel = new ServiceCallModel(supabaseClient);

    // Register IPC handlers
    this.registerIPCHandlers();

    // Start stale call monitoring (local fallback)
    this.startStaleCallMonitoring();

    console.log('WorkflowService initialized successfully');
  }

  private registerIPCHandlers(): void {
    // Manual stale call check
    ipcMain.handle('workflows:check-stale-calls', async () => {
      return this.checkStaleCalls();
    });

    // Get workflow status
    ipcMain.handle('workflows:get-status', async (_, workflowId: string) => {
      return this.getWorkflowStatus(workflowId);
    });

    // Trigger custom workflow
    ipcMain.handle('workflows:trigger', async (_, workflowName: string, data: any) => {
      return this.triggerWorkflow(workflowName, data);
    });

    // N8n specific handlers
    ipcMain.handle('workflows:n8n-status', async () => {
      return {
        isReady: n8nService.isServerReady(),
        serverUrl: n8nService.getServerUrl(),
      };
    });

    ipcMain.handle('workflows:n8n-workflows', async () => {
      if (n8nService.isServerReady()) {
        return n8nService.getWorkflows();
      }
      return [];
    });

    ipcMain.handle('workflows:open-n8n-editor', async () => {
      if (n8nService.isServerReady()) {
        const { shell } = require('electron');
        shell.openExternal(n8nService.getServerUrl());
        return { success: true };
      }
      return { success: false, error: 'N8n server not ready' };
    });

    console.log('Workflow service IPC handlers registered');
  }

  /**
   * Local fallback analysis (keeping existing logic)
   */
  private async analyzeApplianceProblem(problemDesc: string, modelNumber?: string): Promise<AutoTagResult> {
    const problem = problemDesc.toLowerCase();
    
    // Simple logic, can be expanded
    console.log(`Performing local analysis for problem: "${problem}" and model: "${modelNumber || 'N/A'}"`);

    // Appliance detection
    let category = 'General';
    if (problem.includes('washer') || problem.includes('washing machine')) category = 'Washer';
    else if (problem.includes('dryer')) category = 'Dryer';
    else if (problem.includes('stove') || problem.includes('oven')) category = 'Stove/Oven';
    else if (problem.includes('fridge') || problem.includes('refrigerator')) category = 'Refrigerator';

    // Urgency detection
    let urgency: AutoTagResult['urgency'] = 'Medium';
    if (problem.includes('emergency') || problem.includes('leak')) urgency = 'Emergency';
    else if (problem.includes('not working')) urgency = 'High';
    else if (problem.includes('noise')) urgency = 'Low';

    // Duration estimation
    const estimatedDuration = '2-4 hours';

    // Suggested parts based on common issues
    const suggestedParts = this.getSuggestedParts(category, problem);
    
    const likelyProblem = `The ${category.toLowerCase()} is likely having an issue with its main function.`;

    return {
      category,
      urgency,
      estimatedDuration,
      suggestedParts,
      confidence: 0.75, // Lower confidence for local analysis
      likelyProblem,
    };
  }

  /**
   * Get suggested parts based on appliance category and problem description
   */
  private getSuggestedParts(category: string, problem: string): string[] {
    const parts: string[] = [];

    switch (category) {
      case 'Washer':
        if (problem.includes('leak')) parts.push('Door seal', 'Water pump', 'Hoses');
        if (problem.includes('spin') || problem.includes('agitator')) parts.push('Drive belt', 'Motor coupler', 'Agitator');
        if (problem.includes('drain')) parts.push('Drain pump', 'Drain hose');
        break;

      case 'Dryer':
        if (problem.includes('heat')) parts.push('Heating element', 'Thermal fuse', 'Thermostat');
        if (problem.includes('belt')) parts.push('Drive belt', 'Idler pulley');
        if (problem.includes('lint')) parts.push('Lint filter', 'Exhaust vent');
        break;

      case 'Stove/Oven':
        if (problem.includes('burner')) parts.push('Burner element', 'Burner switch', 'Drip pan');
        if (problem.includes('oven')) parts.push('Oven element', 'Temperature sensor', 'Door seal');
        if (problem.includes('igniter')) parts.push('Gas igniter', 'Safety valve');
        break;

      case 'Refrigerator':
        if (problem.includes('cooling')) parts.push('Compressor', 'Evaporator fan', 'Condenser coils');
        if (problem.includes('ice')) parts.push('Ice maker assembly', 'Water filter', 'Water line');
        if (problem.includes('door')) parts.push('Door seal', 'Door handle', 'Hinges');
        break;
    }

    return parts;
  }

  /**
   * Start monitoring for stale calls
   * This runs locally and can also trigger n8n workflows
   */
  private startStaleCallMonitoring(): void {
    // Check immediately on startup
    this.checkStaleCalls();

    // Then check every hour
    this.staleCallTimer = setInterval(() => {
      this.checkStaleCalls();
    }, 60 * 60 * 1000); // 1 hour

    console.log('Stale call monitoring started');
  }

  /**
   * Check for stale calls - enhanced with n8n integration and improved status logic
   */
  private async checkStaleCalls(): Promise<ServiceCall[]> {
    if (!this.serviceCallModel) {
      throw new Error('Service not initialized');
    }

    try {
      const now = new Date();
      const staleCalls: ServiceCall[] = [];

      // Get all active calls (not completed)
      const activeCalls = await this.serviceCallModel.getByStatusRange(['New', 'Scheduled', 'InProgress', 'OnHold']);

      for (const call of activeCalls) {
        const hoursSinceCreated = (now.getTime() - call.createdAt.getTime()) / (1000 * 60 * 60);
        const hoursSinceUpdated = (now.getTime() - call.updatedAt.getTime()) / (1000 * 60 * 60);

        let isStale = false;
        let reason = '';

        switch (call.status) {
          case 'New':
            // New calls that haven't been scheduled within threshold (they should get a scheduled time)
            if (hoursSinceCreated >= this.staleCallConfig.newCallThresholdHours) {
              isStale = true;
              reason = `New call needs scheduling (${Math.round(hoursSinceCreated)} hours old)`;
            }
            break;

          case 'Scheduled':
            // Scheduled calls that are past their scheduled time (these should auto-move to InProgress)
            if (call.scheduledAt && now > call.scheduledAt) {
              const hoursPastDue = (now.getTime() - call.scheduledAt.getTime()) / (1000 * 60 * 60);
              if (hoursPastDue >= 2) { // Give 2 hours grace period
                isStale = true;
                reason = `Scheduled call is past due (${Math.round(hoursPastDue)} hours overdue)`;
              }
            }
            break;

          case 'InProgress':
            // In-progress calls not updated within threshold
            if (hoursSinceUpdated >= this.staleCallConfig.inProgressThresholdHours) {
              isStale = true;
              reason = `In-progress call needs update (${Math.round(hoursSinceUpdated)} hours since last update)`;
            }
            break;

          case 'OnHold':
            // On-hold calls not updated within threshold
            if (hoursSinceUpdated >= this.staleCallConfig.onHoldThresholdHours) {
              isStale = true;
              reason = `On-hold call needs attention (${Math.round(hoursSinceUpdated)} hours on hold)`;
            }
            break;
        }

        if (isStale) {
          staleCalls.push(call);
          await this.sendStaleCallNotification(call, reason);
        }
      }

      if (staleCalls.length > 0) {
        console.log(`Found ${staleCalls.length} stale call(s)`);
        
        // Trigger n8n stale call workflow if available
        if (n8nService.isServerReady()) {
          try {
            await n8nService.triggerWebhook('check-stale-calls', {
              staleCalls: staleCalls.map(call => ({
                id: call.id,
                customerName: call.customerName,
                address: call.address,
                status: call.status,
                hoursSinceCreated: (now.getTime() - call.createdAt.getTime()) / (1000 * 60 * 60),
                hoursSinceUpdated: (now.getTime() - call.updatedAt.getTime()) / (1000 * 60 * 60),
              })),
            });
            console.log('✅ Stale calls sent to n8n workflow successfully');
          } catch (n8nError) {
            const error = n8nError as any;
            console.warn('⚠️ Failed to trigger n8n stale call workflow, continuing with local notifications:', error.response?.data?.message || error.message);
          }
        }
      }

      return staleCalls;
    } catch (error) {
      console.error('Error checking stale calls:', error);
      return [];
    }
  }

  /**
   * Send desktop notification for stale calls
   */
  private async sendStaleCallNotification(call: ServiceCall, reason: string): Promise<void> {
    try {
      const notification = new Notification({
        title: 'Stale Service Call Alert',
        body: `${call.customerName} - ${reason}\nAddress: ${call.address}`,
        urgency: 'normal',
        timeoutType: 'default',
        actions: [
          {
            type: 'button',
            text: 'View Call'
          }
        ]
      });

      notification.show();

      notification.on('click', () => {
        console.log('User clicked stale call notification for:', call.id);
      });

      console.log(`Sent stale call notification for: ${call.customerName} (${call.id})`);
    } catch (error) {
      console.error('Error sending stale call notification:', error);
    }
  }

  /**
   * Get workflow status - enhanced with n8n integration
   */
  private async getWorkflowStatus(workflowId: string): Promise<any> {
    // Try to get status from n8n first
    if (n8nService.isServerReady()) {
      try {
        const executions = await n8nService.getWorkflowExecutions(workflowId, 1);
        if (executions.length > 0) {
          const latest = executions[0];
          return {
            id: workflowId,
            status: latest.finished ? 'completed' : 'running',
            result: latest.finished ? 'success' : 'pending',
            startedAt: latest.startedAt,
            stoppedAt: latest.stoppedAt,
          };
        }
      } catch (error) {
        console.error('Error getting n8n workflow status:', error);
      }
    }

    // Fallback to placeholder status
    return {
      id: workflowId,
      status: 'completed',
      result: 'success'
    };
  }

  /**
   * Trigger custom workflow - enhanced with n8n integration
   */
  async triggerWorkflow(workflowName: string, data: any): Promise<any> {
    console.log(`Triggering workflow: ${workflowName}`, data);

    // --- Direct handling for specific local workflows ---
    // This workflow sends an SMS and does NOT use n8n.
    if (workflowName === 'request-model-number') {
      console.log('Using direct local handler for request-model-number.');
      return this.requestModelNumberBySms(data.callId, data.customerPhone);
    }
    
    // --- n8n-first handling for all other workflows ---
    if (n8nService.isServerReady()) {
      try {
        console.log(`Attempting to trigger n8n webhook for: ${workflowName}`);
        return await n8nService.triggerWebhook(workflowName, data);
      } catch (error) {
        console.warn(`N8n workflow '${workflowName}' failed or does not exist, using local fallback. Error:`, error as any);
      }
    }

    // --- Local fallback handling for n8n-compatible workflows ---
    console.log(`Using local fallback for workflow: ${workflowName}`);
    switch (workflowName) {
      case 'stale-call-check':
        return this.checkStaleCalls();
      default:
        throw new Error(`Unknown workflow or no local fallback available: ${workflowName}`);
    }
  }

  /**
   * Sends an SMS to the customer to request the model number using Twilio.
   * This is a direct, local implementation that does not involve n8n.
   * NOTE: This only SENDS the message. The reply must be manually checked in your
   * Twilio account and entered into the application.
   */
  private async requestModelNumberBySms(callId: string, customerPhone: string): Promise<any> {
    if (!twilioClient) {
      const errorMessage = 'Twilio is not configured. Cannot send SMS. Please check .env file and install twilio package.';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      const errorMessage = 'Twilio phone number (TWILIO_PHONE_NUMBER) is not configured in .env file.';
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    const messageBody = `Hello, this is regarding your service call. To help our technician prepare, please reply with the model number of your appliance. Thank you.`;

    try {
      console.log(`Sending SMS to ${customerPhone} for call ID ${callId} via Twilio.`);
      
      const message = await twilioClient.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: customerPhone
      });

      console.log(`SMS sent successfully. Message SID: ${message.sid}`);
      return { success: true, message: `SMS sent to ${customerPhone}` };

    } catch (error) {
      const typedError = error as Error;
      console.error('Error sending SMS via Twilio:', typedError.message);
      throw new Error(`Failed to send SMS: ${typedError.message}`);
    }
  }

  async shutdown(): Promise<void> {
    // Stop stale call monitoring
    if (this.staleCallTimer) {
      clearInterval(this.staleCallTimer);
      this.staleCallTimer = null;
    }

    // Shutdown n8n service
    try {
      await n8nService.shutdown();
    } catch (error) {
      console.error('Error shutting down n8n service:', error);
    }

    // Clean up IPC handlers
    ipcMain.removeAllListeners('workflows:check-stale-calls');
    ipcMain.removeAllListeners('workflows:get-status');
    ipcMain.removeAllListeners('workflows:trigger');
    ipcMain.removeAllListeners('workflows:n8n-status');
    ipcMain.removeAllListeners('workflows:n8n-workflows');
    ipcMain.removeAllListeners('workflows:open-n8n-editor');

    console.log('WorkflowService shut down');
  }
}

// Export singleton instance
export const workflowService = new WorkflowService(); 