import { useShallow } from "zustand/react/shallow";

import { QUADRANTS } from "../../domain/types";
import { useBoardStore } from "../../store/boardStore";
import { useViewStore } from "../../store/viewStore";
import { BoardLabel } from "./BoardLabel";
import { registerMatrix } from "./cardDrag";
import { CardView } from "./CardView";
import styles from "./Matrix.module.css";
import { QuadrantMenu } from "./QuadrantMenu";

/**
 * The 2×2 board: four quadrants, dashed centre lines, the two axis labels
 * and every placed card. Cards are absolutely positioned at their points
 * (plain CSS, no canvas library): the page never pans or zooms, so React
 * Flow's camera, edges and handles would all go unused. Every label on it
 * can be renamed with a double-click (`BoardLabel`). Right-clicking a
 * quadrant offers presets that tidy its cards (`QuadrantMenu`).
 */
export function Matrix() {
  const placedIds = useBoardStore(
    useShallow((s) => s.doc.state.order.filter((id) => s.doc.state.cards[id]?.pos)),
  );
  const best = useBoardStore((s) => s.doc.state.best);

  return (
    <div className={styles.frame}>
      <div className={styles.yAxis}>
        <span className={styles.yAxisText}>
          <BoardLabel labelKey="y" /> →
        </span>
      </div>
      <div
        ref={registerMatrix}
        className={styles.matrix}
        onClick={() => useViewStore.getState().select(null)}
      >
        {QUADRANTS.map((q) => (
          <QuadrantMenu key={q} q={q}>
            <div className={styles.quadrant} data-q={q} data-best={q === best ? "" : undefined}>
              <BoardLabel labelKey={q} className={styles.quadrantName} />
            </div>
          </QuadrantMenu>
        ))}
        <div className={styles.vLine} />
        <div className={styles.hLine} />
        {placedIds.map((id) => (
          <CardView key={id} id={id} />
        ))}
      </div>
      <div className={styles.xAxis}>
        <BoardLabel labelKey="x" /> →
      </div>
    </div>
  );
}
