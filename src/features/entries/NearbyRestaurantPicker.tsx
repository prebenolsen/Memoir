import { useCallback, useEffect, useState } from 'react';
import { MapPin, UtensilsCrossed } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { getCurrentPosition, GeoError } from '@/lib/geo';
import { findNearbyFoodVenues, NearbyError, type NearbyPlace } from '@/lib/nearbyPlaces';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; places: NearbyPlace[]; radius: number };

const BASE_RADIUS = 200;

function formatDistance(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

export function NearbyRestaurantPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (place: NearbyPlace) => void;
}) {
  const [state, setState] = useState<State>({ status: 'loading' });

  const run = useCallback(async (radius: number) => {
    setState({ status: 'loading' });
    try {
      const { latitude, longitude } = await getCurrentPosition();
      const places = await findNearbyFoodVenues(latitude, longitude, { radius });
      setState({ status: 'ready', places, radius });
    } catch (err) {
      const message =
        err instanceof GeoError || err instanceof NearbyError
          ? err.message
          : 'Something went wrong finding nearby venues.';
      setState({ status: 'error', message });
    }
  }, []);

  useEffect(() => {
    if (open) run(BASE_RADIUS);
  }, [open, run]);

  return (
    <Sheet open={open} onClose={onClose} title="Find nearby venues">
      {state.status === 'loading' && (
        <div className="py-10 text-center text-sm text-text-muted">
          <MapPin className="mx-auto mb-2 animate-pulse text-primary" size={24} />
          Finding venues near you…
        </div>
      )}

      {state.status === 'error' && (
        <div className="py-8 text-center">
          <p className="text-sm text-text-muted">{state.message}</p>
          <Button variant="secondary" className="mt-4" onClick={() => run(BASE_RADIUS)}>
            Try again
          </Button>
        </div>
      )}

      {state.status === 'ready' && state.places.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-text-muted">No venues found within {formatDistance(state.radius)}.</p>
          <Button variant="secondary" className="mt-4" onClick={() => run(state.radius * 2)}>
            Search wider
          </Button>
        </div>
      )}

      {state.status === 'ready' && state.places.length > 0 && (
        <ul className="space-y-1">
          {state.places.map((place) => (
            <li key={place.osmId}>
              <button
                type="button"
                onClick={() => {
                  onSelect(place);
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-alt"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-alt text-text-muted">
                  <UtensilsCrossed size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-text">{place.name}</span>
                  {place.address && (
                    <span className="block truncate text-xs text-text-muted">{place.address}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-text-muted">{formatDistance(place.distanceMeters)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
