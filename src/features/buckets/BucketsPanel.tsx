import { useMemo, useState } from "react";

import { closeCallsOf } from "../../domain/compare";
import { bucketsOf } from "../../domain/matrix";
import type { CardId } from "../../domain/types";
import { countInWords } from "../../domain/words";
import { useBoardStore } from "../../store/boardStore";
import { useViewStore } from "../../store/viewStore";
import { ThisOrThat, type Comparison } from "../compare/ThisOrThat";
import styles from "./BucketsPanel.module.css";

/**
 * The answer, read straight off the matrix: one section per quadrant, best
 * first, each an ordered list. It recomputes on every store change, which
 * during a drag means on every pointer move, so the order updates live.
 * That's cheap: a board holds tens of cards, not thousands.
 *
 * Under a card whose next neighbour ranks almost the same, a quiet "This
 * or that?" link asks which comes first. It hides during a drag, when
 * the close calls change with every pointer move.
 */
export function BucketsPanel() {
  const state = useBoardStore((s) => s.doc.state);
  const { buckets, unsorted } = useMemo(() => bucketsOf(state), [state]);
  const selectedIds = useViewStore((s) => s.selectedIds);
  const dragging = useViewStore((s) => s.drag !== null);
  /** Each close call, found by the card ranked first in it. */
  const closeAfter = useMemo(
    () => new Map<CardId, CardId>(closeCallsOf(state).map((c) => [c.first.id, c.second.id])),
    [state],
  );
  const [comparison, setComparison] = useState<Comparison | null>(null);
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
                  data-selected={selectedIds.includes(card.id) ? "" : undefined}
                  onPointerEnter={() => hover(card.id)}
                  onPointerLeave={() => hover(null)}
                  onClick={() => select(card.id)}
                >
                  {card.color && (
                    <span className={styles.dot} style={{ background: `var(--palette-${card.color})` }} aria-hidden />
                  )}
                  <span className={styles.text}>{card.text || "New card"}</span>
                  {!dragging && closeAfter.has(card.id) && (
                    <button
                      type="button"
                      className={styles.compare}
                      onClick={(e) => {
                        e.stopPropagation();
                        setComparison({ first: card.id, second: closeAfter.get(card.id)!, bucket: bucket.name });
                      }}
                    >
                      This or that?
                    </button>
                  )}
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
      <ThisOrThat comparison={comparison} onClose={() => setComparison(null)} />
    </aside>
  );
}
