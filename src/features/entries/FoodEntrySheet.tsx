import { useEffect, useState } from 'react';
import { MapPin, UtensilsCrossed } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Combobox, type ComboValue } from '@/components/ui/Combobox';
import { RatingField } from './RatingField';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DateField } from '@/components/ui/DateField';
import { useProject } from '@/context/ProjectProvider';
import { useSettings } from '@/context/SettingsProvider';
import { useEntryMutations } from '@/features/entries/hooks/useEntryMutations';
import { resolveItem } from '@/hooks/useItems';
import { supabase } from '@/lib/supabase';
import { combineDateTime, newId, nowTime, timeFromISO, titleCase } from '@/lib/format';
import {
  MEAL_TYPES,
  FOOD_SOURCES,
  SNACK_TYPES,
  type FoodEntry,
  type MealType,
  type FoodSource,
  type SnackType,
} from '@/types/db';
import { useEditingEntry } from './hooks/useEditingEntry';
import { NearbyRestaurantPicker } from './NearbyRestaurantPicker';
import { MapRestaurantPicker } from './MapRestaurantPicker';
import type { NearbyPlace } from '@/lib/nearbyPlaces';

function defaultsByTime(): { mealType: MealType; source: FoodSource } {
  const hour = new Date().getHours();
  if (hour < 12) return { mealType: 'breakfast', source: 'home' };
  if (hour < 16) return { mealType: 'lunch', source: 'venue' };
  return { mealType: 'dinner', source: 'venue' };
}

