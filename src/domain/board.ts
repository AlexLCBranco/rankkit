import type { BoardState, CardId, LabelKey, Point } from "./types";

/**
 * Card operations, as pure functions from one state to the next. Each one
 * copies only the slices it touches (`cards`, `order`) and keeps the rest
 * at the same reference, so undo can later store just what changed (the
 * patch design of Treekit's `domain/history.ts`).
 */

export const DEFAULT_BOARD: Omit<BoardState, "cards" | "order"> = {
  axes: { x: "More urgent", y: "More important" },
  quadrantNames: { tr: "Do now", tl: "Schedule", br: "Delegate", bl: "Drop" },
  best: "tr",
};

export function emptyBoard(): BoardState {
  return { ...DEFAULT_BOARD, cards: {}, order: [] };
}

/** A new card goes to the end of the unsorted strip (or straight to `pos`). */
export function addCard(state: BoardState, id: CardId, text: string, pos: Point | null = null): BoardState {
  return {
    ...state,
    cards: { ...state.cards, [id]: { id, text, color: null, pos } },
    order: [...state.order, id],
  };
}

export function setCardText(state: BoardState, id: CardId, text: string): BoardState {
  const card = state.cards[id];
  if (!card || card.text === text) return state;
  return { ...state, cards: { ...state.cards, [id]: { ...card, text } } };
}

/** `pos: null` sends the card back to the unsorted strip. */
export function moveCard(state: BoardState, id: CardId, pos: Point | null): BoardState {
  const card = state.cards[id];
  if (!card) return state;
  const same = card.pos === pos || (card.pos && pos && card.pos.x === pos.x && card.pos.y === pos.y);
  if (same) return state;
  return { ...state, cards: { ...state.cards, [id]: { ...card, pos } } };
}

export function deleteCard(state: BoardState, id: CardId): BoardState {
  if (!state.cards[id]) return state;
  const cards = { ...state.cards };
  delete cards[id];
  return { ...state, cards, order: state.order.filter((c) => c !== id) };
}

/** The current word for an axis or a quadrant. */
export function labelOf(state: Pick<BoardState, "axes" | "quadrantNames">, key: LabelKey): string {
  return key === "x" || key === "y" ? state.axes[key] : state.quadrantNames[key];
}

/**
 * Renames an axis or a quadrant. Blank text brings the default word back,
 * so the board never shows an empty heading.
 */
export function setLabel(state: BoardState, key: LabelKey, text: string): BoardState {
  const next = text.trim() || labelOf(DEFAULT_BOARD, key);
  if (next === labelOf(state, key)) return state;
  if (key === "x" || key === "y") return { ...state, axes: { ...state.axes, [key]: next } };
  return { ...state, quadrantNames: { ...state.quadrantNames, [key]: next } };
}
