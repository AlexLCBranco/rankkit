import { describe, expect, it } from "vitest";

import { addCard, deleteCard, emptyBoard, moveCard, setCardText, setLabel } from "./board";
import { amendLast, discardLast, EMPTY_HISTORY, record, redo, undo } from "./history";
import { asCardId } from "./ids";

const A = asCardId("a");

describe("history", () => {
  it("undoes and redoes a step, restoring the exact slices", () => {
    const s0 = addCard(emptyBoard(), A, "Hello");
    const s1 = moveCard(s0, A, { x: 0.8, y: 0.8 });
    const h1 = record(EMPTY_HISTORY, s0, s1);

    const back = undo(h1, s1)!;
    expect(back.state.cards).toBe(s0.cards);
    const forward = redo(back.history, back.state)!;
    expect(forward.state.cards).toBe(s1.cards);
  });

  it("stores only the slices that changed", () => {
    const s0 = emptyBoard();
    const s1 = setLabel(s0, "tr", "Now!");
    expect(Object.keys(record(EMPTY_HISTORY, s0, s1).past[0].after)).toEqual(["quadrantNames"]);
  });

  it("drops no-op steps and clears redo on a new step", () => {
    const s0 = addCard(emptyBoard(), A, "Hello");
    expect(record(EMPTY_HISTORY, s0, s0)).toBe(EMPTY_HISTORY);

    const s1 = setCardText(s0, A, "One");
    const undone = undo(record(EMPTY_HISTORY, s0, s1), s1)!;
    expect(undone.history.future).toHaveLength(1);
    const s2 = setCardText(undone.state, A, "Two");
    expect(record(undone.history, undone.state, s2).future).toHaveLength(0);
  });

  it("folds add-then-type into one undo step", () => {
    const s0 = emptyBoard();
    const s1 = addCard(s0, A, "");
    const s2 = setCardText(s1, A, "Typed");
    const h = amendLast(record(EMPTY_HISTORY, s0, s1), s1, s2);

    expect(h.past).toHaveLength(1);
    const back = undo(h, s2)!;
    expect(back.state.cards).toBe(s0.cards);
    expect(back.state.order).toBe(s0.order);
    expect(redo(back.history, back.state)!.state.cards).toBe(s2.cards);
  });

  it("discards an abandoned new card without leaving a step", () => {
    const s0 = emptyBoard();
    const s1 = addCard(s0, A, "");
    const h = record(EMPTY_HISTORY, s0, s1);
    const gone = discardLast(h, deleteCard(s1, A));

    expect(gone.history).toEqual(EMPTY_HISTORY);
    expect(gone.state.cards).toBe(s0.cards);
    expect(gone.state.order).toBe(s0.order);
  });

  it("returns null at either end of the stack", () => {
    const s0 = emptyBoard();
    expect(undo(EMPTY_HISTORY, s0)).toBeNull();
    expect(redo(EMPTY_HISTORY, s0)).toBeNull();
  });
});
