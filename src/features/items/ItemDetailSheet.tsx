import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Hash, Star } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Field, Textarea } from '@/components/ui/Input';
import { RatingInput, RatingBadge } from '@/components/ui/RatingInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useProject } from '@/context/ProjectProvider';
import { useItemOccasions, entryEditKind } from '@/hooks/useItemDetail';
import { updateItem, type ItemKind, type ItemWithStats } from '@/hooks/useItems';
import { useQuickAdd } from '@/lib/quickAdd';
import { toast } from '@/components/ui/Toast';
import { formatDate, formatMoney } from '@/lib/format';

export function ItemDetailSheet({
  kind,
  item,
  onClose,
}: {
  kind: ItemKind;
  item: ItemWithStats | null;
  onClose: () => void;
}) {
  const { settings } = useProject();
  const qc = useQueryClient();
  const { data: occasions = [] } = useItemOccasions(kind, item?.id ?? null);
  const openAdd = useQuickAdd((s) => s.open);

  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRating(item?.default_rating ?? null);
    setNotes(item?.notes ?? '');
  }, [item]);

  if (!item) return null;

  const saveHeadline = async () => {
    setBusy(true);
    try {
      await updateItem(kind, item.id, { default_rating: rating, notes: notes || null });
      await qc.invalidateQueries({ queryKey: ['itemList', kind] });
      await qc.invalidateQueries({ queryKey: ['itemDetail', kind, item.id] });
      toast('Item updated');
      onClose();
    } catch {
      toast('Could not update item', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={!!item}
      onClose={onClose}
      title={item.name}
      footer={
        <Button block onClick={saveHeadline} disabled={busy}>
          Save item
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="flex items-center gap-3 p-3.5">
            <Hash size={18} className="text-text-muted" />
            <div>
              <p className="text-xs uppercase tracking-wide text-text-muted">Logged</p>
              <p className="font-serif text-xl font-semibold">{item.count}×</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-3.5">
            <Star size={18} className="text-accent" />
            <div>
              <p className="text-xs uppercase tracking-wide text-text-muted">Average</p>
              <p className="font-serif text-xl font-semibold text-accent">
                {item.avg_rating != null
                  ? `${Math.round(item.avg_rating * 10) / 10}/10`
                  : '—'}
              </p>
            </div>
          </Card>
        </div>

        <Field label="Personal rating" hint="Your headline rating for this item." optional>
          <RatingInput value={rating} onChange={setRating} scale={settings.rating_scale} />
        </Field>
        <Field label="Notes" optional>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              History · {occasions.length}
            </h3>
            <button
              onClick={() => {
                onClose();
                openAdd(entryEditKind(kind));
              }}
              className="text-sm font-medium text-primary"
            >
              + Add review
            </button>
          </div>
          <Card>
            {occasions.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-text-muted">No history yet.</p>
            )}
            {occasions.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  onClose();
                  openAdd(entryEditKind(kind), o.id);
                }}
                className="flex w-full items-start gap-2 border-t border-border px-4 py-3 text-left first:border-t-0 hover:bg-surface-alt"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[15px] font-medium">
                    {formatDate(o.entry_date, settings.date_format)}
                    <span className="rounded-full bg-surface-alt px-2 py-0.5 text-xs font-normal text-text-muted">
                      {o.project_name}
                    </span>
                  </div>
                  {(o.detail || o.notes) && (
                    <p className="truncate text-sm text-text-muted">{o.detail || o.notes}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <RatingBadge value={o.rating} scale={settings.rating_scale} />
                  {o.cost != null && (
                    <span className="text-sm text-text-muted">
                      {formatMoney(o.cost, settings.currency)}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </Card>
        </div>
      </div>
    </Sheet>
  );
}
