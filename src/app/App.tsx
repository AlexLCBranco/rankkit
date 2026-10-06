import { useEffect } from "react";

import { BucketsPanel } from "../features/buckets/BucketsPanel";
import { DragGhost } from "../features/matrix/CardView";
import { Matrix } from "../features/matrix/Matrix";
import { UnsortedStrip } from "../features/matrix/UnsortedStrip";
import { useBoardStore } from "../store/boardStore";
import { useViewStore } from "../store/viewStore";
import styles from "./App.module.css";
import { VersionBadge } from "./VersionBadge";

/**
 * One fixed page: header, then the matrix with the unsorted strip under it
 * on the left and the buckets panel on the right.
 */
export function App() {
  const name = useBoardStore((s) => s.doc.name);
  useCardKeys();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.appName}>{__APP_NAME__}</span>
        <h1 className={styles.boardName}>{name}</h1>
      </header>
      <main className={styles.main}>
        <div className={styles.board}>
          <div className={styles.matrixArea}>
            <Matrix />
          </div>
          <UnsortedStrip />
        </div>
        <BucketsPanel />
      </main>
      <DragGhost />
      <VersionBadge />
    </div>
  );
}

/** Delete removes the selected card; Esc lets go of it. Typing never reaches here. */
function useCardKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { selectedId, editingId, select } = useViewStore.getState();
      if (editingId || !selectedId || e.target instanceof HTMLInputElement) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        useBoardStore.getState().deleteCard(selectedId);
        select(null);
      } else if (e.key === "Escape") {
        select(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
