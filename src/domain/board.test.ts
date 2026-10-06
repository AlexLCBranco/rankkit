import { describe, expect, it } from "vitest";

import { addCard, deleteCard, emptyBoard, moveCard, setCardText } from "./board";
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
