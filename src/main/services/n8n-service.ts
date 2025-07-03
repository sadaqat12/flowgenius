import { spawn, ChildProcess } from 'child_process';
import axios, { AxiosInstance } from 'axios';
import path from 'path';
import { app } from 'electron';

interface N8nConfig {
  port: number;
  host: string;
  basicAuth: {
    user: string;
    password: string;
  };
  encryption_key: string;
  user_folder: string;
  api_key?: string;
}

interface N8nWorkflow {
  id?: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
  settings?: any;
  staticData?: any;
}

interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  retryOf?: string;
  retrySuccessId?: string;
  startedAt: Date;
  stoppedAt?: Date;
  workflowId: string;
  data?: any;
}

export class N8nService {
  private config: N8nConfig;
  private process: ChildProcess | null = null;
  private api: AxiosInstance;
  private isStarting = false;
  private isReady = false;

  constructor() {
    // Configure n8n settings
    this.config = {
      port: parseInt(process.env.N8N_PORT || '5678'),
      host: process.env.N8N_HOST || 'localhost',
      basicAuth: {
        user: process.env.N8N_BASIC_AUTH_USER || 'admin',
        password: process.env.N8N_BASIC_AUTH_PASSWORD || 'admin123',
      },
      encryption_key: process.env.N8N_ENCRYPTION_KEY || 'service-call-manager-n8n-key',
      user_folder: path.join(app.getPath('userData'), 'n8n'),
      api_key: process.env.N8N_API_KEY, // Optional API key for newer versions
    };

    // Setup axios instance for n8n API
    this.api = axios.create({
      baseURL: `http://${this.config.host}:${this.config.port}`,
      timeout: 30000, // Increased timeout for workflow operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add API key if available, otherwise use basic auth
    if (this.config.api_key) {
      this.api.defaults.headers['X-N8N-API-KEY'] = this.config.api_key;
    } else {
      this.api.defaults.auth = {
        username: this.config.basicAuth.user,
        password: this.config.basicAuth.password,
      };
    }
  }

  async initialize(): Promise<void> {
    console.log('Initializing N8n Service...');
    
    try {
      // Check if n8n is already running
      const isRunning = await this.checkIfRunning();
      
      if (!isRunning) {
        await this.startN8nServer();
      } else {
        console.log('N8n server already running');
        this.isReady = true;
      }

      // Wait a bit for server to fully initialize
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Setup default workflows (only if we can access the API)
      try {
        await this.setupDefaultWorkflows();
      } catch (error) {
        console.log('Note: Could not setup default workflows. This is normal on first run or if API key is needed.');
        console.log('You can access the n8n editor at:', this.getServerUrl());
      }
      
      console.log('N8n Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize N8n Service:', error);
      // Don't throw here - let the app continue with local workflows
    }
  }

  private async checkIfRunning(): Promise<boolean> {
    try {
      // Try to access the web interface instead of API
      const response = await axios.get(`http://${this.config.host}:${this.config.port}`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private async startN8nServer(): Promise<void> {
    if (this.isStarting || this.process) {
      return;
    }

    this.isStarting = true;
    
    return new Promise((resolve, reject) => {
      console.log('Starting n8n server...');

      // Set environment variables for n8n
      const env = {
        ...process.env,
        N8N_PORT: this.config.port.toString(),
        N8N_HOST: this.config.host,
        N8N_BASIC_AUTH_ACTIVE: 'true',
        N8N_BASIC_AUTH_USER: this.config.basicAuth.user,
        N8N_BASIC_AUTH_PASSWORD: this.config.basicAuth.password,
        N8N_ENCRYPTION_KEY: this.config.encryption_key,
        N8N_USER_FOLDER: this.config.user_folder,
        N8N_DISABLE_UI: 'false',
        N8N_LOG_LEVEL: 'info',
        WEBHOOK_URL: `http://${this.config.host}:${this.config.port}/`,
        // Disable telemetry for privacy
        N8N_DIAGNOSTICS_ENABLED: 'false',
        N8N_VERSION_NOTIFICATIONS_ENABLED: 'false',
        N8N_TEMPLATES_ENABLED: 'false',
      };

      // Start n8n as a child process
      this.process = spawn('npx', ['n8n', 'start'], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });

      let startupComplete = false;

      // Handle stdout
      this.process.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`n8n: ${output}`);
        
        // Check if server is ready - look for various startup indicators
        if (!startupComplete && (
          output.includes('n8n ready on') || 
          output.includes('Editor is now accessible') ||
          output.includes('Server is listening on') ||
          output.includes('n8n is ready')
        )) {
          startupComplete = true;
          this.isReady = true;
          this.isStarting = false;
          resolve();
        }
      });

      // Handle stderr
      this.process.stderr?.on('data', (data) => {
        const output = data.toString();
        console.error(`n8n error: ${output}`);
        
        // Don't reject on warnings or deprecation notices
        if (output.toLowerCase().includes('error') && 
            !output.includes('deprecated') && 
            !output.includes('warning')) {
          if (!startupComplete) {
            this.isStarting = false;
            reject(new Error(`n8n startup error: ${output}`));
          }
        }
      });

      // Handle process exit
      this.process.on('exit', (code, signal) => {
        console.log(`n8n process exited with code ${code} and signal ${signal}`);
        this.process = null;
        this.isReady = false;
        this.isStarting = false;
      });

      // Handle process errors
      this.process.on('error', (error) => {
        console.error('n8n process error:', error);
        this.isStarting = false;
        if (!startupComplete) {
          reject(error);
        }
      });

      // Timeout after 45 seconds (n8n can take longer to start)
      setTimeout(() => {
        if (this.isStarting && !startupComplete) {
          this.isStarting = false;
          // Don't reject here, just mark as not ready
          console.log('N8n startup timeout - continuing with local workflows');
          resolve();
        }
      }, 45000);
    });
  }

  private async setupDefaultWorkflows(): Promise<void> {
    // Wait a bit for n8n to be fully ready
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      // Try to get workflows to test API access
      const workflows = await this.getWorkflows();
      console.log(`Found ${workflows.length} existing workflows`);
      
      // Setup workflows in order
      await this.setupChatGPTWorkflow(workflows);
      await this.setupStaleCallsWorkflow(workflows);
      
      console.log('Default workflows setup completed');
    } catch (error) {
      console.error('Error setting up default workflows:', error);
      // This is expected if API key is required
      console.log('Please create workflows manually in the n8n editor');
    }
  }

