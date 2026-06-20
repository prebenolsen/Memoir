import { Wine } from 'lucide-react';
import { ItemListView } from '@/features/items/ItemListView';

export function AlcoholScreen() {
  return (
    <div className="space-y-4">
      <ItemListView
        kind="drink"
        emptyIcon={Wine}
        emptyText="Drinks you log are saved here with how often you've had them and your average rating — rate the drink once, reuse it forever."
        countLabel={(n) => `${n}× consumed`}
      />
    </div>
  );
}
