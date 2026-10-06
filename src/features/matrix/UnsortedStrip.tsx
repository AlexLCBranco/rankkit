import { Plus } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { useBoardStore } from "../../store/boardStore";
import { useViewStore } from "../../store/viewStore";
import { justDragged, registerStrip } from "./cardDrag";
import { CardView } from "./CardView";
import styles from "./UnsortedStrip.module.css";

/** New cards wait here until they're dragged onto the matrix. */
export function UnsortedStrip() {
  const unsortedIds = useBoardStore(
    useShallow((s) => s.doc.state.order.filter((id) => s.doc.state.cards[id]?.pos === null)),
  );

  const add = () => {
    const id = useBoardStore.getState().addCard();
    useViewStore.getState().edit(id);
  };

  return (
    <section
      ref={registerStrip}
      data-strip
      className={styles.strip}
      // Clicking empty space adds a card, unless the click is just the tail
      // end of a drag that dropped a card here.
      onClick={(e) => e.target === e.currentTarget && !justDragged() && add()}
    >
      <button type="button" className={styles.add} onClick={add} aria-label="Add a card" title="Add a card">
        <Plus size={16} />
      </button>
      {unsortedIds.map((id) => (
        <CardView key={id} id={id} />
      ))}
      {unsortedIds.length === 0 && (
        <span className={styles.hint}>Click here to add a card, or drag one back from the board.</span>
      )}
    </section>
  );
}
