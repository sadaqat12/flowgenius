import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import DashboardPage from './pages/dashboard-page';
import CallsPage from './pages/calls-page';
import NewCallPage from './pages/new-call-page';
import ServiceCallDetailsPage from './pages/service-call-details-page';
import DailySheetPage from './pages/daily-sheet-page';
import SettingsPage from './pages/settings-page';
import MainLayout from './components/layout/main-layout';

function App() {
  const [appVersion, setAppVersion] = useState<string>('');

  useEffect(() => {
    const getVersion = async () => {
      try {
        const version = await window.electronAPI.getAppVersion();
        setAppVersion(version);
      } catch (error) {
        console.error('Failed to get app version:', error);
      }
    };

    getVersion();
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/calls" element={<CallsPage />} />
            <Route path="/calls/new" element={<NewCallPage />} />
            <Route path="/calls/:id" element={<ServiceCallDetailsPage />} />
            <Route path="/daily-sheet" element={<DailySheetPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </MainLayout>
      </Router>

      {/* Development info */}
      {appVersion && (
        <div className="fixed bottom-2 right-2 text-xs text-muted-foreground">
          v{appVersion}
        </div>
      )}
    </div>
  );
}

export default App;
