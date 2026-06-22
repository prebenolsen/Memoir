import { create } from 'zustand';
import type { DrinkType, WineStyle } from '@/types/db';

export type AddKind = 'food' | 'drink' | 'activity' | 'purchase';

export interface DrinkPreFill {
  drinkType?: DrinkType;
  wineStyle?: WineStyle;
  name?: string;
  abv?: number;
  beerSizeKey?: string;
}

interface QuickAddState {
  kind: AddKind | null;
  editId: string | null;
  preFill: DrinkPreFill | null;
  scannerOpen: boolean;
  open: (kind: AddKind, editId?: string | null, preFill?: DrinkPreFill | null) => void;
  close: () => void;
  openScanner: () => void;
  closeScanner: () => void;
}

export const useQuickAdd = create<QuickAddState>((set) => ({
  kind: null,
  editId: null,
  preFill: null,
  scannerOpen: false,
  open: (kind, editId = null, preFill = null) => set({ kind, editId, preFill, scannerOpen: false }),
  close: () => set({ kind: null, editId: null, preFill: null }),
  openScanner: () => set({ scannerOpen: true }),
  closeScanner: () => set({ scannerOpen: false }),
}));
