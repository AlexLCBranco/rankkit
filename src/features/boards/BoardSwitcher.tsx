import { ChevronDown } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { InlineEditable } from "../../components/InlineEditable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { UNTITLED_BOARD } from "../../domain/persistence";
import { useBoardStore } from "../../store/boardStore";
import styles from "./BoardSwitcher.module.css";

/**
 * The open board's name (click to rename) plus a menu to switch to another
 * saved board, start a new one, duplicate or delete this one. Modelled on
 * Treekit's `TreeSwitcher` (itself from Boardkit).
 *
 * The menu and the confirm dialog are shadcn/ui: supporting chrome, not the
 * board, which is where CLAUDE.md draws the line. Their colours still come
 * from tokens.css through the bridge in global.css.
 */
export function BoardSwitcher() {
  const boardId = useBoardStore((s) => s.doc.id);
  const name = useBoardStore((s) => s.doc.name);
  const boards = useBoardStore((s) => s.boards);
  const renameBoard = useBoardStore((s) => s.renameBoard);
  const switchBoard = useBoardStore((s) => s.switchBoard);
  const newBoard = useBoardStore((s) => s.newBoard);
  const duplicateBoard = useBoardStore((s) => s.duplicateBoard);
  const deleteBoard = useBoardStore((s) => s.deleteBoard);

  const [renaming, setRenaming] = useState(false);
  // Set by "New board", read as the menu closes (see `onCloseAutoFocus`).
  const focusNameAfterClose = useRef(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // Stored oldest-first; listed newest-first, so the latest experiment is
  // always at the top however many have piled up.
  const newestFirst = useMemo(() => [...boards].reverse(), [boards]);

  return (
    <div className={styles.switcher}>
      {renaming ? (
        <InlineEditable
          value={name}
          editing
          // A board always needs a name for the list; an emptied field keeps
          // the old one.
          onCommit={(value) => value.trim() && renameBoard(value.trim())}
          onDone={() => setRenaming(false)}
          ariaLabel="Board name"
          className={styles.name}
        />
      ) : (
        <button
          type="button"
          className={styles.name}
          onClick={() => setRenaming(true)}
          title="Rename board"
        >
          {name}
        </button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={styles.trigger} aria-label="Switch board">
            <ChevronDown size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-56"
          // After "New board", the name field opens only once the menu has
          // fully closed. Opened any earlier, the menu (which keeps focus
          // inside itself while open) pulls focus straight back, and the
          // typed name goes to the menu instead. Focus would also normally
          // return to the trigger here, so that is skipped.
          onCloseAutoFocus={(event) => {
            if (!focusNameAfterClose.current) return;
            focusNameAfterClose.current = false;
            event.preventDefault();
            setRenaming(true);
          }}
        >
          {newestFirst.map((t) => (
            <DropdownMenuItem key={t.id} onSelect={() => switchBoard(t.id)}>
              <span className={styles.check}>{t.id === boardId ? "✓" : ""}</span>
              {t.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              newBoard(UNTITLED_BOARD);
              // Straight into naming it, like a new card.
              focusNameAfterClose.current = true;
            }}
          >
            + New board
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => duplicateBoard(`${name} (copy)`)}>
            Duplicate this board
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={boards.length <= 1}
            onSelect={() => setConfirmingDelete(true)}
          >
            Delete this board…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The whole board is deleted for good. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleteBoard(boardId)}>
              Delete board
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
