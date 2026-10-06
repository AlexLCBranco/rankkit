import type { PointerEvent as ReactPointerEvent } from "react";

import { clampToBoard } from "../../domain/matrix";
import type { CardId } from "../../domain/types";
import { useBoardStore } from "../../store/boardStore";
import { useViewStore } from "../../store/viewStore";

/**
 * Dragging a card, with plain pointer events instead of a drag library.
 * There are only two places a card can land (the matrix or the unsorted
 * strip) and the drop position must be read as board coordinates anyway,
 * so a library would add weight without removing much code.
 *
 * While dragging, a floating copy follows the pointer (`DragGhost`) and
 * the real card is moved in the store on every move, so the buckets panel
 * re-ranks live. Dropping anywhere else puts the card back where it was.
 */

/** Below this many pixels of movement, a press is a click, not a drag. */
const DRAG_THRESHOLD = 4;

const zones: { matrix: HTMLElement | null; strip: HTMLElement | null } = { matrix: null, strip: null };

/** Ref callbacks for the two drop targets. */
export const registerMatrix = (el: HTMLElement | null) => void (zones.matrix = el);
export const registerStrip = (el: HTMLElement | null) => void (zones.strip = el);

const inside = (r: DOMRect, x: number, y: number) =>
  x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;

/**
 * Set when a drag ends, so the click the browser fires right after the
 * release (on the strip, say) is not mistaken for "add a card here".
 */
let lastDragEnd = 0;
export const justDragged = () => performance.now() - lastDragEnd < 100;

export function startCardDrag(event: ReactPointerEvent<HTMLElement>, id: CardId) {
  if (event.button !== 0 || useViewStore.getState().editingId === id) return;
  const view = useViewStore.getState();
  const board = useBoardStore.getState();
  view.select(id);

  const rect = event.currentTarget.getBoundingClientRect();
  const start = { x: event.clientX, y: event.clientY };
  // Where in the card it was grabbed, so it doesn't jump to the pointer.
  const grab = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  const original = board.doc.state.cards[id]?.pos ?? null;
  let dragging = false;
  let overNothing = false;

  const onMove = (e: PointerEvent) => {
    if (!dragging) {
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < DRAG_THRESHOLD) return;
      dragging = true;
      document.documentElement.dataset.dragging = "";
    }
    const left = e.clientX - grab.x;
    const top = e.clientY - grab.y;
    view.setDrag({ id, left, top, width: rect.width });

    const matrix = zones.matrix?.getBoundingClientRect();
    const strip = zones.strip?.getBoundingClientRect();
    overNothing = false;
    if (matrix && inside(matrix, e.clientX, e.clientY)) {
      // The card's centre, as a point on the board (y counts upwards),
      // kept far enough from the edges that the whole card stays inside.
      const cx = left + rect.width / 2;
      const cy = top + rect.height / 2;
      const pos = clampToBoard(
        { x: (cx - matrix.left) / matrix.width, y: 1 - (cy - matrix.top) / matrix.height },
        { x: rect.width / 2 / matrix.width, y: rect.height / 2 / matrix.height },
      );
      board.moveCard(id, pos);
    } else if (strip && inside(strip, e.clientX, e.clientY)) {
      board.moveCard(id, null);
    } else {
      overNothing = true;
    }
  };

  const finish = (cancelled: boolean) => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
    if (!dragging) return;
    if (cancelled || overNothing) board.moveCard(id, original);
    view.setDrag(null);
    delete document.documentElement.dataset.dragging;
    lastDragEnd = performance.now();
  };
  const onUp = () => finish(false);
  const onCancel = () => finish(true);

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onCancel);
}
