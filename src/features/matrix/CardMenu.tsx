import { Trash2 } from "lucide-react";
import type { ReactElement } from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../../components/ui/context-menu";
import { PALETTE_COLORS, type CardId, type PaletteColor } from "../../domain/types";
import { countInWords } from "../../domain/words";
import { useBoardStore } from "../../store/boardStore";
import { useViewStore } from "../../store/viewStore";
import { MIXED, NONE, useGroupColor } from "../../store/groupColor";

const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * A card's right-click menu: its colour (the same eight as Treekit's, with
 * the same words) and delete. Right-clicking also selects the card, so it is
 * clear which card the menu is about. Right-clicking a card of a picked
 * group keeps the group, and the menu then acts on all of it (Treekit's
 * rule). While the card's text is being typed the menu stands aside, so the
 * browser's own menu (paste, spelling) works.
 *
 * `children` must be the card element itself: it becomes the trigger.
 */
export function CardMenu({ id, children }: { readonly id: CardId; readonly children: ReactElement }) {
  const inGroup = useViewStore((s) => s.selectedIds.length > 1 && s.selectedIds.includes(id));
  const editing = useViewStore((s) => s.editingId === id);
  const color = useGroupColor(inGroup ? null : id);
  const count = useViewStore((s) => (inGroup ? s.selectedIds.length : 1));

  // Read at click time, so an action always gets the group as it is now.
  const targets = () => (inGroup ? useViewStore.getState().selectedIds : [id]);

  return (
    <ContextMenu>
      <ContextMenuTrigger
        asChild
        disabled={editing}
        onContextMenu={() => !inGroup && useViewStore.getState().select(id)}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44" onCloseAutoFocus={(e) => e.preventDefault()}>
        <ContextMenuLabel>Colour</ContextMenuLabel>
        <ContextMenuRadioGroup
          value={color === MIXED ? "" : color}
          onValueChange={(value) =>
            useBoardStore.getState().setCardsColor(targets(), value === NONE ? null : (value as PaletteColor))
          }
        >
          <ContextMenuRadioItem value={NONE}>
            <span className="size-3 rounded-full border border-border" aria-hidden />
            None
          </ContextMenuRadioItem>
          {PALETTE_COLORS.map((swatch) => (
            <ContextMenuRadioItem key={swatch} value={swatch}>
              <span className="size-3 rounded-full" style={{ background: `var(--palette-${swatch})` }} aria-hidden />
              {capitalise(swatch)}
            </ContextMenuRadioItem>
          ))}
        </ContextMenuRadioGroup>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onSelect={() => {
            useBoardStore.getState().deleteCards(targets());
            useViewStore.getState().select(null);
          }}
        >
          <Trash2 aria-hidden />
          {inGroup ? `Delete ${countInWords(count, "card").toLowerCase()}` : "Delete card"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
