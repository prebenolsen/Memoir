import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { User } from 'lucide-react';
import { ProjectSwitcher } from './ProjectSwitcher';
import { BottomNav } from './BottomNav';
import { QuickAddFab } from './QuickAddFab';
import { SyncBanner } from './SyncBanner';
import { Toaster } from '@/components/ui/Toast';
import { GlobalAddSheets } from '@/features/entries/GlobalAddSheets';
import { useFriends } from '@/hooks/useFriends';
import { cn } from '@/lib/cn';

function FriendRequestDot() {
  const { incoming } = useFriends();
  if (!incoming.length) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg bg-accent" />
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  // Project switching is per-day work, so it belongs on the Journal tab only.
  const showProjectSwitcher = pathname === '/today';

  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-bg">
      <SyncBanner />
      <header className="z-30 flex items-center justify-between gap-2 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur">
        <h1 className="font-serif text-xl font-semibold text-primary">Memoir</h1>
        <div className="flex items-center gap-1.5">
          {showProjectSwitcher && <ProjectSwitcher />}
          <NavLink
            to="/profile"
            aria-label="Profile"
            className={({ isActive }) =>
              cn(
                'relative grid h-9 w-9 place-items-center rounded-full border border-border transition',
                isActive ? 'bg-primary text-primary-fg' : 'text-text-muted hover:bg-surface-alt',
              )
            }
          >
            <User size={18} />
            <FriendRequestDot />
          </NavLink>
        </div>
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
