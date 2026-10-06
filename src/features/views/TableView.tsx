import { useMemo } from "react";

import { rankingOf } from "../../domain/matrix";
import { useBoardStore } from "../../store/boardStore";
import { useViewStore } from "../../store/viewStore";
import styles from "./TableView.module.css";

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * A row per card, in priority order: what it says, its bucket, its place
 * in that bucket, and its colour in a word. Unsorted cards come last with
 * no place, since they haven't been judged yet.
 */
export function TableView() {
  const state = useBoardStore((s) => s.doc.state);
  const ranking = useMemo(() => rankingOf(state), [state]);
  const selectedIds = useViewStore((s) => s.selectedIds);
  const select = useViewStore((s) => s.select);

  return (
    <div className={styles.view}>
      {ranking.length === 0 ? (
        <p className={styles.empty}>No cards yet. Add some in the Matrix view.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Card</th>
              <th>Bucket</th>
              <th>Place</th>
              <th>Colour</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map(({ card, quadrant, bucket, place }) => (
              <tr
                key={card.id}
                data-selected={selectedIds.includes(card.id) ? "" : undefined}
                onClick={() => select(card.id)}
              >
                <td className={styles.text}>{card.text || "New card"}</td>
                <td
                  className={styles.bucket}
                  data-best={quadrant === state.best ? "" : undefined}
                  data-unsorted={quadrant ? undefined : ""}
                >
                  {bucket}
                </td>
                <td className={styles.place}>{place ?? "—"}</td>
                <td className={styles.colour}>
                  {card.color ? (
                    <>
                      <span className={styles.dot} style={{ background: `var(--palette-${card.color})` }} aria-hidden />
                      {capitalise(card.color)}
                    </>
                  ) : (
                    <span className={styles.none}>None</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
