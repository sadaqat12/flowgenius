import { useState, useEffect, useCallback } from 'react';
import type { WorkLog, WorkLogCreateData, WorkLogUpdateData } from '../../shared/types/ipc';
import { useElectronAPI } from './use-electron-api';

export function useWorkLogs(callId?: string) {
  const { electronAPI, isReady: apiReady, error: apiError } = useElectronAPI();
  
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch work logs for a specific call
  const fetchWorkLogs = useCallback(async (targetCallId?: string) => {
    if (!electronAPI) return;
    
    const idToFetch = targetCallId || callId;
    if (!idToFetch) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const logs = await electronAPI.workLogs.getByCallId(idToFetch);
      setWorkLogs(logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch work logs');
      console.error('Error fetching work logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [electronAPI, callId]);

  // Create a new work log
  const createWorkLog = useCallback(async (data: WorkLogCreateData): Promise<WorkLog | null> => {
    if (!electronAPI) return null;
    
    try {
      setError(null);
      const newLog = await electronAPI.workLogs.create(data);
      setWorkLogs(prev => [newLog, ...prev]);
      return newLog;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create work log');
      console.error('Error creating work log:', err);
      return null;
    }
  }, [electronAPI]);

  // Update a work log
  const updateWorkLog = useCallback(async (id: string, data: WorkLogUpdateData): Promise<WorkLog | null> => {
    if (!electronAPI) return null;
    
    try {
      setError(null);
      const updatedLog = await electronAPI.workLogs.update(id, data);
      setWorkLogs(prev => 
        prev.map(log => log.id === id ? updatedLog : log)
      );
      return updatedLog;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update work log');
      console.error('Error updating work log:', err);
      return null;
    }
  }, [electronAPI]);

  // Delete a work log
  const deleteWorkLog = useCallback(async (id: string): Promise<boolean> => {
    if (!electronAPI) return false;
    
    try {
      setError(null);
      const success = await electronAPI.workLogs.delete(id);
      if (success) {
        setWorkLogs(prev => prev.filter(log => log.id !== id));
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete work log');
      console.error('Error deleting work log:', err);
      return false;
    }
  }, [electronAPI]);

  // Refresh work logs
  const refresh = useCallback(async () => {
    await fetchWorkLogs();
  }, [fetchWorkLogs]);

  // Load initial data
  useEffect(() => {
    // Set API error if there's one
    if (apiError) {
      setError(apiError);
      setIsLoading(false);
      return;
    }
    
    // Wait for API to be ready
    if (!apiReady) {
      return;
    }
    
    // If API is ready but electronAPI is null, show error
    if (!electronAPI) {
      setError('ElectronAPI not available. Please restart the application.');
      setIsLoading(false);
      return;
    }
    
    // API is ready and we have a call ID, load data
    if (callId) {
      fetchWorkLogs();
    } else {
      setIsLoading(false);
    }
  }, [apiReady, apiError, electronAPI, callId, fetchWorkLogs]);

  return {
    // Data
    workLogs,
    isLoading,
    error,

    // Actions
    createWorkLog,
    updateWorkLog,
    deleteWorkLog,
    fetchWorkLogs,
    refresh,

    // Utilities
    clearError: () => setError(null),
  };
} 