import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  UtensilsCrossed,
  Wine,
  Ticket,
  Wallet,
  ShoppingBag,
  Plus,
  Trash2,
} from 'lucide-react';
import { useProject } from '@/context/ProjectProvider';
import { useProjectStats, type NamedCount, type NamedRating } from '@/hooks/useStats';
import { useEntryMutations } from '@/hooks/useEntryMutations';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useQuickAdd } from '@/lib/quickAdd';
import { supabase } from '@/lib/supabase';
import { Card, SectionTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatMoney, formatDate, titleCase } from '@/lib/format';
import type { ExpenseCategory, PurchaseEntry } from '@/types/db';

function RankList({ rows, kind }: { rows: (NamedCount | NamedRating)[]; kind: 'count' | 'rating' }) {
  if (!rows.length) return <p className="px-4 py-3 text-sm text-text-muted">No data yet.</p>;
  return (
    <div>
      {rows.map((r, i) => (
        <div
          key={r.name + i}
          className="flex items-center justify-between border-t border-border px-4 py-2.5 first:border-t-0"
        >
          <span className="flex items-center gap-2 truncate">
            <span className="text-sm tabular-nums text-text-muted">{i + 1}.</span>
            <span className="truncate text-[15px]">{r.name}</span>
          </span>
          <span className="text-sm font-medium text-accent">
            {kind === 'count'
              ? `${(r as NamedCount).count}×`
              : `${Math.round((r as NamedRating).rating * 10) / 10}/10`}
          </span>
        </div>
      ))}
    </div>
  );
}

function usePurchases(projectId: string | null | undefined, from?: string, to?: string) {
  return useQuery({
    queryKey: ['expenses', 'purchases', projectId, from, to],
    enabled: projectId !== undefined,
    queryFn: async () => {
      let q = supabase
        .from('memoir_purchase_entries')
        .select('*')
        .order('entry_date', { ascending: false });
      if (projectId !== null) q = q.eq('project_id', projectId!);
      if (from) q = q.gte('entry_date', from);
      if (to) q = q.lte('entry_date', to);
      const { data, error } = await q;
      if (error) throw error;
      return data as PurchaseEntry[];
    },
  });
}

const CAT_COLORS: Record<ExpenseCategory, string> = {
  food: 'bg-primary',
  alcohol: 'bg-accent',
  activities: 'bg-[#6b8f71]',
  purchases: 'bg-[#9c7a3c]',
  other: 'bg-text-muted',
};

