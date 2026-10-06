import { useEffect } from "react";

import { BoardSwitcher } from "../features/boards/BoardSwitcher";
import { BucketsPanel } from "../features/buckets/BucketsPanel";
import { HistoryButtons } from "../features/history/HistoryButtons";
import { DragGhost } from "../features/matrix/CardView";
import { Matrix } from "../features/matrix/Matrix";
import { UnsortedStrip } from "../features/matrix/UnsortedStrip";
import { MarqueeArea } from "../features/selection/MarqueeArea";
import { SelectionBar } from "../features/selection/SelectionBar";
import { ListView } from "../features/views/ListView";
import { TableView } from "../features/views/TableView";
import { ViewSwitcher } from "../features/views/ViewSwitcher";
import { useBoardStore } from "../store/boardStore";
import { useViewStore } from "../store/viewStore";
import styles from "./App.module.css";
import { VersionBadge } from "./VersionBadge";

/**
 * One fixed page: header, then the matrix with the unsorted strip under it
 * on the left and the buckets panel on the right. The header's switcher
 * swaps that for the List or Table view, which fill the space alone.
 */
export function App() {
  useBoardKeys();
  const mode = useViewStore((s) => s.mode);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.appName}>{__APP_NAME__}</span>
        <BoardSwitcher />
        <ViewSwitcher />
        <HistoryButtons />
      </header>
      {mode === "matrix" ? (
        <main className={styles.main}>
          <MarqueeArea className={styles.board}>
            <div className={styles.matrixArea}>
              <Matrix />
              <SelectionBar />
            </div>
            <UnsortedStrip />
          </MarqueeArea>
          <BucketsPanel />
        </main>
      ) : (
        <main key={mode} className={styles.single}>
          {mode === "list" ? <ListView /> : <TableView />}
        </main>
      )}
      <DragGhost />
      <VersionBadge />
    </div>
  );
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

/**
 * Ctrl/Cmd+Z undoes, Ctrl/Cmd+Shift+Z (or Ctrl+Y) redoes. Delete removes
 * the picked card (or the whole picked group); Esc lets go of it. Typing
 * never reaches here, so a
 * text field keeps its own undo and Backspace.
 */
function useBoardKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { selectedIds, editingId, select } = useViewStore.getState();
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
      if (selectedIds.length === 0) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        board.deleteCards(selectedIds);
        select(null);
      } else if (e.key === "Escape") {
        select(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
