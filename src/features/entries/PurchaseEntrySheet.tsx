import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DateField } from '@/components/ui/DateField';
import { useProject } from '@/context/ProjectProvider';
import { useSettings } from '@/context/SettingsProvider';
import { useEntryMutations } from '@/features/entries/hooks/useEntryMutations';
import { combineDateTime, newId, nowTime, timeFromISO, titleCase } from '@/lib/format';
import { PURCHASE_CATEGORIES, type PurchaseCategory, type PurchaseEntry } from '@/types/db';
import { useEditingEntry } from './hooks/useEditingEntry';

export function PurchaseEntrySheet({
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
  const { data: editing } = useEditingEntry<PurchaseEntry>('memoir_purchase_entries', editId);

  const [entryDate, setEntryDate] = useState(date);
  const [entryTime, setEntryTime] = useState(nowTime());
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<PurchaseCategory>('clothes');
  const [cost, setCost] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setEntryDate(editing.entry_date);
      setEntryTime(timeFromISO(editing.created_at));
      setItemName(editing.item_name);
      setCategory(editing.category);
      setCost(editing.cost);
      setNotes(editing.notes ?? '');
    } else if (!editId) {
      setEntryDate(date);
      setEntryTime(nowTime());
      setItemName('');
      setCategory('clothes');
      setCost(null);
      setNotes('');
    }
  }, [open, editing, editId, date]);

  const canSave = !!project && !!itemName.trim();

  const submit = async () => {
    if (!project || busy) return;
    setBusy(true);
    try {
      await save('memoir_purchase_entries', editId ?? newId(), {
        project_id: project.id,
        entry_date: entryDate,
        created_at: combineDateTime(entryDate, entryTime, editing?.created_at),
        item_name: itemName.trim(),
        category,
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
      title={editId ? 'Edit purchase' : 'Add purchase'}
      footer={
        <Button block onClick={submit} disabled={!canSave || busy}>
          {editId ? 'Save changes' : 'Add purchase'}
        </Button>
      }
    >
      <div className="space-y-4">
        <Field label="What did you buy?">
          <Input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g. Shoes"
            autoFocus
          />
        </Field>

        <Field label="Category">
          <SegmentedControl
            value={category}
            onChange={setCategory}
            options={PURCHASE_CATEGORIES.map((c) => ({ value: c, label: titleCase(c) }))}
          />
        </Field>

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
