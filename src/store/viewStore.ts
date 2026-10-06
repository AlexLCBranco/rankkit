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

/** The marquee being dragged out, in pixels inside the matrix. */
export interface MarqueeBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Which picture of the board is on screen. All three read the same board. */
export const VIEW_MODES = ["matrix", "list", "table"] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

/** Remembered per browser, like Vennkit's view; never part of a board. */
const MODE_KEY = "rankkit:view";

function loadMode(): ViewMode {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    return VIEW_MODES.find((m) => m === saved) ?? "matrix";
  } catch {
    return "matrix";
  }
}

interface ViewStore {
  readonly mode: ViewMode;
  /** The last card picked: what Delete and the card menu act on alone. */
  readonly selectedId: CardId | null;
  /** Every picked card (one, or a group from the marquee or Shift+click),
      in the order they were picked; `selectedId` is the last one. */
  readonly selectedIds: readonly CardId[];
  readonly editingId: CardId | null;
  /** The axis label or quadrant name being renamed. */
  readonly editingLabel: LabelKey | null;
  /** A card hovered in the buckets panel, highlighted on the matrix. */
  readonly hoveredId: CardId | null;
  readonly drag: DragState | null;
  readonly marquee: MarqueeBox | null;
  setMode(mode: ViewMode): void;
  select(id: CardId | null): void;
  /** Picks a whole group at once. */
  selectMany(ids: readonly CardId[]): void;
  edit(id: CardId | null): void;
  editLabel(key: LabelKey | null): void;
  hover(id: CardId | null): void;
  setDrag(drag: DragState | null): void;
  setMarquee(marquee: MarqueeBox | null): void;
}

export const useViewStore = create<ViewStore>()((set) => ({
  mode: loadMode(),
  selectedId: null,
  selectedIds: [],
  editingId: null,
  editingLabel: null,
  hoveredId: null,
  drag: null,
  marquee: null,
  setMode: (mode) => {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      // Private windows may refuse; the choice just isn't remembered.
    }
    set({ mode, editingId: null, editingLabel: null, hoveredId: null, marquee: null });
  },
  select: (id) => set({ selectedId: id, selectedIds: id ? [id] : [] }),
  selectMany: (ids) => set({ selectedId: ids.at(-1) ?? null, selectedIds: ids }),
  edit: (editingId) =>
    set(editingId ? { editingId, selectedId: editingId, selectedIds: [editingId] } : { editingId }),
  editLabel: (editingLabel) => set({ editingLabel }),
  hover: (hoveredId) => set({ hoveredId }),
  setDrag: (drag) => set({ drag }),
  setMarquee: (marquee) => set({ marquee }),
}));

/** Whether several cards are picked as a group. */
export const isGroup = (s: { readonly selectedIds: readonly CardId[] }) => s.selectedIds.length > 1;
