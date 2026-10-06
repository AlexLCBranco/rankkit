import { describe, expect, it } from "vitest";

import { addCard, emptyBoard, setCardColor, setLabel } from "./board";
import { asCardId } from "./ids";
import { readBoard, serializeBoard } from "./persistence";
import { readRegistry, removeBoard, upsertBoard } from "./registry";
import type { BoardDoc, BoardId } from "./types";

const A = asCardId("a");
const B = asCardId("b");

function sampleDoc(): BoardDoc {
  let state = addCard(emptyBoard(), A, "First", { x: 0.8, y: 0.9 });
  state = addCard(state, B, "Second");
  state = setCardColor(state, A, "teal");
  state = setLabel(state, "tr", "Now!");
  return { id: "b1" as BoardId, name: "My week", state };
}

/** A JSON round trip, like a real save and load. */
const roundTrip = (value: unknown) => JSON.parse(JSON.stringify(value));

describe("readBoard", () => {
  it("reads back exactly what was saved", () => {
    const doc = sampleDoc();
    expect(readBoard(roundTrip(serializeBoard(doc)))).toEqual({ status: "ok", doc });
  });

  it("rejects data with nothing to salvage, or from an unknown version", () => {
    expect(readBoard(null).status).toBe("unreadable");
    expect(readBoard({ version: 1, doc: {} }).status).toBe("unreadable");
    const newer = roundTrip(serializeBoard(sampleDoc()));
    newer.version = 2;
    expect(readBoard(newer).status).toBe("unreadable");
  });

  it("repairs bad fields, off-board positions and a broken order", () => {
    const data = roundTrip(serializeBoard(sampleDoc()));
    data.doc.state.cards.a.color = "pink";
    data.doc.state.cards.a.pos = { x: 3, y: 0.5 };
    data.doc.state.cards.b.text = 42;
    data.doc.state.order = ["missing", "b"];
    data.doc.state.quadrantNames.bl = "  ";
    data.doc.state.best = "middle";
    data.doc.name = "";

    const read = readBoard(data);
    expect(read.status).toBe("repaired");
    if (read.status !== "repaired") return;
    const { state, name } = read.doc;
    expect(state.cards[A]).toEqual({ id: A, text: "First", color: null, pos: null });
    expect(state.cards[B].text).toBe("");
    expect(state.order).toEqual([B, A]);
    expect(state.quadrantNames.bl).toBe("Drop");
    expect(state.quadrantNames.tr).toBe("Now!");
    expect(state.best).toBe("tr");
    expect(name).toBe("Untitled board");
  });
});

describe("registry", () => {
  const one = { id: "one" as BoardId, name: "One" };
  const two = { id: "two" as BoardId, name: "Two" };

  it("adds in creation order, renames in place and removes", () => {
    let reg = upsertBoard(upsertBoard([], one), two);
    expect(reg).toEqual([one, two]);
    reg = upsertBoard(reg, { ...one, name: "Uno" });
    expect(reg.map((b) => b.name)).toEqual(["Uno", "Two"]);
    expect(upsertBoard(reg, reg[1])).toBe(reg);
    expect(removeBoard(reg, one.id)).toEqual([two]);
  });

  it("skips bad entries and duplicates when reading", () => {
    expect(readRegistry({ version: 2, boards: [] })).toBeNull();
    expect(readRegistry({ version: 1, boards: [one, one, { id: 5 }, { id: "x", name: "" }] })).toEqual([
      one,
      { id: "x", name: "Untitled board" },
    ]);
  });
});
