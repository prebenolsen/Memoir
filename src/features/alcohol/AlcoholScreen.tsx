import { Plus, Wine } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ItemListView } from '@/features/items/ItemListView';
import { useQuickAdd } from '@/lib/quickAdd';

export function AlcoholScreen() {
  const openAdd = useQuickAdd((s) => s.open);
  return (
    <div className="space-y-4">
      <Button block size="lg" onClick={() => openAdd('drink')}>
        <Plus size={18} /> Add drink
      </Button>
      <ItemListView
        kind="drink"
        emptyIcon={Wine}
        emptyText="Drinks you log are saved here with how often you've had them and your average rating — rate the drink once, reuse it forever."
        countLabel={(n) => `${n}× consumed`}
      />
    </div>
  );
}
