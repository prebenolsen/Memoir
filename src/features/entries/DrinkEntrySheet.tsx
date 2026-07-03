import { useEffect, useState } from 'react';
import { Beer, Home, MapPin, ScanLine, X } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Field, Textarea } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Combobox, type ComboValue } from '@/components/ui/Combobox';
import { RatingField } from './RatingField';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DateField } from '@/components/ui/DateField';
import { Stepper } from '@/components/ui/Stepper';
import { AbvInput } from '@/components/ui/AbvInput';
import { useProject } from '@/context/ProjectProvider';
import { useSettings } from '@/context/SettingsProvider';
import { useEntryMutations } from '@/features/entries/hooks/useEntryMutations';
import { resolveItem } from '@/hooks/useItems';
import { supabase } from '@/lib/supabase';
import { combineDateTime, newId, nowTime, timeFromISO, titleCase, baseDrinkName, formatAbv } from '@/lib/format';
import { cn } from '@/lib/cn';
import { getCurrentPosition, reverseGeocode, GeoError } from '@/lib/geo';
import { findNearbyVenues, type NearbyPlace } from '@/lib/nearbyPlaces';
import {
  BEER_SIZES,
  BEER_EMPTY_NAME,
  COCKTAIL_SUGGESTIONS,
  DEFAULT_ABV,
  DRINK_LOCATION_KINDS,
  DRINK_NAME_PLACEHOLDERS,
  DRINK_TYPES,
  WINE_EMPTY_NAMES,
  WINE_STYLES,
  type DrinkEntry,
  type DrinkLocationKind,
  type DrinkType,
  type WineStyle,
} from '@/types/db';
import type { DrinkPreFill } from '@/lib/quickAdd';
import { type BarcodeProduct } from '@/lib/barcodeProduct';
import { useEditingEntry } from './hooks/useEditingEntry';
import { BarcodeScanner } from './BarcodeScanner';
import { NearbyVenuePicker } from './NearbyVenuePicker';
import { MapRestaurantPicker } from './MapRestaurantPicker';

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
  const { activeProject: project, date, settings, updateProjectHome } = useProject();
  const { update: updateSettings } = useSettings();
  const { save } = useEntryMutations();
  const { data: editing } = useEditingEntry<DrinkEntry>('memoir_drink_entries', editId);

  const [entryDate, setEntryDate] = useState(date);
  const [entryTime, setEntryTime] = useState(nowTime());
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
  const [locationKind, setLocationKind] = useState<DrinkLocationKind>('home');
  const [venue, setVenue] = useState<ComboValue | null>(null);
  const [pickedVenue, setPickedVenue] = useState<NearbyPlace | null>(null);
  const [venueRating, setVenueRating] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [venuePickerOpen, setVenuePickerOpen] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setEntryDate(editing.entry_date);
      setEntryTime(timeFromISO(editing.created_at));
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
      // Older entries predate location_kind: infer from what they carry.
      setLocationKind(
        editing.location_kind ??
          (editing.venue_id ? 'venue' : editing.latitude != null ? 'location' : 'home'),
      );
      setVenue(null);
      setPickedVenue(null);
      setVenueRating(editing.venue_rating ?? null);
      setCity(editing.city ?? null);
      setCountry(editing.country ?? null);
      setLat(editing.latitude ?? null);
      setLon(editing.longitude ?? null);
      setGeoError(null);
      setDrink(null);
      if (editing.drink_item_id) {
        void supabase
          .from('memoir_drink_items')
          .select('id,name')
          .eq('id', editing.drink_item_id)
          .maybeSingle()
          .then(({ data }) => {
            if (!data) return;
            // Show the clean product name; size/ABV live in the cards & fields.
            const name =
              editing.drink_type === 'beer' || editing.drink_type === 'wine'
                ? baseDrinkName(data.name) || data.name
                : data.name;
            setDrink({ id: data.id, name });
          });
      }
    } else if (!editId) {
      setEntryDate(date);
      setEntryTime(nowTime());
      setDrinkType(preFill?.drinkType ?? 'beer');
      setWineStyle(preFill?.wineStyle ?? 'red');
      setAbv(preFill?.abv ?? null);
      setDrink(preFill?.name ? { id: null, name: preFill.name } : null);
      const sizeKey = preFill?.beerSizeKey ?? BEER_SIZES[0].key;
      setBeerSize(sizeKey);
      setBeerCount(1);
      setQuantity(1);
      setRating(null);
      setCost(null);
      setNotes('');
      setLocationKind('home');
      setVenue(null);
      setPickedVenue(null);
      setVenueRating(null);
      // Reuse this project's saved home so a "Home" drink needs no extra tap.
      const hasHome = project?.home_latitude != null && project?.home_longitude != null;
      setCity(hasHome ? (project?.home_city ?? null) : null);
      setCountry(hasHome ? (project?.home_country ?? null) : null);
      setLat(hasHome ? (project?.home_latitude ?? null) : null);
      setLon(hasHome ? (project?.home_longitude ?? null) : null);
      setGeoError(null);
    }
    // `project` is read for its saved home only; it's intentionally not a dep so a
    // background refetch (e.g. after capturing home) never resets an open form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, editId, date, preFill]);

  // Load the linked venue's name when editing a venue-tagged drink.
  useEffect(() => {
    if (!editing?.venue_id) return;
    let cancelled = false;
    void supabase
      .from('memoir_venues')
      .select('id,name')
      .eq('id', editing.venue_id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setVenue({ id: data.id, name: data.name });
      });
    return () => {
      cancelled = true;
    };
  }, [editing]);

  const isBeer = drinkType === 'beer';
  const isWine = drinkType === 'wine';
  const isCocktail = drinkType === 'cocktail';
  const tracksAbv = isBeer || isWine;
  const canSave = !!project && (!isBeer || beerCount > 0);

  const nameEmpty = !drink?.name?.trim();
  const activeBeerSize = BEER_SIZES.find((s) => s.key === beerSize) ?? BEER_SIZES[0];

  // Visual-only cards shown inside the name input: they mirror the size and ABV
  // set in the fields below (live), reminding the user to correct them there.
  // Text matches the input colour for readability; the ABV card picks up a tint
  // once a value is set (it shows the type's default, untinted, until then).
  const card = (text: string, active: boolean) => (
    <span
      className={cn(
        'rounded-md px-2 py-1 text-[15px] font-medium tabular-nums text-text',
        active ? 'bg-primary/12' : 'bg-surface-alt',
      )}
    >
      {text}
    </span>
  );
  const abvCard = card(`${formatAbv(abv ?? DEFAULT_ABV[drinkType] ?? 0)} %`, abv != null);
  const nameCards = isBeer ? (
    <>
      {card(activeBeerSize.short, false)}
      {abvCard}
    </>
  ) : isWine ? (
    abvCard
  ) : null;

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

  const applyGpsLocation = async (latitude: number, longitude: number) => {
    setGeoLoading(true);
    setGeoError(null);
    // Keep the raw fix even if reverse geocoding fails — the map only needs coords.
    setLat(latitude);
    setLon(longitude);
    try {
      const info = await reverseGeocode(latitude, longitude);
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

  const clearLocation = () => {
    setCity(null);
    setCountry(null);
    setLat(null);
    setLon(null);
    setGeoError(null);
  };

  // Apply the project's stored home, capturing & remembering it on first use.
  const applyHome = async () => {
    if (!project) return;
    if (project.home_latitude != null && project.home_longitude != null) {
      setLat(project.home_latitude);
      setLon(project.home_longitude);
      setCity(project.home_city);
      setCountry(project.home_country);
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    try {
      const { latitude, longitude } = await getCurrentPosition();
      let info = { city: null as string | null, country: null as string | null };
      try {
        info = await reverseGeocode(latitude, longitude);
      } catch {
        // Coordinates are enough; city/country are a nicety.
      }
      await updateProjectHome(project.id, { latitude, longitude, ...info });
      setLat(latitude);
      setLon(longitude);
      setCity(info.city);
      setCountry(info.country);
    } catch (err) {
      setGeoError(err instanceof GeoError ? err.message : 'Could not get your location.');
    } finally {
      setGeoLoading(false);
    }
  };

  const changeLocationKind = (kind: DrinkLocationKind) => {
    setLocationKind(kind);
    setGeoError(null);
    clearLocation();
    if (kind === 'home') void applyHome();
    if (kind !== 'venue') {
      setVenue(null);
      setPickedVenue(null);
      setVenueRating(null);
    }
  };

  // A venue chosen from the nearby list or map: name + coordinates in one tap.
  const onVenuePicked = (place: NearbyPlace) => {
    setVenue({ id: null, name: place.name });
    setPickedVenue(place);
    void applyGpsLocation(place.latitude, place.longitude);
  };

  // An existing saved venue picked from the combobox: pull its stored coordinates.
  const onVenueChange = (v: ComboValue | null) => {
    setVenue(v);
    setPickedVenue(null);
    clearLocation();
    if (!v?.id) return;
    void supabase
      .from('memoir_venues')
      .select('latitude,longitude')
      .eq('id', v.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.latitude != null && data?.longitude != null) {
          void applyGpsLocation(data.latitude, data.longitude);
        }
      });
  };

  const submit = async () => {
    if (!project || busy) return;
    setBusy(true);
    try {
      let selection = drink;
      if (nameEmpty) {
        const fallback = isWine ? WINE_EMPTY_NAMES[wineStyle] : isBeer ? BEER_EMPTY_NAME : null;
        selection = fallback ? { id: null, name: fallback } : null;
      } else if ((isBeer || isWine) && drink && !drink.id) {
        // Store only the clean product name; size and ABV are saved on the entry
        // (count columns + abv) and recomposed for display, so the same beer is
        // a single reusable item regardless of how it was served.
        const clean = baseDrinkName(drink.name);
        const fallback = isWine ? WINE_EMPTY_NAMES[wineStyle] : BEER_EMPTY_NAME;
        selection = { id: null, name: clean || fallback };
      }

      const drink_item_id = await resolveItem('memoir_drink_items', selection, {
        drink_type: drinkType,
      });

      // Resolve the venue only in Venue mode; carry coordinates from a freshly
      // picked place so the saved venue keeps its location (deduped by osm id).
      let venue_id: string | null = null;
      if (locationKind === 'venue' && venue?.name?.trim()) {
        const placeMatches = !!pickedVenue && pickedVenue.name === venue.name;
        venue_id = await resolveItem(
          'memoir_venues',
          venue,
          placeMatches && pickedVenue
            ? {
                latitude: pickedVenue.latitude,
                longitude: pickedVenue.longitude,
                address: pickedVenue.address,
                osm_id: pickedVenue.osmId,
              }
            : {},
        );
      }

      const sizeColumns = Object.fromEntries(
        BEER_SIZES.map((s) => [s.column, isBeer && s.key === beerSize ? beerCount : 0]),
      );
      await save('memoir_drink_entries', editId ?? newId(), {
        project_id: project.id,
        entry_date: entryDate,
        created_at: combineDateTime(entryDate, entryTime, editing?.created_at),
        drink_item_id,
        drink_type: drinkType,
        wine_style: isWine ? wineStyle : null,
        abv: tracksAbv ? abv : null,
        ...sizeColumns,
        quantity: isBeer ? Math.max(1, beerCount) : quantity,
        rating,
        cost,
        notes: notes || null,
        location_kind: locationKind,
        venue_id,
        venue_rating: locationKind === 'venue' ? venueRating : null,
        city: city || null,
        country: country || null,
        latitude: lat,
        longitude: lon,
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

        <Field label="What did you drink?">
          <Combobox
            table="memoir_drink_items"
            value={drink}
            onChange={setDrink}
            match={{ drink_type: drinkType }}
            placeholder={
              isBeer
                ? BEER_EMPTY_NAME
                : isWine
                  ? WINE_EMPTY_NAMES[wineStyle]
                  : DRINK_NAME_PLACEHOLDERS[drinkType]
            }
            suggestions={
              isBeer
                ? [BEER_EMPTY_NAME]
                : isWine
                  ? [WINE_EMPTY_NAMES[wineStyle]]
                  : isCocktail
                    ? COCKTAIL_SUGGESTIONS
                    : undefined
            }
            pinSuggestions={isBeer || isWine}
            trailing={nameCards}
            inputClassName={cn(
              tracksAbv && 'placeholder:italic',
              isBeer ? 'pr-36' : isWine ? 'pr-24' : '',
            )}
          />
        </Field>

        {isBeer ? (
          <Field label="Amount">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-alt/50 p-3.5">
              <Select
                value={beerSize}
                onChange={setBeerSize}
                options={BEER_SIZES.map((s) => ({ value: s.key, label: s.label }))}
              />
              <Stepper value={beerCount} onChange={setBeerCount} />
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
          <Field label="ABV (%)">
            <AbvInput value={abv} onChange={setAbv} defaultValue={DEFAULT_ABV[drinkType] ?? 12.5} />
          </Field>
        ) : (
          <div aria-hidden className="invisible">
            <Field label="ABV (%)">
              <div className="rounded-xl border border-border bg-surface-alt/50 p-3.5">
                <div className="h-11" />
              </div>
            </Field>
          </div>
        )}

        <Field label="Rate the drink">
          <RatingField value={rating} onChange={setRating} />
        </Field>

        <Field label="Where did you drink?">
          <div className="space-y-2">
            <SegmentedControl
              value={locationKind}
              onChange={changeLocationKind}
              options={DRINK_LOCATION_KINDS}
            />

            {geoError && <p className="text-xs text-danger">{geoError}</p>}

            {locationKind === 'home' && (
              <div className="flex items-center gap-2 rounded-xl bg-surface-alt px-3.5 py-2.5 text-[15px]">
                <Home size={15} className="text-primary" />
                {geoLoading ? (
                  <span className="text-text-muted">Saving this project&rsquo;s home…</span>
                ) : hasLocation ? (
                  <span>Home · {[city, country].filter(Boolean).join(', ')}</span>
                ) : (
                  <span className="text-text-muted">Home</span>
                )}
              </div>
            )}

            {locationKind === 'location' && (
              <>
                {hasLocation && (
                  <div className="flex items-center justify-between rounded-xl bg-surface-alt px-3.5 py-2.5">
                    <span className="flex items-center gap-2 text-[15px]">
                      <MapPin size={15} className="text-primary" />
                      <span>{[city, country].filter(Boolean).join(', ')}</span>
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
              </>
            )}

            {locationKind === 'venue' && (
              <>
                <Combobox
                  table="memoir_venues"
                  value={venue}
                  onChange={onVenueChange}
                  placeholder="e.g. The Dead Rabbit"
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => setVenuePickerOpen(true)}
                    disabled={geoLoading}
                  >
                    <MapPin size={16} />
                    Find nearby venues
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => setMapPickerOpen(true)}
                    disabled={geoLoading}
                  >
                    <MapPin size={16} />
                    Find venues
                  </Button>
                </div>
              </>
            )}
          </div>
        </Field>

        {locationKind === 'venue' && venue?.name?.trim() && (
          <Field label="Rate the venue" hint="The place itself — not the drink you rated above.">
            <RatingField value={venueRating} onChange={setVenueRating} showScale={false} />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label={locationKind === 'home' ? 'Store price' : 'Cost'}>
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

        <Field label="Notes" hint="Private — only you can see this. Never shared with friends.">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
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

      <MapRestaurantPicker
        open={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        onSelect={onVenuePicked}
        find={findNearbyVenues}
        radius={500}
        title="Find venues"
        Icon={Beer}
      />
    </Sheet>
  );
}
