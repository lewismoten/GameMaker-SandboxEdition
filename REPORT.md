# Two-game asset usage

Tuesday, November 24, 2026. Times are UTC.

- **01:01** Checked the November 23 housekeeping report before editing. With CUTS.GAM primary, the editor missed both BLUE.GIF owners in NEBULA.GAM. The Overview queried only the selected game and deduplicated by scene number. The file header and confirmations also queried only that game.
- **01:01** Updated the Overview to count distinct scenes within each readable GAM and add those totals. The file header, Delete and Replace now use each owning game's filename and scene number. The existing single-game lookup still serves game-specific editors.
- **01:02** Ran the assetUsedBy, gameProject, quickOpen and core uses Vitest files. All 24 tests passed. The new serialized two-game fixture covers a secondary-only picture, matching scene numbers across games, and two slots in one scene. The expected category total is three. The file lookup identifies the correct GAM for each slot.

- **01:09** Prettier and ESLint passed on the changed source. The full web TypeScript check passed with a 6 GiB Node heap after the default heap was exhausted.

The fix is in `web/src/editor/shell/assetBrowser.ts:255`, `web/src/editor/shell/assetUsedBy.ts:12` and `web/src/editor/core/uses.ts:80`. The regression is in `web/src/editor/shell/assetUsedBy.test.ts:31`. Added a Pages release fragment and a Codex credit in NOTICE.md. Verification used automated checks. No browser or server was started. The pre-existing edit to `games/bakers/printables.json` is unrelated.

Suggested commit message: Count asset usage across every game in a project
