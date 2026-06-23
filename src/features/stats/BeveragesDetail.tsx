import {
  Wine,
  Clock,
  CalendarDays,
  Flame,
  Trophy,
  MapPin,
  Beer,
  Sparkles,
  Hourglass,
} from 'lucide-react';
import { useProject } from '@/context/ProjectProvider';
import { useBeverageStats, type NamedCount, type NamedRating } from '@/hooks/useBeverageStats';
import { Card, SectionTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatMoney, formatLongDate, titleCase } from '@/lib/format';
import type { DrinkType } from '@/types/db';
import { DrinkMap } from './DrinkMap';

const TYPE_COLORS: Record<DrinkType, string> = {
  beer: 'bg-[#c89a4a]',
  wine: 'bg-[#7b2d3a]',
  cocktail: 'bg-[#c2607f]',
  spirit: 'bg-[#6b5b95]',
  other: 'bg-text-muted',
};

const WINE_COLORS: Record<string, string> = {
  red: 'bg-[#7b2d3a]',
  white: 'bg-[#d8c879]',
  rose: 'bg-[#e6a6b0]',
  sparkling: 'bg-[#efd98a]',
};

/** Litres with at most one decimal and no trailing ".0". */
function fmtLitres(n: number): string {
  return (Math.round(n * 10) / 10).toLocaleString();
}

/** "4h 20m" / "45m" / "2h". */
function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min - h * 60);
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

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

