import { readBoard, serializeBoard, type BoardRead } from "../domain/persistence";
import {
  readRegistry,
  removeBoard,
  serializeRegistry,
  upsertBoard,
  type Registry,
} from "../domain/registry";
import type { BoardDoc, BoardId } from "../domain/types";

/**
 * The only module that touches localStorage for boards. `domain/` owns the
 * data shapes and their validation; this owns where they live:
 *
 *   rankkit:board:<id>  one board
 *   rankkit:registry    the list of boards (ids and names, creation order)
 *   rankkit:active      the id of the board that was open last
 *
 * Every write is wrapped: storage can fail (quota, private browsing)
 * without that being fatal -- the app keeps working in memory.
 */
const BOARD_KEY_PREFIX = "rankkit:board:";
const REGISTRY_KEY = "rankkit:registry";
const ACTIVE_KEY = "rankkit:active";
const DAMAGED_KEY_PREFIX = "rankkit:damaged:";

function tryWrite(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // See the module comment: failing to save is not fatal.
  }
}

function parse(raw: string): BoardRead {
  try {
    return readBoard(JSON.parse(raw));
  } catch {
    return { status: "unreadable" };
  }
}

function storedBoardIds(): BoardId[] {
  const ids: BoardId[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(BOARD_KEY_PREFIX)) ids.push(key.slice(BOARD_KEY_PREFIX.length) as BoardId);
  }
  return ids;
}

function writeRegistry(registry: Registry): void {
  tryWrite(REGISTRY_KEY, JSON.stringify(serializeRegistry(registry)));
}

/**
 * The list of saved boards, reconciled with what is actually stored: an
 * entry whose board is gone is dropped, and a stored board the list does not
 * know is added. That also covers a registry lost or damaged on its own.
 */
export function loadRegistry(): Registry {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    let registry: Registry = [];
    if (raw !== null) {
      try {
        registry = readRegistry(JSON.parse(raw)) ?? [];
      } catch {
        registry = [];
      }
    }
    const stored = new Set(storedBoardIds());
    let reconciled: Registry = registry.filter((t) => stored.has(t.id));
    for (const id of stored) {
      if (reconciled.some((t) => t.id === id)) continue;
      const read = parse(localStorage.getItem(BOARD_KEY_PREFIX + id) ?? "");
      reconciled = upsertBoard(reconciled, {
        id,
        name: read.status === "unreadable" ? "Damaged board" : read.doc.name,
      });
    }
    if (reconciled.length !== registry.length || reconciled.some((t, i) => t !== registry[i])) {
      writeRegistry(reconciled);
    }
    return reconciled;
  } catch {
    return [];
  }
}

/** Writes a board and keeps its registry entry (name) in step. */
export function saveBoard(doc: BoardDoc): void {
  tryWrite(BOARD_KEY_PREFIX + doc.id, JSON.stringify(serializeBoard(doc)));
  writeRegistry(upsertBoard(loadRegistry(), { id: doc.id, name: doc.name }));
}

export function deleteStoredBoard(id: BoardId): void {
  try {
    localStorage.removeItem(BOARD_KEY_PREFIX + id);
  } catch {
    // Nothing to do: the registry below still forgets it.
  }
  writeRegistry(removeBoard(loadRegistry(), id));
}

export function loadActiveBoardId(): BoardId | null {
  try {
    return localStorage.getItem(ACTIVE_KEY) as BoardId | null;
  } catch {
    return null;
  }
}

export function saveActiveBoardId(id: BoardId): void {
  tryWrite(ACTIVE_KEY, id);
}

/**
 * Reads one board, or `null` if it is missing or nothing could be salvaged.
 *
 * A damaged board still opens, repaired as far as possible -- but first its
 * saved text is copied, untouched, to a `rankkit:damaged:` key, because the
 * next auto-save overwrites the board's own key. Without that copy,
 * "repaired" would quietly mean "whatever the repair kept".
 */
export function loadBoard(id: BoardId): BoardDoc | null {
  try {
    const raw = localStorage.getItem(BOARD_KEY_PREFIX + id);
    if (raw === null) return null;
    const read = parse(raw);
    if (read.status === "ok") return read.doc;

    const asideKey = `${DAMAGED_KEY_PREFIX}${id}:${Date.now()}`;
    tryWrite(asideKey, raw);
    console.warn(
      read.status === "repaired"
        ? `Rankkit: a saved board was damaged and has been repaired (${read.fixes} fixes). The original is kept in localStorage under "${asideKey}".`
        : `Rankkit: a saved board could not be read. It is kept in localStorage under "${asideKey}".`,
    );
    return read.status === "repaired" ? read.doc : null;
  } catch {
    return null;
  }
}
