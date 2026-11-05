# What happened when the tools met real-world game files

Original RSD Game-Maker games are scattered across old shareware collections. Two experiments checked how well this project's engine and tools cope with them. Only totals and cause categories are given here. No archive, game or file is named, and no third-party bytes are shown.

## Experiment 1: round trip

Question: if the reader loads an original file and the writer saves it, is the output byte for byte the same?

About 420 zip files were read in memory. Of 12,274 files in 13 types, 11,535 (94%) came back identical, 721 differed, and 18 sound files could not be read. One type (recordings) was identical in all 641 cases. The largest rates of difference were in background-picture files (about 31 percent) and history files (about 26 percent).

Most differences fell into two categories, seen in the first examples:
1. **A trailing marker byte** that the original tools sometimes appended and the writer does not (an off-by-one in length).
2. **Embedded text or padding** after a picture block that the reader does not keep.

Why it matters: files that differ still play, but an editor that saves them would change them. The project's rule is that games must leave in the format they came in, so each category is either fixed or recorded as a known difference.

## Experiment 2: a walkthrough bot on unknown games

Question: how far does the editor's automatic walkthrough bot get on games it has never seen?

225 runs over 217 distinct games, 20 seconds per scene, 10 minutes per game at most:

| Outcome | Runs |
|---|---|
| Won | 20 |
| Not won | 187 |
| No game file in the zip | 18 |

Why the 187 stopped (by the bot's own stated reason):

| Cause | Runs |
|---|---|
| All four play styles failed with no door named (gap, hazard, boss, puzzle, or a mechanic the bot does not model) | 110 |
| A counter door: the bot was one short of a key, or saw nothing that adds to it | 52 |
| No way forward the bot had not tried | 20 |
| Other key or lock cases | 2 |
| A tool limit (missing map file in the zip) | 2 |
| Title with no link to a level | 1 |

About 60% of the not-won runs stopped in the first scene. The time limit, not the game, explains some of the "never got enough" cases.

One finding came straight from the original C source: the 30 per-hero counters 20 to 29 have no built-in meaning, so many games use them as keys or tokens, and a door that wants such a counter can be filled by a monster that turns into a pickup when killed. The bot's "nothing adds to it" message could not see that chain. It is a suggestion, not a verdict.

Checked since, game by game (all 52 counter-door runs, read from each game's own files): monsters that turn into pickups explain 4 of them, and the bot already follows those chains, so they are not a gap in what it models. Of the 52, 41 have a key source in the same scene that the bot models but did not reach (29 keys lying on the map, 6 monsters that add to the counter on contact, and the rest priced or chained pickups), 10 need a key carried from another scene (the bot plays one scene at a time, so it cannot tell whether that scene is reachable first), and 1 door has no source anywhere in its game, so it can never open.

## Method, in short

- Pick games by player version, skip duplicates by content hash.
- Run the bot with a per-scene and a per-game time cap, resumable, one result row per game.
- Read the stated reason and sort into causes by hand.
- Treat every row as a lead for a person to watch.
