import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { latLngBounds } from 'leaflet';
import type { MapPoint } from '@/features/stats/hooks/useBeverageStats';

/** Resolve a theme CSS variable (e.g. "--accent") to an `rgb()` string for SVG. */
function themeColor(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw ? `rgb(${raw})` : fallback;
}

/** Frame the map around every point each time the set changes. */
function FitPoints({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lon], 14);
      return;
    }
    map.fitBounds(latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number])), {
      padding: [28, 28],
      maxZoom: 15,
    });
  }, [map, points]);
  return null;
}

export function DrinkMap({ points }: { points: MapPoint[] }) {
  const accent = themeColor('--accent', 'rgb(196 154 74)');
  const center: [number, number] = points.length
    ? [points[0].lat, points[0].lon]
    : [48.8566, 2.3522];

  return (
    <div className="-mx-0 h-64 overflow-hidden rounded-2xl border border-border">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitPoints points={points} />
        {points.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lon]}
            radius={7}
            pathOptions={{ color: '#fff', weight: 2, fillColor: accent, fillOpacity: 0.9 }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <span className="font-medium">{p.name}</span>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
