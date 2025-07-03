import { ipcMain, dialog, BrowserWindow, app } from 'electron';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { format } from 'date-fns';
import { tmpdir } from 'os';
import { IPC_CHANNELS } from '../../shared/types/ipc';
import type { PDFExportData, SaveDialogOptions, ServiceCall } from '../../shared/types/ipc';

export class PDFService {
  async initialize(): Promise<void> {
    this.registerIPCHandlers();
    console.log('PDFService initialized successfully');
  }

  private registerIPCHandlers(): void {
    // Export PDF handler
    ipcMain.handle(IPC_CHANNELS.EXPORT_PDF, async (event, data: PDFExportData) => {
      return this.exportToPDF(event.sender, data);
    });

    // Show save dialog handler
    ipcMain.handle(IPC_CHANNELS.SHOW_SAVE_DIALOG, async (event, options: SaveDialogOptions) => {
      return this.showSaveDialog(options);
    });

    console.log('PDF service IPC handlers registered');
  }

  private async exportToPDF(webContents: Electron.WebContents, data: PDFExportData): Promise<string> {
    let printWindow: BrowserWindow | null = null;
    let filePath: string | undefined;
    let tempFilePath: string | undefined;
    
    try {
      console.log('Starting PDF export process...');
      console.log('Data received:', { date: data.date, callsCount: data.calls.length, title: data.title });

      // Show save dialog first
      const dateStr = format(data.date, 'yyyy-MM-dd');
      const defaultFilename = `daily-service-sheet-${dateStr}.pdf`;
      
      console.log('Showing save dialog...');
      const result = await dialog.showSaveDialog({
        title: 'Save Daily Service Sheet',
        defaultPath: defaultFilename,
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      filePath = result.filePath;
      if (!filePath) {
        console.log('User cancelled save dialog');
        throw new Error('Save operation cancelled');
      }

      console.log('Save path selected:', filePath);

      // Generate high-quality HTML content for PDF
      console.log('Generating HTML content...');
      const htmlContent = this.generateSimplePDFHTML(data);
      
      // Create a hidden window for PDF generation
      console.log('Creating print window...');
      printWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false, // Set to true for debugging
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false, // Allow local content
          allowRunningInsecureContent: true,
        },
      });

      // Add timeout to prevent hanging
      const mainTimeout = setTimeout(() => {
        console.error('PDF generation timeout');
        if (printWindow && !printWindow.isDestroyed()) {
          printWindow.close();
        }
        throw new Error('PDF generation timeout');
      }, 30000);

      try {
        // Use temporary file approach for better reliability with complex HTML
        console.log('Using temporary file approach...');
        tempFilePath = join(tmpdir(), `daily-sheet-${Date.now()}.html`);
        
        // Write HTML to temporary file
        await writeFile(tempFilePath, htmlContent, 'utf8');
        console.log('Temporary HTML file created:', tempFilePath);
        
        // Load the temporary file
        await printWindow.loadFile(tempFilePath);

        // Wait for content to load with improved timeout handling
        console.log('Waiting for page to finish loading...');
        await new Promise((resolve, reject) => {
          const loadTimeout = setTimeout(() => {
            console.error('Page load timeout - will try fallback');
            reject(new Error('Page load timeout'));
          }, 25000); // Increased to 25 seconds

          // Wait for both DOM and all resources to load
          let domLoaded = false;
          let resourcesLoaded = false;

          const checkComplete = () => {
            if (domLoaded && resourcesLoaded) {
              clearTimeout(loadTimeout);
              console.log('Page finished loading successfully');
              resolve(true);
            }
          };

          printWindow!.webContents.once('did-finish-load', () => {
            console.log('DOM finished loading');
            domLoaded = true;
            
            // Give a moment for any remaining resources
            setTimeout(() => {
              resourcesLoaded = true;
              checkComplete();
            }, 2000);
          });

          printWindow!.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
            clearTimeout(loadTimeout);
            console.error('Page failed to load:', errorCode, errorDescription);
            reject(new Error(`Page failed to load: ${errorDescription} (${errorCode})`));
          });
        });

        console.log('Generating PDF...');
        // Generate PDF with optimized settings
        const pdfBuffer = await printWindow.webContents.printToPDF({
          pageSize: 'A4',
          printBackground: true,
          margins: {
            top: 0.5,
            bottom: 0.5,
            left: 0.5,
            right: 0.5
          }
        });

        clearTimeout(mainTimeout);
        console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');

