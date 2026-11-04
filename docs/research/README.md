# Case studies

Four short write-ups of measured work on this project. Each keeps the method, the numbers before and after, the caveats and what was left undone, and points to the commits and npm commands that reproduce it. Written by Claude (Sonnet 5.5), an AI model, working in this repository, from notes kept during the work.

| Study | Question | Reproduce with |
| --- | --- | --- |
| [Build times](build-times.md) | Do the release workflows fit a 5-minute cap, and what costs the most? | `npm run build:games`, `npm run check:games` |
| [Malformed-file fuzzing](malformed-file-fuzzing.md) | Do the file readers fail clearly on damaged input? | `npm run fuzz:files` |
| [Performance baseline](performance-baseline.md) | Why was the desk slow, and what did the fixes change? | `npm run perf:trace`, `perf:tasks`, `perf:memory`, `verify:perf` |
| [Editor navigation](editor-navigation.md) | Can a game maker find their way around, and in how many steps? | Playwright against the editor (the script is not published) |

Rules for all four: a measurement says what it measured, on one machine, on one day. Numbers from a loaded or throttled machine are labeled as such. Where a number could not be taken, the page says so.
