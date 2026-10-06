import { moveCard } from "./board";
import { bucketsOf, cornerOf, distanceToBest, quadrantOf } from "./matrix";
import type { BoardState, Card, CardId, Point, Quadrant } from "./types";

/**
 * "This or that": two neighbours in a bucket that rank almost the same are
 * a close call, and the app asks which comes first. The answer is written
 * back as positions (the winner moves towards the best corner, the other
 * away from it), so the matrix stays the only judgment and nothing extra
 * is stored.
 */

/** Rank distances closer than this are too near to tell by eye. */
export const CLOSE_CALL = 0.05;
/** How far apart a settled pair ends up: clearly more than a close call. */
const SETTLED_GAP = 0.1;
/** A settled card keeps this far from the centre lines (so it stays in its
    bucket) and from the board's edges (so the whole card stays visible). */
export const LINE_INSET = 0.03;
export const EDGE_INSET = 0.1;

export interface CloseCall {
  readonly quadrant: Quadrant;
  /** Ranked first right now. */
  readonly first: Card;
  readonly second: Card;
}

/** Every pair of neighbours, in every bucket, that is a close call. */
export function closeCallsOf(state: BoardState): CloseCall[] {
  const calls: CloseCall[] = [];
  for (const { quadrant, cards } of bucketsOf(state).buckets) {
    for (let i = 1; i < cards.length; i++) {
      const [first, second] = [cards[i - 1], cards[i]];
      const gap = distanceToBest(state, second.pos!) - distanceToBest(state, first.pos!);
      if (gap < CLOSE_CALL) calls.push({ quadrant, first, second });
    }
  }
  return calls;
}

/**
 * Settles a close call: `winner` comes first. Both cards slide along the
 * line to the best corner, the winner in and the other out, until they are
 * clearly apart, each staying inside its own quadrant. Cards already
 * clearly in that order are left alone.
 */
export function settle(state: BoardState, winner: CardId, loser: CardId): BoardState {
  const w = state.cards[winner];
  const l = state.cards[loser];
  if (!w?.pos || !l?.pos || winner === loser) return state;
  const q = quadrantOf(w.pos);
  if (quadrantOf(l.pos) !== q) return state;
  const dw = distanceToBest(state, w.pos);
  const dl = distanceToBest(state, l.pos);
  const mid = (dw + dl) / 2;
  const wPos = slide(state, w.pos, Math.min(dw, mid - SETTLED_GAP / 2), q);
  const lPos = slide(state, l.pos, Math.max(dl, mid + SETTLED_GAP / 2), q);
  // Hemmed in by the quadrant's edges: better no change than a wrong one.
  if (distanceToBest(state, wPos) >= distanceToBest(state, lPos)) return state;
  return moveCard(moveCard(state, winner, wPos), loser, lPos);
}

/**
 * Moves `p` along the ray from the best corner through it, to distance
 * `target` from that corner, or as near as the quadrant allows. Along one
 * ray the distance only grows, so stopping early never flips the order.
 */
function slide(state: BoardState, p: Point, target: number, q: Quadrant): Point {
  const corner = cornerOf(state.best);
  const d = distanceToBest(state, p);
  // A card sitting right on the best corner heads for its quadrant's middle.
  const centre = { x: q[1] === "r" ? 0.75 : 0.25, y: q[0] === "t" ? 0.75 : 0.25 };
  const from = d > 0 ? p : centre;
  const len = Math.hypot(from.x - corner.x, from.y - corner.y);
  const u = { x: (from.x - corner.x) / len, y: (from.y - corner.y) / len };

  // The scales s (point = corner + u·s) that keep each axis inside the
  // quadrant's safe box, widened to include where the card is now.
  let lo = 0;
  let hi = Infinity;
  for (const axis of ["x", "y"] as const) {
    const high = axis === "x" ? q[1] === "r" : q[0] === "t";
    const [min, max] = high ? [0.5 + LINE_INSET, 1 - EDGE_INSET] : [EDGE_INSET, 0.5 - LINE_INSET];
    const [a, b] = [Math.min(min, p[axis]), Math.max(max, p[axis])];
    const c = corner[axis];
    if (u[axis] === 0) continue;
    const s1 = (a - c) / u[axis];
    const s2 = (b - c) / u[axis];
    lo = Math.max(lo, Math.min(s1, s2));
    hi = Math.min(hi, Math.max(s1, s2));
  }
  const s = Math.min(hi, Math.max(lo, target));
  if (d > 0 && s === d) return p;
  return { x: corner.x + u.x * s, y: corner.y + u.y * s };
}
