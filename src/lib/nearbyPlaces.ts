/**
 * Nearby place lookups via the OpenStreetMap Overpass API.
 * Free, no API key, CORS-friendly — suits this client-only app.
 */
import type { FoodSource } from '@/types/db';

export interface NearbyPlace {
  /** OSM element id, e.g. "node/123" — used to dedupe a saved restaurant. */
  osmId: string;
  name: string;
  source: FoodSource; // 'restaurant' | 'cafe'
  address: string | null;
  latitude: number;
  longitude: number;
  distanceMeters: number;
}

export type NearbyErrorKind = 'rate_limited' | 'network' | 'server';

export class NearbyError extends Error {
  kind: NearbyErrorKind;
  constructor(kind: NearbyErrorKind, message: string) {
    super(message);
    this.name = 'NearbyError';
    this.kind = kind;
  }
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

interface OverpassTags {
  name?: string;
  amenity?: string;
  'addr:housenumber'?: string;
  'addr:street'?: string;
  'addr:city'?: string;
  [k: string]: string | undefined;
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: OverpassTags;
}

function haversineMeters(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

function formatAddress(tags: OverpassTags): string | null {
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
  const parts = [street, tags['addr:city']].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

/**
 * Find restaurants/cafes within `radius` metres of the given coordinates,
 * sorted by distance and capped at 25 results.
 */
export async function findNearbyRestaurants(
  latitude: number,
  longitude: number,
  { radius = 200 }: { radius?: number } = {},
): Promise<NearbyPlace[]> {
  const filter = '["amenity"~"^(restaurant|cafe|fast_food)$"]["name"]';
  const around = `(around:${radius},${latitude},${longitude})`;
  const query = `[out:json][timeout:25];(node${filter}${around};way${filter}${around};);out center 60;`;

  let res: Response;
  try {
    res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
  } catch {
    throw new NearbyError('network', 'Could not reach the places service. Check your connection.');
  }

  if (res.status === 429) {
    throw new NearbyError('rate_limited', 'Too many lookups right now — try again in a moment.');
  }
  if (!res.ok) {
    throw new NearbyError('server', 'The places service is unavailable right now.');
  }

  const json = (await res.json()) as { elements?: OverpassElement[] };
  const places: NearbyPlace[] = [];
  for (const el of json.elements ?? []) {
    const name = el.tags?.name;
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!name || lat == null || lon == null) continue;
    places.push({
      osmId: `${el.type}/${el.id}`,
      name,
      source: el.tags?.amenity === 'cafe' ? 'cafe' : 'restaurant',
      address: formatAddress(el.tags ?? {}),
      latitude: lat,
      longitude: lon,
      distanceMeters: haversineMeters(latitude, longitude, lat, lon),
    });
  }
  places.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return places.slice(0, 25);
}

// ---------------------------------------------------------------------------
// Nearby venue lookup (bars, pubs, etc.) for drink location tagging
// ---------------------------------------------------------------------------

export interface NearbyVenue {
  osmId: string;
  name: string;
  amenityType: string;
  address: string | null;
  latitude: number;
  longitude: number;
  distanceMeters: number;
}

/**
 * Find bars, pubs and similar venues within `radius` metres of the given
 * coordinates, sorted by distance and capped at 25 results.
 */
export async function findNearbyVenues(
  latitude: number,
  longitude: number,
  { radius = 500 }: { radius?: number } = {},
): Promise<NearbyVenue[]> {
  const filter = '["amenity"~"^(bar|pub|biergarten|nightclub|brewery|cafe)$"]["name"]';
  const around = `(around:${radius},${latitude},${longitude})`;
  const query = `[out:json][timeout:25];(node${filter}${around};way${filter}${around};);out center 60;`;

  let res: Response;
  try {
    res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
  } catch {
    throw new NearbyError('network', 'Could not reach the places service. Check your connection.');
  }

  if (res.status === 429)
    throw new NearbyError('rate_limited', 'Too many lookups right now — try again in a moment.');
  if (!res.ok)
    throw new NearbyError('server', 'The places service is unavailable right now.');

  const json = (await res.json()) as { elements?: OverpassElement[] };
  const venues: NearbyVenue[] = [];
  for (const el of json.elements ?? []) {
    const name = el.tags?.name;
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!name || lat == null || lon == null) continue;
    venues.push({
      osmId: `${el.type}/${el.id}`,
      name,
      amenityType: el.tags?.amenity ?? 'bar',
      address: formatAddress(el.tags ?? {}),
      latitude: lat,
      longitude: lon,
      distanceMeters: haversineMeters(latitude, longitude, lat, lon),
    });
  }
  venues.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return venues.slice(0, 25);
}
