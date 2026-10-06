# Rankkit — project summary

_Last updated: 2026-10-05, v0.0.10_

## What it is

A calm 2×2 priority matrix for one question: "How do I prioritize these?"
You drag cards onto the matrix, and where a card sits is the judgment. The
app reads three answers off those positions: the picture, one bucket per
quadrant, and an ordered list inside each bucket. It's a standalone sibling
of Boardkit, Treekit, Vennkit and Linkkit. The name is provisional and lives
only in `package.json` (`displayName`). Repo: github.com/AlexLCBranco/rankkit;
every push to main deploys on Vercel (rankkit-nine.vercel.app).

## Stack

Vite, React 19, TypeScript, Zustand, Tailwind v4 + shadcn/ui (only for menus and
dialogs, such as the card menu), CSS Modules with design tokens copied from
Treekit, lucide icons. Same layering as Treekit:
`app -> features -> store -> domain`. `domain/` is plain TypeScript with
Vitest tests. It holds the card operations, quadrants, the ranking and the
sample board, the "this or that" close calls, the arrange presets, what the marquee picks, the one-list ranking the List and Table views show, and how a saved board is read back (and repaired). No
backend: boards live in the browser's localStorage.

## Decisions

- **No React Flow, no drag library.** The page never pans or zooms, and a
  card can land in only two places (the matrix or the unsorted strip).
  Plain pointer events (`features/matrix/cardDrag.ts`) and absolutely
  placed cards are less code than adapting a library.
- **Positions are a unit square, never shown.** `x` goes 0→1 to the right,
  `y` goes 0→1 upwards. The screen shows only words (quadrant names) and
  list positions (1, 2, 3). Unsorted counts are in words ("Two cards").
- **Ranking.** Each bucket is ordered by straight-line distance to the
  board's *best* corner (top-right by default), not to its own corner. So
  in every bucket, first means "closest to Do now". Ties keep the order the
  cards were added.
- **Bucket order.** Best quadrant first, then the one beside it (same
  height), then the one below it, then the opposite one. Up beats right, as
  in the Eisenhower habit: Do now, Schedule, Delegate, Drop.
- **Live re-ranking.** While you drag, the real card moves in the store on
  every pointer move, so the panel re-orders as you go. A floating copy
  follows the pointer. Dropping outside the matrix and the strip puts the
  card back where it was.
- **Dark theme by default**, like the other widgets.
- **Renaming labels.** Double-click an axis label or a quadrant name to
  rename it, the same gesture as a card. No settings panel. Clearing a name
  brings the default word back, so a heading is never blank.
- **Undo stores patches, not copies.** Each change keeps only the parts
  of the board it replaced (`domain/history.ts`, the same design as
  Treekit). The history lives for the session only and is never saved.
- **Colours live in a right-click menu.** The same eight colours and words
  as Boardkit and Treekit. No number keys for colours (unlike Treekit):
  Rankkit keeps the keyboard for typing text. A colour is only a tag; it
  never changes where a card ranks.
- **Saving works like Treekit.** Each board is its own localStorage entry
  (`rankkit:board:<id>`), with a small list of names beside it
  (`rankkit:registry`), so the menu never has to read every board. Saves
  happen a moment after each change, and straight away when the tab is
  hidden or closed. Every saved board carries a version number, and a
  damaged one is repaired on load (the original is kept aside) instead of
  crashing the app.
- **The board menu.** Click the board's name to rename it; the small arrow
  beside it lists your boards (newest first) with New, Duplicate and
  Delete. Deleting asks first, because it can't be undone. Each board keeps
  its own undo history while the tab is open.
- **"This or that" answers with positions.** Two neighbours in a bucket
  whose distances to the best corner differ by less than a small amount
  (`CLOSE_CALL` in `domain/compare.ts`) are a close call. Your answer is
  not stored as a separate fact: both cards slide along their line to the
  best corner, the chosen one in and the other out, until they are clearly
  apart, never leaving their quadrant. So the matrix stays the only
  judgment, and undo, saving and dragging need nothing new.
- **Arrange presets keep the order.** Right-click a quadrant's empty space
  to tidy its cards. Since where a card sits is its rank, a preset may
  only reshape the picture, never re-rank. For now there is one preset,
  "In a line": cards evenly spaced on the quadrant's diagonal towards the
  best corner (`domain/arrange.ts`). Column, row or grid can join the same
  menu later.
- **The marquee works like Treekit's and Linkkit's.** A card is picked
  only when the box holds all of it, so brushing its edge doesn't count
  (`domain/marquee.ts`). A picked group drags as one block that stops at
  the board's edge as a whole, so the cards keep their spacing and order
  among themselves. Cards of the group still in the unsorted strip stay
  there. The bar's count is in words ("Two cards"), like the panel's. No
  Ctrl+A: Rankkit keeps the keyboard for typing text.
- **Three views, one board (like Vennkit).** Matrix, List and Table all
  read the same board, so nothing new is stored and undo, saving and
  colours just work. List and Table are for reading the answer; moving
  cards stays on the matrix. The switcher sits in the middle of the
  header, not bottom-left as in Vennkit, because that corner holds the
  unsorted strip. The chosen view is remembered per browser
  (`rankkit:view`), not per board.

