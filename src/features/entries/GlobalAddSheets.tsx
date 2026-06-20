import { useQuickAdd } from '@/lib/quickAdd';
import { FoodEntrySheet } from './FoodEntrySheet';
import { DrinkEntrySheet } from './DrinkEntrySheet';
import { ActivityEntrySheet } from './ActivityEntrySheet';
import { PurchaseEntrySheet } from './PurchaseEntrySheet';

/** Renders the quick-add entry sheets, driven by the global quick-add store. */
export function GlobalAddSheets() {
  const { kind, editId, close } = useQuickAdd();
  return (
    <>
      <FoodEntrySheet open={kind === 'food'} editId={editId} onClose={close} />
      <DrinkEntrySheet open={kind === 'drink'} editId={editId} onClose={close} />
      <ActivityEntrySheet open={kind === 'activity'} editId={editId} onClose={close} />
      <PurchaseEntrySheet open={kind === 'purchase'} editId={editId} onClose={close} />
    </>
  );
}
