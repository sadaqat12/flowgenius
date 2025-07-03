import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Phone, Plus, FileText, Settings } from 'lucide-react';
import { useElectronAPI } from '../../hooks/use-electron-api';
import { ServiceCall } from '../../../shared/types/ipc';

interface MainLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Service Calls', href: '/calls', icon: Phone, showStaleCallsBadge: true },
  { name: 'New Call', href: '/calls/new', icon: Plus },
  { name: 'Daily Sheet', href: '/daily-sheet', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const { electronAPI } = useElectronAPI();
  const [staleCalls, setStaleCalls] = useState<ServiceCall[]>([]);

  // Check for stale calls periodically
  useEffect(() => {
    const checkForStaleCalls = async () => {
      if (!electronAPI) return;

      try {
        const stale = await electronAPI.workflows.checkStaleCalls();
        setStaleCalls(stale);
      } catch (error) {
        console.error('Error checking stale calls in navigation:', error);
      }
    };

    checkForStaleCalls();

    // Check every 10 minutes
    const interval = setInterval(checkForStaleCalls, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [electronAPI]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-card border-r">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-foreground">
              Service Call Manager
            </h1>
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                const showBadge = item.showStaleCallsBadge && staleCalls.length > 0;

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground'
                      }`}
                    />
                    <span className="flex-1">{item.name}</span>
                    {showBadge && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {staleCalls.length}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
