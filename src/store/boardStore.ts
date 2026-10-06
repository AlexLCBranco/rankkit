import { create } from "zustand";

import { addCard, deleteCard, moveCard, setCardText } from "../domain/board";
import { createCardId } from "../domain/ids";
import { sampleBoard } from "../domain/sample";
import type { BoardDoc, BoardState, CardId, Point } from "../domain/types";

/**
 * The open board: the single source of truth for cards and their places.
 * Actions are thin wrappers around the pure functions in `domain/board.ts`,
 * so this file stays small and every rule lives (and is tested) there.
 *
 * Not saved yet: a reload starts from the sample board again. Saving,
 * several boards and undo come in the next step.
 */
interface BoardStore {
  readonly doc: BoardDoc;
  /** Adds an empty card to the unsorted strip and returns its id. */
  addCard(): CardId;
  setCardText(id: CardId, text: string): void;
  moveCard(id: CardId, pos: Point | null): void;
  deleteCard(id: CardId): void;
}

export const useBoardStore = create<BoardStore>()((set) => {
  const apply = (fn: (state: BoardState) => BoardState) =>
    set(({ doc }) => {
      const state = fn(doc.state);
      return state === doc.state ? {} : { doc: { ...doc, state } };
    });

  return {
    doc: sampleBoard(),
    addCard() {
      const id = createCardId();
      apply((s) => addCard(s, id, ""));
      return id;
    },
    setCardText: (id, text) => apply((s) => setCardText(s, id, text)),
    moveCard: (id, pos) => apply((s) => moveCard(s, id, pos)),
    deleteCard: (id) => apply((s) => deleteCard(s, id)),
  };
});

/** Narrow selector: a card component re-renders only when its own card changes. */
export const useCard = (id: CardId) => useBoardStore((s) => s.doc.state.cards[id]);
