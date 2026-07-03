import { BEER_SIZES, type DrinkType, type WineStyle } from '@/types/db';
import { baseDrinkName } from './format';

export interface BarcodeProduct {
  name: string;
  drinkType: DrinkType | null;
  wineStyle: WineStyle | null;
  abv: number | null;
  beerSizeKey: string | null;
}

interface OFFNutriments {
  'alcohol_100g'?: number;
}

interface OFFProduct {
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  brands?: string;
  categories_tags?: string[];
  nutriments?: OFFNutriments;
  quantity?: string;
}

interface OFFResponse {
  status: 0 | 1;
  product?: OFFProduct;
}

// Label-name fallbacks for products whose OFF entry has no usable category
// tags (common for wines contributed via the mobile app). Grape varieties are
// unambiguous wine markers on a label. \b is not Unicode-aware ("rosé", "øl"),
// so word edges use \p{L} lookarounds instead.
const BEER_NAME =
  /(?<!\p{L})(?:beer|ipa|lager|stout|porter|pilsner|pils|ale|weissbier|cerveza|birra|bi[eè]re|bier|øl)(?!\p{L})/iu;
const WINE_NAME =
  /(?<!\p{L})(?:wine|vino?|vinho|wein|rosé|rosado|rosato|chardonnay|riesling|sauvignon|pinot|merlot|malbec|syrah|shiraz|grenache|tempranillo|sangiovese|zinfandel|cabernet|champagne|prosecco|cava|cr[eé]mant|spumante)(?!\p{L})/iu;
const SPIRIT_NAME =
  /(?<!\p{L})(?:whisk(?:e)?y|vodka|gin|rum|tequila|mezcal|cognac|brandy|liqueur|aquavit|akevitt)(?!\p{L})/iu;
const CIDER_NAME = /(?<!\p{L})(?:cider|sidra|cidre)(?!\p{L})/iu;
// Unaccented "rose" is ambiguous (rose lemonade, rose water) — only trusted on
// products that are demonstrably alcoholic.
const BARE_ROSE = /(?<!\p{L})rose(?!\p{L})/iu;

function detectDrinkType(tags: string[], name: string, abv: number | null): DrinkType | null {
  const joined = tags.join(',');
  if (/en:(beers|ales|lagers|stouts|pilsners|craft-beers|wheat-beers|porters)/.test(joined))
    return 'beer';
  if (/en:(wines|red-wines|white-wines|ros[eé]-wines|sparkling-wines|champagnes?)/.test(joined))
    return 'wine';
  if (/en:(spirits|whiskies|whiskys|vodkas|gins|rums|tequilas|liqueurs|brandies|cognacs)/.test(joined))
    return 'spirit';
  if (/en:(ciders|hard-seltzers|alcopops)/.test(joined)) return 'other';

  // No usable categories — read the label name instead.
  if (BEER_NAME.test(name)) return 'beer';
  if (WINE_NAME.test(name) || (abv != null && BARE_ROSE.test(name))) return 'wine';
  if (SPIRIT_NAME.test(name)) return 'spirit';
  if (CIDER_NAME.test(name)) return 'other';

  // Last resort: alcohol strength is a decent tell between the big groups.
  if (abv != null) {
    if (abv >= 16) return 'spirit';
    if (abv >= 8.5) return 'wine';
    return 'beer';
  }
  return null;
}

function detectWineStyle(tags: string[], name: string): WineStyle | null {
  const joined = tags.join(',');
  if (/en:sparkling-wines|en:champagne|en:prosecco|en:cava/.test(joined)) return 'sparkling';
  if (/en:red-wines/.test(joined)) return 'red';
  if (/en:white-wines/.test(joined)) return 'white';
  if (/en:ros[eé]-wines/.test(joined)) return 'rose';

  // Same label-name fallback as the drink type. Bare "rose" is fine here —
  // this only runs once the product is already known to be a wine.
  if (/(?<!\p{L})(?:ros[eé]|rosado|rosato)(?!\p{L})/iu.test(name)) return 'rose';
  if (/\b(?:sparkling|champagne|prosecco|cava|cr[eé]mant|spumante)\b/i.test(name)) return 'sparkling';
  if (/\b(?:red wine|vin rouge|tinto|rosso)\b/i.test(name)) return 'red';
  if (/\b(?:white wine|vin blanc|blanco|bianco)\b/i.test(name)) return 'white';
  return null;
}

