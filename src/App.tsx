import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { SettingsProvider } from '@/context/SettingsProvider';
import { ProjectProvider } from '@/context/ProjectProvider';
import { AppShell } from '@/components/layout/AppShell';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { TodayScreen } from '@/features/today/TodayScreen';
import { FoodScreen } from '@/features/food/FoodScreen';
import { AlcoholScreen } from '@/features/alcohol/AlcoholScreen';
import { ActivitiesScreen } from '@/features/activities/ActivitiesScreen';
import { StatsScreen } from '@/features/stats/StatsScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';

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
            <Route path="/today" element={<TodayScreen />} />
            <Route path="/food" element={<FoodScreen />} />
            <Route path="/alcohol" element={<AlcoholScreen />} />
            <Route path="/activities" element={<ActivitiesScreen />} />
            <Route path="/stats" element={<StatsScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Route>
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </ProjectProvider>
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
