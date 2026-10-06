import { describe, expect, it } from "vitest";

import { arrangeLine } from "./arrange";
import { addCard, emptyBoard } from "./board";
import { closeCallsOf } from "./compare";
import { asCardId } from "./ids";
import { bucketsOf, quadrantOf } from "./matrix";
import { sampleBoard } from "./sample";
import { QUADRANTS, type BoardState, type Point } from "./types";

function board(...cards: [string, Point | null][]): BoardState {
  return cards.reduce((s, [id, pos]) => addCard(s, asCardId(id), id, pos), emptyBoard());
}

const order = (s: BoardState) => bucketsOf(s).buckets.map((bk) => bk.cards.map((card) => card.id));

describe("arrangeLine", () => {
  it("keeps every bucket's order, on the sample week and every quadrant", () => {
    const start = sampleBoard().state;
    for (const q of QUADRANTS) {
      const tidy = arrangeLine(start, q);
      expect(order(tidy)).toEqual(order(start));
    }
  });

  it("keeps the order when the best corner is somewhere else", () => {
    const start = { ...sampleBoard().state, best: "bl" as const };
    const tidy = QUADRANTS.reduce(arrangeLine, start);
    expect(order(tidy)).toEqual(order(start));
  });

  it("lays the cards on the diagonal towards the best corner, evenly spaced", () => {
    const s = board(["a", { x: 0.6, y: 0.9 }], ["b", { x: 0.95, y: 0.55 }], ["c", { x: 0.7, y: 0.7 }]);
    const tidy = arrangeLine(s, "tr");
    const [a, b, c] = ["a", "b", "c"].map((id) => tidy.cards[asCardId(id)].pos!);
    // Each card on the line x = y, the first nearest the top-right corner.
    for (const p of [a, b, c]) expect(p.x).toBeCloseTo(p.y);
    const [first, second, third] = order(s)[0].map((id) => tidy.cards[id].pos!);
    expect(first.x).toBeGreaterThan(second.x);
    expect(first.x - second.x).toBeCloseTo(second.x - third.x);
    expect(order(tidy)).toEqual(order(s));
  });

  it("never moves a card out of its quadrant, or touches other quadrants and the strip", () => {
    const s = board(["a", { x: 0.2, y: 0.8 }], ["b", { x: 0.45, y: 0.95 }], ["c", { x: 0.9, y: 0.2 }], ["d", null]);
    const tidy = arrangeLine(s, "tl");
    expect(quadrantOf(tidy.cards[asCardId("a")].pos!)).toBe("tl");
    expect(quadrantOf(tidy.cards[asCardId("b")].pos!)).toBe("tl");
    expect(tidy.cards[asCardId("c")]).toBe(s.cards[asCardId("c")]);
    expect(tidy.cards[asCardId("d")].pos).toBeNull();
  });

  it("leaves no close calls behind in a tidied bucket of a few cards", () => {
    const s = board(["a", { x: 0.8, y: 0.8 }], ["b", { x: 0.82, y: 0.79 }], ["c", { x: 0.6, y: 0.9 }]);
    expect(closeCallsOf(s)).not.toEqual([]);
    expect(closeCallsOf(arrangeLine(s, "tr"))).toEqual([]);
  });

  it("changes nothing in an empty quadrant", () => {
    const s = board(["a", { x: 0.8, y: 0.8 }]);
    expect(arrangeLine(s, "bl")).toBe(s);
  });
});
