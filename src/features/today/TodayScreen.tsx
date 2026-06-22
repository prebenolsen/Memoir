import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Trash2, UtensilsCrossed, Wine, Ticket, ShoppingBag, Wallet, CalendarClock } from 'lucide-react';
import { useProject } from '@/context/ProjectProvider';
import { useDay, dayCost, type DayData } from '@/hooks/useDay';
import { useEntryMutations, type EntryTable } from '@/hooks/useEntryMutations';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { useQuickAdd, type AddKind } from '@/lib/quickAdd';
import { Card, SectionTitle } from '@/components/ui/Card';
import { RatingBadge } from '@/components/ui/RatingInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { addDays, formatLongDate, formatMoney, formatWeekday } from '@/lib/format';
import { BEER_SIZES } from '@/types/db';
import {
  activityTitle,
  drinkAmount,
  drinkTitle,
  foodSubtitle,
  foodTitle,
} from '@/features/entries/entryDisplay';

function Row({
  title,
  subtitle,
  cost,
  rating,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  cost?: number | null;
  rating?: number | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { settings } = useProject();
  return (
    <div className="flex items-center gap-2 border-t border-border first:border-t-0">
      <button onClick={onEdit} className="flex min-w-0 flex-1 items-center gap-2 py-2.5 text-left">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium">{title}</div>
          {subtitle && <div className="truncate text-sm text-text-muted">{subtitle}</div>}
        </div>
        {rating != null && <RatingBadge value={rating} scale={settings.rating_scale} />}
        {cost != null && (
          <span className="text-sm font-medium text-text-muted">
            {formatMoney(cost, settings.currency)}
          </span>
        )}
      </button>
      <button
        onClick={onDelete}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-text-muted hover:bg-surface-alt hover:text-danger"
        aria-label="Delete"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

function alcoholSummary(d: DayData) {
  let beers = 0;
  let drinks = 0;
  const bySize = new Map<string, number>(); // size label -> total count
  for (const e of d.drinks) {
    if (e.drink_type === 'beer') {
      for (const s of BEER_SIZES) {
        const n = e[s.column];
        if (n) {
          beers += n;
          bySize.set(s.short, (bySize.get(s.short) ?? 0) + n);
        }
      }
    } else {
      drinks += e.quantity;
    }
  }
  const sizeDetail = [...bySize.entries()].map(([label, n]) => `${n}×${label}`).join(', ');
  return { beers, sizeDetail, drinks };
}

export function TodayScreen() {
  const { project, date, setDate, settings } = useProject();
  const { data, isLoading } = useDay(project?.id, date);
  const { remove } = useEntryMutations();
  const confirmDelete = useConfirmDelete();
  const openAdd = useQuickAdd((s) => s.open);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const openCalendar = () => {
    const el = dateInputRef.current;
    if (!el) return;
    // showPicker is the reliable way to open the native calendar on click.
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.focus();
  };

  const edit = (kind: AddKind, id: string) => openAdd(kind, id);
  const del = async (table: EntryTable, id: string) => {
    if (confirmDelete()) await remove(table, id);
  };

  const total = dayCost(data);
  const al = data ? alcoholSummary(data) : null;
  const isEmpty =
    data &&
    !data.food.length &&
    !data.drinks.length &&
    !data.activities.length &&
    !data.purchases.length;

  return (
    <div className="space-y-4">
      {/* Date navigator */}
      <Card className="flex items-center justify-between p-2">
        <button
          onClick={() => setDate(addDays(date, -1))}
          className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-alt"
          aria-label="Previous day"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={openCalendar}
            className="flex flex-col items-center rounded-xl px-3 py-1 hover:bg-surface-alt"
            aria-label="Pick date"
          >
            <span className="font-serif text-lg font-semibold">{formatLongDate(date)}</span>
            <span className="text-xs text-text-muted">{formatWeekday(date)}</span>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="pointer-events-none absolute inset-x-0 bottom-0 h-0 w-full opacity-0"
            tabIndex={-1}
            aria-hidden
          />
        </div>
        <button
          onClick={() => setDate(addDays(date, 1))}
          className="grid h-10 w-10 place-items-center rounded-xl hover:bg-surface-alt"
          aria-label="Next day"
        >
          <ChevronRight size={20} />
        </button>
      </Card>

      {isLoading && <p className="py-8 text-center text-sm text-text-muted">Loading…</p>}

      {isEmpty && (
        <EmptyState
          icon={CalendarClock}
          title="Nothing logged yet"
          subtitle="Use the + button to add food, drinks, activities or purchases for this day."
        />
      )}

      {/* Food */}
      {!!data?.food.length && (
        <section>
          <SectionTitle icon={<UtensilsCrossed size={15} />}>Food</SectionTitle>
          <Card className="px-4">
            {data.food.map((e) => (
              <Row
                key={e.id}
                title={foodTitle(e)}
                subtitle={foodSubtitle(e)}
                cost={e.cost}
                rating={e.rating}
                onEdit={() => edit('food', e.id)}
                onDelete={() => del('memoir_food_entries', e.id)}
              />
            ))}
          </Card>
        </section>
      )}

      {/* Alcohol */}
      {!!data?.drinks.length && al && (
        <section>
          <SectionTitle icon={<Wine size={15} />}>
            Alcohol
            <span className="ml-2 font-normal normal-case text-text-muted">
              {al.beers > 0 && `${al.beers} beer${al.beers === 1 ? '' : 's'}`}
              {al.beers > 0 && al.sizeDetail ? ` (${al.sizeDetail})` : ''}
              {al.drinks > 0 ? `${al.beers > 0 ? ' · ' : ''}${al.drinks} drink${al.drinks === 1 ? '' : 's'}` : ''}
            </span>
          </SectionTitle>
          <Card className="px-4">
            {data.drinks.map((e) => (
              <Row
                key={e.id}
                title={drinkTitle(e)}
                subtitle={drinkAmount(e)}
                cost={e.cost}
                rating={e.rating}
                onEdit={() => edit('drink', e.id)}
                onDelete={() => del('memoir_drink_entries', e.id)}
              />
            ))}
          </Card>
        </section>
      )}

      {/* Activities */}
      {!!data?.activities.length && (
        <section>
          <SectionTitle icon={<Ticket size={15} />}>Activities</SectionTitle>
          <Card className="px-4">
            {data.activities.map((e) => (
              <Row
                key={e.id}
                title={activityTitle(e)}
                subtitle={e.description ?? undefined}
                cost={e.cost}
                rating={e.rating}
                onEdit={() => edit('activity', e.id)}
                onDelete={() => del('memoir_activity_entries', e.id)}
              />
            ))}
          </Card>
        </section>
      )}

      {/* Purchases */}
      {!!data?.purchases.length && (
        <section>
          <SectionTitle icon={<ShoppingBag size={15} />}>Purchases</SectionTitle>
          <Card className="px-4">
            {data.purchases.map((e) => (
              <Row
                key={e.id}
                title={e.item_name}
                subtitle={e.category}
                cost={e.cost}
                onEdit={() => edit('purchase', e.id)}
                onDelete={() => del('memoir_purchase_entries', e.id)}
              />
            ))}
          </Card>
        </section>
      )}

      {/* Expenses */}
      {!isEmpty && (
        <Card className="flex items-center justify-between p-4">
          <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
            <Wallet size={15} /> Day total
          </span>
          <span className="font-serif text-xl font-semibold text-accent">
            {formatMoney(total, settings.currency)}
          </span>
        </Card>
      )}
    </div>
  );
}
