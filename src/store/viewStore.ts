import { create } from "zustand";

import type { CardId, LabelKey } from "../domain/types";

/**
 * What the screen is doing right now, as opposed to what the board holds:
 * selection, editing, hover and the drag in progress. Kept apart from the
 * board store so none of it is ever saved or undone.
 */
export interface DragState {
  readonly id: CardId;
  /** Where the floating copy of the card sits, in window pixels. */
  readonly left: number;
  readonly top: number;
  readonly width: number;
}

interface ViewStore {
  readonly selectedId: CardId | null;
  readonly editingId: CardId | null;
  /** The axis label or quadrant name being renamed. */
  readonly editingLabel: LabelKey | null;
  /** A card hovered in the buckets panel, highlighted on the matrix. */
  readonly hoveredId: CardId | null;
  readonly drag: DragState | null;
  select(id: CardId | null): void;
  edit(id: CardId | null): void;
  editLabel(key: LabelKey | null): void;
  hover(id: CardId | null): void;
  setDrag(drag: DragState | null): void;
}

export const useViewStore = create<ViewStore>()((set) => ({
  selectedId: null,
  editingId: null,
  editingLabel: null,
  hoveredId: null,
  drag: null,
  select: (selectedId) => set({ selectedId }),
  edit: (editingId) => set(editingId ? { editingId, selectedId: editingId } : { editingId }),
  editLabel: (editingLabel) => set({ editingLabel }),
  hover: (hoveredId) => set({ hoveredId }),
  setDrag: (drag) => set({ drag }),
}));
