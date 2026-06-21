import { Outlet, useLocation } from 'react-router-dom';
import { ProjectSwitcher } from './ProjectSwitcher';
import { BottomNav } from './BottomNav';
import { QuickAddFab } from './QuickAddFab';
import { SyncBanner } from './SyncBanner';
import { Toaster } from '@/components/ui/Toast';
import { GlobalAddSheets } from '@/features/entries/GlobalAddSheets';

export function AppShell() {
  const { pathname } = useLocation();
  // Project switching belongs on the four main tabs, but not on Stats/Settings.
  const showProjectSwitcher = ['/today', '/food', '/alcohol', '/activities'].includes(pathname);

  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-bg">
      <SyncBanner />
      <header className="z-30 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur">
        <h1 className="font-serif text-xl font-semibold text-primary">Memoir</h1>
        {showProjectSwitcher && <ProjectSwitcher />}
      </header>

      {/* Single, reliable scroll container so scrolling never gets stuck. */}
      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
        <Outlet />
      </main>

      <QuickAddFab />
      <BottomNav />
      <GlobalAddSheets />
      <Toaster />
    </div>
  );
}
