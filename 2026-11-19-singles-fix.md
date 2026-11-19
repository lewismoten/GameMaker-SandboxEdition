# Tour check singles

Thursday, November 19, 2026. Times are UTC. Each chapter ran separately from `web/` with `npx vite-node scripts/tourCheck.ts <chapter>`. The before rows come from the November 18 all-chapter log. A fresh Home run on this branch reproduced its row and exited with one problem. The after rows come from today’s runs.

Columns follow the checker’s order: 1440 light, 1440 dark, 390 light, 390 dark, 375 light, 375 dark.

| Step | Before | After | Chapter finished |
| --- | --- | --- | --- |
| `home-teddy` | `MISSING MISSING MISSING MISSING MISSING MISSING` | `ok ok ok ok ok ok` | 21:44 |
| `cast-appears` | `MISSING MISSING MISSING MISSING MISSING MISSING` | `ok ok ok ok ok ok` | 21:46 |
| `edit-map-find` | `MISSING MISSING MISSING MISSING MISSING MISSING` | `ok ok ok ok ok ok` | 21:48 |
| `edit-integrator-player` | `MISSING MISSING MISSING MISSING MISSING MISSING` | `ok ok ok ok ok ok` | 21:51 |
| `edit-player-open` | `MISSING MISSING MISSING MISSING MISSING MISSING` | `ok ok ok ok ok ok` | 21:54 |
| `library-card` | `ok ok MISSING MISSING MISSING MISSING` | `ok ok ok ok ok ok` | 21:58 |
| `edit-around-assets-back` | `ok ok MISSING MISSING MISSING MISSING` | `ok ok ok ok ok ok` | 22:02 |

## Changes and suggested commits

- **home-teddy.** Home and Cast both say “Woof!”. The checker now reads the caption once the bubble is visible, so it can identify each bark. Suggested commit: `Identify Teddy’s tour steps by their displayed captions`.
- **cast-appears.** Open Teddy’s Seen in disclosure and point at its game pictures. The old class identifies the fallback for characters without listed games. The selector test now recognizes card IDs generated from cast data. Suggested commit: `Open Teddy’s game pictures during the Cast tour`.
- **edit-map-find.** Match the map toolbar’s accessible name, Find block. Suggested commit: `Match the Find block button in the Map tour`.
- **edit-integrator-player.** Board mode removes the DOS player toolbar button (integrator.ts:357). Navigate to Overview and point at its DOS player tab. Suggested commit: `Show Overview’s DOS player tab at the end of the Integrator tour`.
- **edit-player-open.** Start on Overview, where the DOS player tab is visible. The following step already opens its panel. Suggested commit: `Start the DOS player tour on Overview`.
- **library-card.** Phone layouts hide the wall of spines. Open the manual drawer’s stacks dialog and point at its first card. Wait for the stacks control when entering the Library. Suggested commit: `Show a manual card in the Library stacks`.
- **edit-around-assets-back.** Open the file actions menu to reveal Assets on a phone. The desktop step still points at the toolbar button. Suggested commit: `Reveal Assets in the phone’s file actions menu`.

## Verification

Each chapter ended with `ok`. Axe reported `page-has-heading-one: html` in all six Player runs. The other six chapters reported clean axe results. Some optional steps elsewhere in the chapters were skipped.

Prettier and ESLint passed on the changed files. Project TypeScript passed with an 8 GiB Node heap after exhausting the default heap. Tour Vitest passed all 42 tests in seven files. All scratch tour checks exited.

The Pages release fragment describes the repaired targets. NOTICE.md credits OpenAI Codex. Changes are uncommitted on `feature/tourcheck-singles-1119`. The requested report directory resolves through a read-only symlink, so this handoff is at the worktree root.
