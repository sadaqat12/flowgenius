import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Phone, MapPin, RefreshCw } from 'lucide-react';
import { useServiceCalls } from '../hooks/use-service-calls';
import { useElectronAPI } from '../hooks/use-electron-api';
import { format } from 'date-fns';
import { ServiceCall } from '../../shared/types/ipc';

function DashboardPage() {
  const { stats, serviceCalls, isLoading, error } = useServiceCalls();
  const { electronAPI } = useElectronAPI();
  const [staleCalls, setStaleCalls] = useState<ServiceCall[]>([]);
  const [isCheckingStale, setIsCheckingStale] = useState(false);

  // Get recent calls (last 5)
  const recentCalls = serviceCalls.slice(0, 5);

  // Check for stale calls on component mount
  useEffect(() => {
    checkForStaleCalls();
  }, [electronAPI]);

  const checkForStaleCalls = async () => {
    if (!electronAPI) return;

    try {
      setIsCheckingStale(true);
      const stale = await electronAPI.workflows.checkStaleCalls();
      setStaleCalls(stale);
      console.log('Stale calls found:', stale);
    } catch (error) {
      console.error('Error checking stale calls:', error);
    } finally {
      setIsCheckingStale(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-red-500 mt-2">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to Service Call Manager - your central hub for managing
          service calls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Calls */}
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-primary/10 rounded-lg">
              <div className="w-6 h-6 bg-primary rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-muted-foreground">Total Calls</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        {/* New Calls */}
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <div className="w-6 h-6 bg-yellow-500 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-muted-foreground">New Calls</p>
              <p className="text-2xl font-bold">{stats.new}</p>
            </div>
          </div>
        </div>

        {/* Scheduled */}
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <div className="w-6 h-6 bg-purple-500 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold">{stats.scheduled}</p>
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <div className="w-6 h-6 bg-blue-500 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <div className="w-6 h-6 bg-green-500 rounded"></div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stale Calls Widget */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Stale Calls</h2>
          </div>
          <button
            onClick={checkForStaleCalls}
            disabled={isCheckingStale}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {isCheckingStale ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                Refresh
              </>
            )}
          </button>
        </div>
        
        {staleCalls.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-red-600 mb-3">
              {staleCalls.length} call{staleCalls.length > 1 ? 's' : ''} need immediate attention
            </p>
            {staleCalls.slice(0, 3).map((call) => (
              <div key={call.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">{call.customerName}</p>
                    <p className="text-sm text-red-600">{call.address}</p>
                    <p className="text-xs text-red-500">
                      {call.status} • Last updated: {format(new Date(call.updatedAt), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/calls/${call.id}`}
                  className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                >
                  View
                </Link>
              </div>
            ))}
            {staleCalls.length > 3 && (
              <p className="text-sm text-muted-foreground text-center">
                and {staleCalls.length - 3} more... 
                <Link to="/calls" className="text-blue-600 hover:underline ml-1">
                  View all calls
                </Link>
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p>No stale calls found</p>
            <p className="text-sm">All calls are up to date</p>
          </div>
        )}
      </div>

      {/* Recent Calls */}
      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Service Calls</h2>
          {recentCalls.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No service calls yet.</p>
              <p className="text-sm mt-2">
                Create your first service call to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{call.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {call.address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {call.problemDesc}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          call.status === 'New'
                            ? 'bg-yellow-100 text-yellow-800'
                            : call.status === 'Scheduled'
                            ? 'bg-purple-100 text-purple-800'
                            : call.status === 'InProgress'
                            ? 'bg-blue-100 text-blue-800'
                            : call.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : call.status === 'OnHold'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {call.status}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {call.callType}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(call.createdAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
