# Meet the Monsters: tools

- `check.ts`: the bot plays both levels and must win without losing a life. Along the way it asserts what the signs teach: the first gumdrop costs nothing, and the snail by the TOUCHING HURTS sign costs exactly one hurt (10 hit points), taken on purpose.
- `bumpCheck.ts`: a scripted player walks into each monster and stays 2 seconds (standing, then pushing on); each run must touch the target and survive. From approach through the two-second wait, the largest hit-point loss must be zero for the harmless gumdrop and exactly 10 for each hurting monster.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo; both include the hurt once.
- `hurtShot.ts`: pictures of the hurt moment and the pit for the progress shots.

## Starter rule: show the bad thing once

A Starter's demo and walkthrough show what each sign teaches, including the bad thing happening once: the bot walks into what the sign says hurts, takes one small hit, pauses so a watcher sees the hit points drop and the hurt pose, then carries on. The check asserts the count (exactly one hurt from that monster, none from a harmless one) and still fails if a life is lost.
