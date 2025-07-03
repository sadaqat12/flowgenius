import { useState, useEffect, useCallback } from 'react';
import type { ServiceCall, ServiceCallCreateData, ServiceCallUpdateData, ServiceCallStats } from '../../shared/types/ipc';
import { useElectronAPI } from './use-electron-api';

export function useServiceCalls() {
  const { electronAPI, isReady: apiReady, error: apiError } = useElectronAPI();
  
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);
  const [stats, setStats] = useState<ServiceCallStats>({
    total: 0,
    new: 0,
    scheduled: 0,
    inProgress: 0,
    onHold: 0,
    completed: 0,
    todaysTotal: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all service calls
  const fetchServiceCalls = useCallback(async () => {
    if (!electronAPI) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const calls = await electronAPI.serviceCalls.getAll();
      setServiceCalls(calls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service calls');
      console.error('Error fetching service calls:', err);
    } finally {
      setIsLoading(false);
    }
  }, [electronAPI]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!electronAPI) return;
    
    try {
      const newStats = await electronAPI.serviceCalls.getStats();
      setStats(newStats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [electronAPI]);

  // Create a new service call
  const createServiceCall = useCallback(async (data: ServiceCallCreateData): Promise<ServiceCall | null> => {
    if (!electronAPI) return null;
    
    try {
      setError(null);
      const newCall = await electronAPI.serviceCalls.create(data);
      setServiceCalls(prev => [newCall, ...prev]);
      await fetchStats(); // Refresh stats
      return newCall;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service call');
      console.error('Error creating service call:', err);
      return null;
    }
  }, [electronAPI, fetchStats]);

  // Update a service call
  const updateServiceCall = useCallback(async (id: string, data: ServiceCallUpdateData): Promise<ServiceCall | null> => {
    if (!electronAPI) return null;
    
    try {
      setError(null);
      const updatedCall = await electronAPI.serviceCalls.update(id, data);
      setServiceCalls(prev => 
        prev.map(call => call.id === id ? updatedCall : call)
      );
      await fetchStats(); // Refresh stats
      return updatedCall;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service call');
      console.error('Error updating service call:', err);
      return null;
    }
  }, [electronAPI, fetchStats]);

  // Delete a service call
  const deleteServiceCall = useCallback(async (id: string): Promise<boolean> => {
    if (!electronAPI) return false;
    
    try {
      setError(null);
      const success = await electronAPI.serviceCalls.delete(id);
      if (success) {
        setServiceCalls(prev => prev.filter(call => call.id !== id));
        await fetchStats(); // Refresh stats
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service call');
      console.error('Error deleting service call:', err);
      return false;
    }
  }, [electronAPI, fetchStats]);

  // Get a specific service call by ID
  const getServiceCallById = useCallback(async (id: string): Promise<ServiceCall | null> => {
    // Use direct window access to avoid stale closure values
    let currentAPI = window.electronAPI;
    
    // Wait for API to become available if it's not ready
    if (!currentAPI) {
      let attempts = 0;
      while (attempts < 20 && !currentAPI) { // Increased attempts
        await new Promise(resolve => setTimeout(resolve, 100));
        currentAPI = window.electronAPI; // Re-check each time
        attempts++;
      }
      
      if (!currentAPI) {
        return null;
      }
    }
    
    try {
      return await currentAPI.serviceCalls.getById(id);
    } catch (err) {
      console.error('Error fetching service call by ID:', id, err);
      return null;
    }
  }, []); // Empty dependency array since we're using direct window access

  // Get today's calls for daily sheet
  const getTodaysCalls = useCallback(async (): Promise<ServiceCall[]> => {
    if (!electronAPI) return [];
    
    try {
      return await electronAPI.serviceCalls.getTodaysCalls();
    } catch (err) {
      console.error('Error fetching today\'s calls:', err);
      return [];
    }
  }, [electronAPI]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([fetchServiceCalls(), fetchStats()]);
  }, [fetchServiceCalls, fetchStats]);

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
    
    // API is ready, load data
    refresh();
  }, [apiReady, apiError, electronAPI, refresh]);

  return {
    // Data
    serviceCalls,
    stats,
    isLoading,
    error,

    // Actions
    createServiceCall,
    updateServiceCall,
    deleteServiceCall,
    getServiceCallById,
    getTodaysCalls,
    refresh,

    // Utilities
    clearError: () => setError(null),
  };
} 