import { describe, expect, it } from "vitest";

import { asCardId } from "./ids";
import { cardsIn, contains, marqueeSelection, moveGroup, rectBetween, toggleInSelection } from "./marquee";

const [a, b, c] = ["a", "b", "c"].map(asCardId);

describe("rectBetween", () => {
  it("is the same box whichever way it was dragged", () => {
    const box = { x: 10, y: 20, width: 30, height: 40 };
    expect(rectBetween({ x: 10, y: 20 }, { x: 40, y: 60 })).toEqual(box);
    expect(rectBetween({ x: 40, y: 60 }, { x: 10, y: 20 })).toEqual(box);
  });
});

describe("contains / cardsIn", () => {
  const box = { x: 0, y: 0, width: 100, height: 100 };

  it("picks a card only when the box holds all of it", () => {
    expect(contains(box, { x: 0, y: 0, width: 100, height: 100 })).toBe(true);
    expect(contains(box, { x: 90, y: 10, width: 20, height: 10 })).toBe(false);
  });

  it("lists the held cards in the order given", () => {
    const cards = [
      [b, { x: 10, y: 10, width: 10, height: 10 }],
      [a, { x: 95, y: 10, width: 10, height: 10 }],
      [c, { x: 50, y: 50, width: 10, height: 10 }],
    ] as const;
    expect(cardsIn(box, cards)).toEqual([b, c]);
  });
});

describe("marqueeSelection", () => {
  it("replaces the selection on a plain drag", () => {
    expect(marqueeSelection([a], [b, c], false)).toEqual([b, c]);
  });

  it("adds to it with Shift, keeping what was there first", () => {
    expect(marqueeSelection([c, a], [a, b], true)).toEqual([c, a, b]);
  });
});

describe("toggleInSelection", () => {
  it("adds a card, or takes it out", () => {
    expect(toggleInSelection([a], b)).toEqual([a, b]);
    expect(toggleInSelection([a, b], a)).toEqual([b]);
  });
});

describe("moveGroup", () => {
  const margin = { x: 0.1, y: 0.05 };
  const members = new Map([
    [a, { start: { x: 0.3, y: 0.3 }, margin }],
    [b, { start: { x: 0.6, y: 0.5 }, margin }],
  ]);

  it("moves every card by the same amount", () => {
    const moved = moveGroup(members, { x: 0.1, y: -0.1 });
    expect(moved.get(a)?.x).toBeCloseTo(0.4);
    expect(moved.get(a)?.y).toBeCloseTo(0.2);
    expect(moved.get(b)?.x).toBeCloseTo(0.7);
    expect(moved.get(b)?.y).toBeCloseTo(0.4);
  });

  it("stops the whole block when one card reaches an edge", () => {
    const moved = moveGroup(members, { x: 0.9, y: -0.9 });
    // b stops at the right edge, a keeps its distance from it.
    expect(moved.get(b)?.x).toBeCloseTo(0.9);
    expect(moved.get(a)?.x).toBeCloseTo(0.6);
    // a stops at the bottom edge, b keeps its distance.
    expect(moved.get(a)?.y).toBeCloseTo(0.05);
    expect(moved.get(b)?.y).toBeCloseTo(0.25);
  });
});
