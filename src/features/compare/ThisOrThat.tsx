import type { CSSProperties } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import type { Card, CardId } from "../../domain/types";
import { useBoardStore } from "../../store/boardStore";
import styles from "./ThisOrThat.module.css";

export interface Comparison {
  readonly first: CardId;
  readonly second: CardId;
  /** The bucket's name, for the question. */
  readonly bucket: string;
}

/**
 * The "this or that" question: two close cards side by side, click the one
 * that comes first. Choosing moves both cards on the matrix (one undo
 * step); "Not sure" or Esc leaves them as they are.
 */
export function ThisOrThat({ comparison, onClose }: { comparison: Comparison | null; onClose: () => void }) {
  const cards = useBoardStore((s) => s.doc.state.cards);
  const settle = useBoardStore((s) => s.settle);
  const first = comparison && cards[comparison.first];
  const second = comparison && cards[comparison.second];
  const open = Boolean(first && second);

  const choose = (winner: CardId, loser: CardId) => {
    settle(winner, loser);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>This or that?</DialogTitle>
          <DialogDescription>
            These two are almost level in {comparison?.bucket}. Which comes first?
          </DialogDescription>
        </DialogHeader>
        {first && second && (
          <div className={styles.choices}>
            <Choice card={first} onClick={() => choose(first.id, second.id)} />
            <span className={styles.or}>or</span>
            <Choice card={second} onClick={() => choose(second.id, first.id)} />
          </div>
        )}
        <DialogFooter>
          <DialogClose className={styles.notSure}>Not sure</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Choice({ card, onClick }: { card: Card; onClick: () => void }) {
  const accent = card.color ? ({ "--card-accent": `var(--palette-${card.color})` } as CSSProperties) : undefined;
  return (
    <button type="button" className={styles.choice} data-colored={card.color ? "" : undefined} style={accent} onClick={onClick}>
      {card.text || "New card"}
    </button>
  );
}
