import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Field, Textarea } from '@/components/ui/Input';
import { Combobox, type ComboValue } from '@/components/ui/Combobox';
import { RatingInput } from '@/components/ui/RatingInput';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DateField } from '@/components/ui/DateField';
import { useProject } from '@/context/ProjectProvider';
import { useEntryMutations } from '@/hooks/useEntryMutations';
import { resolveItem } from '@/hooks/useItems';
import { supabase } from '@/lib/supabase';
import { newId } from '@/lib/format';
import type { ActivityEntry } from '@/types/db';
import { useEditingEntry } from './useEditingEntry';

export function ActivityEntrySheet({
  open,
  onClose,
  editId,
}: {
  open: boolean;
  onClose: () => void;
  editId: string | null;
}) {
  const { project, date, settings } = useProject();
  const { save } = useEntryMutations();
  const { data: editing } = useEditingEntry<ActivityEntry>('memoir_activity_entries', editId);

  const [entryDate, setEntryDate] = useState(date);
  const [activity, setActivity] = useState<ComboValue | null>(null);
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setEntryDate(editing.entry_date);
      setDescription(editing.description ?? '');
      setRating(editing.rating);
      setCost(editing.cost);
      setNotes(editing.notes ?? '');
      setActivity(null);
      if (editing.activity_item_id) {
        void supabase
          .from('memoir_activity_items')
          .select('id,name')
          .eq('id', editing.activity_item_id)
          .maybeSingle()
          .then(({ data }) => data && setActivity({ id: data.id, name: data.name }));
      }
    } else if (!editId) {
      setEntryDate(date);
      setActivity(null);
      setDescription('');
      setRating(null);
      setCost(null);
      setNotes('');
    }
  }, [open, editing, editId, date]);

  const canSave = !!project && !!activity?.name;

  const submit = async () => {
    if (!project || busy) return;
    setBusy(true);
    try {
      const activity_item_id = await resolveItem('memoir_activity_items', activity);
      await save('memoir_activity_entries', editId ?? newId(), {
        project_id: project.id,
        entry_date: entryDate,
        activity_item_id,
        description: description || null,
        rating,
        cost,
        notes: notes || null,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editId ? 'Edit activity' : 'Add activity'}
      footer={
        <Button block onClick={submit} disabled={!canSave || busy}>
          {editId ? 'Save changes' : 'Add activity'}
        </Button>
      }
    >
      <div className="space-y-4">
        <Field label="Activity">
          <Combobox
            table="memoir_activity_items"
            value={activity}
            onChange={setActivity}
            placeholder="e.g. Water park"
          />
        </Field>

        <Field label="Description" optional>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What did you do?"
          />
        </Field>

        <Field label="Rating" optional>
          <RatingInput value={rating} onChange={setRating} scale={settings.rating_scale} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cost" optional>
            <CurrencyInput value={cost} onChange={setCost} currency={settings.currency} />
          </Field>
          <Field label="Date">
            <DateField value={entryDate} onChange={setEntryDate} />
          </Field>
        </div>

        <Field label="Notes" optional>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </Field>
      </div>
    </Sheet>
  );
}