  private async setupChatGPTWorkflow(existingWorkflows: N8nWorkflow[]): Promise<void> {
    console.log('Setting up ChatGPT Parts Analysis workflow...');
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const workflowPath = path.join(process.cwd(), 'resources', 'workflows', 'chatgpt-parts-analysis.json');
      
      if (fs.existsSync(workflowPath)) {
        const rawWorkflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
        const workflowData = this.cleanWorkflowForApi(rawWorkflowData);
        
        // Check if workflow already exists
        const existingWorkflow = existingWorkflows.find(w => w.name === workflowData.name);
        if (!existingWorkflow) {
          await this.createWorkflow(workflowData);
          console.log('✅ ChatGPT Parts Analysis workflow created successfully');
        } else {
          console.log('✅ ChatGPT Parts Analysis workflow already exists');
        }
      } else {
        console.log('⚠️ ChatGPT Parts Analysis workflow file not found');
      }
    } catch (workflowError) {
      console.error('Error setting up ChatGPT workflow:', workflowError);
    }
  }

  private async setupStaleCallsWorkflow(existingWorkflows: N8nWorkflow[]): Promise<void> {
    console.log('Setting up Stale Calls Monitoring workflow...');
    
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const workflowPath = path.join(process.cwd(), 'resources', 'workflows', 'stale-calls-workflow.json');
      
      if (fs.existsSync(workflowPath)) {
        const rawWorkflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
        const workflowData = this.cleanWorkflowForApi(rawWorkflowData);
        
        // Check if workflow already exists
        const existingWorkflow = existingWorkflows.find(w => w.name === workflowData.name);
        if (!existingWorkflow) {
          const workflowId = await this.createWorkflow(workflowData);
          
          // Activate the workflow
          try {
            await this.api.post(`/api/v1/workflows/${workflowId}/activate`);
            console.log('✅ Stale Calls Monitoring workflow created and activated successfully');
          } catch (activationError) {
            console.log('✅ Stale Calls Monitoring workflow created (manual activation required)');
          }
        } else {
          console.log('✅ Stale Calls Monitoring workflow already exists');
        }
      } else {
        console.log('⚠️ Stale Calls Monitoring workflow file not found');
      }
    } catch (workflowError) {
      console.error('Error setting up Stale Calls workflow:', workflowError);
    }
  }

  // Helper method to clean workflow data for API creation (same as setup scripts)
  private cleanWorkflowForApi(workflowData: any): N8nWorkflow {
    return {
      name: workflowData.name,
      active: false, // Will be set via activation API
      nodes: workflowData.nodes.map((node: any) => {
        const cleanNode = {
          parameters: node.parameters || {},
          id: node.id,
          name: node.name,
          type: node.type,
          typeVersion: node.typeVersion || 1,
          position: node.position || [0, 0]
        };
        
        // Remove webhookId from webhook nodes as it's auto-generated
        if (node.webhookId) {
          delete (cleanNode as any).webhookId;
        }
        
        return cleanNode;
      }),
      connections: workflowData.connections || {},
      settings: workflowData.settings || {}
    };
  }

  async createWorkflow(workflow: N8nWorkflow): Promise<string> {
    try {
      const response = await this.api.post('/api/v1/workflows', workflow);
      console.log(`Created workflow: ${workflow.name} (ID: ${response.data.id})`);
      return response.data.id;
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log(`Workflow ${workflow.name} already exists`);
        return 'existing';
      }
      console.error('Error creating workflow:', error.response?.data || error.message);
      throw error;
    }
  }

  async executeWorkflow(workflowId: string, data: any = {}): Promise<N8nExecution> {
    const response = await this.api.post(`/api/v1/workflows/${workflowId}/execute`, {
      data,
    });
    return response.data;
  }

  async triggerWebhook(webhookPath: string, data: any): Promise<any> {
    try {
      // Webhooks don't require API authentication
      // Use longer timeout for ChatGPT analysis which can take 30-60 seconds
      const timeout = webhookPath === 'chatgpt-parts-analysis' ? 60000 : 10000;
      
      console.log(`Triggering webhook ${webhookPath} with timeout ${timeout}ms`);
      
      const response = await axios.post(`http://${this.config.host}:${this.config.port}/webhook/${webhookPath}`, data, {
        timeout,
      });
      return response.data;
    } catch (error) {
      console.error(`Error triggering webhook ${webhookPath}:`, error);
      throw error;
    }
  }

  async getWorkflows(): Promise<N8nWorkflow[]> {
    try {
      const response = await this.api.get('/api/v1/workflows');
      return response.data.data || response.data || [];
    } catch (error: any) {
      console.error('Error getting workflows:', error.response?.data || error.message);
      return []; // Return empty array instead of throwing
    }
  }

  async getExecution(executionId: string): Promise<N8nExecution> {
    const response = await this.api.get(`/api/v1/executions/${executionId}`);
    return response.data;
  }

  async getWorkflowExecutions(workflowId: string, limit = 10): Promise<N8nExecution[]> {
    try {
      const response = await this.api.get(`/api/v1/executions`, {
        params: {
          filter: JSON.stringify({ workflowId }),
          limit,
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error getting workflow executions:', error);
      return [];
    }
  }

  isServerReady(): boolean {
    return this.isReady;
  }

  getServerUrl(): string {
    return `http://${this.config.host}:${this.config.port}`;
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down N8n Service...');
    
    if (this.process) {
      this.process.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (this.process) {
            this.process.kill('SIGKILL');
          }
          resolve();
        }, 5000);

        this.process?.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
      
      this.process = null;
    }
    
    this.isReady = false;
    console.log('N8n Service shut down');
  }
}

// Export singleton instance
export const n8nService = new N8nService(); 