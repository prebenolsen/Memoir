import { useEffect, useState } from 'react';
import { MapPin, UtensilsCrossed } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Combobox, type ComboValue } from '@/components/ui/Combobox';
import { RatingInput } from '@/components/ui/RatingInput';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DateField } from '@/components/ui/DateField';
import { useProject } from '@/context/ProjectProvider';
import { useSettings } from '@/context/SettingsProvider';
import { useEntryMutations } from '@/hooks/useEntryMutations';
import { resolveItem } from '@/hooks/useItems';
import { supabase } from '@/lib/supabase';
import { newId, titleCase } from '@/lib/format';
import { MEAL_TYPES, FOOD_SOURCES, type FoodEntry, type MealType, type FoodSource } from '@/types/db';
import { useEditingEntry } from './useEditingEntry';
import { NearbyRestaurantPicker } from './NearbyRestaurantPicker';
import { MapRestaurantPicker } from './MapRestaurantPicker';
import type { NearbyPlace } from '@/lib/nearbyPlaces';

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
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [source, setSource] = useState<FoodSource>('restaurant');
  const [food, setFood] = useState<ComboValue | null>(null);
  const [restaurant, setRestaurant] = useState<ComboValue | null>(null);
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
      setMealType(editing.meal_type);
      setSource(editing.source);
      setFood(null);
      setRestaurant(null);
      setPickedPlace(null);
      setStarter(editing.starter ?? '');
      setMain(editing.main_course ?? '');
      setDessert(editing.dessert ?? '');
      setShowCourses(!!(editing.starter || editing.main_course || editing.dessert));
      setRating(editing.rating);
      setCost(editing.cost);
      setNotes(editing.notes ?? '');
    } else if (!editId) {
      setEntryDate(date);
      setMealType('lunch');
      setSource('restaurant');
      setFood(null);
      setRestaurant(null);
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
      if (editing.restaurant_id) {
        const { data } = await supabase
          .from('memoir_restaurants')
          .select('id,name')
          .eq('id', editing.restaurant_id)
          .maybeSingle();
        if (!cancelled && data) setRestaurant({ id: data.id, name: data.name });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editing]);

  const hasFood = !!food?.name || (showCourses && !!(starter || main || dessert));
  const canSave = !!project && (source === 'home' ? hasFood : !!restaurant?.name);

  const submit = async () => {
    if (!project || busy) return;
    setBusy(true);
    try {
      const food_item_id = await resolveItem('memoir_food_items', food);
      // Pass through GPS-picked location when it still matches the chosen name.
      const placeMatches =
        !!pickedPlace && !!restaurant && pickedPlace.name === restaurant.name;
      const restaurant_id =
        source === 'home'
          ? null
          : await resolveItem('memoir_restaurants', restaurant, {
              source,
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
        meal_type: mealType,
        source,
        food_item_id,
        restaurant_id,
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
          <Field label={source === 'cafe' ? 'Cafe' : 'Restaurant'}>
            <div className="space-y-2">
              <Combobox
                table="memoir_restaurants"
                value={restaurant}
                onChange={(v) => {
                  setRestaurant(v);
                  setPickedPlace(null);
                }}
                placeholder="Where?"
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setPickerOpen(true)}
                >
                  <MapPin size={16} />
                  Find nearby restaurants
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setMapPickerOpen(true)}
                >
                  <MapPin size={16} />
                  Find restaurants
                </Button>
              </div>
            </div>
          </Field>
        )}

        <Field label="Rating">
          <RatingInput value={rating} onChange={setRating} scale={settings.rating_scale} />
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
            <DateField value={entryDate} onChange={setEntryDate} />
          </Field>
        </div>

        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </Field>
      </div>

      <NearbyRestaurantPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(place) => {
          setRestaurant({ id: null, name: place.name });
          setPickedPlace(place);
          if (place.source !== source) setSource(place.source);
        }}
      />
      <MapRestaurantPicker
        open={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        onSelect={(place) => {
          setRestaurant({ id: null, name: place.name });
          setPickedPlace(place);
          if (place.source !== source) setSource(place.source);
        }}
      />
    </Sheet>
  );
}