## What works now (step 1: the core)

- The matrix: four quadrants, dashed centre lines, "Do now" softly
  highlighted, axis labels ("More important" up, "More urgent" right).
- The unsorted strip under it. Click its empty space or "+" to add a card
  and type its text. A card left empty disappears.
- Cards: drag anywhere (matrix ↔ strip), double-click to edit, Delete key
  or the hover trash button to remove, Esc to deselect.
- The buckets panel: four sections with numbered lists that re-rank live
  while dragging, and a note saying how many cards are still unsorted.
  Hovering a row highlights its card on the matrix.
- Sample board "My week" on every load.

## What works now (step 2: editable labels)

- Double-click either axis label or any quadrant name, type, Enter (Esc
  cancels). The buckets panel follows the new names at once. A soft hover
  background hints that a label can be renamed.

## What works now (step 3: undo / redo)

- Ctrl+Z undoes, Ctrl+Shift+Z (or Ctrl+Y) redoes; on a Mac, Cmd. Two
  arrow buttons in the header do the same and grey out when there is
  nothing to undo or redo. While typing in a card, Ctrl+Z is the text
  field's own undo.
- One undo step per thing you did: a whole drag is one step (not one per
  pointer move), adding a card and typing its text is one step, and a new
  card abandoned empty leaves no step at all.

## What works now (step 4: card colours)

- Right-click a card for its menu: None or one of eight colours (slate,
  red, orange, yellow, green, teal, blue, purple), and Delete card. A
  coloured card gets a soft tint and a border in its colour; the buckets
  panel shows a matching dot beside it. Each colour change is one undo
  step.

## What works now (step 5: saved boards)

- Everything is saved in the browser as you go, and a reload opens the
  board you had open. The first visit opens the sample board "My week".
- The header shows the board's name: click it to rename. The arrow beside
  it opens the board menu: switch to another board, "+ New board" (opens
  empty, straight into naming it), "Duplicate this board", and "Delete
  this board…" (asks first; greyed out when it's the only board).

## What works now (step 6: this or that)

- Under a card that is almost level with the next one in its bucket, the
  panel shows a quiet "This or that?" link. Clicking it opens the two
  cards side by side: click the one that comes first. Both cards move a
  little on the matrix to show the answer, the list re-orders and the link
  goes away. "Not sure" (or Esc) changes nothing. Each answer is one undo
  step. The links hide while you drag.
- The sample week now has one close call (in Schedule) to try it on.

## What works now (step 7: arrange presets)

- Right-click empty space in a quadrant: "Arrange cards → In a line,
  keeping the order". Its cards line up evenly on the diagonal towards
  Do now, in the order the panel already shows. One undo step. Greyed out
  in an empty quadrant. Spreading cards out also clears any close calls
  among them (they keep their current order).

## What works now (step 8: picking several cards)

Asked for by the owner as "the standard marquee feature" of the other
widgets, so it took the next step number.

- Drag across any empty space in the board column (the matrix, the
  space around it, or the unsorted strip): a tinted box follows the
  pointer and every card it holds completely is picked as it goes.
  Shift+drag adds to what is already picked; Shift+click a card adds it
  or takes it out. Strip cards can be boxed too. Clicking a card or empty
  space (outside the strip, where a click adds a card), or
  Esc, goes back to one / none. Picked cards are highlighted on the
  matrix and in the buckets panel.
- Drag any picked card and all the picked cards on the matrix move
  together; the panel re-ranks live. One undo step.
- With two or more picked, a bar at the bottom of the matrix says how
  many (in words) and offers a colour (shows the shared one, or a mixed
  dot), delete, and × to let go. Right-clicking a picked card opens its
  menu for the whole group ("Delete three cards"), and the Delete key
  removes them all. Each is one undo step.
- `.claude/launch.json` has a second dev server, `rankkit-2` on port
  5184, for when another chat already runs `rankkit` on 5183.

## What works now (step 9: views)

Asked for by the owner ("the different view option, like on Vennkit"),
so it took the next step number.

- A Matrix / List / Table switcher in the header, with a highlight that
  slides to the view on screen.
- List: the whole board as one numbered priority order (Do now's cards,
  then Schedule's, Delegate's, Drop's), each row naming its bucket. The
  unsorted cards sit underneath, unnumbered.
- Table: one row per card in that same order, with its bucket, its place
  in the bucket and its colour in a word. Unsorted cards come last.
- Clicking a row picks the card, so Delete and undo work there too.

## Open problems

- Boards are saved only in this browser; there is no export or sync yet.
- Cards can overlap on the matrix; nothing pushes them apart (an arrange
  preset tidies one quadrant on request).
- Narrow screens just stack the panel under the board; not tuned for phones.

## What's next

Each line is one step, done in its own chat, in this order. Step numbers
never change (step 1 was the core), so "step 3" always means the same thing.

No numbered steps are planned right now; the next one gets step 10.

Planned later, on purpose not in v1 (the model mustn't block them):
switching axes between several criteria, a low/medium/high word grid with
a "never beaten" highlight. Not planned: dependencies between cards
(Linkkit's job), pan or zoom, Excel import.
