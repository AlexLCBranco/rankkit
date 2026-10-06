import type { PointerEvent as ReactPointerEvent } from "react";

import { moveGroup, toggleInSelection, type GroupMember } from "../../domain/marquee";
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
 * The whole drag is one undo step (`beginGesture` / `endGesture`).
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

/** Marks a press-and-move as finished (see `justDragged`). */
export const markDragEnd = () => void (lastDragEnd = performance.now());

/** The matrix element, for the marquee and the group drag to measure. */
export const matrixElement = () => zones.matrix;

/** A placed card's element on the matrix (cards carry `data-card-id`). */
export const cardElement = (id: CardId) =>
  zones.matrix?.querySelector<HTMLElement>(`[data-card-id="${CSS.escape(id)}"]`) ?? null;

export function startCardDrag(event: ReactPointerEvent<HTMLElement>, id: CardId) {
  if (event.button !== 0 || useViewStore.getState().editingId === id) return;
  const view = useViewStore.getState();
  const board = useBoardStore.getState();
  // Shift+click adds the card to the picked group, or takes it out.
  if (event.shiftKey) {
    view.selectMany(toggleInSelection(view.selectedIds, id));
    return;
  }
  // Pressing a card of a group moves the whole group (its placed cards).
  if (view.selectedIds.length > 1 && view.selectedIds.includes(id) && board.doc.state.cards[id]?.pos) {
    startGroupDrag(event, id);
    return;
  }
  view.select(id);

  const rect = event.currentTarget.getBoundingClientRect();
  const start = { x: event.clientX, y: event.clientY };
  // Where in the card it was grabbed, so it doesn't jump to the pointer.
  const grab = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  let dragging = false;
  let overNothing = false;

  const onMove = (e: PointerEvent) => {
    if (!dragging) {
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < DRAG_THRESHOLD) return;
      dragging = true;
      board.beginGesture();
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
    board.endGesture(cancelled || overNothing);
    view.setDrag(null);
    delete document.documentElement.dataset.dragging;
    markDragEnd();
  };
  const onUp = () => finish(false);
  const onCancel = () => finish(true);

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onCancel);
}

/**
 * Dragging a group: every picked card on the matrix moves by the pointer's
 * movement, as one block that stops at the board's edges (`moveGroup`).
 * No floating copy here; the real cards move, so the shape stays visible.
 * Cards of the group still in the unsorted strip stay there. A press that
 * doesn't move picks just that card, as a plain click would. The whole
 * drag is one undo step; a cancelled pointer puts the cards back.
 */
function startGroupDrag(event: ReactPointerEvent<HTMLElement>, id: CardId) {
  const view = useViewStore.getState();
  const board = useBoardStore.getState();
  const matrix = zones.matrix?.getBoundingClientRect();
  if (!matrix) return;
  const { cards } = board.doc.state;
  const members = new Map<CardId, GroupMember>();
  for (const member of view.selectedIds) {
    const pos = cards[member]?.pos;
    const el = cardElement(member);
    if (!pos || !el) continue;
    const r = el.getBoundingClientRect();
    members.set(member, { start: pos, margin: { x: r.width / 2 / matrix.width, y: r.height / 2 / matrix.height } });
  }
  const start = { x: event.clientX, y: event.clientY };
  let dragging = false;

  const onMove = (e: PointerEvent) => {
    if (!dragging) {
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < DRAG_THRESHOLD) return;
      dragging = true;
      board.beginGesture();
      document.documentElement.dataset.dragging = "";
    }
    // Pixels to board units; y counts upwards on the board.
    const delta = { x: (e.clientX - start.x) / matrix.width, y: -(e.clientY - start.y) / matrix.height };
    board.moveCards(moveGroup(members, delta));
  };

  const finish = (cancelled: boolean) => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
    if (!dragging) {
      if (!cancelled) view.select(id);
      return;
    }
    board.endGesture(cancelled);
    delete document.documentElement.dataset.dragging;
    markDragEnd();
  };
  const onUp = () => finish(false);
  const onCancel = () => finish(true);

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onCancel);
}
