import { describe, expect, it } from "vitest";

import { addCard, emptyBoard } from "./board";
import { CLOSE_CALL, closeCallsOf, settle } from "./compare";
import { asCardId } from "./ids";
import { bucketsOf, distanceToBest, quadrantOf } from "./matrix";
import { sampleBoard } from "./sample";
import type { BoardState, Point } from "./types";

const a = asCardId("a");
const b = asCardId("b");
const c = asCardId("c");

function board(...cards: [string, Point][]): BoardState {
  return cards.reduce((s, [id, pos]) => addCard(s, asCardId(id), id, pos), emptyBoard());
}

const order = (s: BoardState) => bucketsOf(s).buckets.map((bk) => bk.cards.map((card) => card.id));
const gap = (s: BoardState, x: string, y: string) =>
  distanceToBest(s, s.cards[asCardId(y)].pos!) - distanceToBest(s, s.cards[asCardId(x)].pos!);

describe("closeCallsOf", () => {
  it("finds neighbours in a bucket that rank almost the same", () => {
    const s = board(["a", { x: 0.8, y: 0.8 }], ["b", { x: 0.82, y: 0.79 }], ["c", { x: 0.55, y: 0.55 }]);
    const calls = closeCallsOf(s);
    expect(calls.map((k) => [k.first.id, k.second.id])).toEqual([[b, a]]);
    expect(calls[0].quadrant).toBe("tr");
  });

  it("never pairs cards from different buckets, or far apart ones", () => {
    const s = board(["a", { x: 0.49, y: 0.8 }], ["b", { x: 0.51, y: 0.8 }], ["c", { x: 0.9, y: 0.9 }]);
    expect(closeCallsOf(s)).toEqual([]);
  });

  it("has one close call in the sample week, in Schedule", () => {
    const calls = closeCallsOf(sampleBoard().state);
    expect(calls.map((k) => [k.first.text, k.second.text])).toEqual([["Plan team offsite", "Renew passport"]]);
  });
});

describe("settle", () => {
  it("puts the chosen card first, clearly apart, in the same quadrant", () => {
    const s = board(["a", { x: 0.8, y: 0.8 }], ["b", { x: 0.82, y: 0.79 }]);
    const next = settle(s, a, b);
    expect(order(next)[0]).toEqual([a, b]);
    expect(gap(next, "a", "b")).toBeGreaterThanOrEqual(CLOSE_CALL);
    expect(closeCallsOf(next)).toEqual([]);
    expect(quadrantOf(next.cards[a].pos!)).toBe("tr");
    expect(quadrantOf(next.cards[b].pos!)).toBe("tr");
  });

  it("keeps the current order if that is the choice, still pulling them apart", () => {
    const s = board(["a", { x: 0.8, y: 0.8 }], ["b", { x: 0.82, y: 0.79 }]);
    const next = settle(s, b, a);
    expect(order(next)[0]).toEqual([b, a]);
    expect(closeCallsOf(next)).toEqual([]);
  });

  it("works in a bucket away from the best corner, without crossing a centre line", () => {
    const sample = sampleBoard().state;
    const [offsite, passport] = bucketsOf(sample).buckets[1].cards;
    const next = settle(sample, passport.id, offsite.id);
    expect(bucketsOf(next).buckets[1].cards.map((card) => card.text)).toEqual(["Renew passport", "Plan team offsite"]);
    expect(quadrantOf(next.cards[passport.id].pos!)).toBe("tl");
    expect(quadrantOf(next.cards[offsite.id].pos!)).toBe("tl");
    expect(closeCallsOf(next)).toEqual([]);
  });

  it("moves each card along its line to the best corner, so its direction is kept", () => {
    const s = board(["a", { x: 0.3, y: 0.7 }], ["b", { x: 0.32, y: 0.69 }]);
    const next = settle(s, b, a);
    const slope = (p: Point) => (1 - p.y) / (1 - p.x);
    expect(slope(next.cards[a].pos!)).toBeCloseTo(slope(s.cards[a].pos!));
    expect(slope(next.cards[b].pos!)).toBeCloseTo(slope(s.cards[b].pos!));
  });

  it("leaves a pair that is already clearly in that order alone", () => {
    const s = board(["a", { x: 0.9, y: 0.9 }], ["b", { x: 0.6, y: 0.6 }]);
    expect(settle(s, a, b)).toBe(s);
  });

  it("ignores cards in different quadrants, unsorted cards and missing ids", () => {
    const s = addCard(board(["a", { x: 0.49, y: 0.8 }], ["b", { x: 0.51, y: 0.8 }]), c, "c");
    expect(settle(s, a, b)).toBe(s);
    expect(settle(s, a, c)).toBe(s);
    expect(settle(s, a, asCardId("gone"))).toBe(s);
  });

  it("still puts the chosen card first when it is pressed against a centre line", () => {
    // In Schedule, right by the centre: moving towards Do now would leave the bucket.
    const s = board(["a", { x: 0.48, y: 0.52 }], ["b", { x: 0.35, y: 0.8 }]);
    const next = settle(s, a, b);
    expect(next.cards[a].pos).toEqual(s.cards[a].pos);
    expect(order(next)[1]).toEqual([a, b]);
  });
});
