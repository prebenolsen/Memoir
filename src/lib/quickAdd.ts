import { create } from 'zustand';

export type AddKind = 'food' | 'drink' | 'activity' | 'purchase';

interface QuickAddState {
  /** Which add-sheet is open, or null. */
  kind: AddKind | null;
  /** Entry id being edited, if any (null = new). */
  editId: string | null;
  open: (kind: AddKind, editId?: string | null) => void;
  close: () => void;
}

export const useQuickAdd = create<QuickAddState>((set) => ({
  kind: null,
  editId: null,
  open: (kind, editId = null) => set({ kind, editId }),
  close: () => set({ kind: null, editId: null }),
}));
