import { BEER_SIZES, type DrinkType, type WineStyle } from '@/types/db';

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
  categories_tags?: string[];
  nutriments?: OFFNutriments;
  quantity?: string;
}

interface OFFResponse {
  status: 0 | 1;
  product?: OFFProduct;
}

function detectDrinkType(tags: string[]): DrinkType | null {
  const joined = tags.join(',');
  if (/en:(beers|ales|lagers|stouts|pilsners|craft-beers|wheat-beers|porters)/.test(joined))
    return 'beer';
  if (/en:(wines|red-wines|white-wines|ros[eé]-wines|sparkling-wines)/.test(joined)) return 'wine';
  return null;
}

function detectWineStyle(tags: string[]): WineStyle | null {
  const joined = tags.join(',');
  if (/en:sparkling-wines|en:champagne|en:prosecco|en:cava/.test(joined)) return 'sparkling';
  if (/en:red-wines/.test(joined)) return 'red';
  if (/en:white-wines/.test(joined)) return 'white';
  if (/en:ros[eé]-wines/.test(joined)) return 'rose';
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

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  let res: Response;
  try {
    res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
  } catch {
    throw new Error('Could not reach product database. Check your connection.');
  }
  if (!res.ok) throw new Error('Product lookup failed — try again.');

  const json: OFFResponse = await res.json();
  if (json.status !== 1 || !json.product) return null;

  const p = json.product;
  const name = (p.product_name || p.product_name_en || '').trim();
  if (!name) return null;

  const tags = p.categories_tags ?? [];
  const abvRaw = p.nutriments?.['alcohol_100g'];
  const abv = abvRaw != null && abvRaw > 0 ? Math.round(abvRaw * 10) / 10 : null;
  const drinkType = detectDrinkType(tags);
  const wineStyle = drinkType === 'wine' ? detectWineStyle(tags) : null;
  const beerSizeKey = drinkType === 'beer' ? parseBeerSizeKey(p.quantity) : null;

  return { name, drinkType, wineStyle, abv, beerSizeKey };
}
