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

The owner starts a fresh chat for each step, saying "Read PROJECT.md and
CLAUDE.md, then do step N" or "the next step". Each one:

1. Read PROJECT.md (and `git log --oneline | head`) to get oriented. A step
   is one numbered item of PROJECT.md's "What's next" list; "the next
   step" is the lowest-numbered one still on it.
2. Say briefly what you'll build and why, then build only that step. New
   pure logic goes in `domain/` with tests.
3. `npm run build`, `npm test` and `npm run lint` must pass.
4. Check it in the browser pane (dev server `rankkit` in
   `.claude/launch.json`, port 5183).
5. Update PROJECT.md (move the step from "What's next" to "What works
   now"), bump the version, commit on `main` and push. Every
   push to `main` deploys to https://rankkit-nine.vercel.app (Vercel
   project `rankkit`, team `alexlcbrancos-projects`; plain rankkit.vercel.app
   belongs to someone else). Check a deploy with
   `npx -y vercel@latest ls rankkit`.

## Testing policy

Automate every check that can be automated: unit, integration, and end-to-end
with Playwright, using throwaway data the test creates and deletes itself. Never hand the owner a manual checklist for something a
script can do. Manual steps only for what truly can't be automated (browser
permission prompts like folder pickers, and judging feel/usability). Keep
those to the minimum, say why each one can't be automated, and give one short
step at a time.

**Vercel requests are a budget** (owner, 2026-11-24: the free plan's 1M CDN
requests a month are shared by all his projects, and going over pauses them
all; a full live Playwright run costs thousands of requests). Every page,
file, API call and prefetch on the live site counts; local runs cost nothing.
- The full Playwright suite runs locally (against a local production build),
  never against the live site unless the owner asks for it.
- After a push the live site gets only a small smoke check (it loads, the
  version, one throwaway create + delete): tens of requests.
- Check the live `/version.json` at most every 30 s and stop once it shows the
  new version; don't browse the live site when a local run shows the same.

## Commands

```bash
npm run dev      # dev server
npm run build    # type-check + production build
npm test         # vitest
npm run lint     # oxlint
```
