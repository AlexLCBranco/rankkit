import { nanoid } from "nanoid";

import type { BoardId, CardId } from "./types";

/**
 * Id generation, wrapped in one place (as in Treekit): nothing else calls
 * `nanoid`, so if ids ever change shape this is the only file that moves.
 */
const ID_LENGTH = 10;

export const createBoardId = (): BoardId => nanoid(ID_LENGTH) as BoardId;
export const createCardId = (): CardId => nanoid(ID_LENGTH) as CardId;

/** Casts for ids coming from outside the generator (saved state, tests). */
export const asCardId = (value: string): CardId => value as CardId;
