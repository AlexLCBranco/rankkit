import { UNTITLED_BOARD } from "./persistence";
import type { BoardId } from "./types";

/**
 * The index of saved boards: what the board menu lists. Kept apart from the
 * boards themselves (like Boardkit's and Treekit's registries), so listing
 * boards never means reading and parsing every board in storage.
 *
 * Stored oldest-first (creation order); the menu shows it newest-first.
 */
export interface BoardSummary {
  readonly id: BoardId;
  readonly name: string;
}

export type Registry = readonly BoardSummary[];

export const REGISTRY_VERSION = 1;

export interface PersistedRegistryV1 {
  readonly version: 1;
  readonly boards: Registry;
}

export function serializeRegistry(registry: Registry): PersistedRegistryV1 {
  return { version: REGISTRY_VERSION, boards: registry.map(({ id, name }) => ({ id, name })) };
}

/** `null` when the data is not a registry at all; bad entries are skipped. */
export function readRegistry(data: unknown): Registry | null {
  if (typeof data !== "object" || data === null) return null;
  const candidate = data as Record<string, unknown>;
  if (candidate.version !== 1 || !Array.isArray(candidate.boards)) return null;
  const seen = new Set<string>();
  const boards: BoardSummary[] = [];
  for (const entry of candidate.boards as unknown[]) {
    if (typeof entry !== "object" || entry === null) continue;
    const { id, name } = entry as Record<string, unknown>;
    if (typeof id !== "string" || !id || seen.has(id)) continue;
    seen.add(id);
    boards.push({ id: id as BoardId, name: typeof name === "string" && name ? name : UNTITLED_BOARD });
  }
  return boards;
}

/** Adds a board at the end, or updates its name in place if listed. */
export function upsertBoard(registry: Registry, summary: BoardSummary): Registry {
  const index = registry.findIndex((b) => b.id === summary.id);
  if (index === -1) return [...registry, summary];
  if (registry[index].name === summary.name) return registry;
  return registry.map((b, i) => (i === index ? summary : b));
}

export function removeBoard(registry: Registry, id: BoardId): Registry {
  return registry.filter((b) => b.id !== id);
}
