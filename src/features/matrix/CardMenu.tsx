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
import { useBoardStore, useCard } from "../../store/boardStore";
import { useViewStore } from "../../store/viewStore";

const NONE = "none";

const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * A card's right-click menu: its colour (the same eight as Treekit's, with
 * the same words) and delete. Right-clicking also selects the card, so it is
 * clear which card the menu is about. While the card's text is being typed
 * the menu stands aside, so the browser's own menu (paste, spelling) works.
 *
 * `children` must be the card element itself: it becomes the trigger.
 */
export function CardMenu({ id, children }: { readonly id: CardId; readonly children: ReactElement }) {
  const color = useCard(id)?.color ?? null;
  const editing = useViewStore((s) => s.editingId === id);
  const { setCardColor, deleteCard } = useBoardStore.getState();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild disabled={editing} onContextMenu={() => useViewStore.getState().select(id)}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44" onCloseAutoFocus={(e) => e.preventDefault()}>
        <ContextMenuLabel>Colour</ContextMenuLabel>
        <ContextMenuRadioGroup
          value={color ?? NONE}
          onValueChange={(value) => setCardColor(id, value === NONE ? null : (value as PaletteColor))}
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
            deleteCard(id);
            useViewStore.getState().select(null);
          }}
        >
          <Trash2 aria-hidden />
          Delete card
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
