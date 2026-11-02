# DOS reference tables

One file per game: `<game>.txt`, a line for every 20 ticks of the game's shipped `demo.rec` replayed by the
original DOS PLAYGAME (an instrumented build with a deterministic clock and re-seeded random numbers):
`tick`, `timer`, `score`, `scene`, `char=(x,y)`, and `pan` (the DOS video hardware scroll registers).

Credit: recorded by chiguire in pull request 4 to gandrewstone/GameMaker
(https://github.com/gandrewstone/GameMaker/pull/4), files `port/baseline/<game>/states.txt`, copied unchanged.
The upstream repository and this one are under the MIT License (see the root `LICENSE`), so the tables may be kept here.

Only the eight games with a shipped demo are kept (bcuda, houses, nebula, peach, pipemare, tutor, volume, zark).
The PR's eight `*-gen` tables replay recordings it generated, which were not in the diff, so they are left out.

`games/kit/dosStates.ts` replays each demo through our engine and compares tick, score, scene and character
position (not `pan`, which has no counterpart in the web engine).
