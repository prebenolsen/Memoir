/**
 * Nearby place lookups via the OpenStreetMap Overpass API.
 * Free, no API key, CORS-friendly — suits this client-only app.
 *
 * Results are blended with user-contributed "community" venues (see
 * communityVenues.ts) so places missing from OpenStreetMap still surface.
 */

import {
  findNearbyCommunityVenues,
  type CommunityCategory,
  type NearbyCommunityVenue,
} from '@/lib/communityVenues';

export interface NearbyPlace {
  /** OSM element id ("node/123") or "community/<uuid>" — dedupes a saved venue. */
  osmId: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  /** True when contributed by a user (not from OpenStreetMap). */
  community?: boolean;
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

async function overpassQuery(query: string): Promise<OverpassElement[]> {
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
  return json.elements ?? [];
}

interface Located {
  name: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  community?: boolean;
}

/**
 * Fold user-contributed venues into an OSM result set: drop any community row
 * that duplicates an OSM place (same name within 60 m), tag the rest as
 * community, and re-sort by distance. A gazetteer hiccup never sinks the OSM
 * results — on failure the original list is returned untouched.
 */
async function withCommunityVenues<T extends Located>(
  osm: T[],
  latitude: number,
  longitude: number,
  category: CommunityCategory,
  radius: number,
  build: (v: NearbyCommunityVenue) => T,
): Promise<T[]> {
  let community: NearbyCommunityVenue[];
  try {
    community = await findNearbyCommunityVenues(latitude, longitude, category, { radius });
  } catch {
    return osm;
  }
  const extras = community
    .filter((c) => {
      const lower = c.name.trim().toLowerCase();
      return !osm.some(
        (p) =>
          p.name.trim().toLowerCase() === lower &&
          haversineMeters(c.latitude, c.longitude, p.latitude, p.longitude) < 60,
      );
    })
    .map(build);
  return [...osm, ...extras].sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Find food venues (restaurants, cafes, fast food) within `radius` metres,
 * sorted by distance and capped at 25 results.
 */
export async function findNearbyFoodVenues(
  latitude: number,
  longitude: number,
  { radius = 200 }: { radius?: number } = {},
): Promise<NearbyPlace[]> {
  const filter = '["amenity"~"^(restaurant|cafe|fast_food)$"]["name"]';
  const around = `(around:${radius},${latitude},${longitude})`;
  const query = `[out:json][timeout:25];(node${filter}${around};way${filter}${around};);out center 60;`;

  const elements = await overpassQuery(query);
  const places: NearbyPlace[] = [];
  for (const el of elements) {
    const name = el.tags?.name;
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!name || lat == null || lon == null) continue;
    places.push({
      osmId: `${el.type}/${el.id}`,
      name,
      address: formatAddress(el.tags ?? {}),
      latitude: lat,
      longitude: lon,
      distanceMeters: haversineMeters(latitude, longitude, lat, lon),
    });
  }
  places.sort((a, b) => a.distanceMeters - b.distanceMeters);
  const merged = await withCommunityVenues(
    places,
    latitude,
    longitude,
    'food',
    radius,
    (v) => ({
      osmId: `community/${v.id}`,
      name: v.name,
      address: v.address,
      latitude: v.latitude,
      longitude: v.longitude,
      distanceMeters: v.distanceMeters,
      community: true,
    }),
  );
  return merged.slice(0, 25);
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
  /** True when contributed by a user (not from OpenStreetMap). */
  community?: boolean;
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

  const elements = await overpassQuery(query);
  const venues: NearbyVenue[] = [];
  for (const el of elements) {
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
  const merged = await withCommunityVenues(
    venues,
    latitude,
    longitude,
    'drink',
    radius,
    (v) => ({
      osmId: `community/${v.id}`,
      name: v.name,
      amenityType: 'bar',
      address: v.address,
      latitude: v.latitude,
      longitude: v.longitude,
      distanceMeters: v.distanceMeters,
      community: true,
    }),
  );
  return merged.slice(0, 25);
}
