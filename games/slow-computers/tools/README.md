# Slow Computers: tools

Run from `web/` with `npx vite-node ../games/slow-computers/tools/<name>.ts`.

- `check.ts`: the bot reads the signs and plays all three levels without losing a life. `route.ts` checks that each sound pad plays once, the crowd has 36 monsters and costs no hit points, and the last door wins.
- `crowdCheck.ts [outDir]`: runs the built disk to the crowd and checks all 36 moving sprites against the actual 312×196 viewport across 480 standing frames, including three airborne double-jump/return cycles that exercise downward scrolling. Checks the visible grass roof, open cave, dirt floor, absent old platform collision and eight supported snails. Optional output is 2× gameplay PNGs and 73 consecutive frames at the engine's 18.2 Hz rate. This is a central crowd view, not a claim that the crowd stays on screen at the entrance and exit.
- `walkthrough.ts`: re-records the complete walkthrough. The crowd pause keeps both bee rows and the cave on screen.
- `gendemo.ts`: re-records the title demo from level 1's sound pads; rebuild afterward. `demoCheck.ts` verifies the built recording.
- `preview.ts`: static PNGs of the blocks, hero and whole levels. `shots.ts <outDir>`: static lesson views. These overviews do not prove gameplay visibility; use `crowdCheck.ts` for that.
- `games/kit/inViewCheck.ts slow-computers --scene 3 --standing 19 --rect 22,17,13,2`: checks the full bee-row envelope over standing walkthrough frames. Entry and exit views intentionally scroll the crowd off to the side; inspect the raw failures separately from the central moving-sprite check.
- `games/kit/flashCheckCli.ts slow-computers`: checks the walkthrough's large light changes against the three-flashes-per-second limit.
