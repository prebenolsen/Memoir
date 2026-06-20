import { Ticket } from 'lucide-react';
import { ItemListView } from '@/features/items/ItemListView';

export function ActivitiesScreen() {
  return (
    <div className="space-y-4">
      <ItemListView
        kind="activity"
        emptyIcon={Ticket}
        emptyText="Activities you log are saved here with how many times you've done them and your average rating."
        countLabel={(n) => `Done ${n}×`}
      />
    </div>
  );
}
