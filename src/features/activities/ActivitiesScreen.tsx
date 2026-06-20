import { Plus, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ItemListView } from '@/features/items/ItemListView';
import { useQuickAdd } from '@/lib/quickAdd';

export function ActivitiesScreen() {
  const openAdd = useQuickAdd((s) => s.open);
  return (
    <div className="space-y-4">
      <Button block size="lg" onClick={() => openAdd('activity')}>
        <Plus size={18} /> Add activity
      </Button>
      <ItemListView
        kind="activity"
        emptyIcon={Ticket}
        emptyText="Activities you log are saved here with how many times you've done them and your average rating."
        countLabel={(n) => `Done ${n}×`}
      />
    </div>
  );
}
