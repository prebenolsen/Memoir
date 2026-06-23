import { drinkSearchTerm } from './format';

interface OFFSearchProduct {
  image_front_small_url?: string;
  image_small_url?: string;
}

interface OFFSearchResponse {
  products?: OFFSearchProduct[];
}

/**
 * Find a thumbnail photo for a beverage on Open Food Facts by name. Returns a
 * small image URL, or null when nothing usable is found. Network and parse
 * errors resolve to null so a missing photo simply falls back to the placeholder.
 */
export async function lookupBeverageImage(name: string): Promise<string | null> {
  const term = drinkSearchTerm(name);
  if (!term) return null;

  const url =
    'https://world.openfoodfacts.org/cgi/search.pl' +
    `?search_terms=${encodeURIComponent(term)}` +
    '&search_simple=1&action=process&json=1&page_size=1' +
    '&fields=image_front_small_url,image_small_url';

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json: OFFSearchResponse = await res.json();
    const p = json.products?.[0];
    return p?.image_front_small_url || p?.image_small_url || null;
  } catch {
    return null;
  }
}
