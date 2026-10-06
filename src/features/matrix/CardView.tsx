import { Trash2 } from "lucide-react";
import type { CSSProperties } from "react";

import { InlineEditable } from "../../components/InlineEditable";
import type { Card, CardId } from "../../domain/types";
import { useBoardStore, useCard } from "../../store/boardStore";
import { useViewStore } from "../../store/viewStore";
import { CardMenu } from "./CardMenu";
import { startCardDrag } from "./cardDrag";
import styles from "./CardView.module.css";

/**
 * One card, wherever it sits: on the matrix (absolutely placed at its
 * point) or in the unsorted strip (in the flow). Press and move to drag,
 * double-click to edit, hover for the trash button, right-click for the
 * colour menu.
 */
export function CardView({ id }: { readonly id: CardId }) {
  const card = useCard(id);
  const selected = useViewStore((s) => s.selectedIds.includes(id));
  const editing = useViewStore((s) => s.editingId === id);
  const hovered = useViewStore((s) => s.hoveredId === id);
  const dragging = useViewStore((s) => s.drag?.id === id);
  if (!card) return null;

  // On the matrix, the card's centre sits on its point; y counts upwards.
  const place: CSSProperties = card.pos
    ? { left: `${card.pos.x * 100}%`, top: `${(1 - card.pos.y) * 100}%` }
    : {};

  return (
    <CardMenu id={id}>
      <div
        className={styles.card}
        data-card-id={id}
        data-placed={card.pos ? "" : undefined}
        data-selected={selected ? "" : undefined}
        data-hovered={hovered ? "" : undefined}
        data-dragging={dragging ? "" : undefined}
        data-colored={card.color ? "" : undefined}
        style={{ ...place, ...accentOf(card) }}
        onPointerDown={(e) => startCardDrag(e, id)}
        onDoubleClick={() => useViewStore.getState().edit(id)}
        // Clicks on a card never reach the matrix or strip behind it.
        onClick={(e) => e.stopPropagation()}
      >
        <CardText card={card} editing={editing} />
        {!editing && (
          <button
            type="button"
            className={styles.trash}
            aria-label="Delete card"
            title="Delete card"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => useBoardStore.getState().deleteCard(id)}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </CardMenu>
  );
}

/** A coloured card carries its palette colour as `--card-accent`. */
const accentOf = (card: Card) =>
  (card.color ? { "--card-accent": `var(--palette-${card.color})` } : {}) as CSSProperties;

function CardText({ card, editing }: { readonly card: Card; readonly editing: boolean }) {
  return (
    <InlineEditable
      value={card.text}
      editing={editing}
      placeholder="New card"
      ariaLabel="Card text"
      onCommit={(text) => useBoardStore.getState().setCardText(card.id, text)}
      onDone={() => {
        useViewStore.getState().edit(null);
        // A card left empty (a new one typed into, then abandoned) goes away.
        const board = useBoardStore.getState();
        if (!board.doc.state.cards[card.id]?.text) board.deleteCard(card.id);
      }}
    />
  );
}

/** The floating copy that follows the pointer while a card is dragged. */
export function DragGhost() {
  const drag = useViewStore((s) => s.drag);
  const card = useCard(drag?.id ?? ("" as CardId));
  if (!drag || !card) return null;
  return (
    <div
      className={`${styles.card} ${styles.ghost}`}
      data-colored={card.color ? "" : undefined}
      style={{ left: drag.left, top: drag.top, width: drag.width, ...accentOf(card) }}
    >
      <span className={styles.ghostText}>{card.text || "New card"}</span>
    </div>
  );
}
