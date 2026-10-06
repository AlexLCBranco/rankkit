import { useBoardStore } from "./boardStore";
import { flushSave, scheduleSave } from "./saveQueue";

/**
 * Saves the open board shortly after every change. Called once from
 * `main.tsx`.
 *
 * Only content changes trigger a save: undo history and drag bookkeeping
 * live in the same store but are session-only. A board switch also changes
 * `doc`, but the switch has already flushed and the new board is as saved,
 * so that is skipped too (it would only rewrite the same data). Mid-drag
 * moves are skipped as well; the drop saves the result.
 */
export function initAutoSave(): void {
  useBoardStore.subscribe((s, prev) => {
    if (s.doc.id !== prev.doc.id || s.gestureStart) return;
    // A drop leaves `doc` as the last move made it, so a drag ending
    // counts as a change too.
    if (s.doc === prev.doc && !prev.gestureStart) return;
    // The doc is read when the save runs, not now, so one write covers a
    // whole burst of edits.
    scheduleSave(() => useBoardStore.getState().doc);
  });

  // A pending save must not be lost when the tab closes or is hidden (on
  // mobile, hidden is often the last event a page ever gets).
  window.addEventListener("pagehide", flushSave);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushSave();
  });
}
