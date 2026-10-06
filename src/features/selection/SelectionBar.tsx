import { ChevronDown, Trash2, X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { PALETTE_COLORS, type PaletteColor } from "../../domain/types";
import { countInWords } from "../../domain/words";
import { MIXED, NONE, useGroupColor } from "../../store/groupColor";
import { useBoardStore } from "../../store/boardStore";
import { useViewStore } from "../../store/viewStore";
import styles from "./SelectionBar.module.css";

const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * Actions for a picked group, floating at the bottom of the matrix while
 * two or more cards are picked (Treekit's and Linkkit's selection bar):
 * how many, in words; colour; delete; and × to let go. Each is one undo
 * step for the whole group. The same things the right-click menu and the
 * Delete / Esc keys do, made visible so they can be found without knowing
 * them.
 */
export function SelectionBar() {
  const count = useViewStore((s) => s.selectedIds.length);
  const color = useGroupColor(null);
  if (count < 2) return null;

  // Read at click time, so an action always gets the group as it is now.
  const group = () => useViewStore.getState().selectedIds;
  const label = countInWords(count, "card");

  return (
    <div className={styles.bar} role="toolbar" aria-label="Picked cards">
      <span className={styles.count}>{label}</span>
      <span className={styles.divider} aria-hidden />

      <DropdownMenu>
        <DropdownMenuTrigger className={styles.colorTrigger} aria-label="Colour" title="Colour">
          <span
            className={styles.swatch}
            data-none={color === NONE || undefined}
            data-mixed={color === MIXED || undefined}
            style={color !== NONE && color !== MIXED ? { background: `var(--palette-${color})` } : undefined}
            aria-hidden
          />
          <ChevronDown size={12} aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" sideOffset={8} className="w-44" onCloseAutoFocus={(e) => e.preventDefault()}>
          <DropdownMenuRadioGroup
            value={color === MIXED ? "" : color}
            onValueChange={(value) =>
              useBoardStore.getState().setCardsColor(group(), value === NONE ? null : (value as PaletteColor))
            }
          >
            <DropdownMenuRadioItem value={NONE}>
              <span className="size-3 rounded-full border border-border" aria-hidden />
              None
            </DropdownMenuRadioItem>
            {PALETTE_COLORS.map((swatch) => (
              <DropdownMenuRadioItem key={swatch} value={swatch}>
                <span className="size-3 rounded-full" style={{ background: `var(--palette-${swatch})` }} aria-hidden />
                {capitalise(swatch)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        className={styles.iconButton}
        data-danger
        aria-label={`Delete ${label.toLowerCase()}`}
        title={`Delete ${label.toLowerCase()} (Delete)`}
        onClick={() => {
          useBoardStore.getState().deleteCards(group());
          useViewStore.getState().select(null);
        }}
      >
        <Trash2 size={16} aria-hidden />
      </button>
      <span className={styles.divider} aria-hidden />

      <button
        type="button"
        className={styles.iconButton}
        aria-label="Let go of the picked cards"
        title="Let go (Esc)"
        onClick={() => useViewStore.getState().select(null)}
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
