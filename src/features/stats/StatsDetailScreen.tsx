import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, UtensilsCrossed, Wine, Ticket, ShoppingBag, Construction } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProject } from '@/context/ProjectProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/format';
import { BeveragesDetail } from './BeveragesDetail';

export const STATS_CATEGORIES: { slug: string; label: string; icon: LucideIcon; ready: boolean }[] = [
  { slug: 'venues', label: 'Venues', icon: UtensilsCrossed, ready: false },
  { slug: 'beverages', label: 'Beverages', icon: Wine, ready: true },
  { slug: 'activity', label: 'Activity', icon: Ticket, ready: false },
  { slug: 'purchases', label: 'Purchases', icon: ShoppingBag, ready: false },
];

export function StatsDetailScreen() {
  const { category } = useParams<{ category: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { project, isEverything, viewProjectId, settings } = useProject();

  const meta = STATS_CATEGORIES.find((c) => c.slug === category);
  const from = params.get('from') || undefined;
  const to = params.get('to') || undefined;

  const scope = isEverything ? 'Everything' : project?.name ?? '';
  const range =
    from && to
      ? `${formatDate(from, settings.date_format)} – ${formatDate(to, settings.date_format)}`
      : 'All time';

  return (
    <div className="space-y-5">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-2 flex items-center gap-1 text-sm font-medium text-primary"
        >
          <ArrowLeft size={16} /> Stats
        </button>
        <p className="text-sm text-text-muted">
          {scope} · {range}
        </p>
        <h2 className="font-serif text-xl font-semibold">{meta?.label ?? 'Stats'}</h2>
      </div>

      {viewProjectId === undefined ? (
        <p className="py-8 text-center text-sm text-text-muted">Loading…</p>
      ) : meta?.slug === 'beverages' ? (
        <BeveragesDetail projectId={viewProjectId} from={from} to={to} />
      ) : (
        <EmptyState
          icon={Construction}
          title={`${meta?.label ?? 'This'} stats are coming soon`}
          subtitle="We started with Beverages. This deep-dive is next on the list."
        />
      )}
    </div>
  );
}
