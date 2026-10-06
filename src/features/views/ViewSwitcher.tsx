import type { CSSProperties } from "react";

import { VIEW_MODES, useViewStore, type ViewMode } from "../../store/viewStore";
import styles from "./ViewSwitcher.module.css";

const LABELS: Record<ViewMode, string> = { matrix: "Matrix", list: "List", table: "Table" };

/**
 * Vennkit's view switcher: three words in a pill, with a highlight that
 * slides under the one on screen. The highlight is one element moved by
 * `transform`, so the slide is a cheap GPU animation.
 */
export function ViewSwitcher() {
  const mode = useViewStore((s) => s.mode);
  const setMode = useViewStore((s) => s.setMode);
  return (
    <div
      className={styles.switcher}
      role="group"
      aria-label="View"
      style={{ "--view-index": VIEW_MODES.indexOf(mode) } as CSSProperties}
    >
      <span className={styles.indicator} aria-hidden />
      {VIEW_MODES.map((m) => (
        <button
          key={m}
          type="button"
          className={styles.option}
          aria-pressed={m === mode}
          onClick={() => setMode(m)}
        >
          {LABELS[m]}
        </button>
      ))}
    </div>
  );
}
