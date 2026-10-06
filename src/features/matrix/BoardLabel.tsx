import { InlineEditable } from "../../components/InlineEditable";
import { labelOf } from "../../domain/board";
import type { LabelKey } from "../../domain/types";
import { useBoardStore } from "../../store/boardStore";
import { useViewStore } from "../../store/viewStore";
import styles from "./BoardLabel.module.css";

const ARIA: Record<LabelKey, string> = {
  x: "Name of the right-hand axis",
  y: "Name of the upward axis",
  tl: "Name of the top-left quadrant",
  tr: "Name of the top-right quadrant",
  bl: "Name of the bottom-left quadrant",
  br: "Name of the bottom-right quadrant",
};

/**
 * An axis label or quadrant name you can rename: double-click, type, Enter
 * (the same gesture as a card). Clearing it brings the default word back,
 * a rule that lives in `domain/board.ts`.
 */
export function BoardLabel({ labelKey, className }: { readonly labelKey: LabelKey; readonly className?: string }) {
  const value = useBoardStore((s) => labelOf(s.doc.state, labelKey));
  const editing = useViewStore((s) => s.editingLabel === labelKey);

  return (
    <span
      className={[styles.label, className].filter(Boolean).join(" ")}
      data-editing={editing ? "" : undefined}
      title={editing ? undefined : "Double-click to rename"}
      onDoubleClick={(event) => {
        event.stopPropagation();
        useViewStore.getState().editLabel(labelKey);
      }}
    >
      <InlineEditable
        value={value}
        editing={editing}
        onCommit={(text) => useBoardStore.getState().setLabel(labelKey, text)}
        onDone={() => useViewStore.getState().editLabel(null)}
        ariaLabel={ARIA[labelKey]}
      />
    </span>
  );
}
