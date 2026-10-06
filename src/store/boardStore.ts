import { create } from "zustand";

import { addCard, deleteCard, moveCard, setCardColor, setCardText, setLabel } from "../domain/board";
import * as history from "../domain/history";
import { createCardId } from "../domain/ids";
import { sampleBoard } from "../domain/sample";
import type { BoardDoc, BoardState, CardId, LabelKey, PaletteColor, Point } from "../domain/types";
import { useViewStore } from "./viewStore";

/**
 * The open board: the single source of truth for cards and their places.
 * Actions are thin wrappers around the pure functions in `domain/board.ts`,
 * so this file stays small and every rule lives (and is tested) there.
 * Every change goes through `apply`, which also records it for undo, so no
 * action can forget to be undoable.
 *
 * Not saved yet: a reload starts from the sample board again.
 */
interface BoardStore {
  readonly doc: BoardDoc;
  /** Undo history. Session-only: never saved. */
  readonly history: history.History;
  /** A card just added and not yet touched by anything else: typing its
      text joins the "add" undo step, and abandoning it empty erases it. */
  readonly newCardId: CardId | null;
  /** The board as it was when a drag began; while set, moves are not
      recorded one by one, and `endGesture` records the whole drag. */
  readonly gestureStart: BoardState | null;
  /** Adds an empty card to the unsorted strip and returns its id. */
  addCard(): CardId;
  setCardText(id: CardId, text: string): void;
  moveCard(id: CardId, pos: Point | null): void;
  /** `null` takes the colour off. */
  setCardColor(id: CardId, color: PaletteColor | null): void;
  deleteCard(id: CardId): void;
  /** Renames an axis or a quadrant; blank text restores the default. */
  setLabel(key: LabelKey, text: string): void;
  /** Starts a drag: the many moves until `endGesture` make one undo step. */
  beginGesture(): void;
  /** Ends the drag as one undo step; `cancel` puts the board back as it was. */
  endGesture(cancel?: boolean): void;
  undo(): void;
  redo(): void;
}

export const useBoardStore = create<BoardStore>()((set, get) => {
  /**
   * Runs one board operation and records it. `fold` folds it into the last
   * undo step instead of adding one (typing a new card's first text).
   */
  const apply = (fn: (state: BoardState) => BoardState, fold = false) =>
    set((s) => {
      const state = fn(s.doc.state);
      if (state === s.doc.state) return {};
      const doc = { ...s.doc, state };
      // Mid-drag: just move; the whole drag is recorded when it ends.
      if (s.gestureStart) return { doc };
      const record = fold ? history.amendLast : history.record;
      return { doc, history: record(s.history, s.doc.state, state), newCardId: null };
    });

  /** Undo or redo: swap in the other state, then let go of any selection,
      edit or hover pointing at a card that no longer exists. */
  const travel = (step: typeof history.undo) => {
    const s = get();
    if (s.gestureStart) return;
    const result = step(s.history, s.doc.state);
    if (!result) return;
    set({ doc: { ...s.doc, state: result.state }, history: result.history, newCardId: null });
    const { cards } = result.state;
    const view = useViewStore.getState();
    if (view.selectedId && !cards[view.selectedId]) view.select(null);
    if (view.editingId && !cards[view.editingId]) view.edit(null);
    if (view.hoveredId && !cards[view.hoveredId]) view.hover(null);
  };

  return {
    doc: sampleBoard(),
    history: history.EMPTY_HISTORY,
    newCardId: null,
    gestureStart: null,
    addCard() {
      const id = createCardId();
      apply((s) => addCard(s, id, ""));
      set({ newCardId: id });
      return id;
    },
    setCardText: (id, text) => apply((s) => setCardText(s, id, text), get().newCardId === id),
    moveCard: (id, pos) => apply((s) => moveCard(s, id, pos)),
    setCardColor: (id, color) => apply((s) => setCardColor(s, id, color)),
    deleteCard(id) {
      const s = get();
      if (s.newCardId === id && !s.gestureStart && !s.doc.state.cards[id]?.text) {
        // A new card abandoned empty: as if it was never added.
        const gone = history.discardLast(s.history, deleteCard(s.doc.state, id));
        set({ doc: { ...s.doc, state: gone.state }, history: gone.history, newCardId: null });
        return;
      }
      apply((state) => deleteCard(state, id));
    },
    setLabel: (key, text) => apply((s) => setLabel(s, key, text)),
    beginGesture: () => set((s) => ({ gestureStart: s.doc.state })),
    endGesture: (cancel = false) =>
      set((s) => {
        if (!s.gestureStart) return {};
        if (cancel) return { gestureStart: null, doc: { ...s.doc, state: s.gestureStart } };
        const recorded = history.record(s.history, s.gestureStart, s.doc.state);
        if (recorded === s.history) return { gestureStart: null };
        return { gestureStart: null, history: recorded, newCardId: null };
      }),
    undo: () => travel(history.undo),
    redo: () => travel(history.redo),
  };
});

/** Narrow selector: a card component re-renders only when its own card changes. */
export const useCard = (id: CardId) => useBoardStore((s) => s.doc.state.cards[id]);
