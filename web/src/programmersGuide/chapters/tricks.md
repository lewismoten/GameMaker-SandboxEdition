# Tips and tricks that use the rules

Every trick here follows from a rule in an earlier chapter; the chapter is named so a reader can check the reason. `PG:n` = `code/GM/PLAYGAME.C` line n.
Tricks marked **[not yet checked in DOSBox]** depend on an inference and need a DOSBox check.

## Scenes and files

1. **A pass-through scene is a message.** A scene with a black palette, a message screen as its intro and a link out lands the player on the only link: the dialogue/cut-scene primitive. It costs the message's fade (about 1 s each way) and nothing else. (Ch 4, 11; probe 5)
2. **A blank file slot keeps the previous scene's data.** Leave the song, sound or character slot empty and the earlier one stays in memory (`PG:4244-4289`: loads happen only for slots that have a file). Shared sounds without shipping them again; also stale monsters if a `.mon` slot is left blank by mistake. (Ch 4, 13)
3. **Many scenes on one map make checkpoints.** Each scene is a re-entry with its own link `To` cell; 283 bytes per scene is cheap (ch 4).
4. **Walk off the edge to teleport.** The hero wraps at 100 (`chkmapbounds`, `PG:3386-3393`) and so do drawing and monster targets. A world with no edges needs no links. Wall the seam if you do not want it. (Ch 4)
5. **A link fires when the hero overlaps its cell at all**, not only when standing on it (6 cells, `PG:3837-3858`). Make a one-cell doorway and the hero cannot miss it. (Ch 4, 8)

## Blocks and timing

6. **A block ring is a clock.** Every cell showing number N changes together, exactly on the absolute clock, with no drift (`PG:2333-2341`). Cells holding different members of one ring give phase-shifted copies: a marquee, a rhythm track or a metronome, with no monsters. (Ch 5)
7. **Touch reads the displayed frame**, so a ring can be a gate: some frames `solid`, some not; some frames hurt, some pay. (Ch 5, 8)
8. **One spawner block fills every visible cell showing it in the same tick** (`PG:3299-3305`), up to the 200 free slots: a burst, a swarm or a curtain of notes in one tick. (Ch 5, 6)
9. **Spawners can live off screen**, up to half a screen away on each side (`PG:3290-3292`); their timers keep running. Put the spawner row out of sight and let a ring cycle which spawner is lit: a timetable. (Ch 5)
10. **A `touchbl` swap is permanent for the scene visit** (`PG:3524-3547`): doors that stay open, pickups that vanish, switches that stay flipped. It needs the cell on screen. (Ch 5)
11. **Time anything in ticks, not fades.** A fade is 65 display refreshes and varies with the monitor; a tick is 54.9 ms everywhere. (Ch 11, 12)

## Monsters

12. **An exact stopwatch.** A monster with `end = n` dies (turns into `newmon`) exactly n ticks after birth (`PG:3157-3160`, probe 3); chain lifetimes with `newmon` for timed stages. (Ch 6)
13. **Equal power passes through.** Give a shot the same power as the monsters you want it to ignore, a different power for the ones it should kill (`PG:2810`). (Ch 8)
14. **The monster's frame carries the reward.** The touch applies the _current frame's_ block (`PG:3113-3115`): a monster can be harmless, then pay, then hurt as it animates. (Ch 6, 8)
15. **An all-clear hero frame is immune**: pixels at 255 never touch (`PicChkTouch`). A "dodge" sequence can be a frame of nothing but 255. (Ch 8)
16. **A monster in the hidden band cannot hurt** (the cell is "off screen", `PG:2728`) **[not yet checked in DOSBox]**; do not hide a hazard there on purpose, but know why a monster in the top row did nothing. (Ch 8, 14)
17. **Shorten a path with a speed-0 corner**: the path ends at the first corner whose speed is 0 (`PG:3157`). (Ch 6)

## The character

18. **One key per row.** A fire frame's `y` only picks the row (`PG:2442-2445`); ten sequences on ten keys shoot into ten rows. (Ch 7)
19. **Ammunition is a sequence counter.** Counters 5-19 are the uses left; blocks refill them (effect = the sequence number); 32,767 is unlimited (`PG:2380-2381`). (Ch 7, 9)
20. **Upgrades by carrying.** Tie a sequence to an inventory block (`bloc`) and it exists only while the block is carried; list the upgraded sequence before the plain one on the same key and the upgrade wins (probe 4). (Ch 7)
21. **Jump arcs from momentum.** `Momentum` sequences add to `gravx`/`gravy`; a gravity block pulls the arc down; the cap is 44 (`PG:3761-3764`). (Ch 5, 7)
22. **Conveyors and wind** are blocks with `grav` bits. (Ch 5)

## Counters

23. **A lock is a counter.** Counters 3 and 20-29 refuse a touch that would leave them at 0 or below (`PG:3440-3443`), so a door (`eamt` = -1, `touchbl` = open door) opens only for a hero who holds a key (stored value 2 or more). (Ch 9)
24. **Counter 3 shows on the inventory screen** as money minus one; it is the only counter the player can read (`PG:1974-1976`). (Ch 9)
25. **A toll is a negative score block**, a bonus a positive one; sounds follow the sign (`PG:3502-3510`). (Ch 9)
26. **Give a pickup its own sound by giving it its own counter**; a block has no sound field. (Ch 9)

## Sound and speed

27. **Never put a digital sound on a block that stays touched** (it re-triggers every tick and cuts itself). (Ch 10b)
28. **Keep every VOC under 64 KB**, the median at about 11 KB, and speech at 11 kHz. (Ch 10b)
29. **Ten visible monsters or fewer** keeps a 286 at full pace (ch 12); 50 is the hard cap. (Ch 6, 12)
30. **Leave a clear blue, red and yellow in every scene's palette** so the inventory box is legible. (Ch 11)
