import { create } from "zustand";

import { addCard, deleteCard, emptyBoard, moveCard, setCardColor, setCardText, setLabel } from "../domain/board";
import { settle } from "../domain/compare";
import * as history from "../domain/history";
import { createBoardId, createCardId } from "../domain/ids";
import { UNTITLED_BOARD } from "../domain/persistence";
import { removeBoard, upsertBoard, type Registry } from "../domain/registry";
import { sampleBoard } from "../domain/sample";
import type { BoardDoc, BoardId, BoardState, CardId, LabelKey, PaletteColor, Point } from "../domain/types";
import {
  deleteStoredBoard,
  loadActiveBoardId,
  loadBoard,
  loadRegistry,
  saveActiveBoardId,
  saveBoard,
} from "./persistBoard";
import { cancelSave, flushSave } from "./saveQueue";
import { useViewStore } from "./viewStore";

/**
 * The open board: the single source of truth for cards and their places.
 * Actions are thin wrappers around the pure functions in `domain/board.ts`,
 * so this file stays small and every rule lives (and is tested) there.
 * Every change goes through `apply`, which also records it for undo, so no
 * action can forget to be undoable.
 *
 * It also holds the list of saved boards. Saving itself happens in
 * `autoSave.ts`, which watches `doc`; this store only loads boards and
 * creates or deletes them in storage.
 */
interface BoardStore {
  readonly doc: BoardDoc;
  /** Every saved board, oldest first. */
  readonly boards: Registry;
  /** Undo history of the open board. Session-only: never saved. */
  readonly history: history.History;
  /** The other boards' undo histories, parked while they are not open, so
      switching away and back keeps them (for this session only). */
  readonly histories: Readonly<Record<BoardId, history.History>>;
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
  /** Answers "this or that": `winner` comes before `loser`, and both
      cards move to show it. One undo step. */
  settle(winner: CardId, loser: CardId): void;
  /** Renames an axis or a quadrant; blank text restores the default. */
  setLabel(key: LabelKey, text: string): void;
  /** Starts a drag: the many moves until `endGesture` make one undo step. */
  beginGesture(): void;
  /** Ends the drag as one undo step; `cancel` puts the board back as it was. */
  endGesture(cancel?: boolean): void;
  undo(): void;
  redo(): void;
  /** Opens a new, empty board. */
  newBoard(name: string): void;
  /** Opens a copy of the open board. */
  duplicateBoard(name: string): void;
  switchBoard(id: BoardId): void;
  /** Renames the open board. Not an undo step: undo is about the cards. */
  renameBoard(name: string): void;
  /** Deletes a saved board for good. Deleting the open one opens the
      newest remaining board, or a new empty one if none is left. */
  deleteBoard(id: BoardId): void;
}

function blankDoc(name: string): BoardDoc {
  return { id: createBoardId(), name, state: emptyBoard() };
}

/** Creates a board in storage right away, so it is listed even before its
    first edit. */
function createStored(doc: BoardDoc, boards: Registry): Registry {
  saveBoard(doc);
  return upsertBoard(boards, { id: doc.id, name: doc.name });
}

/** What opens on load: the board open last time, else the newest one, else
    (a first visit) the sample board. */
function initialState(): { doc: BoardDoc; boards: Registry } {
  const boards = loadRegistry();
  const activeId = loadActiveBoardId();
  const doc =
    (activeId && boards.some((b) => b.id === activeId) ? loadBoard(activeId) : null) ??
    (boards.length > 0 ? loadBoard(boards[boards.length - 1].id) : null);
  if (doc) {
    saveActiveBoardId(doc.id);
    return { doc, boards };
  }
  const fresh = sampleBoard();
  saveActiveBoardId(fresh.id);
  return { doc: fresh, boards: createStored(fresh, boards) };
}

/** Selection, editing and hover never carry across boards. */
function clearView() {
  const view = useViewStore.getState();
  view.select(null);
  view.edit(null);
  view.editLabel(null);
  view.hover(null);
}

const initial = initialState();

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

  /**
   * Puts another board on screen. The outgoing board's undo history is
   * parked in `histories` (only if it is still listed), and the incoming
   * one's picked back up.
   */
  const open = (doc: BoardDoc, boards: Registry) => {
    saveActiveBoardId(doc.id);
    clearView();
    set((s) => {
      const { [doc.id]: incoming, ...others } = s.histories;
      const keep = boards.some((b) => b.id === s.doc.id);
      return {
        doc,
        boards,
        history: incoming ?? history.EMPTY_HISTORY,
        histories: keep ? { ...others, [s.doc.id]: s.history } : others,
        newCardId: null,
        gestureStart: null,
      };
    });
  };

  return {
    doc: initial.doc,
    boards: initial.boards,
    history: history.EMPTY_HISTORY,
    histories: {},
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
    settle: (winner, loser) => apply((s) => settle(s, winner, loser)),
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

    // Board management. Each one flushes the pending auto-save first, so
    // the outgoing board's last edits are written before anything else.
    newBoard(name) {
      flushSave();
      const doc = blankDoc(name);
      open(doc, createStored(doc, get().boards));
    },
    duplicateBoard(name) {
      flushSave();
      // Boards are immutable values, so a copy can share the same state:
      // the next edit to either one makes new objects anyway.
      const doc: BoardDoc = { id: createBoardId(), name, state: get().doc.state };
      open(doc, createStored(doc, get().boards));
    },
    switchBoard(id) {
      if (id === get().doc.id) return;
      flushSave();
      const doc = loadBoard(id);
      if (!doc) {
        // Missing or unreadable (then `loadBoard` has already copied it
        // aside): there is nothing to open, so it leaves the list.
        deleteStoredBoard(id);
        set((s) => ({ boards: removeBoard(s.boards, id) }));
        return;
      }
      open(doc, get().boards);
    },
    renameBoard: (name) =>
      set((s) =>
        s.doc.name === name
          ? {}
          : { doc: { ...s.doc, name }, boards: upsertBoard(s.boards, { id: s.doc.id, name }) },
      ),
    deleteBoard(id) {
      const s = get();
      if (id !== s.doc.id) {
        deleteStoredBoard(id);
        const { [id]: _, ...histories } = s.histories;
        set({ boards: removeBoard(s.boards, id), histories });
        return;
      }
      // The open board: its pending save must not bring it back.
      cancelSave();
      deleteStoredBoard(id);
      const remaining = removeBoard(s.boards, id);
      const next = remaining.length > 0 ? loadBoard(remaining[remaining.length - 1].id) : null;
      const doc = next ?? blankDoc(UNTITLED_BOARD);
      open(doc, next ? remaining : createStored(doc, remaining));
    },
  };
});

/** Narrow selector: a card component re-renders only when its own card changes. */
export const useCard = (id: CardId) => useBoardStore((s) => s.doc.state.cards[id]);
