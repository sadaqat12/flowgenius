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

      // Generate minimal HTML content for PDF
      console.log('Generating HTML content...');
      const htmlContent = this.generateSimplePDFHTML(data);
      console.log('HTML content length:', htmlContent.length, 'characters');
      
      // Create a hidden window for PDF generation
      console.log('Creating print window...');
      printWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false, // Hidden for production use
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
      }, 15000); // Reduced to 15 seconds total

      try {
        // Use simple data URL approach - faster than file loading
        console.log('Using data URL approach...');
        const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
        
        console.log('Loading data URL...');
        await printWindow.loadURL(dataUrl);

        // Simple wait since data URLs load immediately
        console.log('Waiting for page to render...');
        await new Promise((resolve) => {
          // Check if already loaded
          if (!printWindow!.webContents.isLoading()) {
            console.log('Page already loaded, proceeding immediately');
            setTimeout(resolve, 100); // Very brief wait for rendering
            return;
          }
          
          // Otherwise wait for load event or timeout
          const loadTimeout = setTimeout(() => {
            console.log('Using timeout fallback - page should be ready');
            resolve(true);
          }, 1000); // 1 second fallback

          printWindow!.webContents.once('did-finish-load', () => {
            console.log('Load event fired');
            clearTimeout(loadTimeout);
            setTimeout(resolve, 100);
          });

          printWindow!.webContents.once('dom-ready', () => {
            console.log('DOM ready event fired');
            clearTimeout(loadTimeout);
            setTimeout(resolve, 100);
          });
        });

        console.log('Generating PDF...');
        // Generate PDF with simple settings for speed
        const pdfBuffer = await printWindow.webContents.printToPDF({
          pageSize: 'A4',
          printBackground: false, // Faster without backgrounds
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

    // Ultra-simple escape
    const escape = (text: string) => text ? String(text).replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

    let callsText = '';
    if (calls.length === 0) {
      callsText = '<p>No service calls scheduled.</p>';
    } else {
      for (let i = 0; i < calls.length; i++) {
        const call = calls[i];
        callsText += `
          <div style="border:1px solid black;margin:10px;padding:10px;">
            <h3>${i + 1}. ${escape(call.customerName)}</h3>
            <p>Phone: ${escape(call.phone)}</p>
            <p>Address: ${escape(call.address)}</p>
            <p>Type: ${escape(call.callType)} - Status: ${escape(call.status)}</p>
            <p>Problem: ${escape(call.problemDesc)}</p>
        `;

        // Add AI Analysis if exists
        if (call.likelyProblem || call.suggestedParts?.length || call.aiAnalysisResult) {
          callsText += '<h4>AI Analysis:</h4>';
          
          if (call.likelyProblem) {
            callsText += `<p>Problem: ${escape(call.likelyProblem)}</p>`;
          }
          
          if (call.aiAnalysisResult?.appliance) {
            callsText += `<p>Appliance: ${escape(call.aiAnalysisResult.appliance)}`;
            if (call.aiAnalysisResult.urgency) {
              callsText += ` - Urgency: ${escape(call.aiAnalysisResult.urgency)}`;
            }
            callsText += '</p>';
          }
          
          // Parts
          if (call.aiAnalysisResult?.recommendedParts?.length) {
            callsText += '<p>Parts: ';
            for (let j = 0; j < call.aiAnalysisResult.recommendedParts.length; j++) {
              const part = call.aiAnalysisResult.recommendedParts[j];
              if (j > 0) callsText += ', ';
              callsText += `${escape(part.name)} ($${part.price})`;
            }
            callsText += '</p>';
          } else if (call.suggestedParts?.length) {
            callsText += '<p>Parts: ';
            for (let j = 0; j < call.suggestedParts.length; j++) {
              if (j > 0) callsText += ', ';
              callsText += escape(call.suggestedParts[j]);
            }
            callsText += '</p>';
          }
        }

        callsText += `
            <hr>
            <p>Work Done: ___________________________</p>
            <p>Parts Used: __________________________</p>
            <p>Time: Start: _______ End: _______</p>
          </div>
        `;
      }
    }

    return `<!DOCTYPE html>
<html>
<head>
<title>${escape(title)}</title>
</head>
<body>
<h1>Daily Service Sheet</h1>
<h2>${escape(formattedDate)}</h2>
<p>${calls.length} calls</p>
${callsText}
<p>Generated: ${escape(generatedTime)}</p>
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