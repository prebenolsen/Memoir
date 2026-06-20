import { Outlet } from 'react-router-dom';
import { ProjectSwitcher } from './ProjectSwitcher';
import { BottomNav } from './BottomNav';
import { QuickAddFab } from './QuickAddFab';
import { SyncBanner } from './SyncBanner';
import { Toaster } from '@/components/ui/Toast';
import { GlobalAddSheets } from '@/features/entries/GlobalAddSheets';

export function AppShell() {
  return (
    <div className="mx-auto min-h-full max-w-md bg-bg">
      <SyncBanner />
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg/90 px-4 py-3 backdrop-blur">
        <h1 className="font-serif text-xl font-semibold text-primary">Memoir</h1>
        <ProjectSwitcher />
      </header>

      <main className="px-4 pb-28 pt-4">
        <Outlet />
      </main>

      <QuickAddFab />
      <BottomNav />
      <GlobalAddSheets />
      <Toaster />
    </div>
  );
}
