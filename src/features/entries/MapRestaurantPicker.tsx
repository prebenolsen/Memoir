import { useCallback, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { Coffee, MapPin, UtensilsCrossed, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { findNearbyRestaurants, NearbyError, type NearbyPlace } from '@/lib/nearbyPlaces';
import type { Map as LeafletMap, LatLng } from 'leaflet';

const RADIUS = 200;

function formatDistance(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

/** Tracks map center changes and exposes the current center via a ref. */
function MapCenterTracker({ centerRef }: { centerRef: React.MutableRefObject<LatLng | null> }) {
  useMapEvents({
    move(e) {
      centerRef.current = e.target.getCenter();
    },
  });
  return null;
}

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; places: NearbyPlace[] };

export function MapRestaurantPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (place: NearbyPlace) => void;
}) {
  const centerRef = useRef<LatLng | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [search, setSearch] = useState<SearchState>({ status: 'idle' });

  const handleSearch = useCallback(async () => {
    const center = centerRef.current ?? mapRef.current?.getCenter();
    if (!center) return;
    setSearch({ status: 'loading' });
    try {
      const places = await findNearbyRestaurants(center.lat, center.lng, { radius: RADIUS });
      setSearch({ status: 'ready', places });
    } catch (err) {
      const message =
        err instanceof NearbyError ? err.message : 'Something went wrong finding restaurants.';
      setSearch({ status: 'error', message });
    }
  }, []);

  const reset = useCallback(() => setSearch({ status: 'idle' }), []);

  return (
    <Sheet open={open} onClose={onClose} title="Find restaurants">
      {/* Map */}
      <div className="relative -mx-4 h-64 overflow-hidden">
        {open && (
          <MapContainer
            center={[48.8566, 2.3522]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenterTracker centerRef={centerRef} />
          </MapContainer>
        )}
        {/* Fixed crosshair pin at center */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <MapPin
            size={32}
            className="-mt-4 text-primary drop-shadow-md"
            style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }}
          />
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-text-muted">
        Move the map to the area you want to search, then tap Search here.
      </p>

      <div className="mt-3 flex gap-2">
        <Button
          block
          onClick={handleSearch}
          disabled={search.status === 'loading'}
        >
          {search.status === 'loading' ? 'Searching…' : `Search here (${RADIUS} m)`}
        </Button>
        {search.status !== 'idle' && (
          <Button variant="secondary" onClick={reset} aria-label="Clear results">
            <X size={16} />
          </Button>
        )}
      </div>

      {/* Results */}
      {search.status === 'error' && (
        <p className="mt-4 text-center text-sm text-text-muted">{search.message}</p>
      )}

      {search.status === 'ready' && search.places.length === 0 && (
        <p className="mt-4 text-center text-sm text-text-muted">
          No restaurants or cafes found within {RADIUS} m of that spot.
        </p>
      )}

      {search.status === 'ready' && search.places.length > 0 && (
        <ul className="mt-3 space-y-1">
          {search.places.map((place) => (
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
                  {place.source === 'cafe' ? <Coffee size={16} /> : <UtensilsCrossed size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-text">
                    {place.name}
                  </span>
                  {place.address && (
                    <span className="block truncate text-xs text-text-muted">{place.address}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-text-muted">
                  {formatDistance(place.distanceMeters)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
