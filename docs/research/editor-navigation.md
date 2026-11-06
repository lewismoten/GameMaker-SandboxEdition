# Case study: finding your way around the editor

Written by Claude (Sonnet 5.5). Measured 2026-11-04.

## Question

Can someone moving between a game's files (scenes, maps, blocks, characters, sounds, pictures) always tell where they are and get back? And how many actions do four common jobs take?

## Part 1: the navigation audit

**Method.** Playwright with its bundled Chromium at 1440 x 900, on a read-only copy of one of the project's example games. From each kind of file, click the first "Used by" link, then the first one on the page it lands on, then press the browser's Back twice.

| Start | Used by | Level 1 lands on | Level 2 | Back |
| --- | --- | --- | --- | --- |
| scene | none (it is the top) | n/a | n/a | n/a |
| map, block set, monsters, song, palette | 1 to 3 scenes | the game, scene 0 (no scene named) | none | right entry each time |
| character, sound | 5 and 36 scenes | the game, scene 0 | none | right |
| picture, text | a slide show | the slide list | the game, scene 0 | right, two steps |

**Findings.**

1. No dead ends. Every file reaches the Overview, and Back always returned to the previous entry with its selection (a monster, a color, a tab) intact.
2. Wrong target: a "Used by ... scene" link opened scene 0 whatever scene it named. Fixed: the link carries the scene number (commit `f227d8149`).
3. No breadcrumb or "where did I come from". Fixed: Overview > Category > file, plus "Back to <file>" when opened from another file (commit `bfeeb7e2e`, merged in `998ec1371`).
4. Back to an Overview page reset the scroll to the top. Fixed where the page scrolls (phones). At 1440 x 900 the Overview fits one screen, so nothing was lost there.

**Left.** A scene's own files are reached inside the scene editor's slots. "Back to" remembers one step (the browser's Back has the whole stack). A file page's scroll is restored on Back only if its content is ready in time.

## Part 2: common jobs in fewer steps

**Method.** The same browser and size. From a fresh new game, count actions: clicks, key presses, typed fields, drags. Counts are actions, not time.

| Job | Before | After | What changed |
| --- | --- | --- | --- |
| New level you can play | 5 | 5 | Already good: one button makes the scene and its map. |
| New monster placed on a map | 16 | 10 | "+ New monster" copies a working monster into the first unused slot (unused slots held leftover frames, so a new monster animated junk). |
| Door between two scenes | 8 | 8 | Already pre-linked to the new scene. |
| Test the level from where you are | 5 | 4 | "Play here" plays from the middle of the view and leaves the game's start alone. Before, one dragged the start marker, which moved it for good. |

Commits: `a54332163` and `b1b436092` (Play here), merged with the monster button in `89be8dff5`. Checked with axe at 1440 and 390 px in light and dark: clean, no horizontal scroll.

**Where a person still hesitates (not changed).** A "First steps" panel on a fresh game covers part of the map's monster palette. Narrow toolbars rely on titles. A just-made monster still needs the map's Monsters tab and its slot number. A candidate next step is to preselect the newest monster as the map's brush.

## What this cannot show

One example game, one browser size, one pass by a script. Action counts are not time and do not capture confusion. Real people would find different snags, and no person was timed. The script is not published.

## Reproduce

Use the editor's own touch and axe audits for the related checks:

```sh
cd web
npm run editor:touch -- <route>
npx vitest run src/editor
```
