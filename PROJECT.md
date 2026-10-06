# Rankkit — project summary

_Last updated: 2026-10-05, v0.0.2_

## What it is

A calm 2×2 priority matrix for one question: "How do I prioritize these?"
You drag cards onto the matrix, and where a card sits is the judgment. The
app reads three answers off those positions: the picture, one bucket per
quadrant, and an ordered list inside each bucket. It's a standalone sibling
of Boardkit, Treekit, Vennkit and Linkkit. The name is provisional and lives
only in `package.json` (`displayName`). Repo: github.com/AlexLCBranco/rankkit;
every push to main deploys on Vercel (rankkit-nine.vercel.app).

## Stack

Vite, React 19, TypeScript, Zustand, Tailwind v4 + shadcn/ui (for menus and
dialogs, coming in step 2), CSS Modules with design tokens copied from
Treekit, lucide icons. Same layering as Treekit:
`app -> features -> store -> domain`. `domain/` is plain TypeScript with
Vitest tests. It holds the card operations, quadrants, the ranking and the
sample board. No backend.

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

## Open problems

- Nothing is saved yet: a reload brings the sample board back.
- Cards can overlap on the matrix; nothing pushes them apart.
- Narrow screens just stack the panel under the board; not tuned for phones.

## What's next

Each line is one step, done in its own chat, in this order. Step numbers
never change (step 1 was the core), so "step 3" always means the same thing.

- **Step 3.** Undo / redo (Ctrl+Z, Ctrl+Shift+Z and buttons).
- **Step 4.** Card colours (optional, same palette as the other widgets).
- **Step 5.** Several saved boards with a board menu, saved in localStorage.
- **Step 6.** "This or that": compare two close cards in the same bucket.

Planned later, on purpose not in v1 (the model mustn't block them):
switching axes between several criteria, a low/medium/high word grid with
a "never beaten" highlight. Not planned: dependencies between cards
(Linkkit's job), pan or zoom, Excel import.
