import { useState } from 'react';
import { MapPinPlus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { addCommunityVenue, type CommunityCategory } from '@/lib/communityVenues';
import type { CommunityVenue } from '@/types/db';

/**
 * "Can't find it?" affordance for the nearby-venue pickers. Takes the name the
 * user types plus the search location and contributes the place to the shared
 * community gazetteer, so it shows up for everyone from then on.
 */
export function AddMissingVenue({
  getCoords,
  category,
  onAdded,
}: {
  /** Coordinates to attach — the user's fix, or the searched map centre. */
  getCoords: () => { latitude: number; longitude: number } | null;
  category: CommunityCategory;
  onAdded: (venue: CommunityVenue) => void;
}) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    const coords = getCoords();
    if (!coords) {
      setError('We need your location to add a place. Try searching first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const venue = await addCommunityVenue({ name: trimmed, category, ...coords });
      setName('');
      onAdded(venue);
    } catch {
      setError('Could not add this place right now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-surface-alt/40 p-3">
      <p className="mb-2 text-xs font-medium text-text-muted">
        Can&rsquo;t find it? Add the place you&rsquo;re at
      </p>
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name of the place"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void submit();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          className="shrink-0"
          onClick={submit}
          disabled={!name.trim() || busy}
        >
          <MapPinPlus size={16} />
          {busy ? 'Adding…' : 'Add'}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <p className="mt-2 text-xs text-text-muted">
        Uses your current location and shares this spot with other Memoir users.
      </p>
    </div>
  );
}
