# The Mountain Moved Next Door: tools

A Special (a limited-time game): fourteen levels, three of them scenes you watch unfold.

- `check.ts`: the bot plays every level without losing a life and prints how long each took it. It also fails on
  an invisible wall (a solid block drawn as sky). `route.ts` (the first ten), `routeMore.ts` and `routeLate.ts` (the levels added later) hold each level's orders, at human timing: it reads
  every sign, stops to watch each scene (the fog lifting, the mountain waking, the sunset, the neighbors arriving),
  waits on the bank for the stepping stones to come up, rides the wind, and checks every blaze, acorn, gate and
  lantern scored. `routeKit.ts` has the shared orders.
- `play.ts`: the run itself, and how many ticks each level took.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1).
- `preview.ts`: PNGs of each level's blocks and whole map in its time of day, Tess and the monster pictures, every
  picture on the disk, and a contact sheet of each cartoon.
- `shots.ts`: progress pictures: the title and a screen of every level as the player sees it.
- `seams.ts`: lists cells where sky meets a neighbor's picture on two opposite sides (a prop showing sky where the
  mountain, a wall or the earth should be behind it). The few it still lists are ladders through thin floors and
  posts beside a slope's edge, which are right.
