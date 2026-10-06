import { useEffect } from "react";

import { BoardSwitcher } from "../features/boards/BoardSwitcher";
import { BucketsPanel } from "../features/buckets/BucketsPanel";
import { HistoryButtons } from "../features/history/HistoryButtons";
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
  useBoardKeys();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.appName}>{__APP_NAME__}</span>
        <BoardSwitcher />
        <HistoryButtons />
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

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

/**
 * Ctrl/Cmd+Z undoes, Ctrl/Cmd+Shift+Z (or Ctrl+Y) redoes. Delete removes
 * the selected card; Esc lets go of it. Typing never reaches here, so a
 * text field keeps its own undo and Backspace.
 */
function useBoardKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { selectedId, editingId, select } = useViewStore.getState();
      if (editingId || isTyping(e.target)) return;
      const board = useBoardStore.getState();
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === "z" && !e.shiftKey) {
          e.preventDefault();
          board.undo();
        } else if ((key === "z" && e.shiftKey) || key === "y") {
          e.preventDefault();
          board.redo();
        }
        return;
      }
      if (!selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        board.deleteCard(selectedId);
        select(null);
      } else if (e.key === "Escape") {
        select(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
