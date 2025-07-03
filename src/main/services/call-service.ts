import { ipcMain } from 'electron';
import { databaseService } from './database/database';
import { ServiceCallModel, WorkLogModel } from './database/models';
import { IPC_CHANNELS } from '../../shared/types/ipc';
import type { ServiceCall, ServiceCallCreateData, ServiceCallUpdateData } from '../../shared/types/ipc';
import { n8nService } from './n8n-service';
import { sendToRenderer } from '../main';

// Types for parts analysis
interface PartsAnalysis {
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

    // ChatGPT Parts Analysis operations
    ipcMain.handle('parts:analyze-chatgpt', async (_, modelNumber: string, problemDescription: string) => {
      return this.analyzeParts(modelNumber, problemDescription);
    });

    // Database maintenance operations
    ipcMain.handle('service-calls:fix-statuses', async () => {
      return this.fixIncorrectStatuses();
    });

    console.log('IPC handlers registered');
  }

  // Database maintenance operations
  private async fixIncorrectStatuses() {
    if (!this.serviceCallModel) {
      throw new Error('Service not initialized');
    }

    try {
      return await this.serviceCallModel.fixIncorrectStatuses();
    } catch (error) {
      console.error('Error fixing incorrect statuses:', error);
      throw error;
    }
  }

  // Service call operations
  private async createServiceCall(data: ServiceCallCreateData): Promise<ServiceCall> {
    if (!this.serviceCallModel) {
      throw new Error('Service not initialized');
    }

    try {
      const newCall = await this.serviceCallModel.create(data);
      
      // If a model number is provided on creation, trigger the parts analysis
      if (newCall.modelNumber && newCall.problemDesc) {
        console.log(`Triggering background parts analysis for new call: ${newCall.id}`);
        setImmediate(async () => {
          try {
            const analysisResult = await this.analyzeParts(newCall.modelNumber!, newCall.problemDesc);
            if (analysisResult.success && analysisResult.analysis) {
              const finalCall = await this.serviceCallModel!.update(newCall.id, {
                aiAnalysisResult: analysisResult.analysis as any,
                likelyProblem: analysisResult.analysis.analysisNotes.join('\\n'),
                suggestedParts: analysisResult.analysis.recommendedParts.map(p => p.name),
              });
              console.log(`Successfully updated new call ${newCall.id} with AI analysis.`);
              // Notify the renderer that the call was updated
              sendToRenderer('service-call-updated', finalCall);
            }
          } catch (error) {
            console.error(`Background AI analysis failed for new call ${newCall.id}:`, error);
          }
        });
      }
      
      return newCall;
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
      // Get the state of the call *before* the update
      const originalCall = await this.serviceCallModel.getById(id);
      if (!originalCall) {
        throw new Error('Service call not found for update');
      }

      const updatedCall = await this.serviceCallModel.update(id, data);
      if (!updatedCall) {
        throw new Error('Service call not found after update');
      }

      // Check if the model number was just added
      const modelNumberWasAdded = data.modelNumber && !originalCall.modelNumber;
      if (modelNumberWasAdded && updatedCall.problemDesc) {
        console.log(`Triggering background parts analysis for updated call: ${updatedCall.id}`);
        setImmediate(async () => {
          try {
            const analysisResult = await this.analyzeParts(updatedCall.modelNumber!, updatedCall.problemDesc);
            if (analysisResult.success && analysisResult.analysis) {
              const finalCall = await this.serviceCallModel!.update(updatedCall.id, {
                aiAnalysisResult: analysisResult.analysis as any,
                likelyProblem: analysisResult.analysis.analysisNotes.join('\\n'),
                suggestedParts: analysisResult.analysis.recommendedParts.map(p => p.name),
              });
              console.log(`Successfully updated call ${updatedCall.id} with AI analysis after model number addition.`);
              // Notify the renderer that the call was updated
              sendToRenderer('service-call-updated', finalCall);
            }
          } catch (error) {
            console.error(`Background AI analysis failed for updated call ${updatedCall.id}:`, error);
          }
        });
      }
      
      return updatedCall;
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
      const allCalls = await this.serviceCallModel.getAll();
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      return allCalls.filter(call => {
        // Include calls scheduled for today, or calls that are InProgress/OnHold without completed status
        if (call.scheduledAt) {
          const scheduledDate = new Date(call.scheduledAt).toISOString().split('T')[0];
          return scheduledDate === todayStr;
        }
        
        // Also include active calls (InProgress/OnHold) that might need attention today
        if (call.status === 'InProgress' || call.status === 'OnHold') {
          return true;
        }
        
        return false;
      });
    } catch (error) {
      console.error('Error getting today\'s calls:', error);
      throw error;
    }
  }

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
      console.error('Error getting work logs:', error);
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

  // ChatGPT Parts Analysis using n8n workflow
  async analyzeParts(modelNumber: string, problemDescription: string): Promise<{
    success: boolean;
    analysis?: PartsAnalysis;
    error?: string;
    summary: string;
  }> {
    try {
      console.log(`🤖 Analyzing parts for ${modelNumber} with ChatGPT...`);
      
      if (!n8nService.isServerReady()) {
        throw new Error('N8n server is not ready');
      }

      const webhookResult = await n8nService.triggerWebhook('chatgpt-parts-analysis', {
        modelNumber,
        problemDescription,
        appliance: this.detectAppliance(problemDescription)
      });

      console.log('Raw n8n response:', JSON.stringify(webhookResult, null, 2));
      
      // Extract content from webhook result - handle different possible formats
      let outputContent = '';
      let rawData: any = null;
      
      if (webhookResult) {
        // Case 1: Direct object response (most common with n8n)
        if (typeof webhookResult === 'object' && !Array.isArray(webhookResult) && webhookResult.success) {
          rawData = webhookResult;
          outputContent = JSON.stringify(webhookResult);
        }
        // Case 2: Array with objects
        else if (Array.isArray(webhookResult) && webhookResult.length > 0) {
          const firstResult = webhookResult[0];
          // Check if it has an output field
          if (firstResult.output) {
            outputContent = firstResult.output;
          } 
          // Or if it's the analysis data directly
          else if (firstResult.success || firstResult.analysis || firstResult.modelNumber) {
            rawData = firstResult;
            outputContent = JSON.stringify(firstResult);
          }
        }
        // Case 3: String response
        else if (typeof webhookResult === 'string') {
          outputContent = webhookResult;
        }
      }
      
      console.log('Extracted output content:', outputContent);
      console.log('Raw data object:', rawData);
      
      let analysis: PartsAnalysis | null = null;
      
      // Enhanced parsing logic to handle the n8n workflow format
      if (rawData || outputContent) {
        let parsedData: any = rawData; // Use rawData if we already have it

        // If we don't have rawData, try to parse the output content
        if (!parsedData && outputContent) {
          // 1. Try to parse the output content as JSON (most common case for n8n)
          try {
            parsedData = JSON.parse(outputContent);
            console.log('Successfully parsed output as JSON:', parsedData);
          } catch (e) {
            console.log('Failed to parse output as JSON:', e);
            // Will try other methods below
          }
        }

        // 2. If we have parsed data, extract the analysis
        if (parsedData) {
          // Handle the specific n8n format: {success: true, analysis: {...}}
          if (parsedData.success && parsedData.analysis) {
            console.log('Found analysis in n8n format');
            analysis = this.normalizeAnalysisResponse(parsedData.analysis);
          }
          // Handle direct analysis object
          else if (parsedData.modelNumber || parsedData.recommendedParts) {
            console.log('Found direct analysis object');
            analysis = this.normalizeAnalysisResponse(parsedData);
          }
          // Handle raw ChatGPT API response format
          else if (parsedData.choices && Array.isArray(parsedData.choices) && parsedData.choices[0]?.message?.content) {
            console.log('Found ChatGPT API response format');
            try {
              const contentData = JSON.parse(parsedData.choices[0].message.content);
              const analysisObject = contentData.analysis || contentData;
              analysis = this.normalizeAnalysisResponse(analysisObject);
            } catch (e) {
              console.error('Failed to parse ChatGPT API content:', e);
            }
          }
          // Handle array-wrapped responses
          else if (Array.isArray(parsedData) && parsedData.length > 0) {
            console.log('Found array-wrapped response');
            const first = parsedData[0];
            if (first.analysis) {
              analysis = this.normalizeAnalysisResponse(first.analysis);
            } else {
              analysis = this.normalizeAnalysisResponse(first);
            }
          }
        }
        
        // 3. If JSON parsing failed, look for an embedded JSON block (legacy)
        if (!analysis && outputContent) {
          console.log('Trying to find embedded JSON block');
          const jsonMatch = outputContent.match(/```json\s*\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            try {
              let jsonStr = jsonMatch[1].trim();
              let parsedBlock = JSON.parse(jsonStr);

              if (Array.isArray(parsedBlock) && parsedBlock.length > 0) {
                parsedBlock = parsedBlock[0];
              }
              
              const analysisObject = parsedBlock.analysis || parsedBlock;
              analysis = this.normalizeAnalysisResponse(analysisObject);
              console.log('Successfully parsed embedded JSON block');

            } catch (e) {
              console.error('Failed to parse embedded JSON block:', e);
            }
          }
        }
      }

      // 4. If all JSON parsing fails, fall back to the markdown scraper
      if (!analysis && outputContent) {
        console.log('No valid JSON found, falling back to markdown parsing.');
        analysis = this.parseMarkdownAnalysis(outputContent, modelNumber);
      }

      // Final check to ensure we have some data
      if (!analysis || analysis.recommendedParts.length === 0) {
        console.error('Analysis object:', analysis);
        throw new Error('Analysis failed to produce valid parts information.');
      }
      
      console.log('✅ ChatGPT analysis successful:', analysis);
      
      return {
        success: true,
        analysis,
        summary: this.formatChatGPTSummary(analysis)
      };
      
    } catch (error) {
      console.error('ChatGPT parts analysis error:', error);
      
      const mockAnalysis = this.generateMockAnalysis(modelNumber, problemDescription);
      const summary = `❌ ChatGPT analysis unavailable - Using fallback analysis:\n\n${this.formatChatGPTSummary(mockAnalysis)}`;
      
      return {
        success: false,
        analysis: mockAnalysis,
        error: error instanceof Error ? error.message : 'Unknown error',
        summary
      };
    }
  }

  private parseMarkdownAnalysis(text: string, modelNumber: string): PartsAnalysis {
    const recommendedParts: PartsAnalysis['recommendedParts'] = [];
    const analysisNotes: string[] = [];

    // Regex to find each part block, which starts with a number, dot, and bolded title.
    const partBlockRegex = /\d+\.\s+\*\*(.*?)\*\*[\s\S]*?(?=\n\d+\.\s+\*\*|\n###|$)/g;
    
    let match;
    while ((match = partBlockRegex.exec(text)) !== null) {
        const section = match[0];
        const name = match[1].trim();

        const partNumberMatch = section.match(/(?:Part Number|P\/N)[:\s]*([A-Z0-9\-]+)/i);
        const priorityMatch = section.match(/Priority[:\s]*(\w+)/i);
        const priceMatch = section.match(/Price[:\s]*.*?\$?(\d+)/i);
        const descriptionMatch = section.match(/Description[:\s]*(.*)/i);
        const categoryMatch = section.match(/Category[:\s]*(.*)/i);
        
        // We only add the part if we can find a name and part number.
        if (partNumberMatch) {
            recommendedParts.push({
                name: name,
                partNumber: partNumberMatch[1].trim(),
                category: categoryMatch ? categoryMatch[1].trim().replace(/\.$/, '') : 'General',
                priority: (priorityMatch ? priorityMatch[1].toLowerCase() : 'medium') as any,
                price: priceMatch ? parseInt(priceMatch[1], 10) : 0,
                description: descriptionMatch ? descriptionMatch[1].trim().replace(/\.$/, '') : `Details for ${name}.`
            });
        }
    }

    // Extract diagnostic advice
    const diagnosticsMatch = text.match(/### Diagnostic Advice:\s*([\s\S]*?)(\n###|$)/);
    if (diagnosticsMatch) {
        analysisNotes.push(...diagnosticsMatch[1].trim().split(/\n\s*-\s*/).filter(Boolean));
    }

    return {
      modelNumber: modelNumber.toUpperCase(),
      appliance: this.detectAppliance(text),
      brand: 'Unknown',
      confidence: 75, // Assign a reasonable confidence for text-based parsing
      recommendedParts,
      analysisNotes,
      timestamp: new Date().toISOString(),
      source: 'ChatGPT (Text Parsed)'
    };
  }

  private detectAppliance(description: string): string {
    const lower = description.toLowerCase();
    if (lower.includes('washer') || lower.includes('washing')) return 'washer';
    if (lower.includes('dryer')) return 'dryer';
    if (lower.includes('fridge') || lower.includes('refrigerator')) return 'refrigerator';
    if (lower.includes('stove') || lower.includes('oven')) return 'stove';
    if (lower.includes('dishwasher')) return 'dishwasher';
    return 'unknown';
  }

  private generateMockAnalysis(modelNumber: string, problemDescription: string): PartsAnalysis {
    const appliance = this.detectAppliance(problemDescription);
    const lower = problemDescription.toLowerCase();
    const parts: Array<{
      name: string;
      partNumber: string;
      category: string;
      priority: string;
      price: number;
      description: string;
    }> = [];

    // Generate basic mock parts based on appliance and problem
    if (appliance === 'washer' && lower.includes('leak')) {
      parts.push({
        name: 'Door Seal/Boot',
        partNumber: 'WH02X24917',
        category: 'seal',
        priority: 'high',
        price: 65.99,
        description: 'Most common source of front-load washer leaks'
      });
    } else if (appliance === 'dryer' && lower.includes('heat')) {
      parts.push({
        name: 'Heating Element',
        partNumber: 'WE11M29',
        category: 'heating',
        priority: 'high',
        price: 75.99,
        description: 'Primary heat source for electric dryers'
      });
    } else {
      parts.push({
        name: 'Diagnostic Kit',
        partNumber: 'DIAG-001',
        category: 'tool',
        priority: 'low',
        price: 0,
        description: 'For proper diagnosis'
      });
    }

    return {
      modelNumber: modelNumber.toUpperCase(),
      appliance,
      brand: 'Unknown',
      confidence: 60,
      recommendedParts: parts,
      analysisNotes: ['Fallback analysis - ChatGPT unavailable'],
      timestamp: new Date().toISOString(),
      source: 'fallback'
    };
  }



  private normalizeAnalysisResponse(analysis: any): PartsAnalysis {
    // Handle both 'parts' and 'recommendedParts' field names
    let parts = analysis.recommendedParts || analysis.parts || [];
    
    // Normalize parts array
    parts = parts.map((part: any) => {
      let price = 0;
      
      // Convert price strings like "$50-$70" to numbers
      if (typeof part.price === 'string') {
        const priceMatch = part.price.match(/\$?(\d+)/);
        if (priceMatch) {
          price = parseInt(priceMatch[1]);
        }
      } else if (typeof part.price === 'number') {
        price = part.price;
      }
      
      return {
        name: part.name || 'Unknown Part',
        partNumber: part.partNumber || 'N/A',
        priority: (part.priority || 'medium').toLowerCase(),
        price: price,
        description: part.description || 'No description available',
        category: part.category || 'general'
      };
    });
    
    // Convert confidence to number if it's a string
    let confidence = analysis.confidence || 0;
    if (typeof confidence === 'string') {
      const confStr = confidence.toLowerCase();
      if (confStr === 'high' || confStr === 'very high') {
        confidence = 90;
      } else if (confStr === 'medium' || confStr === 'moderate') {
        confidence = 70;
      } else if (confStr === 'low') {
        confidence = 50;
      } else {
        // Try to parse as number
        const parsed = parseInt(confidence);
        confidence = isNaN(parsed) ? 0 : parsed;
      }
    }
    
    return {
      modelNumber: analysis.modelNumber || 'Unknown',
      appliance: analysis.appliance || 'unknown',
      brand: analysis.brand || 'Unknown',
      confidence: confidence,
      recommendedParts: parts,
      analysisNotes: analysis.analysisNotes || [],
      timestamp: analysis.timestamp || new Date().toISOString(),
      source: analysis.source || 'ChatGPT'
    };
  }

  private formatChatGPTSummary(analysis: PartsAnalysis): string {
    return `🤖 ChatGPT Parts Analysis for ${analysis.modelNumber}
📱 Appliance: ${analysis.appliance}
🏷️ Brand: ${analysis.brand}
📊 Confidence: ${analysis.confidence}%
⏰ Analysis Time: ${analysis.timestamp ? new Date(analysis.timestamp).toLocaleString() : 'N/A'}

🛠️ Recommended Parts (${analysis.recommendedParts.length}):
${analysis.recommendedParts.map((part, index) => 
  `${index + 1}. ${part.name} (${part.partNumber})
   Priority: ${part.priority} | Price: $${part.price}
   Category: ${part.category}
   ${part.description}`
).join('\n\n')}

💡 AI Analysis Notes:
${analysis.analysisNotes.map(note => `• ${note}`).join('\n')}

🔗 Powered by ChatGPT via n8n workflow`;
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
    ipcMain.removeAllListeners('service-calls:fix-statuses');
    ipcMain.removeAllListeners('work-logs:create');
    ipcMain.removeAllListeners('work-logs:get-by-call-id');
    ipcMain.removeAllListeners('work-logs:update');
    ipcMain.removeAllListeners('work-logs:delete');
    ipcMain.removeAllListeners('parts:analyze-chatgpt');

    // Close database
    await databaseService.close();

    console.log('CallService shut down');
  }
}

// Export singleton instance
export const callService = new CallService(); 