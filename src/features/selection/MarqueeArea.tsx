import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

import { cardsIn, marqueeSelection, rectBetween, type Rect } from "../../domain/marquee";
import type { CardId } from "../../domain/types";
import { useViewStore } from "../../store/viewStore";
import { justDragged, markDragEnd } from "../matrix/cardDrag";
import styles from "./MarqueeArea.module.css";

/** Below this many pixels of movement, a press is a click, not a marquee. */
const MARQUEE_THRESHOLD = 4;

/** Things a press must never start a marquee from: they have their own job. */
const OWN_GESTURE = "[data-card-id], button, input, textarea, [role=toolbar]";

/**
 * The whole board column (the matrix, the space around it and the unsorted
 * strip) as one surface for the marquee: press on any empty spot and drag
 * to draw a box. Every card the box holds completely is picked as it grows
 * (Treekit's and Linkkit's rule), on the matrix or in the strip; with Shift
 * held it adds to what is already picked. Measured in pixels from the
 * cards' own elements, so the picking matches exactly what is on screen.
 *
 * A plain click on empty space lets go of the pick, except in the strip,
 * where a click adds a card instead.
 */
export function MarqueeArea({ className, children }: { readonly className: string; readonly children: ReactNode }) {
  return (
    <div className={className} onPointerDown={startMarquee} onClick={onClick}>
      {children}
      <MarqueeBox />
    </div>
  );
}

/** Events from menus open over the board bubble here through React (they
    are portals), but they are not on the board itself. */
const onBoard = (e: { currentTarget: HTMLElement; target: EventTarget }) =>
  e.target instanceof Element && e.currentTarget.contains(e.target);

function onClick(e: React.MouseEvent<HTMLElement>) {
  if (!onBoard(e) || justDragged()) return;
  const target = e.target as Element;
  if (target.closest(`${OWN_GESTURE}, [data-strip]`)) return;
  useViewStore.getState().select(null);
}

function startMarquee(event: ReactPointerEvent<HTMLElement>) {
  if (event.button !== 0 || !onBoard(event)) return;
  if ((event.target as Element).closest(OWN_GESTURE)) return;
  const area = event.currentTarget;
  const view = useViewStore.getState();
  const before = view.selectedIds;
  const adding = event.shiftKey;
  const box = area.getBoundingClientRect();
  const local = (e: { clientX: number; clientY: number }) => ({ x: e.clientX - box.left, y: e.clientY - box.top });
  const start = local(event);
  let drawing = false;

  const cardRects = () => {
    const rects: [CardId, Rect][] = [];
    for (const el of area.querySelectorAll<HTMLElement>("[data-card-id]")) {
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
    // The box stays inside the board column.
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
    // The click fired right after the release must not clear the pick, or
    // (in the strip) add a card.
    markDragEnd();
  };

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", finish);
  window.addEventListener("pointercancel", finish);
}

/** The tinted box that follows the pointer while a marquee is drawn. */
function MarqueeBox() {
  const box = useViewStore((s) => s.marquee);
  if (!box) return null;
  return <div className={styles.marquee} style={{ left: box.x, top: box.y, width: box.width, height: box.height }} />;
}
