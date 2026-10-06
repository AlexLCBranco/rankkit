import type { BoardState, Card, Point, Quadrant } from "./types";

/**
 * Turning positions into answers: which quadrant a card is in, and its
 * place in that quadrant's list. Everything the buckets panel shows comes
 * from here.
 */

/** Exactly on a centre line counts as the "more" side (top, right). */
export function quadrantOf(p: Point): Quadrant {
  return `${p.y >= 0.5 ? "t" : "b"}${p.x >= 0.5 ? "r" : "l"}` as Quadrant;
}

/** The outer corner of a quadrant, in board coordinates. */
export function cornerOf(q: Quadrant): Point {
  return { x: q[1] === "r" ? 1 : 0, y: q[0] === "t" ? 1 : 0 };
}

const flipX = (q: Quadrant) => `${q[0]}${q[1] === "r" ? "l" : "r"}` as Quadrant;
const flipY = (q: Quadrant) => `${q[0] === "t" ? "b" : "t"}${q[1]}` as Quadrant;

/**
 * The quadrants from most to least wanted: the best one, then its
 * neighbour across the vertical line (same height: by default "important
 * but not urgent", Schedule), then the one below the best (Delegate), then
 * the opposite corner (Drop). Up beats right, matching the Eisenhower
 * habit that importance outranks urgency.
 */
export function quadrantOrder(best: Quadrant): readonly Quadrant[] {
  return [best, flipX(best), flipY(best), flipX(flipY(best))];
}

/** How far a point is from the board's best corner: what ranks a card. */
export function distanceToBest(state: Pick<BoardState, "best">, p: Point): number {
  const c = cornerOf(state.best);
  return Math.hypot(p.x - c.x, p.y - c.y);
}

export interface Bucket {
  readonly quadrant: Quadrant;
  readonly name: string;
  /** Closest to the board's best corner first. */
  readonly cards: readonly Card[];
}

export interface Buckets {
  readonly buckets: readonly Bucket[];
  readonly unsorted: readonly Card[];
}

/**
 * Every placed card sorted into its quadrant's bucket, and each bucket
 * ordered by closeness to the board's best corner (not the bucket's own
 * corner): in every bucket, "first" means "nearest to Do now". Equal
 * distances fall back to the order cards were added, so the list never
 * flickers between two equal cards.
 */
export function bucketsOf(state: BoardState): Buckets {
  const placed = new Map<Quadrant, { card: Card; d: number; i: number }[]>();
  const unsorted: Card[] = [];
  state.order.forEach((id, i) => {
    const card = state.cards[id];
    if (!card) return;
    if (!card.pos) {
      unsorted.push(card);
      return;
    }
    const q = quadrantOf(card.pos);
    const list = placed.get(q) ?? [];
    list.push({ card, d: distanceToBest(state, card.pos), i });
    placed.set(q, list);
  });
  const buckets = quadrantOrder(state.best).map((quadrant) => ({
    quadrant,
    name: state.quadrantNames[quadrant],
    cards: (placed.get(quadrant) ?? []).sort((a, b) => a.d - b.d || a.i - b.i).map((e) => e.card),
  }));
  return { buckets, unsorted };
}

/** Keeps a point inside the board, `margin` in from each edge. */
export function clampToBoard(p: Point, margin: Point = { x: 0, y: 0 }): Point {
  const clamp = (v: number, m: number) => Math.min(1 - m, Math.max(m, v));
  return { x: clamp(p.x, Math.min(margin.x, 0.5)), y: clamp(p.y, Math.min(margin.y, 0.5)) };
}

export interface RankedCard {
  readonly card: Card;
  /** `null` while the card is still unsorted. */
  readonly quadrant: Quadrant | null;
  /** The bucket's name, or "Unsorted". */
  readonly bucket: string;
  /** 1-based place inside its bucket; `null` when unsorted. */
  readonly place: number | null;
}

/**
 * The whole board as one priority order: every bucket's list one after
 * another, best bucket first, then the unsorted cards in the order they
 * were added. The List and Table views read this.
 */
export function rankingOf(state: BoardState): readonly RankedCard[] {
  const { buckets, unsorted } = bucketsOf(state);
  return [
    ...buckets.flatMap((b) =>
      b.cards.map((card, i) => ({ card, quadrant: b.quadrant, bucket: b.name, place: i + 1 })),
    ),
    ...unsorted.map((card) => ({ card, quadrant: null, bucket: "Unsorted", place: null })),
  ];
}
