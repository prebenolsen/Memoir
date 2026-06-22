import { useQuickAdd, type DrinkPreFill } from '@/lib/quickAdd';
import { type BarcodeProduct } from '@/lib/barcodeProduct';
import { FoodEntrySheet } from './FoodEntrySheet';
import { DrinkEntrySheet } from './DrinkEntrySheet';
import { ActivityEntrySheet } from './ActivityEntrySheet';
import { PurchaseEntrySheet } from './PurchaseEntrySheet';
import { BarcodeScanner } from './BarcodeScanner';

function productToPreFill(p: BarcodeProduct): DrinkPreFill {
  return {
    drinkType: p.drinkType ?? 'beer',
    wineStyle: p.wineStyle ?? undefined,
    name: p.name || undefined,
    abv: p.abv ?? undefined,
    beerSizeKey: p.beerSizeKey ?? undefined,
  };
}

/** Renders the quick-add entry sheets and global barcode scanner, driven by the quick-add store. */
export function GlobalAddSheets() {
  const { kind, editId, preFill, scannerOpen, open, close, closeScanner } = useQuickAdd();

  const handleScannedProduct = (product: BarcodeProduct) => {
    closeScanner();
    open('drink', null, productToPreFill(product));
  };

  return (
    <>
      <FoodEntrySheet open={kind === 'food'} editId={editId} onClose={close} />
      <DrinkEntrySheet
        open={kind === 'drink'}
        editId={editId}
        preFill={preFill}
        onClose={close}
      />
      <ActivityEntrySheet open={kind === 'activity'} editId={editId} onClose={close} />
      <PurchaseEntrySheet open={kind === 'purchase'} editId={editId} onClose={close} />
      <BarcodeScanner
        open={scannerOpen}
        onClose={closeScanner}
        onProduct={handleScannedProduct}
      />
    </>
  );
}