function parseBeerSizeKey(quantity: string | undefined): string | null {
  if (!quantity) return null;
  const match = quantity.match(/([\d.,]+)\s*(ml|cl|l)\b/i);
  if (!match) return null;
  const num = parseFloat(match[1].replace(',', '.'));
  const unit = match[2].toLowerCase();
  const ml = unit === 'ml' ? num : unit === 'cl' ? num * 10 : num * 1000;

  let bestKey: string | null = null;
  let bestDiff = Infinity;
  for (const s of BEER_SIZES) {
    const diff = Math.abs(s.liters * 1000 - ml);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestKey = s.key;
    }
  }
  return bestDiff <= 75 ? bestKey : null;
}

// Only the fields we read — the full product document can be >100 KB, so this
// keeps the lookup fast on mobile connections.
const OFF_FIELDS = 'product_name,product_name_en,generic_name,brands,categories_tags,nutriments,quantity';

/**
 * Open Food Facts stores the same physical product under either the 12-digit
 * UPC-A code or its zero-padded 13-digit EAN form, depending on how it was
 * contributed. Scanners report one or the other, so try both spellings.
 */
function barcodeCandidates(raw: string): string[] {
  const code = raw.replace(/\D/g, '');
  if (!code) return [];
  const candidates = [code];
  if (code.length === 13 && code.startsWith('0')) candidates.push(code.slice(1));
  else if (code.length === 12) candidates.push(`0${code}`);
  return candidates;
}

async function fetchOFFProduct(code: string): Promise<OFFProduct | null> {
  let res: Response;
  try {
    res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${OFF_FIELDS}`,
      { cache: 'no-store' },
    );
  } catch {
    throw new Error('Could not reach product database. Check your connection.');
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Product lookup failed — try again.');

  const json: OFFResponse = await res.json();
  return json.status === 1 && json.product ? json.product : null;
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  let p: OFFProduct | null = null;
  for (const code of barcodeCandidates(barcode)) {
    p = await fetchOFFProduct(code);
    if (p) break;
  }
  if (!p) return null;

  // Strip any size / percentage the product database bakes into the name (e.g.
  // "Hansa Pilsner 4,7 %" → "Hansa Pilsner"); those are surfaced as the ABV and
  // size fields / input cards instead, so the stored name stays consistent.
  // Products contributed without a name often still carry a brand — better to
  // offer that than reject the scan.
  const rawName = (p.product_name || p.product_name_en || p.generic_name || '').trim();
  const name = baseDrinkName(rawName) || (p.brands ?? '').split(',')[0].trim();
  if (!name) return null;

  const tags = p.categories_tags ?? [];
  const abvRaw = p.nutriments?.['alcohol_100g'];
  const abv = abvRaw != null && abvRaw > 0 ? Math.round(abvRaw * 10) / 10 : null;
  // Detection reads every name variant the entry has — the style word is often
  // only in one of them (e.g. a French product_name but an English generic_name).
  const label = [p.product_name, p.product_name_en, p.generic_name].filter(Boolean).join(' ');
  const drinkType = detectDrinkType(tags, label, abv);
  const wineStyle = drinkType === 'wine' ? detectWineStyle(tags, label) : null;
  const beerSizeKey = drinkType === 'beer' ? parseBeerSizeKey(p.quantity) : null;

  return { name, drinkType, wineStyle, abv, beerSizeKey };
}
