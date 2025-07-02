import { useState, useEffect } from 'react';
import type { ElectronAPI } from '../../shared/types/ipc';

export function useElectronAPI(): {
  electronAPI: ElectronAPI | null;
  isReady: boolean;
  error: string | null;
} {
  const [electronAPI, setElectronAPI] = useState<ElectronAPI | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if electronAPI is available immediately
    if (window.electronAPI) {
      setElectronAPI(window.electronAPI);
      setIsReady(true);
      return;
    }

    // If not available immediately, wait for it
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds total
    
    const checkAPI = () => {
      attempts++;
      
      if (window.electronAPI) {
        setElectronAPI(window.electronAPI);
        setIsReady(true);
        return;
      }

      if (attempts >= maxAttempts) {
        const errorMsg = 'ElectronAPI not available after 5 seconds. Please restart the application.';
        console.error('ElectronAPI timeout:', errorMsg);
        setError(errorMsg);
        setIsReady(true);
        return;
      }

      // Try again in 100ms
      setTimeout(checkAPI, 100);
    };

    // Start checking
    setTimeout(checkAPI, 100);
  }, []);

  return { electronAPI, isReady, error };
} 