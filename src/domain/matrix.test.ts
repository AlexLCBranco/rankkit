import { describe, expect, it } from "vitest";

import { addCard, emptyBoard } from "./board";
import { asCardId } from "./ids";
import { bucketsOf, clampToBoard, quadrantOf, quadrantOrder } from "./matrix";
import { sampleBoard } from "./sample";

describe("quadrantOf", () => {
  it("names each corner, with the centre lines counting as top and right", () => {
    expect(quadrantOf({ x: 0.9, y: 0.9 })).toBe("tr");
    expect(quadrantOf({ x: 0.1, y: 0.9 })).toBe("tl");
    expect(quadrantOf({ x: 0.9, y: 0.1 })).toBe("br");
    expect(quadrantOf({ x: 0.1, y: 0.1 })).toBe("bl");
    expect(quadrantOf({ x: 0.5, y: 0.5 })).toBe("tr");
  });
});

describe("quadrantOrder", () => {
  it("goes best, same row, same column, opposite", () => {
    expect(quadrantOrder("tr")).toEqual(["tr", "tl", "br", "bl"]);
    expect(quadrantOrder("bl")).toEqual(["bl", "br", "tl", "tr"]);
  });
});

describe("bucketsOf", () => {
  it("sorts the sample week into its four buckets", () => {
    const { buckets, unsorted } = bucketsOf(sampleBoard().state);
    expect(buckets.map((b) => [b.name, b.cards.map((c) => c.text)])).toEqual([
      ["Do now", ["Prepare Thursday presentation", "Pay the electricity bill"]],
      ["Schedule", ["Plan team offsite", "Renew passport"]],
      ["Delegate", ["Book a meeting room", "Answer newsletter survey"]],
      ["Drop", ["Clean the garage"]],
    ]);
    expect(unsorted.map((c) => c.text)).toEqual(["Fix the leaking sink", "Learn Spanish"]);
  });

  it("puts the card nearest the best corner first, ties in added order", () => {
    let s = emptyBoard();
    s = addCard(s, asCardId("far"), "far", { x: 0.6, y: 0.6 });
    s = addCard(s, asCardId("near"), "near", { x: 0.95, y: 0.95 });
    s = addCard(s, asCardId("tieA"), "tieA", { x: 0.7, y: 0.8 });
    s = addCard(s, asCardId("tieB"), "tieB", { x: 0.8, y: 0.7 });
    const doNow = bucketsOf(s).buckets[0];
    expect(doNow.cards.map((c) => c.text)).toEqual(["near", "tieA", "tieB", "far"]);
  });

  it("ranks the other buckets towards the board's best corner too", () => {
    let s = emptyBoard();
    s = addCard(s, asCardId("a"), "deep left", { x: 0.05, y: 0.9 });
    s = addCard(s, asCardId("b"), "near centre", { x: 0.45, y: 0.9 });
    expect(bucketsOf(s).buckets[1].cards.map((c) => c.text)).toEqual(["near centre", "deep left"]);
  });
});

describe("clampToBoard", () => {
  it("keeps a point inside, a margin in from the edges", () => {
    expect(clampToBoard({ x: -1, y: 2 }, { x: 0.1, y: 0.2 })).toEqual({ x: 0.1, y: 0.8 });
  });
});
