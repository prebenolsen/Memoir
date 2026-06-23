import { useEffect, useState } from 'react';
import { MapPin, ScanLine, X } from 'lucide-react';
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
import { newId, titleCase, formatBeerWineName } from '@/lib/format';
import { getCurrentPosition, reverseGeocode, GeoError } from '@/lib/geo';
import type { NearbyVenue } from '@/lib/nearbyPlaces';
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
import { NearbyVenuePicker } from './NearbyVenuePicker';

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
  const { activeProject: project, date, settings } = useProject();
  const { save } = useEntryMutations();
  const { data: editing } = useEditingEntry<DrinkEntry>('memoir_drink_entries', editId);

  const [entryDate, setEntryDate] = useState(date);
  const [drinkType, setDrinkType] = useState<DrinkType>('beer');
  const [wineStyle, setWineStyle] = useState<WineStyle>('red');
  const [abv, setAbv] = useState<number | null>(null);
  const [drink, setDrink] = useState<ComboValue | null>(null);
  const [beerSize, setBeerSize] = useState<string>(BEER_SIZES[0].key);
  const [beerCount, setBeerCount] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState<number | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [city, setCity] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [venuePickerOpen, setVenuePickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setEntryDate(editing.entry_date);
      setDrinkType(editing.drink_type);
      setWineStyle(editing.wine_style ?? 'red');
      setAbv(editing.abv);
      const recorded = BEER_SIZES.find((s) => editing[s.column] > 0) ?? BEER_SIZES[0];
      setBeerSize(recorded.key);
      setBeerCount(editing[recorded.column] ?? 0);
      setQuantity(editing.quantity);
      setRating(editing.rating);
      setCost(editing.cost);
      setNotes(editing.notes ?? '');
      setCity(editing.city ?? null);
      setCountry(editing.country ?? null);
      setGeoError(null);
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
      setCity(null);
      setCountry(null);
      setGeoError(null);
    }
  }, [open, editing, editId, date, preFill]);

  const isBeer = drinkType === 'beer';
  const isWine = drinkType === 'wine';
  const isCocktail = drinkType === 'cocktail';
  const tracksAbv = isBeer || isWine;
  const canSave = !!project && (!isBeer || beerCount > 0);

  const nameEmpty = !drink?.name?.trim();
  const activeBeerSize = BEER_SIZES.find((s) => s.key === beerSize) ?? BEER_SIZES[0];
  const beerNameIsAuto = nameEmpty || BEER_SIZES.some((s) => s.emptyName === drink?.name);

  const changeBeerCount = (value: number) => {
    const prev = beerCount;
    setBeerCount(value);
    if (value > prev && nameEmpty) setDrink({ id: null, name: activeBeerSize.emptyName });
  };

  const changeBeerSize = (key: string) => {
    setBeerSize(key);
    const next = BEER_SIZES.find((s) => s.key === key) ?? BEER_SIZES[0];
    if (!nameEmpty && beerNameIsAuto) setDrink({ id: null, name: next.emptyName });
  };

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

  const applyGpsLocation = async (lat: number, lon: number) => {
    setGeoLoading(true);
    setGeoError(null);
    try {
      const info = await reverseGeocode(lat, lon);
      setCity(info.city);
      setCountry(info.country);
    } catch (err) {
      setGeoError(err instanceof GeoError ? err.message : 'Could not determine location.');
    } finally {
      setGeoLoading(false);
    }
  };

  const useMyLocation = async () => {
    setGeoLoading(true);
    setGeoError(null);
    try {
      const { latitude, longitude } = await getCurrentPosition();
      await applyGpsLocation(latitude, longitude);
    } catch (err) {
      setGeoError(err instanceof GeoError ? err.message : 'Could not get your location.');
      setGeoLoading(false);
    }
  };

  const onVenuePicked = (venue: NearbyVenue) => {
    void applyGpsLocation(venue.latitude, venue.longitude);
  };

  const clearLocation = () => {
    setCity(null);
    setCountry(null);
    setGeoError(null);
  };

  const submit = async () => {
    if (!project || busy) return;
    setBusy(true);
    try {
      let selection = drink;
      if (nameEmpty) {
        const fallback = isWine
          ? WINE_EMPTY_NAMES[wineStyle]
          : isBeer
            ? activeBeerSize.emptyName
            : null;
        selection = fallback ? { id: null, name: fallback } : null;
      } else if ((isBeer || isWine) && drink && !drink.id) {
        selection = {
          id: null,
          name: formatBeerWineName(drink.name, abv, isBeer ? activeBeerSize.short : null),
        };
      }

      const drink_item_id = await resolveItem('memoir_drink_items', selection, {
        drink_type: drinkType,
      });
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
        city: city || null,
        country: country || null,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const hasLocation = !!(city || country);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editId ? 'Edit drink' : 'Add drink'}
      footer={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            type="button"
            className="basis-2/5"
            onClick={() => setScannerOpen(true)}
          >
            <ScanLine size={16} />
            Scan
          </Button>
          <Button className="basis-3/5" onClick={submit} disabled={!canSave || busy}>
            {editId ? 'Save changes' : 'Add drink'}
          </Button>
        </div>
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

        <Field label="Location" optional>
          <div className="space-y-2">
            {hasLocation && (
              <div className="flex items-center justify-between rounded-xl bg-surface-alt px-3.5 py-2.5">
                <span className="flex items-center gap-2 text-[15px]">
                  <MapPin size={15} className="text-primary" />
                  <span>
                    {[city, country].filter(Boolean).join(', ')}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={clearLocation}
                  className="text-text-muted hover:text-text"
                  aria-label="Clear location"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {geoError && <p className="text-xs text-danger">{geoError}</p>}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={useMyLocation}
                disabled={geoLoading}
              >
                <MapPin size={16} />
                {geoLoading ? 'Locating…' : 'Use my location'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setVenuePickerOpen(true)}
                disabled={geoLoading}
              >
                <MapPin size={16} />
                Find nearby
              </Button>
            </div>
          </div>
        </Field>
      </div>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onProduct={applyScannedProduct}
      />

      <NearbyVenuePicker
        open={venuePickerOpen}
        onClose={() => setVenuePickerOpen(false)}
        onSelect={onVenuePicked}
      />
    </Sheet>
  );
}
