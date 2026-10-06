import { useMemo } from "react";

import { rankingOf } from "../../domain/matrix";
import type { Card } from "../../domain/types";
import { useBoardStore } from "../../store/boardStore";
import { useViewStore } from "../../store/viewStore";
import styles from "./ListView.module.css";

/**
 * The whole board as one numbered priority order: Do now's list, then
 * Schedule's, and so on. Each row names its bucket in a quiet word.
 * Unsorted cards have no place yet, so they sit apart underneath.
 */
export function ListView() {
  const state = useBoardStore((s) => s.doc.state);
  const ranking = useMemo(() => rankingOf(state), [state]);
  const ranked = ranking.filter((r) => r.quadrant);
  const unsorted = ranking.filter((r) => !r.quadrant);

  return (
    <div className={styles.view}>
      <div className={styles.page}>
        {ranked.length === 0 ? (
          <p className={styles.empty}>Nothing on the matrix yet. Drag cards onto it in the Matrix view.</p>
        ) : (
          <ol className={styles.list}>
            {ranked.map(({ card, quadrant, bucket }) => (
              <Row key={card.id} card={card}>
                <span className={styles.bucket} data-best={quadrant === state.best ? "" : undefined}>
                  {bucket}
                </span>
              </Row>
            ))}
          </ol>
        )}
        {unsorted.length > 0 && (
          <section className={styles.unsorted}>
            <h2 className={styles.heading}>Still unsorted</h2>
            <ul className={styles.plain}>
              {unsorted.map(({ card }) => (
                <Row key={card.id} card={card} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function Row({ card, children }: { card: Card; children?: React.ReactNode }) {
  const selected = useViewStore((s) => s.selectedIds.includes(card.id));
  return (
    <li
      className={styles.item}
      data-selected={selected ? "" : undefined}
      onClick={() => useViewStore.getState().select(card.id)}
    >
      <span className={styles.line}>
        {card.color && (
          <span className={styles.dot} style={{ background: `var(--palette-${card.color})` }} aria-hidden />
        )}
        <span className={styles.text}>{card.text || "New card"}</span>
        {children}
      </span>
    </li>
  );
}
