/**
 * Community venues: a shared, crowdsourced gazetteer of places (see the
 * memoir_community_venues table). Contributed by users when a spot is missing
 * from the OpenStreetMap-backed nearby search, and readable by everyone.
 */

import { supabase } from '@/lib/supabase';
import { distanceMeters } from '@/lib/geo';
import type { CommunityVenue } from '@/types/db';

export type CommunityCategory = CommunityVenue['category'];

/** A community venue resolved for a specific search point, with its distance. */
export interface NearbyCommunityVenue extends CommunityVenue {
  distanceMeters: number;
}

/** Metres of latitude per degree — good enough for a small bounding box. */
const M_PER_DEG_LAT = 111_320;

/**
 * Contribute a place to the shared gazetteer, or return the existing row if the
 * same name already sits at (roughly) the same spot. The DB unique index is the
 * real guard; the pre-check just lets us hand back the existing id on a repeat.
 */
export async function addCommunityVenue(input: {
  name: string;
  category: CommunityCategory;
  latitude: number;
  longitude: number;
  address?: string | null;
}): Promise<CommunityVenue> {
  const name = input.name.trim();
  const existing = await findMatchingCommunityVenue(name, input.category, input.latitude, input.longitude);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('memoir_community_venues')
    .insert({
      name,
      category: input.category,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address ?? null,
    })
    .select('*')
    .single();

  // A concurrent contributor may have won the race against the unique index.
  if (error) {
    const dupe = await findMatchingCommunityVenue(name, input.category, input.latitude, input.longitude);
    if (dupe) return dupe;
    throw error;
  }
  return data as CommunityVenue;
}

/** Find an already-contributed venue of the same name within ~30 m. */
async function findMatchingCommunityVenue(
  name: string,
  category: CommunityCategory,
  latitude: number,
  longitude: number,
): Promise<CommunityVenue | null> {
  const nearby = await findNearbyCommunityVenues(latitude, longitude, category, { radius: 30 });
  const lower = name.toLowerCase();
  return nearby.find((v) => v.name.trim().toLowerCase() === lower) ?? null;
}

/**
 * Community venues of a category within `radius` metres, sorted by distance.
 * A bounding-box query narrows the rows; exact haversine distance filters them,
 * mirroring how the OSM lookups measure distance client-side.
 */
export async function findNearbyCommunityVenues(
  latitude: number,
  longitude: number,
  category: CommunityCategory,
  { radius = 500 }: { radius?: number } = {},
): Promise<NearbyCommunityVenue[]> {
  const dLat = radius / M_PER_DEG_LAT;
  const dLon = radius / (M_PER_DEG_LAT * Math.cos((latitude * Math.PI) / 180) || M_PER_DEG_LAT);

  const { data, error } = await supabase
    .from('memoir_community_venues')
    .select('*')
    .eq('category', category)
    .gte('latitude', latitude - dLat)
    .lte('latitude', latitude + dLat)
    .gte('longitude', longitude - dLon)
    .lte('longitude', longitude + dLon)
    .limit(100);
  if (error) throw error;

  return ((data ?? []) as CommunityVenue[])
    .map((v) => ({
      ...v,
      distanceMeters: distanceMeters(latitude, longitude, v.latitude, v.longitude),
    }))
    .filter((v) => v.distanceMeters <= radius)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
