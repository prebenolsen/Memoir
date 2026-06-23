import { NavLink } from 'react-router-dom';
import { NotebookPen, Compass, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/cn';

const tabs = [
  { to: '/today', label: 'Journal', icon: NotebookPen },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
];

export function BottomNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition',
                isActive ? 'text-primary' : 'text-text-muted hover:text-text',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} className={isActive ? 'fill-primary/10' : ''} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
