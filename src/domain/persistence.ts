import { DEFAULT_BOARD } from "./board";
import type { BoardDoc, BoardId, BoardState, Card, CardId, PaletteColor, Point, Quadrant } from "./types";
import { PALETTE_COLORS, QUADRANTS } from "./types";

/**
 * The saved shape of a board, and how to read it back safely. Pure: where it
 * is stored (localStorage) is `store/persistBoard.ts`'s business.
 *
 * The version number is written from the first release, before there is
 * anything to migrate, because that is the only moment adding one is free
 * (same reasoning as Boardkit and Treekit).
 */
export const SCHEMA_VERSION = 1;

export interface PersistedBoard {
  readonly version: typeof SCHEMA_VERSION;
  readonly doc: BoardDoc;
}

export function serializeBoard(doc: BoardDoc): PersistedBoard {
  const { cards, order, axes, quadrantNames, best } = doc.state;
  // Copies out exactly the content fields, so nothing else that happens to
  // ride along on the object can leak into storage.
  return {
    version: SCHEMA_VERSION,
    doc: { id: doc.id, name: doc.name, state: { cards, order, axes, quadrantNames, best } },
  };
}

export type BoardRead =
  | { readonly status: "ok"; readonly doc: BoardDoc }
  /** Some of it was damaged; `doc` is what could be recovered. */
  | { readonly status: "repaired"; readonly doc: BoardDoc; readonly fixes: number }
  | { readonly status: "unreadable" };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isUnit = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

export const UNTITLED_BOARD = "Untitled board";

/**
 * Validates saved data and repairs what it can. Saved data can be damaged
 * by a bug in an older version, a hand edit or a half-written save, and a
 * broken board must never crash the app on load.
 *
 * Repairs: fields with the wrong type get defaults; a position outside the
 * board sends the card back to the unsorted strip; the card order is
 * rebuilt from the cards that exist. `unreadable` is kept for data with
 * nothing to salvage, or an unknown version (possibly a newer one:
 * "repairing" it would destroy what that version wrote).
 */
export function readBoard(data: unknown): BoardRead {
  if (!isObject(data) || data.version !== SCHEMA_VERSION || !isObject(data.doc)) {
    return { status: "unreadable" };
  }
  const doc = data.doc;
  const state = isObject(doc.state) ? doc.state : null;
  if (typeof doc.id !== "string" || !doc.id || !state) return { status: "unreadable" };
  let fixes = 0;
  const fix = <T>(value: T): T => {
    fixes++;
    return value;
  };

  // Cards.
  const rawCards: Record<string, unknown> = isObject(state.cards) ? state.cards : fix({});
  const cards: Record<CardId, Card> = {};
  for (const [key, raw] of Object.entries(rawCards)) {
    if (!isObject(raw)) {
      fix(null);
      continue;
    }
    const id = key as CardId;
    const text = typeof raw.text === "string" ? raw.text : fix("");
    const color =
      raw.color === null || PALETTE_COLORS.includes(raw.color as PaletteColor)
        ? (raw.color as PaletteColor | null)
        : fix(null);
    const pos: Point | null =
      raw.pos === null
        ? null
        : isObject(raw.pos) && isUnit(raw.pos.x) && isUnit(raw.pos.y)
          ? { x: raw.pos.x, y: raw.pos.y }
          : fix(null);
    if (raw.id !== key) fix(null);
    cards[id] = { id, text, color, pos };
  }

  // Order: the saved order where it names real cards (once each), then any
  // card the saved order forgot, so no card is ever lost.
  const rawOrder: unknown[] = Array.isArray(state.order) ? state.order : fix([]);
  const order: CardId[] = [];
  for (const id of rawOrder) {
    if (typeof id === "string" && cards[id as CardId] && !order.includes(id as CardId)) {
      order.push(id as CardId);
    } else {
      fix(null);
    }
  }
  for (const id of Object.keys(cards) as CardId[]) {
    if (!order.includes(id)) order.push(fix(id));
  }

  // Words: a missing or blank one falls back to the default.
  const word = (raw: unknown, fallback: string) =>
    typeof raw === "string" && raw.trim() ? raw : fix(fallback);
  const rawAxes: Record<string, unknown> = isObject(state.axes) ? state.axes : fix({});
  const axes = { x: word(rawAxes.x, DEFAULT_BOARD.axes.x), y: word(rawAxes.y, DEFAULT_BOARD.axes.y) };
  const rawNames: Record<string, unknown> = isObject(state.quadrantNames) ? state.quadrantNames : fix({});
  const quadrantNames = Object.fromEntries(
    QUADRANTS.map((q) => [q, word(rawNames[q], DEFAULT_BOARD.quadrantNames[q])]),
  ) as Record<Quadrant, string>;
  const best = QUADRANTS.includes(state.best as Quadrant) ? (state.best as Quadrant) : fix(DEFAULT_BOARD.best);

  const name = typeof doc.name === "string" && doc.name.trim() ? doc.name : fix(UNTITLED_BOARD);
  const board: BoardState = { cards, order, axes, quadrantNames, best };
  const result: BoardDoc = { id: doc.id as BoardId, name, state: board };
  return fixes === 0 ? { status: "ok", doc: result } : { status: "repaired", doc: result, fixes };
}