export function FoodEntrySheet({
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
  const { data: editing } = useEditingEntry<FoodEntry>('memoir_food_entries', editId);

  const [entryDate, setEntryDate] = useState(date);
  const [entryTime, setEntryTime] = useState(nowTime());
  const [mealType, setMealType] = useState<MealType>(() => defaultsByTime().mealType);
  const [snackType, setSnackType] = useState<SnackType>('ice_cream');
  const [source, setSource] = useState<FoodSource>(() => defaultsByTime().source);
  const [food, setFood] = useState<ComboValue | null>(null);
  const [venue, setVenue] = useState<ComboValue | null>(null);
  const [pickedPlace, setPickedPlace] = useState<NearbyPlace | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [showCourses, setShowCourses] = useState(false);
  const [starter, setStarter] = useState('');
  const [main, setMain] = useState('');
  const [dessert, setDessert] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setEntryDate(editing.entry_date);
      setEntryTime(timeFromISO(editing.created_at));
      setMealType(editing.meal_type);
      setSnackType(editing.snack_type ?? 'ice_cream');
      setSource(editing.source);
      setFood(null);
      setVenue(null);
      setPickedPlace(null);
      setStarter(editing.starter ?? '');
      setMain(editing.main_course ?? '');
      setDessert(editing.dessert ?? '');
      setShowCourses(!!(editing.starter || editing.main_course || editing.dessert));
      setRating(editing.rating);
      setCost(editing.cost);
      setNotes(editing.notes ?? '');
    } else if (!editId) {
      const defaults = defaultsByTime();
      setEntryDate(date);
      setEntryTime(nowTime());
      setMealType(defaults.mealType);
      setSnackType('ice_cream');
      setSource(defaults.source);
      setFood(null);
      setVenue(null);
      setPickedPlace(null);
      setShowCourses(false);
      setStarter('');
      setMain('');
      setDessert('');
      setRating(null);
      setCost(null);
      setNotes('');
    }
  }, [open, editing, editId, date]);

  // Names of linked items for editing display.
  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    (async () => {
      if (editing.food_item_id) {
        const { data } = await supabase
          .from('memoir_food_items')
          .select('id,name')
          .eq('id', editing.food_item_id)
          .maybeSingle();
        if (!cancelled && data) setFood({ id: data.id, name: data.name });
      }
      if (editing.venue_id) {
        const { data } = await supabase
          .from('memoir_venues')
          .select('id,name')
          .eq('id', editing.venue_id)
          .maybeSingle();
        if (!cancelled && data) setVenue({ id: data.id, name: data.name });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editing]);

  const hasFood = !!food?.name || (showCourses && !!(starter || main || dessert));
  const canSave = !!project && (source === 'home' ? hasFood : !!venue?.name);

  const submit = async () => {
    if (!project || busy) return;
    setBusy(true);
    try {
      const food_item_id = await resolveItem('memoir_food_items', food);
      const placeMatches =
        !!pickedPlace && !!venue && pickedPlace.name === venue.name;
      const venue_id =
        source === 'home'
          ? null
          : await resolveItem('memoir_venues', venue, {
              ...(placeMatches && pickedPlace
                ? {
                    latitude: pickedPlace.latitude,
                    longitude: pickedPlace.longitude,
                    address: pickedPlace.address,
                    osm_id: pickedPlace.osmId,
                  }
                : {}),
            });
      await save('memoir_food_entries', editId ?? newId(), {
        project_id: project.id,
        entry_date: entryDate,
        created_at: combineDateTime(entryDate, entryTime, editing?.created_at),
        meal_type: mealType,
        snack_type: mealType === 'snack' ? snackType : null,
        source,
        food_item_id,
        venue_id,
        starter: starter || null,
        main_course: main || null,
        dessert: dessert || null,
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
      title={editId ? 'Edit food' : 'Add food'}
      footer={
        <Button block onClick={submit} disabled={!canSave || busy}>
          {editId ? 'Save changes' : 'Add food'}
        </Button>
      }
    >
      <div className="space-y-4">
        <SegmentedControl
          value={mealType}
          onChange={setMealType}
          options={MEAL_TYPES.map((m) => ({ value: m, label: titleCase(m) }))}
        />

        {mealType === 'snack' && (
          <Field label="Snack type">
            <Select
              value={snackType}
              onChange={setSnackType}
              options={SNACK_TYPES}
              className="w-full"
            />
          </Field>
        )}

        <SegmentedControl
          value={source}
          onChange={setSource}
          options={FOOD_SOURCES.map((s) => ({ value: s, label: titleCase(s) }))}
        />

        <Field label="What did you eat?">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              {showCourses ? (
                <div className="space-y-3">
                  <Input
                    value={starter}
                    onChange={(e) => setStarter(e.target.value)}
                    placeholder="Starter"
                  />
                  <Input
                    value={main}
                    onChange={(e) => setMain(e.target.value)}
                    placeholder="Main course"
                  />
                  <Input
                    value={dessert}
                    onChange={(e) => setDessert(e.target.value)}
                    placeholder="Dessert"
                  />
                </div>
              ) : (
                <Combobox
                  table="memoir_food_items"
                  value={food}
                  onChange={setFood}
                  placeholder="e.g. Steak"
                />
              )}
            </div>
            <Button
              variant={showCourses ? 'primary' : 'secondary'}
              size="sm"
              type="button"
              className="shrink-0"
              onClick={() => setShowCourses((v) => !v)}
              aria-pressed={showCourses}
              title="Multiple courses"
            >
              <UtensilsCrossed size={16} />
              Courses
            </Button>
          </div>
        </Field>

        {source !== 'home' && (
          <Field label="Where did you eat?">
            <div className="space-y-2">
              <Combobox
                table="memoir_venues"
                value={venue}
                onChange={(v) => {
                  setVenue(v);
                  setPickedPlace(null);
                }}
                placeholder="e.g. Joe's Diner"
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setPickerOpen(true)}
                >
                  <MapPin size={16} />
                  Find nearby venues
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setMapPickerOpen(true)}
                >
                  <MapPin size={16} />
                  Find venues
                </Button>
              </div>
            </div>
          </Field>
        )}

        <Field label="Rate the venue">
          <RatingField value={rating} onChange={setRating} />
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

        <Field label="Notes" hint="Private — only you can see this. Never shared with friends.">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </Field>
      </div>

      <NearbyRestaurantPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(place) => {
          setVenue({ id: null, name: place.name });
          setPickedPlace(place);
          setSource('venue');
        }}
      />
      <MapRestaurantPicker
        open={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        onSelect={(place) => {
          setVenue({ id: null, name: place.name });
          setPickedPlace(place);
          setSource('venue');
        }}
      />
    </Sheet>
  );
}