        // Write PDF to file
        console.log('Writing PDF to file...');
        await writeFile(filePath, pdfBuffer);
        
        console.log('PDF export completed successfully');
        return filePath;

            } catch (error) {
        clearTimeout(mainTimeout);
        console.error('PDF generation failed:', error);
        throw error;
      }
    } finally {
      // Always close the print window
      if (printWindow && !printWindow.isDestroyed()) {
        console.log('Closing print window...');
        printWindow.close();
      }
      
      // Clean up temporary file if it exists
      if (tempFilePath) {
        try {
          await unlink(tempFilePath);
          console.log('Temporary file cleaned up in finally block');
        } catch (cleanupError) {
          console.warn('Failed to clean up temporary file in finally block:', cleanupError);
        }
      }
    }
  }

  private async showSaveDialog(options: SaveDialogOptions): Promise<string | null> {
    try {
      const { filePath } = await dialog.showSaveDialog(options);
      return filePath || null;
    } catch (error) {
      console.error('Error showing save dialog:', error);
      return null;
    }
  }

  private generateSimplePDFHTML(data: PDFExportData): string {
    const { date, calls, title } = data;
    
    const formattedDate = format(date, 'EEEE, MMMM d, yyyy');
    const generatedTime = format(new Date(), 'MMM d, yyyy h:mm a');

    // Escape HTML to prevent issues
    const escapeHtml = (text: string) => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    // Helper function to generate AI analysis section
    const generateAIAnalysisSection = (call: any) => {
      const hasAIAnalysis = call.aiAnalysisResult || call.likelyProblem || (call.suggestedParts && call.suggestedParts.length > 0);
      
      if (!hasAIAnalysis) return '';

      let aiSection = `
        <div style="border-top: 1px solid #ccc; margin-top: 15px; padding-top: 15px; margin-bottom: 15px;">
          <div style="font-weight: bold; margin-bottom: 10px;">🤖 AI Parts Analysis</div>
      `;

      // Likely Problem
      if (call.likelyProblem) {
        aiSection += `
          <div style="margin-bottom: 10px;">
            <div style="font-weight: bold; font-size: 10pt; margin-bottom: 3px;">Likely Problem:</div>
            <div style="background: #f0f8ff; padding: 8px; border-radius: 3px; font-size: 10pt;">${escapeHtml(call.likelyProblem)}</div>
          </div>
        `;
      }

      // Appliance Details
      if (call.aiAnalysisResult) {
        const result = call.aiAnalysisResult;
        const hasDetails = result.appliance || result.brand || result.urgency || result.estimatedDuration;
        
        if (hasDetails) {
          aiSection += `
            <div style="margin-bottom: 10px;">
              <div style="font-weight: bold; font-size: 10pt; margin-bottom: 3px;">Appliance Details:</div>
              <div style="background: #f5f5f5; padding: 8px; border-radius: 3px; font-size: 10pt;">
          `;
          
          if (result.appliance) {
            aiSection += `<strong>Type:</strong> ${escapeHtml(result.appliance)}<br/>`;
          }
          if (result.brand) {
            aiSection += `<strong>Brand:</strong> ${escapeHtml(result.brand)}<br/>`;
          }
          if (result.urgency) {
            aiSection += `<strong>Urgency:</strong> ${escapeHtml(result.urgency)}<br/>`;
          }
          if (result.estimatedDuration) {
            aiSection += `<strong>Est. Duration:</strong> ${escapeHtml(result.estimatedDuration)}`;
          }
          
          aiSection += `
              </div>
            </div>
          `;
        }
      }

      // Recommended Parts
      const hasRecommendedParts = (call.aiAnalysisResult && call.aiAnalysisResult.recommendedParts && call.aiAnalysisResult.recommendedParts.length > 0) || 
                                  (call.suggestedParts && call.suggestedParts.length > 0);
      
      if (hasRecommendedParts) {
        aiSection += `
          <div style="margin-bottom: 10px;">
            <div style="font-weight: bold; font-size: 10pt; margin-bottom: 3px;">Recommended Parts:</div>
            <div style="background: #f0fff0; padding: 8px; border-radius: 3px; font-size: 10pt;">
        `;
        
        if (call.aiAnalysisResult && call.aiAnalysisResult.recommendedParts && call.aiAnalysisResult.recommendedParts.length > 0) {
          for (const part of call.aiAnalysisResult.recommendedParts) {
            aiSection += `
              <strong>${escapeHtml(part.name || '')}</strong> (${escapeHtml(part.partNumber || '')})<br/>
              <span style="font-size: 9pt; color: #666;">${escapeHtml(part.category || '')} • Priority: ${escapeHtml(part.priority || '')} • $${part.price || '0'}</span><br/>
            `;
            if (part.description) {
              aiSection += `<span style="font-size: 9pt; color: #666;">${escapeHtml(part.description)}</span><br/>`;
            }
          }
        } else if (call.suggestedParts && call.suggestedParts.length > 0) {
          for (const part of call.suggestedParts) {
            aiSection += `• ${escapeHtml(part)}<br/>`;
          }
        }
        
        aiSection += `
            </div>
          </div>
        `;
      }

      // Analysis Notes
      if (call.aiAnalysisResult && call.aiAnalysisResult.analysisNotes && call.aiAnalysisResult.analysisNotes.length > 0) {
        aiSection += `
          <div style="margin-bottom: 10px;">
            <div style="font-weight: bold; font-size: 10pt; margin-bottom: 3px;">Analysis Notes:</div>
            <div style="background: #fff9e6; padding: 8px; border-radius: 3px; font-size: 10pt;">
        `;
        
        for (const note of call.aiAnalysisResult.analysisNotes) {
          aiSection += `• ${escapeHtml(note)}<br/>`;
        }
        
        aiSection += `
            </div>
          </div>
        `;
      }

      // Confidence Score
      if (call.aiAnalysisResult && call.aiAnalysisResult.confidence) {
        const confidence = Math.round(call.aiAnalysisResult.confidence * 100);
        aiSection += `
          <div style="font-size: 9pt; color: #666; margin-top: 5px;">
            Analysis Confidence: ${confidence}%
          </div>
        `;
      }

      aiSection += `
        </div>
      `;

      return aiSection;
    };

    const callsHtml = calls.length === 0 
      ? '<div style="text-align: center; padding: 40px;"><p>No service calls scheduled for this date.</p></div>'
      : calls.map((call, index) => {
          const scheduledTime = call.scheduledAt ? format(new Date(call.scheduledAt), 'h:mm a') : 'Not scheduled';
          const createdTime = format(new Date(call.createdAt), 'MMM d, h:mm a');
          
          return `
            <div style="border: 1px solid #ccc; margin-bottom: 20px; padding: 15px; page-break-inside: avoid;">
              <div style="font-size: 14pt; font-weight: bold; margin-bottom: 10px;">
                #${index + 1} - ${escapeHtml(call.customerName)}
              </div>
              <div style="margin-bottom: 5px;"><strong>Phone:</strong> ${escapeHtml(call.phone)}</div>
              <div style="margin-bottom: 5px;"><strong>Address:</strong> ${escapeHtml(call.address)}</div>
              ${call.landlordName ? `<div style="margin-bottom: 5px;"><strong>Landlord:</strong> ${escapeHtml(call.landlordName)}</div>` : ''}
              <div style="margin-bottom: 5px;"><strong>Type:</strong> ${escapeHtml(call.callType)} | <strong>Status:</strong> ${escapeHtml(call.status)}</div>
              <div style="margin-bottom: 5px;"><strong>Scheduled:</strong> ${scheduledTime} | <strong>Created:</strong> ${createdTime}</div>
              <div style="margin-bottom: 15px;"><strong>Problem:</strong> ${escapeHtml(call.problemDesc)}</div>
              
              ${generateAIAnalysisSection(call)}
              
              <div style="border-top: 1px solid #ccc; margin-top: 15px; padding-top: 15px;">
                <div><strong>Work Performed:</strong></div>
                <div style="border: 1px solid #999; height: 50px; margin: 5px 0;"></div>
                <div><strong>Parts Used:</strong></div>
                <div style="border: 1px solid #999; height: 40px; margin: 5px 0;"></div>
                <div><strong>Start Time:</strong> _____________ <strong>End Time:</strong> _____________</div>
              </div>
            </div>
          `;
        }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    body { 
      font-family: Arial, Helvetica, sans-serif; 
      font-size: 12pt; 
      line-height: 1.4;
      margin: 20px; 
      background: white;
      color: black;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      body { margin: 0; }
      @page { 
        margin: 1in; 
        size: A4;
      }
    }
    @page {
      margin: 1in;
      size: A4;
    }
  </style>
</head>
<body>
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid black; padding-bottom: 15px;">
    <h1 style="font-size: 24pt; margin-bottom: 10px;">Daily Service Sheet</h1>
    <h2 style="font-size: 18pt; margin-bottom: 10px;">${escapeHtml(formattedDate)}</h2>
    <p style="font-size: 12pt;">${calls.length} service call${calls.length !== 1 ? 's' : ''}</p>
  </div>
  
  ${callsHtml}
  
  <div style="text-align: center; margin-top: 30px; font-size: 10pt; border-top: 1px solid #ccc; padding-top: 15px;">
    Generated on ${escapeHtml(generatedTime)}
  </div>
</body>
</html>`;
  }

  private generateMinimalHTML(data: PDFExportData): string {
    const { date, calls, title } = data;
    const formattedDate = format(date, 'EEEE, MMMM d, yyyy');
    const generatedTime = format(new Date(), 'MMM d, yyyy h:mm a');
    
    const callsHtml = calls.map((call, index) => 
      `<div style="border:1px solid #333;margin:15px 0;padding:15px;page-break-inside:avoid;">
        <h3 style="margin:0 0 10px 0;font-size:14pt;">#${index + 1} - ${call.customerName}</h3>
        <p style="margin:5px 0;"><strong>Phone:</strong> ${call.phone}</p>
        <p style="margin:5px 0;"><strong>Address:</strong> ${call.address}</p>
        ${call.landlordName ? `<p style="margin:5px 0;"><strong>Landlord:</strong> ${call.landlordName}</p>` : ''}
        <p style="margin:5px 0;"><strong>Type:</strong> ${call.callType} | <strong>Status:</strong> ${call.status}</p>
        <p style="margin:10px 0;"><strong>Problem:</strong> ${call.problemDesc}</p>
        
        ${(call.aiAnalysisResult || call.likelyProblem || call.suggestedParts?.length) ? `
        <div style="margin:15px 0;padding:10px;border:1px solid #ddd;background:#f9f9f9;">
          <p style="margin:0 0 10px 0;font-weight:bold;">🤖 AI Parts Analysis</p>
          
          ${call.likelyProblem ? `
          <p style="margin:5px 0;"><strong>Likely Problem:</strong> ${call.likelyProblem}</p>` : ''}
          
          ${call.aiAnalysisResult && (call.aiAnalysisResult.appliance || call.aiAnalysisResult.brand || call.aiAnalysisResult.urgency) ? `
          <p style="margin:5px 0;"><strong>Appliance:</strong> ${call.aiAnalysisResult.appliance || 'N/A'} | <strong>Brand:</strong> ${call.aiAnalysisResult.brand || 'N/A'} | <strong>Urgency:</strong> ${call.aiAnalysisResult.urgency || 'N/A'}</p>` : ''}
          
          ${(call.aiAnalysisResult?.recommendedParts?.length || call.suggestedParts?.length) ? `
          <p style="margin:5px 0;"><strong>Recommended Parts:</strong></p>
          <div style="margin:5px 0;padding:5px;background:#fff;border-radius:3px;">
            ${call.aiAnalysisResult?.recommendedParts?.length ? 
              call.aiAnalysisResult.recommendedParts.map(part => `• ${part.name} (${part.partNumber}) - $${part.price}`).join('<br/>') :
              call.suggestedParts?.map(part => `• ${part}`).join('<br/>')
            }
          </div>` : ''}
        </div>` : ''}
        
        <hr style="margin:15px 0;"/>
        <div style="margin-top:15px;">
          <p style="margin:5px 0;"><strong>Work Performed:</strong></p>
          <div style="border:1px solid #666;height:40px;margin:5px 0;"></div>
          <p style="margin:5px 0;"><strong>Parts Used:</strong></p>
          <div style="border:1px solid #666;height:30px;margin:5px 0;"></div>
          <p style="margin:10px 0;"><strong>Start Time:</strong> _____________ <strong>End Time:</strong> _____________</p>
        </div>
      </div>`
    ).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { text-align: center; font-size: 24pt; margin-bottom: 10px; }
    h2 { text-align: center; font-size: 18pt; margin-bottom: 20px; }
    @media print { @page { margin: 1in; } }
  </style>
</head>
<body>
  <h1>Daily Service Sheet</h1>
  <h2>${formattedDate}</h2>
  <p style="text-align:center;margin-bottom:30px;">${calls.length} service call${calls.length !== 1 ? 's' : ''}</p>
  ${callsHtml || '<p style="text-align:center;margin:50px 0;">No service calls for this date.</p>'}
  <div style="text-align:center;margin-top:30px;font-size:10pt;border-top:1px solid #ccc;padding-top:15px;">
    Generated on ${generatedTime}
  </div>
</body>
</html>`;
  }

  private generatePDFHTML(data: PDFExportData): string {
    const { date, calls, title } = data;
    
    const formattedDate = format(date, 'EEEE, MMMM d, yyyy');
    const generatedTime = format(new Date(), 'MMM d, yyyy h:mm a');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      font-size: 12pt;
      line-height: 1.4;
      color: #000;
      background: #fff;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    
    .header h1 {
      font-size: 28pt;
      font-weight: bold;
      margin-bottom: 8pt;
    }
    
    .header .date {
      font-size: 18pt;
      color: #666;
      margin-bottom: 8pt;
    }
    
    .header .count {
      font-size: 12pt;
      color: #666;
    }
    
    .call-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
      page-break-inside: avoid;
      background: #fff;
    }
    
    .call-header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 15px;
    }
    
    .call-title {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 8pt;
    }
    
    .call-info {
      font-size: 11pt;
      color: #666;
      margin-bottom: 4pt;
    }
    
    .call-info strong {
      color: #000;
    }
    
    .problem-section {
      margin-bottom: 20px;
    }
    
    .problem-section h4 {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 8pt;
    }
    
    .problem-desc {
      background: #f9f9f9;
      padding: 12pt;
      border-radius: 4px;
      border: 1px solid #e5e5e5;
      font-size: 11pt;
    }
    
    .tech-notes {
      border-top: 1px solid #ddd;
      padding-top: 15px;
    }
    
    .tech-notes h4 {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 12pt;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-label {
      font-size: 10pt;
      font-weight: bold;
      color: #666;
      margin-bottom: 4pt;
      display: block;
    }
    
    .form-field {
      border: 1px solid #999;
      background: #fff;
      width: 100%;
      min-height: 30pt;
      padding: 4pt;
    }
    
    .form-field.large {
      min-height: 60pt;
    }
    
    .form-field.medium {
      min-height: 40pt;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }
    
    .empty-state h3 {
      font-size: 16pt;
      margin-bottom: 8pt;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 10pt;
      color: #666;
    }
    
    @media print {
      @page {
        size: A4;
        margin: 1in;
      }
      
      body {
        padding: 0;
      }
      
      .call-card {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Daily Service Sheet</h1>
    <div class="date">${formattedDate}</div>
    <div class="count">${calls.length} service call${calls.length !== 1 ? 's' : ''} scheduled</div>
  </div>
  
  ${calls.length === 0 ? `
    <div class="empty-state">
      <h3>No service calls scheduled</h3>
      <p>There are no service calls scheduled for ${formattedDate}.</p>
    </div>
  ` : `
    ${calls.map((call, index) => `
      <div class="call-card">
        <div class="call-header">
          <div>
            <div class="call-title">#${index + 1} - ${call.customerName}</div>
            <div class="call-info"><strong>Phone:</strong> ${call.phone}</div>
            <div class="call-info"><strong>Address:</strong> ${call.address}</div>
            ${call.landlordName ? `<div class="call-info"><strong>Landlord:</strong> ${call.landlordName}</div>` : ''}
            <div class="call-info"><strong>Type:</strong> ${call.callType} | <strong>Status:</strong> ${call.status}</div>
          </div>
          <div>
            <div class="call-info"><strong>Scheduled:</strong> ${call.scheduledAt ? format(new Date(call.scheduledAt), 'h:mm a') : 'Not scheduled'}</div>
            <div class="call-info"><strong>Created:</strong> ${format(new Date(call.createdAt), 'MMM d, h:mm a')}</div>
          </div>
        </div>
        
        <div class="problem-section">
          <h4>Problem Description:</h4>
          <div class="problem-desc">${call.problemDesc}</div>
        </div>
        
        <div class="tech-notes">
          <h4>Technician Notes:</h4>
          <div class="form-group">
            <label class="form-label">Work Performed:</label>
            <div class="form-field large"></div>
          </div>
          <div class="form-group">
            <label class="form-label">Parts Used:</label>
            <div class="form-field medium"></div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Time Started:</label>
              <div class="form-field"></div>
            </div>
            <div class="form-group">
              <label class="form-label">Time Completed:</label>
              <div class="form-field"></div>
            </div>
          </div>
        </div>
      </div>
    `).join('')}
  `}
  
  <div class="footer">
    <p>Service Call Manager - Generated on ${generatedTime}</p>
  </div>
</body>
</html>
    `.trim();
  }



  async shutdown(): Promise<void> {
    // Clean up any resources if needed
    console.log('PDFService shut down successfully');
  }
}

export const pdfService = new PDFService(); 