export function StatsScreen() {
  const { project, isEverything, viewProjectId, settings } = useProject();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data: stats, isLoading } = useProjectStats(viewProjectId, from || undefined, to || undefined);
  const { data: purchases = [] } = usePurchases(viewProjectId, from || undefined, to || undefined);
  const { remove } = useEntryMutations();
  const confirmDelete = useConfirmDelete();
  const openAdd = useQuickAdd((s) => s.open);

  if (isLoading || !stats)
    return <p className="py-8 text-center text-sm text-text-muted">Loading…</p>;

  const cur = settings.currency;
  const hasData = stats.totalSpent > 0 || stats.activeDays > 0;
  const dateInputClass =
    'w-full rounded-xl border border-border bg-surface h-11 px-3.5 text-[15px] text-text ' +
    'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition';

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-text-muted">Statistics for</p>
        <h2 className="font-serif text-xl font-semibold">
          {isEverything ? 'Everything' : project?.name}
        </h2>
      </div>

      {/* Date range filter */}
      <Card className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Date range
          </p>
          {(from || to) && (
            <button
              onClick={() => {
                setFrom('');
                setTo('');
              }}
              className="text-sm font-medium text-primary"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex items-end gap-3">
          <label className="flex-1">
            <span className="mb-1 block text-xs text-text-muted">From</span>
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className={dateInputClass}
            />
          </label>
          <label className="flex-1">
            <span className="mb-1 block text-xs text-text-muted">To</span>
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className={dateInputClass}
            />
          </label>
        </div>
      </Card>

      {!hasData && (
        <EmptyState
          icon={Wallet}
          title="No statistics yet"
          subtitle="Log some experiences in this project and your stats will appear here."
        />
      )}

      {/* Money */}
      <section>
        <SectionTitle icon={<Wallet size={15} />}>Money</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total spent" value={formatMoney(stats.totalSpent, cur)} accent />
          <StatCard
            label="Daily average"
            value={formatMoney(Math.round(stats.dailyAverage), cur)}
            sub={`over ${stats.activeDays} day${stats.activeDays === 1 ? '' : 's'}`}
          />
        </div>
        <Card className="mt-3 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
            By category
          </p>
          {/* Stacked bar */}
          {stats.totalSpent > 0 && (
            <div className="mb-3 flex h-2.5 overflow-hidden rounded-full">
              {(Object.keys(stats.byCategory) as ExpenseCategory[]).map((c) =>
                stats.byCategory[c] > 0 ? (
                  <div
                    key={c}
                    className={CAT_COLORS[c]}
                    style={{ width: `${(stats.byCategory[c] / stats.totalSpent) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
          )}
          <div className="space-y-1.5">
            {(Object.keys(stats.byCategory) as ExpenseCategory[]).map((c) => (
              <div key={c} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${CAT_COLORS[c]}`} />
                  {titleCase(c)}
                </span>
                <span className="font-medium">{formatMoney(stats.byCategory[c], cur)}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Food */}
      <section>
        <SectionTitle icon={<UtensilsCrossed size={15} />}>Food</SectionTitle>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <StatCard label="Restaurants visited" value={stats.restaurantsVisited} />
          <StatCard
            label="Avg food rating"
            value={stats.avgFoodRating != null ? `${Math.round(stats.avgFoodRating * 10) / 10}/10` : '—'}
            accent
          />
        </div>
        <Card>
          <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-text-muted">
            Most eaten
          </p>
          <RankList rows={stats.mostEaten} kind="count" />
          <div className="border-t border-border">
            <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-text-muted">
              Highest rated
            </p>
            <RankList rows={stats.topRatedFoods} kind="rating" />
          </div>
        </Card>
      </section>

      {/* Alcohol */}
      <section>
        <SectionTitle icon={<Wine size={15} />}>Alcohol</SectionTitle>
        <div className="mb-3 grid grid-cols-3 gap-3">
          <StatCard label="Beers" value={stats.totalBeers} />
          <StatCard label="0.5l" value={stats.total05} />
          <StatCard label="0.33l" value={stats.total033} />
        </div>
        <Card>
          <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-text-muted">
            Most consumed
          </p>
          <RankList rows={stats.mostConsumed} kind="count" />
          <div className="border-t border-border">
            <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-text-muted">
              Highest rated
            </p>
            <RankList rows={stats.topRatedDrinks} kind="rating" />
          </div>
        </Card>
      </section>

      {/* Activities */}
      <section>
        <SectionTitle icon={<Ticket size={15} />}>Activities</SectionTitle>
        <div className="mb-3">
          <StatCard label="Completed" value={stats.activitiesCompleted} />
        </div>
        <Card>
          <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-text-muted">
            Highest rated
          </p>
          <RankList rows={stats.topRatedActivities} kind="rating" />
        </Card>
      </section>

      {/* Purchases */}
      <section>
        <SectionTitle
          icon={<ShoppingBag size={15} />}
          action={
            <button
              onClick={() => openAdd('purchase')}
              className="flex items-center gap-1 text-sm font-medium text-primary"
            >
              <Plus size={16} /> Add
            </button>
          }
        >
          Purchases
        </SectionTitle>
        <Card>
          {purchases.length === 0 && (
            <p className="px-4 py-5 text-center text-sm text-text-muted">No purchases logged.</p>
          )}
          {purchases.map((pr) => (
            <div key={pr.id} className="flex items-center gap-2 border-t border-border px-4 first:border-t-0">
              <button
                onClick={() => openAdd('purchase', pr.id)}
                className="flex min-w-0 flex-1 items-center justify-between py-3 text-left"
              >
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-medium">{pr.item_name}</div>
                  <div className="text-sm text-text-muted">
                    {titleCase(pr.category)} · {formatDate(pr.entry_date, settings.date_format)}
                  </div>
                </div>
                <span className="ml-2 text-sm font-medium">{formatMoney(pr.cost, cur)}</span>
              </button>
              <button
                onClick={async () => {
                  if (confirmDelete()) await remove('memoir_purchase_entries', pr.id);
                }}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-text-muted hover:text-danger"
                aria-label="Delete purchase"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
