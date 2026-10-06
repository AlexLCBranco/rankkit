import type { CardId } from "../domain/types";
import { useBoardStore } from "./boardStore";
import { useViewStore } from "./viewStore";

/** No colour, as a menu value. */
export const NONE = "none";
/** The picked cards have different colours, so no radio item is ticked. */
export const MIXED = "mixed";

/**
 * The colour shared by one card (`id`) or, with `null`, by every picked
 * card: `NONE` when uncoloured, `MIXED` when they differ. Returns a plain
 * string, so a component re-renders only when the answer changes.
 */
export function useGroupColor(id: CardId | null): string {
  const ids = useViewStore((s) => s.selectedIds);
  return useBoardStore((s) => {
    const colors = (id ? [id] : ids).map((c) => s.doc.state.cards[c]?.color ?? NONE);
    return colors.every((c) => c === colors[0]) ? (colors[0] ?? NONE) : MIXED;
  });
}
