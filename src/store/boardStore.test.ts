import { beforeEach, describe, expect, it } from "vitest";

import { EMPTY_HISTORY } from "../domain/history";
import { useBoardStore } from "./boardStore";

const store = () => useBoardStore.getState();

describe("board store undo", () => {
  beforeEach(() => useBoardStore.setState({ history: EMPTY_HISTORY, newCardId: null, gestureStart: null }));

  it("records a whole drag as one step, and a cancelled drag as none", () => {
    const id = store().doc.state.order[0];
    const before = store().doc.state.cards;
    store().beginGesture();
    store().moveCard(id, { x: 0.1, y: 0.1 });
    store().moveCard(id, { x: 0.2, y: 0.2 });
    store().endGesture();
    expect(store().history.past).toHaveLength(1);
    store().undo();
    expect(store().doc.state.cards).toBe(before);

    store().beginGesture();
    store().moveCard(id, { x: 0.3, y: 0.3 });
    store().endGesture(true);
    expect(store().doc.state.cards).toBe(before);
    expect(store().history.future).toHaveLength(1);
  });

  it("undoes add + type in one step, and forgets an abandoned empty card", () => {
    const start = store().doc.state;
    const id = store().addCard();
    store().setCardText(id, "Call the bank");
    expect(store().history.past).toHaveLength(1);
    store().undo();
    expect(store().doc.state.order).toBe(start.order);

    store().redo();
    const empty = store().addCard();
    store().deleteCard(empty);
    expect(store().history.past).toHaveLength(1);
    expect(store().doc.state.cards[id].text).toBe("Call the bank");
  });
});
