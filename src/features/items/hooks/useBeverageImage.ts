import { useQuery } from '@tanstack/react-query';
import { lookupBeverageImage } from '@/lib/beverageImage';
import { isGenericDrinkName } from '@/lib/format';

const DAY = 1000 * 60 * 60 * 24;

/**
 * Resolve (and cache) an Open Food Facts thumbnail for a beverage by name.
 * Generated default names ("0.33l of beer" etc.) describe no real product, so
 * they skip the network call and resolve to no image.
 */
export function useBeverageImage(name: string) {
  return useQuery({
    queryKey: ['beverageImage', name],
    queryFn: () => lookupBeverageImage(name),
    enabled: !!name.trim() && !isGenericDrinkName(name),
    staleTime: DAY,
    gcTime: DAY,
    retry: false,
  });
}
