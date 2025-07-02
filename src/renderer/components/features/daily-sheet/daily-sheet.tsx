import { useState, useEffect } from 'react';
import { Calendar, Download, Printer, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../ui/button';
import { useServiceCalls } from '../../../hooks/use-service-calls';
import { useElectronAPI } from '../../../hooks/use-electron-api';
import type { ServiceCall } from '../../../../shared/types/ipc';

interface DailySheetProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export default function DailySheet({ selectedDate = new Date(), onDateChange }: DailySheetProps) {
  const { electronAPI } = useElectronAPI();
  const { serviceCalls } = useServiceCalls();
  const [filteredCalls, setFilteredCalls] = useState<ServiceCall[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Filter calls by selected date
  useEffect(() => {
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const filtered = serviceCalls.filter(call => {
      // Simple logic: Show calls that have ANY connection to the selected date
      let includeCall = false;
      
      // Check if scheduled for this date
      if (call.scheduledAt) {
        const scheduledDate = new Date(call.scheduledAt);
        const isScheduledToday = scheduledDate >= startOfDay && scheduledDate <= endOfDay;
        if (isScheduledToday) {
          includeCall = true;
        }
      } else {
        // If no scheduled date, check if created on this date
        const createdDate = new Date(call.createdAt);
        const isCreatedToday = createdDate >= startOfDay && createdDate <= endOfDay;
        if (isCreatedToday) {
          includeCall = true;
        }
      }
      
      return includeCall;
    });

    // Sort by scheduled time or creation time
    filtered.sort((a, b) => {
      const timeA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : new Date(b.createdAt).getTime();
      return timeA - timeB;
    });

    setFilteredCalls(filtered);
  }, [serviceCalls, selectedDate]);

  // Export to PDF
  const handleExportPDF = async () => {
    if (!electronAPI) {
      console.error('ElectronAPI not available');
      return;
    }

    try {
      setIsExporting(true);

      const filePath = await electronAPI.exportPDF({
        date: selectedDate,
        calls: filteredCalls,
        title: `Daily Service Sheet - ${format(selectedDate, 'MMMM d, yyyy')}`,
      });
      
      if (filePath) {
        alert(`PDF exported successfully!\nSaved to: ${filePath}`);
      } else {
        alert('PDF export was cancelled or failed.');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to export PDF. ';
      if (error instanceof Error) {
        if (error.message.includes('cancelled')) {
          errorMessage = 'PDF export was cancelled.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'PDF export timed out. Please try again.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Please check the console for details.';
      }
      
      alert(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  // Print functionality
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="daily-sheet">
      {/* Header with date and actions - hidden in print */}
      <div className="no-print mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                // Parse date string and create local date to avoid timezone issues
                const dateString = e.target.value; // "2025-07-02"
                const [year, month, day] = dateString.split('-').map(Number);
                const newDate = new Date(year, month - 1, day); // month is 0-indexed
                onDateChange?.(newDate);
              }}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredCalls.length} call{filteredCalls.length !== 1 ? 's' : ''} scheduled
            {serviceCalls.length > 0 && (
              <span className="ml-2 text-xs text-blue-600">
                (of {serviceCalls.length} total calls)
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <FileText className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Printable content */}
      <div className="print:p-0 print:m-0">
        {/* Header for print */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">Daily Service Sheet</h1>
          <p className="text-xl text-center text-muted-foreground mb-4">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
          <div className="text-center text-sm text-muted-foreground">
            {filteredCalls.length} service call{filteredCalls.length !== 1 ? 's' : ''} scheduled
          </div>
        </div>

        {/* Debug information - remove this after fixing */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <h4 className="font-medium mb-2">Debug Info:</h4>
            <p><strong>Selected Date:</strong> {format(selectedDate, 'yyyy-MM-dd')}</p>
            <p><strong>Total Service Calls:</strong> {serviceCalls.length}</p>
            <p><strong>Filtered Calls:</strong> {filteredCalls.length}</p>
            {serviceCalls.length > 0 && (
              <div className="mt-2">
                <p><strong>Sample calls:</strong></p>
                <ul className="list-disc list-inside ml-4 text-xs">
                  {serviceCalls.slice(0, 3).map(call => (
                    <li key={call.id}>
                      {call.customerName} - Created: {format(new Date(call.createdAt), 'yyyy-MM-dd')} 
                      {call.scheduledAt && ` - Scheduled: ${format(new Date(call.scheduledAt), 'yyyy-MM-dd')}`}
                      - Status: {call.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Service calls list */}
        {filteredCalls.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No service calls scheduled</h3>
            <p className="text-muted-foreground">
              There are no service calls scheduled for {format(selectedDate, 'MMMM d, yyyy')}.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCalls.map((call, index) => (
              <div
                key={call.id}
                className="border rounded-lg p-6 bg-card print:border-gray-300 print:shadow-none"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      #{index + 1} - {call.customerName}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Phone:</strong> {call.phone}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Address:</strong> {call.address}
                    </p>
                    {call.landlordName && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Landlord:</strong> {call.landlordName}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      <strong>Type:</strong> {call.callType} | <strong>Status:</strong> {call.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Scheduled:</strong>{' '}
                      {call.scheduledAt 
                        ? format(new Date(call.scheduledAt), 'h:mm a')
                        : 'Not scheduled'
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Created:</strong>{' '}
                      {format(new Date(call.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Problem Description:</h4>
                  <p className="text-sm bg-muted p-3 rounded-md print:bg-gray-50">
                    {call.problemDesc}
                  </p>
                </div>

                {/* Tech notes section for filling out */}
                                 <div className="border-t pt-4 print:border-gray-300">
                   <h4 className="font-medium mb-2">Technician Notes:</h4>
                   <div className="space-y-3">
                     <div>
                       <div className="text-sm font-medium text-muted-foreground mb-1">Work Performed:</div>
                       <div className="mt-1 h-16 border rounded-md print:border-gray-300"></div>
                     </div>
                     <div>
                       <div className="text-sm font-medium text-muted-foreground mb-1">Parts Used:</div>
                       <div className="mt-1 h-12 border rounded-md print:border-gray-300"></div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <div className="text-sm font-medium text-muted-foreground mb-1">Time Started:</div>
                         <div className="mt-1 h-8 border rounded-md print:border-gray-300"></div>
                       </div>
                       <div>
                         <div className="text-sm font-medium text-muted-foreground mb-1">Time Completed:</div>
                         <div className="mt-1 h-8 border rounded-md print:border-gray-300"></div>
                       </div>
                     </div>
                   </div>
                 </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer for print */}
        <div className="mt-12 pt-8 border-t print:border-gray-300 text-center text-sm text-muted-foreground">
          <p>Service Call Manager - Generated on {format(new Date(), 'MMM d, yyyy h:mm a')}</p>
        </div>
      </div>
    </div>
  );
} 