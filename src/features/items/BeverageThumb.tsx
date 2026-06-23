import { useEffect, useState } from 'react';
import { Wine } from 'lucide-react';
import { useBeverageImage } from '@/hooks/useBeverageImage';

/**
 * Square thumbnail for a beverage, sourced from its Open Food Facts photo.
 * Falls back to a placeholder icon while loading, when no photo is found, or
 * when the resolved image fails to load.
 */
export function BeverageThumb({ name }: { name: string }) {
  const { data: src } = useBeverageImage(name);
  const [failed, setFailed] = useState(false);

  // A new resolved URL gets a fresh chance to load.
  useEffect(() => setFailed(false), [src]);

  const showImage = !!src && !failed;

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-alt">
      {showImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Wine size={20} className="text-text-muted opacity-50" />
      )}
    </div>
  );
}