/** A 24-hour distribution of when drinks were logged. */
function HourBars({ hours, peak }: { hours: { hour: number; servings: number }[]; peak: number | null }) {
  const max = Math.max(...hours.map((h) => h.servings), 1);
  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height: 120 }}>
        {hours.map((h) => (
          <div key={h.hour} className="flex flex-1 flex-col items-center justify-end">
            <div
              className={`w-full rounded-t-sm ${h.hour === peak ? 'bg-accent' : 'bg-accent/35'}`}
              style={{ height: h.servings ? `${Math.max(4, (h.servings / max) * 110)}px` : 2 }}
              title={`${String(h.hour).padStart(2, '0')}:00 — ${h.servings} ${h.servings === 1 ? 'drink' : 'drinks'}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-text-muted">
        {[0, 6, 12, 18, 23].map((h) => (
          <span key={h}>{String(h).padStart(2, '0')}</span>
        ))}
      </div>
    </div>
  );
}

/** One thin bar per day you drank, in order — a cadence sparkline. */
function DayBars({ days }: { days: { date: string; servings: number }[] }) {
  const max = Math.max(...days.map((d) => d.servings), 1);
  return (
    <div className="flex items-end gap-[2px] overflow-hidden" style={{ height: 72 }}>
      {days.map((d) => (
        <div
          key={d.date}
          className="min-w-[3px] flex-1 rounded-t-sm bg-primary/60"
          style={{ height: `${Math.max(4, (d.servings / max) * 64)}px` }}
          title={`${formatLongDate(d.date)} — ${d.servings} ${d.servings === 1 ? 'drink' : 'drinks'}`}
        />
      ))}
    </div>
  );
}

export function BeveragesDetail({
  projectId,
  from,
  to,
}: {
  projectId: string | null;
  from?: string;
  to?: string;
}) {
  const { settings } = useProject();
  const cur = settings.currency;
  const { data: s, isLoading, isError } = useBeverageStats(projectId, from, to);

  if (isError)
    return (
      <EmptyState
        icon={Wine}
        title="Couldn’t load beverage stats"
        subtitle="If this is the first run, make sure the drink-coordinates migration has been applied, then try again."
      />
    );

  if (isLoading || !s)
    return <p className="py-8 text-center text-sm text-text-muted">Loading…</p>;

  if (s.totalEntries === 0)
    return (
      <EmptyState
        icon={Wine}
        title="No beverages logged"
        subtitle="Once you log a few drinks here, this page fills up with charts, streaks and a map."
      />
    );

  const maxType = Math.max(...s.byType.map((t) => t.servings), 1);
  const maxWine = Math.max(...s.wineGlasses.map((w) => w.glasses), 1);
  const avgPerDrink = s.totalServings ? s.totalSpent / s.totalServings : 0;

  return (
    <div className="space-y-6">
      {/* Headline */}
      <Card className="bg-accent/5 p-4">
        <p className="text-[15px] leading-relaxed text-text">
          Across <strong>{s.activeDays}</strong> {s.activeDays === 1 ? 'day' : 'days'} you logged{' '}
          <strong className="text-accent">{s.totalServings}</strong>{' '}
          {s.totalServings === 1 ? 'drink' : 'drinks'} over <strong>{s.totalEntries}</strong>{' '}
          {s.totalEntries === 1 ? 'entry' : 'entries'}
          {s.uniqueDrinks > 1 && (
            <>
              {' '}
              — <strong>{s.uniqueDrinks}</strong> of them different.
            </>
          )}
          {s.uniqueDrinks <= 1 && '.'}
        </p>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Drinks" value={s.totalServings} accent />
        <StatCard label="Active days" value={s.activeDays} sub={`of ${s.spanDays}`} />
        <StatCard label="Per day" value={Math.round(s.avgPerActiveDay * 10) / 10} />
      </div>

      {/* What you drink */}
      <section>
        <SectionTitle icon={<Wine size={15} />}>What you drink</SectionTitle>
        <Card className="space-y-2.5 p-4">
          {s.byType.map((t) => (
            <div key={t.type}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{titleCase(t.type)}</span>
                <span className="text-text-muted">
                  <span className="text-text">{t.servings}</span>{' '}
                  {t.servings === 1 ? 'drink' : 'drinks'}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface-alt">
                <div
                  className={`h-full rounded-full ${TYPE_COLORS[t.type]}`}
                  style={{ width: `${(t.servings / maxType) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </Card>
      </section>

      {/* Beer & wine detail */}
      {s.totalBeers > 0 && (
        <section>
          <SectionTitle icon={<Beer size={15} />}>Beer</SectionTitle>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <StatCard
              label="Beers"
              value={s.totalBeers}
              sub={`${s.totalBeers === 1 ? 'glass' : 'glasses'} in total`}
            />
            <StatCard label="Litres" value={`${fmtLitres(s.totalBeerLitres)} L`} accent />
          </div>
          {s.beerSizes.length > 0 && (
            <Card className="p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
                By size
              </p>
              <div className="space-y-1.5">
                {s.beerSizes.map((sz) => (
                  <div key={sz.key} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{sz.short}</span>
                    <span className="text-text-muted">
                      <span className="text-text">{sz.units}</span>{' '}
                      {sz.units === 1 ? 'glass' : 'glasses'} ·{' '}
                      <span className="text-text">{fmtLitres(sz.litres)} L</span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>
      )}

      {s.wineGlasses.length > 0 && (
        <section>
          <SectionTitle icon={<Wine size={15} />}>Wine</SectionTitle>
          <Card className="p-4">
            <div className="flex items-end justify-around gap-3 pt-2" style={{ height: 160 }}>
              {s.wineGlasses.map((w) => (
                <div key={w.style} className="flex flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-sm font-semibold tabular-nums text-text">{w.glasses}</span>
                  <div
                    className={`w-full max-w-[44px] rounded-t-md ${WINE_COLORS[w.style]}`}
                    style={{ height: `${Math.max(6, (w.glasses / maxWine) * 110)}px` }}
                  />
                  <span className="text-xs text-text-muted">{w.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* When you drink */}
      <section>
        <SectionTitle icon={<Clock size={15} />}>When you drink</SectionTitle>
        <Card className="p-4">
          <HourBars hours={s.hours} peak={s.peakHour} />
          {s.peakHour != null && (
            <p className="mt-3 text-[15px] leading-relaxed text-text">
              You drink most around{' '}
              <strong className="text-accent">{String(s.peakHour).padStart(2, '0')}:00</strong>.
            </p>
          )}
          {(s.earliest || s.latest) && (
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              {s.earliest && (
                <div className="rounded-xl bg-surface-alt px-3 py-2.5">
                  <p className="text-xs uppercase tracking-wide text-text-muted">Earliest</p>
                  <p className="mt-0.5 font-serif text-lg font-semibold">{s.earliest.label}</p>
                  <p className="text-xs text-text-muted">{formatLongDate(s.earliest.date)}</p>
                </div>
              )}
              {s.latest && (
                <div className="rounded-xl bg-surface-alt px-3 py-2.5">
                  <p className="text-xs uppercase tracking-wide text-text-muted">Last call</p>
                  <p className="mt-0.5 font-serif text-lg font-semibold">{s.latest.label}</p>
                  <p className="text-xs text-text-muted">{formatLongDate(s.latest.date)}</p>
                </div>
              )}
            </div>
          )}
          <p className="mt-3 text-xs text-text-muted">
            Based on the time each drink was logged.
          </p>
        </Card>
      </section>

      {/* Sessions */}
      {s.sessionCount > 0 && (
        <section>
          <SectionTitle icon={<Hourglass size={15} />}>Sessions</SectionTitle>
          {s.longestSession && (
            <Card className="mb-3 bg-accent/5 p-4">
              <p className="text-[15px] leading-relaxed text-text">
                Your longest drinking session lasted{' '}
                <strong className="text-accent">{fmtDuration(s.longestSession.durationMin)}</strong> —{' '}
                <strong>{s.longestSession.drinks}</strong>{' '}
                {s.longestSession.drinks === 1 ? 'drink' : 'drinks'} on{' '}
                {formatLongDate(s.longestSession.date)}.
              </p>
              {s.biggestSession && s.biggestSession !== s.longestSession && (
                <p className="mt-2 text-sm text-text-muted">
                  Your biggest was <strong className="text-text">{s.biggestSession.drinks}</strong>{' '}
                  drinks in one sitting, on {formatLongDate(s.biggestSession.date)}.
                </p>
              )}
            </Card>
          )}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Sessions" value={s.sessionCount} sub="3h+ gap = new one" />
            <StatCard
              label="Drinks / session"
              value={Math.round(s.avgDrinksPerSession * 10) / 10}
            />
          </div>
        </section>
      )}

      {/* Cadence */}
      <section>
        <SectionTitle icon={<CalendarDays size={15} />}>Cadence</SectionTitle>
        <Card className="p-4">
          <DayBars days={s.perDay} />
          {s.busiestDay && (
            <p className="mt-3 text-[15px] leading-relaxed text-text">
              Busiest day:{' '}
              <strong className="text-accent">
                {s.busiestDay.servings} {s.busiestDay.servings === 1 ? 'drink' : 'drinks'}
              </strong>{' '}
              on {formatLongDate(s.busiestDay.date)}.
            </p>
          )}
          <p className="mt-1 text-sm text-text-muted">
            You averaged {Math.round(s.avgPerActiveDay * 10) / 10} drinks on the {s.activeDays}{' '}
            {s.activeDays === 1 ? 'day' : 'days'} you drank.
          </p>
        </Card>
      </section>

      {/* Streaks */}
      <section>
        <SectionTitle icon={<Flame size={15} />}>Streaks</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Longest streak"
            value={`${s.longestStreak} ${s.longestStreak === 1 ? 'day' : 'days'}`}
            sub="in a row with a drink"
            accent
          />
          <StatCard
            label="Longest dry spell"
            value={`${s.longestDryStreak} ${s.longestDryStreak === 1 ? 'day' : 'days'}`}
            sub={s.longestDryStreak > 0 ? 'no drinks logged' : 'never a gap'}
          />
        </div>
      </section>

      {/* Rankings */}
      <section>
        <SectionTitle icon={<Trophy size={15} />}>Leaderboard</SectionTitle>
        <Card>
          <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-text-muted">
            Most consumed
          </p>
          <RankList rows={s.mostConsumed} kind="count" />
          <div className="border-t border-border">
            <p className="px-4 pt-3 text-xs font-medium uppercase tracking-wide text-text-muted">
              Highest rated
            </p>
            <RankList rows={s.topRated} kind="rating" />
          </div>
        </Card>
        <Card className="mt-3 space-y-2 p-4 text-[15px] leading-relaxed text-text">
          {s.uniqueBeers > 0 && (
            <p className="flex items-center gap-2">
              <Sparkles size={15} className="shrink-0 text-accent" />
              You've tried <strong>{s.uniqueBeers}</strong> different{' '}
              {s.uniqueBeers === 1 ? 'beer' : 'beers'}.
            </p>
          )}
          {s.strongest && (
            <p className="flex items-center gap-2">
              <Flame size={15} className="shrink-0 text-accent" />
              Strongest pour: <strong>{s.strongest.name}</strong> at {s.strongest.abv}% ABV.
            </p>
          )}
          {s.avgRating != null && (
            <p className="flex items-center gap-2">
              <Trophy size={15} className="shrink-0 text-accent" />
              You rate your drinks <strong>{Math.round(s.avgRating * 10) / 10}/10</strong> on average.
            </p>
          )}
        </Card>
      </section>

      {/* Money */}
      {s.totalSpent > 0 && (
        <section>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Spent on drinks" value={formatMoney(s.totalSpent, cur)} accent />
            <StatCard label="Per drink" value={formatMoney(Math.round(avgPerDrink), cur)} />
          </div>
        </section>
      )}

      {/* Where you drink */}
      {(s.mapPoints.length > 0 || s.places.length > 0) && (
        <section>
          <SectionTitle icon={<MapPin size={15} />}>Where you drink</SectionTitle>
          {s.mapPoints.length > 0 && (
            <div className="mb-3">
              <DrinkMap points={s.mapPoints} />
              <p className="mt-1.5 text-xs text-text-muted">
                {s.mapPoints.length} {s.mapPoints.length === 1 ? 'drink' : 'drinks'} with a pin.
                {s.totalEntries > s.mapPoints.length &&
                  ' Older entries logged without a location aren’t shown.'}
              </p>
            </div>
          )}
          {s.places.length > 0 && (
            <Card>
              {s.places.map((p, i) => (
                <div
                  key={p.name + i}
                  className="flex items-center justify-between border-t border-border px-4 py-2.5 first:border-t-0"
                >
                  <span className="flex items-center gap-2 truncate text-[15px]">
                    <MapPin size={14} className="shrink-0 text-text-muted" />
                    <span className="truncate">{p.name}</span>
                  </span>
                  <span className="text-sm font-medium text-accent">
                    {p.servings} {p.servings === 1 ? 'drink' : 'drinks'}
                  </span>
                </div>
              ))}
            </Card>
          )}
        </section>
      )}
    </div>
  );
}
