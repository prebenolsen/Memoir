import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Combobox, type ComboValue } from '@/components/ui/Combobox';
import { RatingInput } from '@/components/ui/RatingInput';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DateField } from '@/components/ui/DateField';
import { useProject } from '@/context/ProjectProvider';
import { useEntryMutations } from '@/hooks/useEntryMutations';
import { resolveItem } from '@/hooks/useItems';
import { supabase } from '@/lib/supabase';
import { newId, titleCase } from '@/lib/format';
import { MEAL_TYPES, FOOD_SOURCES, type FoodEntry, type MealType, type FoodSource } from '@/types/db';
import { useEditingEntry } from './useEditingEntry';

export function FoodEntrySheet({
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
  const { data: editing } = useEditingEntry<FoodEntry>('memoir_food_entries', editId);

  const [entryDate, setEntryDate] = useState(date);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [source, setSource] = useState<FoodSource>('restaurant');
  const [food, setFood] = useState<ComboValue | null>(null);
  const [restaurant, setRestaurant] = useState<ComboValue | null>(null);
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

  const canSave = !!project && (!!food?.name || !!main || !!restaurant?.name);

  const submit = async () => {
    if (!project || busy) return;
    setBusy(true);
    try {
      const food_item_id = await resolveItem('memoir_food_items', food);
      const restaurant_id =
        source === 'home' ? null : await resolveItem('memoir_restaurants', restaurant, { source });
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
        <Field label="Meal">
          <SegmentedControl
            value={mealType}
            onChange={setMealType}
            options={MEAL_TYPES.map((m) => ({ value: m, label: titleCase(m) }))}
          />
        </Field>

        <Field label="Source">
          <SegmentedControl
            value={source}
            onChange={setSource}
            options={FOOD_SOURCES.map((s) => ({ value: s, label: titleCase(s) }))}
          />
        </Field>

        <Field label="Food" optional>
          <Combobox
            table="memoir_food_items"
            value={food}
            onChange={setFood}
            placeholder="e.g. Paella"
          />
        </Field>

        {source !== 'home' && (
          <Field label={source === 'cafe' ? 'Cafe' : 'Restaurant'} optional>
            <Combobox
              table="memoir_restaurants"
              value={restaurant}
              onChange={setRestaurant}
              placeholder="Where?"
            />
          </Field>
        )}

        <button
          type="button"
          onClick={() => setShowCourses((v) => !v)}
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          {showCourses ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Courses (starter / main / dessert)
        </button>
        {showCourses && (
          <div className="space-y-3">
            <Input value={starter} onChange={(e) => setStarter(e.target.value)} placeholder="Starter" />
            <Input value={main} onChange={(e) => setMain(e.target.value)} placeholder="Main course" />
            <Input value={dessert} onChange={(e) => setDessert(e.target.value)} placeholder="Dessert" />
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
