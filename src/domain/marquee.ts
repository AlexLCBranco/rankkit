import type { CardId, Point } from "./types";

/**
 * Selecting several cards: what the marquee (the box dragged out on empty
 * matrix) picks, and how a picked group moves together. Pure geometry, so
 * it can be tested without the page. Like Treekit's and Linkkit's: a card
 * is picked only when the box holds ALL of it, so brushing past a card's
 * edge doesn't pick it.
 */

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** The rectangle between two corners, whichever way it was dragged. */
export function rectBetween(a: Point, b: Point): Rect {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y) };
}

/** Whether `outer` holds all of `inner` (touching edges count). */
export function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

/** Every card the box holds, in the order given. */
export function cardsIn(box: Rect, cards: Iterable<readonly [CardId, Rect]>): CardId[] {
  const picked: CardId[] = [];
  for (const [id, rect] of cards) if (contains(box, rect)) picked.push(id);
  return picked;
}

/**
 * The selection after the marquee moved. A plain drag picks just what it
 * holds; with Shift held it adds to what was already picked (`before`),
 * which keeps its order, the new ones after it.
 */
export function marqueeSelection(before: readonly CardId[], picked: readonly CardId[], adding: boolean): CardId[] {
  if (!adding) return [...picked];
  return [...before, ...picked.filter((id) => !before.includes(id))];
}

/** Shift+click: a card joins the selection, or leaves it if already in. */
export function toggleInSelection(before: readonly CardId[], id: CardId): CardId[] {
  return before.includes(id) ? before.filter((c) => c !== id) : [...before, id];
}

/** A card in a moving group: where it started, and how far its centre must
    stay from the board's edges (half its size, in board units). */
export interface GroupMember {
  readonly start: Point;
  readonly margin: Point;
}

/**
 * Moving a group by `delta` (board units, y upwards). The group moves as one
 * block: when one card reaches an edge the whole block stops on that axis,
 * so the cards never squash together and keep their order.
 */
export function moveGroup(members: ReadonlyMap<CardId, GroupMember>, delta: Point): Map<CardId, Point> {
  let [minX, maxX, minY, maxY] = [-Infinity, Infinity, -Infinity, Infinity];
  for (const { start, margin } of members.values()) {
    const mx = Math.min(margin.x, 0.5);
    const my = Math.min(margin.y, 0.5);
    minX = Math.max(minX, mx - start.x);
    maxX = Math.min(maxX, 1 - mx - start.x);
    minY = Math.max(minY, my - start.y);
    maxY = Math.min(maxY, 1 - my - start.y);
  }
  // A card already past an edge (min > max) must not drag the rest further.
  const clamp = (v: number, lo: number, hi: number) => (lo > hi ? 0 : Math.min(hi, Math.max(lo, v)));
  const dx = clamp(delta.x, minX, maxX);
  const dy = clamp(delta.y, minY, maxY);
  const moved = new Map<CardId, Point>();
  for (const [id, { start }] of members) moved.set(id, { x: start.x + dx, y: start.y + dy });
  return moved;
}
