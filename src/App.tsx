import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { SettingsProvider } from '@/context/SettingsProvider';
import { ProjectProvider } from '@/context/ProjectProvider';
import { AppShell } from '@/components/layout/AppShell';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { JournalScreen } from '@/features/journal/JournalScreen';
import { ExploreScreen } from '@/features/explore/ExploreScreen';
import { StatsScreen } from '@/features/stats/StatsScreen';
import { StatsDetailScreen } from '@/features/stats/StatsDetailScreen';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { PrideOverlay } from '@/pride-theme'; // PRIDE THEME (temporary) — see src/pride-theme.tsx

function Protected() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-full place-items-center text-text-muted">Loading…</div>
    );
  }
  if (!session) return <LoginScreen />;

  return (
    <SettingsProvider>
      <ProjectProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/journal" element={<JournalScreen />} />
            <Route path="/explore" element={<ExploreScreen />} />
            <Route path="/stats" element={<StatsScreen />} />
            <Route path="/stats/:category" element={<StatsDetailScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            <Route path="/settings" element={<Navigate to="/profile" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/journal" replace />} />
        </Routes>
      </ProjectProvider>
      <PrideOverlay /> {/* PRIDE THEME (temporary) — see src/pride-theme.tsx */}
    </SettingsProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <Protected />
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  );
}
