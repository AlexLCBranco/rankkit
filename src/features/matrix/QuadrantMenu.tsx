import { TrendingUp } from "lucide-react";
import type { ReactElement } from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuTrigger,
} from "../../components/ui/context-menu";
import { quadrantOf } from "../../domain/matrix";
import type { Quadrant } from "../../domain/types";
import { useBoardStore } from "../../store/boardStore";

/**
 * A quadrant's right-click menu: presets that tidy its cards. The same
 * gesture as the card menu, so there is nothing new to learn. Every preset
 * keeps the bucket's order, since where a card sits is its rank.
 *
 * `children` must be the quadrant element itself: it becomes the trigger.
 */
export function QuadrantMenu({ q, children }: { readonly q: Quadrant; readonly children: ReactElement }) {
  const hasCards = useBoardStore((s) =>
    Object.values(s.doc.state.cards).some((card) => card.pos && quadrantOf(card.pos) === q),
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52" onCloseAutoFocus={(e) => e.preventDefault()}>
        <ContextMenuLabel>Arrange cards</ContextMenuLabel>
        <ContextMenuItem disabled={!hasCards} onSelect={() => useBoardStore.getState().arrangeLine(q)}>
          <TrendingUp aria-hidden />
          In a line, keeping the order
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
