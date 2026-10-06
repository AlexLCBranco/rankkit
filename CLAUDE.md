# Rankkit — context for Claude

A calm 2×2 priority matrix: one of the owner's standalone widgets (siblings
of Boardkit, Treekit `../treekit`, Vennkit, Linkkit). Never merge it into
another app now; later it becomes one widget inside the "gauntlet" canvas,
so keep the board embeddable (no assumptions about owning the whole page
or the URL). Match Treekit's stack, structure and feel. The owner is
learning frontend: explain each decision in a sentence or two.

## Rules

- **Widget rules.** Mouse for structure, keyboard only for typing text.
  Calm, no clutter, no settings panels, no jargon. Words, not numbers: never
  show scores, percentages or coordinates. The only numbers on screen are
  list positions.
- **Layering.** `app -> features -> components -> store -> domain`.
  `domain/` imports no React and no store. Pure logic lives there, with
  tests.
- **The name** lives only in `package.json` (`displayName`). The page
  title and header read it through vite.config.ts.
- **No hardcoded visual constants.** Everything comes from
  `src/styles/tokens.css`. Board UI uses CSS Modules; Tailwind + shadcn/ui
  is only for menus and dialogs.
- **PROJECT.md** is the owner's plain-language snapshot. Update it, and
  its "Last updated" line, whenever what's built, decided or next changes.
- Bump `package.json`'s patch version with every user-visible change.

## Workflow

1. `npm run build`, `npm test` and `npm run lint` must pass.
2. Check it in the browser pane (dev server `rankkit` in
   `.claude/launch.json`, port 5183).
3. Update PROJECT.md, bump the version, commit on `main` and push. Every
   push to `main` deploys to https://rankkit-nine.vercel.app (Vercel
   project `rankkit`, team `alexlcbrancos-projects`; plain rankkit.vercel.app
   belongs to someone else). Check a deploy with
   `npx -y vercel@latest ls rankkit`.

## Commands

```bash
npm run dev      # dev server
npm run build    # type-check + production build
npm test         # vitest
npm run lint     # oxlint
```
