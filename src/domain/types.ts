/**
 * The board model. Pure TypeScript: no React, no store.
 *
 * A card's place on the matrix is a point in a unit square: `x` runs left
 * to right (0 to 1) and `y` runs bottom to top (0 to 1), so "up" and
 * "right" both mean "more". These numbers are never shown; the app only
 * ever turns them into words (a quadrant) and an order (1, 2, 3).
 */
export type CardId = string & { readonly __brand: "CardId" };
export type BoardId = string & { readonly __brand: "BoardId" };

export const PALETTE_COLORS = [
  "slate",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
] as const;
export type PaletteColor = (typeof PALETTE_COLORS)[number];

/** Top-left, top-right, bottom-left, bottom-right. */
export const QUADRANTS = ["tl", "tr", "bl", "br"] as const;
export type Quadrant = (typeof QUADRANTS)[number];

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Card {
  readonly id: CardId;
  readonly text: string;
  /** Optional: a card never needs a colour. */
  readonly color: PaletteColor | null;
  /** `null` while the card waits in the unsorted strip. */
  readonly pos: Point | null;
}

export interface BoardState {
  readonly cards: Readonly<Record<CardId, Card>>;
  /** Every card, oldest first: the order of the unsorted strip. */
  readonly order: readonly CardId[];
  /** What "right" and "up" mean on this board. */
  readonly axes: { readonly x: string; readonly y: string };
  readonly quadrantNames: Readonly<Record<Quadrant, string>>;
  /** The corner every bucket is ranked towards. */
  readonly best: Quadrant;
}

export interface BoardDoc {
  readonly id: BoardId;
  readonly name: string;
  readonly state: BoardState;
}
