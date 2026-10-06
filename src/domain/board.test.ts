import { describe, expect, it } from "vitest";

import { addCard, deleteCard, emptyBoard, labelOf, moveCard, setCardText, setLabel } from "./board";
import { asCardId } from "./ids";

const A = asCardId("a");

describe("card operations", () => {
  it("adds a card to the unsorted strip", () => {
    const s = addCard(emptyBoard(), A, "Hello");
    expect(s.order).toEqual([A]);
    expect(s.cards[A]).toEqual({ id: A, text: "Hello", color: null, pos: null });
  });

  it("moves, renames and deletes, leaving untouched slices as they were", () => {
    const start = addCard(emptyBoard(), A, "Hello");
    const moved = moveCard(start, A, { x: 0.7, y: 0.2 });
    expect(moved.cards[A].pos).toEqual({ x: 0.7, y: 0.2 });
    expect(moved.order).toBe(start.order);
    expect(moveCard(moved, A, { x: 0.7, y: 0.2 })).toBe(moved);
    expect(moveCard(moved, A, null).cards[A].pos).toBeNull();
    expect(setCardText(moved, A, "Bye").cards[A].text).toBe("Bye");
    expect(setCardText(moved, A, "Hello")).toBe(moved);
    const gone = deleteCard(moved, A);
    expect(gone.cards).toEqual({});
    expect(gone.order).toEqual([]);
  });
});

describe("labels", () => {
  it("renames an axis or a quadrant, leaving the rest as it was", () => {
    const start = emptyBoard();
    const x = setLabel(start, "x", "  Sooner  ");
    expect(labelOf(x, "x")).toBe("Sooner");
    expect(x.axes.y).toBe(start.axes.y);
    expect(x.quadrantNames).toBe(start.quadrantNames);
    const q = setLabel(start, "tr", "Today");
    expect(labelOf(q, "tr")).toBe("Today");
    expect(q.axes).toBe(start.axes);
  });

  it("keeps the same state when nothing changes", () => {
    const start = emptyBoard();
    expect(setLabel(start, "tl", "Schedule")).toBe(start);
  });

  it("brings the default word back when the text is blank", () => {
    const renamed = setLabel(emptyBoard(), "bl", "Never");
    expect(labelOf(setLabel(renamed, "bl", "   "), "bl")).toBe("Drop");
    expect(labelOf(setLabel(setLabel(emptyBoard(), "y", "Bigger"), "y", ""), "y")).toBe("More important");
  });
});
