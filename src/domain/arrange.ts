import { moveCard } from "./board";
import { EDGE_INSET, LINE_INSET } from "./compare";
import { bucketsOf, cornerOf } from "./matrix";
import type { BoardState, Point, Quadrant } from "./types";

/**
 * Arrange presets: tidy the cards of one quadrant into a neat shape. Where
 * a card sits is its rank, so every preset keeps the bucket's order: it
 * only cleans up the picture, never the judgment.
 */

/** The quadrant's safe box: clear of the centre lines and the edges. */
function safeBox(q: Quadrant): { x: [number, number]; y: [number, number] } {
  const range = (high: boolean): [number, number] =>
    high ? [0.5 + LINE_INSET, 1 - EDGE_INSET] : [EDGE_INSET, 0.5 - LINE_INSET];
  return { x: range(q[1] === "r"), y: range(q[0] === "t") };
}

/**
 * "In a line": the quadrant's cards evenly spaced on its diagonal, from the
 * box corner nearest the board's best corner to the one farthest from it,
 * in their current order. Moving away from the nearest corner only ever
 * grows the distance to the best corner, so the order is kept exactly.
 */
export function arrangeLine(state: BoardState, q: Quadrant): BoardState {
  const cards = bucketsOf(state).buckets.find((b) => b.quadrant === q)?.cards ?? [];
  if (cards.length === 0) return state;
  const box = safeBox(q);
  const best = cornerOf(state.best);
  // Each axis: the box end nearer the best corner, and the other end.
  const ends = (axis: "x" | "y") => (best[axis] === 1 ? [...box[axis]].reverse() : box[axis]);
  const [x0, x1] = ends("x");
  const [y0, y1] = ends("y");
  const start = { x: x0, y: y0 };
  const end = { x: x1, y: y1 };
  // Spread over the middle of the line, so one card sits in the centre.
  const at = (t: number): Point => ({
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  });
  return cards.reduce((s, card, i) => moveCard(s, card.id, at((i + 0.5) / cards.length)), state);
}
