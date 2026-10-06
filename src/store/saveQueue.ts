import type { BoardDoc } from "../domain/types";
import { saveBoard } from "./persistBoard";

/**
 * The pending auto-save, if any (the same module as Treekit's). Its own
 * module so both the auto-saver (which schedules) and the store can reach
 * it without importing each other. The store must flush before switching
 * boards: a pending save reads the store when it runs, so after a switch it
 * would read the *new* board, and the old board's last edits would be lost.
 */
const SAVE_DELAY_MS = 400;

let timer: ReturnType<typeof setTimeout> | null = null;
let pending: (() => BoardDoc) | null = null;

/** Saves `read()` after a short quiet period; a newer call replaces it. */
export function scheduleSave(read: () => BoardDoc): void {
  if (timer !== null) clearTimeout(timer);
  pending = read;
  timer = setTimeout(flushSave, SAVE_DELAY_MS);
}

/** Writes the pending save now, if there is one. */
export function flushSave(): void {
  if (timer !== null) clearTimeout(timer);
  timer = null;
  const read = pending;
  pending = null;
  if (read) saveBoard(read());
}

/** Drops the pending save (the board it belongs to was just deleted). */
export function cancelSave(): void {
  if (timer !== null) clearTimeout(timer);
  timer = null;
  pending = null;
}
