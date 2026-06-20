import { useState } from 'react';
import { UtensilsCrossed, Store } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ItemListView } from '@/features/items/ItemListView';

type Tab = 'food' | 'restaurant';

export function FoodScreen() {
  const [tab, setTab] = useState<Tab>('food');

  return (
    <div className="space-y-4">
      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'food', label: 'Foods' },
          { value: 'restaurant', label: 'Restaurants' },
        ]}
      />

      {tab === 'food' ? (
        <ItemListView
          kind="food"
          emptyIcon={UtensilsCrossed}
          emptyText="Foods you log will be saved here with how often you've eaten them and your average rating."
          countLabel={(n) => `Eaten ${n}×`}
        />
      ) : (
        <ItemListView
          kind="restaurant"
          emptyIcon={Store}
          emptyText="Restaurants and cafes you visit are saved here with your visit count and average rating."
          countLabel={(n) => `${n} visit${n === 1 ? '' : 's'}`}
        />
      )}
    </div>
  );
}
