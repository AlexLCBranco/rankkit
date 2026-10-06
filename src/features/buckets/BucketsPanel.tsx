import { useMemo } from "react";

import { bucketsOf } from "../../domain/matrix";
import { countInWords } from "../../domain/words";
import { useBoardStore } from "../../store/boardStore";
import { useViewStore } from "../../store/viewStore";
import styles from "./BucketsPanel.module.css";

/**
 * The answer, read straight off the matrix: one section per quadrant, best
 * first, each an ordered list. It recomputes on every store change, which
 * during a drag means on every pointer move, so the order updates live.
 * That's cheap: a board holds tens of cards, not thousands.
 */
export function BucketsPanel() {
  const state = useBoardStore((s) => s.doc.state);
  const { buckets, unsorted } = useMemo(() => bucketsOf(state), [state]);
  const selectedId = useViewStore((s) => s.selectedId);
  const { hover, select } = useViewStore.getState();

  return (
    <aside className={styles.panel} onPointerLeave={() => hover(null)}>
      {buckets.map((bucket) => (
        <section key={bucket.quadrant} className={styles.bucket}>
          <h2 className={styles.name} data-best={bucket.quadrant === state.best ? "" : undefined}>
            {bucket.name}
          </h2>
          {bucket.cards.length === 0 ? (
            <p className={styles.empty}>Nothing here yet</p>
          ) : (
            <ol className={styles.list}>
              {bucket.cards.map((card) => (
                <li
                  key={card.id}
                  className={styles.item}
                  data-selected={card.id === selectedId ? "" : undefined}
                  onPointerEnter={() => hover(card.id)}
                  onPointerLeave={() => hover(null)}
                  onClick={() => select(card.id)}
                >
                  {card.color && (
                    <span className={styles.dot} style={{ background: `var(--palette-${card.color})` }} aria-hidden />
                  )}
                  <span className={styles.text}>{card.text || "New card"}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
      <p className={styles.note}>
        {unsorted.length === 0
          ? "Everything is sorted."
          : `${countInWords(unsorted.length, "card")} still unsorted.`}
      </p>
    </aside>
  );
}
