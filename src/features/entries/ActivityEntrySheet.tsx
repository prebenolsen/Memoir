import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Field, Textarea } from '@/components/ui/Input';
import { Combobox, type ComboValue } from '@/components/ui/Combobox';
import { RatingField } from './RatingField';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DateField } from '@/components/ui/DateField';
import { useProject } from '@/context/ProjectProvider';
import { useSettings } from '@/context/SettingsProvider';
import { useEntryMutations } from '@/features/entries/hooks/useEntryMutations';
import { resolveItem } from '@/hooks/useItems';
import { supabase } from '@/lib/supabase';
import { combineDateTime, newId, nowTime, timeFromISO } from '@/lib/format';
import type { ActivityEntry } from '@/types/db';
import { useEditingEntry } from './hooks/useEditingEntry';

export function ActivityEntrySheet({
  open,
  onClose,
  editId,
}: {
  open: boolean;
  onClose: () => void;
  editId: string | null;
}) {
  const { activeProject: project, date, settings } = useProject();
  const { update: updateSettings } = useSettings();
  const { save } = useEntryMutations();
  const { data: editing } = useEditingEntry<ActivityEntry>('memoir_activity_entries', editId);

  const [entryDate, setEntryDate] = useState(date);
  const [entryTime, setEntryTime] = useState(nowTime());
  const [activity, setActivity] = useState<ComboValue | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setEntryDate(editing.entry_date);
      setEntryTime(timeFromISO(editing.created_at));
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
      setEntryTime(nowTime());
      setActivity(null);
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
        created_at: combineDateTime(entryDate, entryTime, editing?.created_at),
        activity_item_id,
        description: null,
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
        <Field label="What did you do?">
          <Combobox
            table="memoir_activity_items"
            value={activity}
            onChange={setActivity}
            placeholder="e.g. Water park"
          />
        </Field>

        <RatingField value={rating} onChange={setRating} />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cost">
            <CurrencyInput
              value={cost}
              onChange={setCost}
              currency={settings.currency}
              onCurrencyChange={(c) => updateSettings({ currency: c })}
            />
          </Field>
          <Field label="Date">
            <DateField
              date={entryDate}
              onDateChange={setEntryDate}
              time={entryTime}
              onTimeChange={setEntryTime}
            />
          </Field>
        </div>

        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </Field>
      </div>
    </Sheet>
  );
}
