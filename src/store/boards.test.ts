import { beforeEach, describe, expect, it, vi } from "vitest";

import { initAutoSave } from "./autoSave";
import { useBoardStore } from "./boardStore";
import { loadBoard, loadRegistry } from "./persistBoard";
import { flushSave } from "./saveQueue";

/** A minimal in-memory localStorage: the tests run in Node, which has none. */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    key: (i) => [...data.keys()][i] ?? null,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
    clear: () => data.clear(),
  };
}

const store = () => useBoardStore.getState();

// Auto-save as in the app; its tab-closing listeners need no real page.
const noEvents = { addEventListener: () => {} };
vi.stubGlobal("window", noEvents);
vi.stubGlobal("document", noEvents);
initAutoSave();

beforeEach(() => {
  vi.stubGlobal("localStorage", memoryStorage());
});

describe("saved boards", () => {
  it("creates, switches and keeps each board's undo history", () => {
    store().newBoard("Work");
    const work = store().doc.id;
    store().newBoard("Errands");
    const errands = store().doc.id;
    expect(store().doc.state.order).toHaveLength(0);
    expect(loadRegistry().map((b) => b.name)).toContain("Errands");

    store().addCard();
    store().setCardText(store().doc.state.order[0], "Buy milk");
    store().switchBoard(work);
    expect(store().doc.name).toBe("Work");
    expect(store().history.past).toHaveLength(0);
    // The pending save was flushed on the way out.
    expect(loadBoard(errands)?.state.order).toHaveLength(1);

    store().switchBoard(errands);
    expect(store().history.past).toHaveLength(1);
    store().undo();
    expect(store().doc.state.order).toHaveLength(0);
  });

  it("renames, duplicates and deletes", () => {
    store().newBoard("Draft");
    store().renameBoard("Plan");
    flushSave();
    store().duplicateBoard("Plan (copy)");
    const copy = store().doc.id;
    expect(store().boards.slice(-2).map((b) => b.name)).toEqual(["Plan", "Plan (copy)"]);

    store().deleteBoard(copy);
    expect(store().boards.some((b) => b.id === copy)).toBe(false);
    expect(loadBoard(copy)).toBeNull();
    expect(store().doc.name).toBe("Plan");
  });
});
