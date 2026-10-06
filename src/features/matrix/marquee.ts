import type { PointerEvent as ReactPointerEvent } from "react";

import { cardsIn, marqueeSelection, rectBetween, type Rect } from "../../domain/marquee";
import type { CardId } from "../../domain/types";
import { useViewStore } from "../../store/viewStore";
import { markDragEnd } from "./cardDrag";

/** Below this many pixels of movement, a press is a click, not a marquee. */
const MARQUEE_THRESHOLD = 4;

/**
 * The marquee: press on empty matrix and drag to draw a box. Every card
 * the box holds completely is picked as it grows (Treekit's and Linkkit's
 * rule); with Shift held it adds to what is already picked. Measured in
 * pixels inside the matrix, from the cards' own elements, so the picking
 * matches exactly what is on screen.
 */
export function startMarquee(event: ReactPointerEvent<HTMLElement>) {
  if (event.button !== 0) return;
  const target = event.target as HTMLElement;
  // Cards start their own drag; a label being renamed keeps the pointer.
  if (target.closest("[data-card-id], input, textarea")) return;
  const matrix = event.currentTarget;
  const view = useViewStore.getState();
  const before = view.selectedIds;
  const adding = event.shiftKey;
  const box = matrix.getBoundingClientRect();
  const local = (e: { clientX: number; clientY: number }) => ({ x: e.clientX - box.left, y: e.clientY - box.top });
  const start = local(event);
  let drawing = false;

  const cardRects = () => {
    const rects: [CardId, Rect][] = [];
    for (const el of matrix.querySelectorAll<HTMLElement>("[data-card-id]")) {
      const r = el.getBoundingClientRect();
      rects.push([el.dataset.cardId as CardId, { x: r.left - box.left, y: r.top - box.top, width: r.width, height: r.height }]);
    }
    return rects;
  };

  const onMove = (e: PointerEvent) => {
    const now = local(e);
    if (!drawing) {
      if (Math.hypot(now.x - start.x, now.y - start.y) < MARQUEE_THRESHOLD) return;
      drawing = true;
    }
    // The box stays inside the matrix, like everything drawn on it.
    const clamped = { x: Math.min(box.width, Math.max(0, now.x)), y: Math.min(box.height, Math.max(0, now.y)) };
    const rect = rectBetween(start, clamped);
    view.setMarquee(rect);
    view.selectMany(marqueeSelection(before, cardsIn(rect, cardRects()), adding));
  };

  const finish = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", finish);
    window.removeEventListener("pointercancel", finish);
    if (!drawing) return;
    view.setMarquee(null);
    // The click fired right after the release must not clear the pick.
    markDragEnd();
  };

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", finish);
  window.addEventListener("pointercancel", finish);
}
