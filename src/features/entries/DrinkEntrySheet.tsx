import { useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Field, Textarea } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Combobox, type ComboValue } from '@/components/ui/Combobox';
import { RatingInput } from '@/components/ui/RatingInput';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DateField } from '@/components/ui/DateField';
import { Stepper } from '@/components/ui/Stepper';
import { AbvInput } from '@/components/ui/AbvInput';
import { useProject } from '@/context/ProjectProvider';
import { useEntryMutations } from '@/hooks/useEntryMutations';
import { resolveItem } from '@/hooks/useItems';
import { supabase } from '@/lib/supabase';
import { newId, titleCase } from '@/lib/format';
import {
  COCKTAIL_SUGGESTIONS,
  DEFAULT_ABV,
  DRINK_NAME_PLACEHOLDERS,
  DRINK_TYPES,
  WINE_NAME_PLACEHOLDERS,
  WINE_STYLES,
  type DrinkEntry,
  type DrinkType,
  type WineStyle,
} from '@/types/db';
import { useEditingEntry } from './useEditingEntry';

export function DrinkEntrySheet({
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
  const { data: editing } = useEditingEntry<DrinkEntry>('memoir_drink_entries', editId);

  const [entryDate, setEntryDate] = useState(date);
  const [drinkType, setDrinkType] = useState<DrinkType>('beer');
  const [wineStyle, setWineStyle] = useState<WineStyle>('red');
  const [abv, setAbv] = useState<number | null>(null);
  const [drink, setDrink] = useState<ComboValue | null>(null);
  const [count05, setCount05] = useState(0);
  const [count033, setCount033] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState<number | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setEntryDate(editing.entry_date);
      setDrinkType(editing.drink_type);
      setWineStyle(editing.wine_style ?? 'red');
      setAbv(editing.abv);
      setCount05(editing.count_05l);
      setCount033(editing.count_033l);
      setQuantity(editing.quantity);
      setRating(editing.rating);
      setCost(editing.cost);
      setNotes(editing.notes ?? '');
      setDrink(null);
      if (editing.drink_item_id) {
        void supabase
          .from('memoir_drink_items')
          .select('id,name')
          .eq('id', editing.drink_item_id)
          .maybeSingle()
          .then(({ data }) => data && setDrink({ id: data.id, name: data.name }));
      }
    } else if (!editId) {
      setEntryDate(date);
      setDrinkType('beer');
      setWineStyle('red');
      setAbv(null);
      setDrink(null);
      setCount05(0);
      setCount033(1);
      setQuantity(1);
      setRating(null);
      setCost(null);
      setNotes('');
    }
  }, [open, editing, editId, date]);

  const isBeer = drinkType === 'beer';
  const isWine = drinkType === 'wine';
  const isCocktail = drinkType === 'cocktail';
  const tracksAbv = isBeer || isWine;
  const canSave = !!project && !!drink?.name;

  // Changing type resets ABV so the wheel re-seeds at the new type's default.
  const changeType = (t: DrinkType) => {
    setDrinkType(t);
    setAbv(null);
  };

  const submit = async () => {
    if (!project || busy) return;
    setBusy(true);
    try {
      const drink_item_id = await resolveItem('memoir_drink_items', drink, {
        drink_type: drinkType,
      });
      await save('memoir_drink_entries', editId ?? newId(), {
        project_id: project.id,
        entry_date: entryDate,
        drink_item_id,
        drink_type: drinkType,
        wine_style: isWine ? wineStyle : null,
        abv: tracksAbv ? abv : null,
        count_05l: isBeer ? count05 : 0,
        count_033l: isBeer ? count033 : 0,
        quantity: isBeer ? Math.max(1, count05 + count033) : quantity,
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
      title={editId ? 'Edit drink' : 'Add drink'}
      footer={
        <Button block onClick={submit} disabled={!canSave || busy}>
          {editId ? 'Save changes' : 'Add drink'}
        </Button>
      }
    >
      <div className="space-y-4">
        <Field label="Type">
          <div className="space-y-2">
            <SegmentedControl
              value={drinkType}
              onChange={changeType}
              options={DRINK_TYPES.map((t) => ({ value: t, label: titleCase(t) }))}
            />
            {isWine && (
              <SegmentedControl value={wineStyle} onChange={setWineStyle} options={WINE_STYLES} />
            )}
          </div>
        </Field>

        <Field label="Drink">
          <Combobox
            table="memoir_drink_items"
            value={drink}
            onChange={setDrink}
            placeholder={
              isWine ? WINE_NAME_PLACEHOLDERS[wineStyle] : DRINK_NAME_PLACEHOLDERS[drinkType]
            }
            suggestions={isCocktail ? COCKTAIL_SUGGESTIONS : undefined}
          />
        </Field>

        {isBeer ? (
          <div className="space-y-3 rounded-xl border border-border bg-surface-alt/50 p-3.5">
            <Stepper label="0.5L glasses" value={count05} onChange={setCount05} />
            <Stepper label="0.33L bottles" value={count033} onChange={setCount033} />
          </div>
        ) : (
          <Field label="Quantity">
            <div className="rounded-xl border border-border bg-surface-alt/50 p-3.5">
              <Stepper label="Servings" value={quantity} onChange={setQuantity} min={1} />
            </div>
          </Field>
        )}

        {tracksAbv ? (
          <Field label="ABV (%)" optional>
            <AbvInput value={abv} onChange={setAbv} defaultValue={DEFAULT_ABV[drinkType] ?? 12.5} />
          </Field>
        ) : (
          // Reserve the ABV field's footprint so cocktail/spirit/other keep the same
          // sheet height as beer/wine and the fields below stay in a fixed position.
          <div aria-hidden className="invisible">
            <Field label="ABV (%)" optional>
              <div className="rounded-xl border border-border bg-surface-alt/50 p-3.5">
                <div className="h-11" />
              </div>
            </Field>
          </div>
        )}

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
