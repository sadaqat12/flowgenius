import React, { useState } from 'react';
import { PartsTestPanel } from '../components/features/parts-test/parts-test-panel';
import { Button } from '../components/ui/button';
import { useElectronAPI } from '../hooks/use-electron-api';

function SettingsPage() {
  const { electronAPI } = useElectronAPI();
  const [isFixingStatuses, setIsFixingStatuses] = useState(false);
  const [fixResult, setFixResult] = useState<{ updated: number; errors: number } | null>(null);

  const handleFixStatuses = async () => {
    if (!electronAPI) return;

    setIsFixingStatuses(true);
    setFixResult(null);

    try {
      const result = await electronAPI.serviceCalls.fixStatuses();
      setFixResult(result);
      
      if (result.updated > 0) {
        alert(`Successfully updated ${result.updated} service call statuses!`);
      } else {
        alert('All service call statuses are already correct!');
      }
    } catch (error) {
      console.error('Error fixing statuses:', error);
      alert('Failed to fix service call statuses. Please try again.');
    } finally {
      setIsFixingStatuses(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your Service Call Manager preferences and maintain your data.
        </p>
      </div>

      {/* Database Maintenance Section */}
      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Database Maintenance</h2>
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Fix Service Call Statuses</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Automatically corrects service call statuses based on scheduled times. 
                This will update calls to the appropriate status:
              </p>
              <ul className="text-sm text-muted-foreground mb-4 ml-4 space-y-1">
                <li>• <strong>New:</strong> Calls without scheduled times</li>
                <li>• <strong>Scheduled:</strong> Calls with future scheduled times</li>
                <li>• <strong>InProgress:</strong> Calls scheduled for today or past due</li>
                <li>• <strong>OnHold/Completed:</strong> Manually set statuses are preserved</li>
              </ul>
              <Button 
                onClick={handleFixStatuses}
                disabled={isFixingStatuses}
                className="w-fit"
              >
                {isFixingStatuses ? 'Fixing Statuses...' : 'Fix Service Call Statuses'}
              </Button>
              
              {fixResult && (
                <div className="mt-3 p-3 bg-muted rounded-md">
                  <p className="text-sm">
                    <strong>Result:</strong> Updated {fixResult.updated} calls
                    {fixResult.errors > 0 && `, ${fixResult.errors} errors`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Parts Testing Section */}
      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Parts Analysis Testing</h2>
          <PartsTestPanel />
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
