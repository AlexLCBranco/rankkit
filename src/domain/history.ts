import type { BoardState } from "./types";

/**
 * Undo/redo over a stack of patches, not full snapshots (the same design as
 * Treekit's and Boardkit's `domain/history.ts`).
 *
 * Every board operation copies only the slices it touches (`cards`,
 * `order`, `axes`, ...) and leaves the rest at their old reference. So the
 * difference between two states is "which top-level slices changed
 * identity", and storing those slices' old and new values is a complete
 * undo record: no per-action undo code.
 */
export type BoardPatch = Partial<BoardState>;

export interface HistoryEntry {
  readonly before: BoardPatch;
  readonly after: BoardPatch;
}

export interface History {
  readonly past: readonly HistoryEntry[];
  readonly future: readonly HistoryEntry[];
}

export const EMPTY_HISTORY: History = { past: [], future: [] };

/** Bounded so a long session's undo stack cannot grow without limit. */
const HISTORY_LIMIT = 200;

/** The slices that changed between two states, old and new. */
function diff(prev: BoardState, next: BoardState): HistoryEntry {
  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};
  for (const key of Object.keys(next) as (keyof BoardState)[]) {
    if (prev[key] !== next[key]) {
      before[key] = prev[key];
      after[key] = next[key];
    }
  }
  return { before: before as BoardPatch, after: after as BoardPatch };
}

const isEmpty = (patch: BoardPatch) => Object.keys(patch).length === 0;

/**
 * Records `prev -> next` as one step. A step that changed nothing is
 * dropped. Any real step clears `future`: redo only replays what undo just
 * walked back through.
 */
export function record(history: History, prev: BoardState, next: BoardState): History {
  const entry = diff(prev, next);
  if (isEmpty(entry.after)) return history;
  return { past: [...history.past, entry].slice(-HISTORY_LIMIT), future: [] };
}

/**
 * Folds `prev -> next` into the most recent step instead of adding a new
 * one, so "add a card, type its text" undoes in one go. The older step's
 * `before` wins for any slice both touched: it is the value from before
 * either change.
 */
export function amendLast(history: History, prev: BoardState, next: BoardState): History {
  const last = history.past.at(-1);
  if (!last) return record(history, prev, next);
  const entry = diff(prev, next);
  if (isEmpty(entry.after)) return history;
  const merged: HistoryEntry = {
    before: { ...entry.before, ...last.before },
    after: { ...last.after, ...entry.after },
  };
  return { past: [...history.past.slice(0, -1), merged], future: [] };
}

/**
 * Walks the most recent step back and forgets it, with nothing to redo.
 * Used when a new card is abandoned empty: it should leave no trace in the
 * undo stack, not an invisible "add then remove" step.
 */
export function discardLast(history: History, state: BoardState): { history: History; state: BoardState } {
  const last = history.past.at(-1);
  if (!last) return { history, state };
  return { history: { ...history, past: history.past.slice(0, -1) }, state: { ...state, ...last.before } };
}

export function undo(history: History, state: BoardState): { history: History; state: BoardState } | null {
  const entry = history.past.at(-1);
  if (!entry) return null;
  return {
    history: { past: history.past.slice(0, -1), future: [...history.future, entry] },
    state: { ...state, ...entry.before },
  };
}

export function redo(history: History, state: BoardState): { history: History; state: BoardState } | null {
  const entry = history.future.at(-1);
  if (!entry) return null;
  return {
    history: { past: [...history.past, entry], future: history.future.slice(0, -1) },
    state: { ...state, ...entry.after },
  };
}
