import { useEffect, useState } from 'react';
import { ScanLine } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Field, Textarea } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
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
  BEER_SIZES,
  COCKTAIL_SUGGESTIONS,
  DEFAULT_ABV,
  DRINK_NAME_PLACEHOLDERS,
  DRINK_TYPES,
  WINE_EMPTY_NAMES,
  WINE_STYLES,
  type DrinkEntry,
  type DrinkType,
  type WineStyle,
} from '@/types/db';
import type { DrinkPreFill } from '@/lib/quickAdd';
import { type BarcodeProduct } from '@/lib/barcodeProduct';
import { useEditingEntry } from './useEditingEntry';
import { BarcodeScanner } from './BarcodeScanner';

export function DrinkEntrySheet({
  open,
  onClose,
  editId,
  preFill,
}: {
  open: boolean;
  onClose: () => void;
  editId: string | null;
  preFill?: DrinkPreFill | null;
}) {
  const { project, date, settings } = useProject();
  const { save } = useEntryMutations();
  const { data: editing } = useEditingEntry<DrinkEntry>('memoir_drink_entries', editId);

  const [entryDate, setEntryDate] = useState(date);
  const [drinkType, setDrinkType] = useState<DrinkType>('beer');
  const [wineStyle, setWineStyle] = useState<WineStyle>('red');
  const [abv, setAbv] = useState<number | null>(null);
  const [drink, setDrink] = useState<ComboValue | null>(null);
  // Beer is one size + an amount; the size dropdown defaults to 0.33l.
  const [beerSize, setBeerSize] = useState<string>(BEER_SIZES[0].key);
  const [beerCount, setBeerCount] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState<number | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setEntryDate(editing.entry_date);
      setDrinkType(editing.drink_type);
      setWineStyle(editing.wine_style ?? 'red');
      setAbv(editing.abv);
      // Collapse to the first recorded size (entries now hold a single size).
      const recorded = BEER_SIZES.find((s) => editing[s.column] > 0) ?? BEER_SIZES[0];
      setBeerSize(recorded.key);
      setBeerCount(editing[recorded.column] ?? 0);
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
      setDrinkType(preFill?.drinkType ?? 'beer');
      setWineStyle(preFill?.wineStyle ?? 'red');
      setAbv(preFill?.abv ?? null);
      setDrink(preFill?.name ? { id: null, name: preFill.name } : null);
      const sizeKey = preFill?.beerSizeKey ?? BEER_SIZES[0].key;
      setBeerSize(sizeKey);
      setBeerCount(0);
      setQuantity(1);
      setRating(null);
      setCost(null);
      setNotes('');
    }
  }, [open, editing, editId, date, preFill]);

  const isBeer = drinkType === 'beer';
  const isWine = drinkType === 'wine';
  const isCocktail = drinkType === 'cocktail';
  const tracksAbv = isBeer || isWine;
  // The drink name is optional — beers/wines fall back to a generated default.
  const canSave = !!project;

  const nameEmpty = !drink?.name?.trim();

  // The selected size drives the beer placeholder and the auto-filled name.
  const activeBeerSize = BEER_SIZES.find((s) => s.key === beerSize) ?? BEER_SIZES[0];

  // True when the name is blank or still one of the generated size defaults — i.e.
  // not something the user typed themselves, so we may keep it in sync with the size.
  const beerNameIsAuto = nameEmpty || BEER_SIZES.some((s) => s.emptyName === drink?.name);

  // Bumping the amount up while the name is blank fills it with the size's default
  // so the entry reads e.g. "0.33l of beer".
  const changeBeerCount = (value: number) => {
    const prev = beerCount;
    setBeerCount(value);
    if (value > prev && nameEmpty) setDrink({ id: null, name: activeBeerSize.emptyName });
  };

  // Switching size keeps an auto-derived name in sync (but never overwrites a name
  // the user typed); the placeholder follows the size regardless.
  const changeBeerSize = (key: string) => {
    setBeerSize(key);
    const next = BEER_SIZES.find((s) => s.key === key) ?? BEER_SIZES[0];
    if (!nameEmpty && beerNameIsAuto) setDrink({ id: null, name: next.emptyName });
  };

  // Changing type resets ABV so the wheel re-seeds at the new type's default.
  const changeType = (t: DrinkType) => {
    setDrinkType(t);
    setAbv(null);
  };

  const applyScannedProduct = (p: BarcodeProduct) => {
    setScannerOpen(false);
    if (p.drinkType) setDrinkType(p.drinkType);
    if (p.wineStyle) setWineStyle(p.wineStyle);
    if (p.name) setDrink({ id: null, name: p.name });
    if (p.abv != null) setAbv(p.abv);
    if (p.beerSizeKey) setBeerSize(p.beerSizeKey);
  };

  const submit = async () => {
    if (!project || busy) return;
    setBusy(true);
    try {
      // Fall back to a generated name when the field is left blank, so beers and
      // wines still read meaningfully ("A glass of red", "0.33l of beer").
      let selection = drink;
      if (nameEmpty) {
        const fallback = isWine
          ? WINE_EMPTY_NAMES[wineStyle]
          : isBeer
            ? activeBeerSize.emptyName
            : null;
        selection = fallback ? { id: null, name: fallback } : null;
      }

      const drink_item_id = await resolveItem('memoir_drink_items', selection, {
        drink_type: drinkType,
      });
      // A beer entry holds a single size: its column gets the amount, the rest 0.
      const sizeColumns = Object.fromEntries(
        BEER_SIZES.map((s) => [s.column, isBeer && s.key === beerSize ? beerCount : 0]),
      );
      await save('memoir_drink_entries', editId ?? newId(), {
        project_id: project.id,
        entry_date: entryDate,
        drink_item_id,
        drink_type: drinkType,
        wine_style: isWine ? wineStyle : null,
        abv: tracksAbv ? abv : null,
        ...sizeColumns,
        quantity: isBeer ? Math.max(1, beerCount) : quantity,
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
        <Button
          variant="secondary"
          size="sm"
          type="button"
          className="w-full"
          onClick={() => setScannerOpen(true)}
        >
          <ScanLine size={16} />
          Scan barcode
        </Button>

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

        <Field label="Drink" optional>
          <Combobox
            table="memoir_drink_items"
            value={drink}
            onChange={setDrink}
            match={{ drink_type: drinkType }}
            placeholder={
              isBeer
                ? activeBeerSize.emptyName
                : isWine
                  ? WINE_EMPTY_NAMES[wineStyle]
                  : DRINK_NAME_PLACEHOLDERS[drinkType]
            }
            suggestions={
              isBeer
                ? BEER_SIZES.map((s) => s.emptyName)
                : isWine
                  ? [WINE_EMPTY_NAMES[wineStyle]]
                  : isCocktail
                    ? COCKTAIL_SUGGESTIONS
                    : undefined
            }
            pinSuggestions={isBeer || isWine}
          />
        </Field>

        {isBeer ? (
          <Field label="Amount">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-alt/50 p-3.5">
              <Select
                value={beerSize}
                onChange={changeBeerSize}
                options={BEER_SIZES.map((s) => ({ value: s.key, label: s.label }))}
              />
              <Stepper value={beerCount} onChange={changeBeerCount} />
            </div>
          </Field>
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

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onProduct={applyScannedProduct}
      />
    </Sheet>
  );
}
