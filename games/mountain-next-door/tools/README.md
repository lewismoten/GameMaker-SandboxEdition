# The Mountain Moved Next Door: tools

A Special (a limited-time game): twenty-four levels, three of them scenes you watch unfold.

- `check.ts`: the bot plays every level without losing a life and prints how long each took it. It also fails on
  an invisible wall (a solid block drawn as sky). `route.ts` (the first ten), `routeMore.ts`, `routeLate.ts` and `routeNew.ts` (the levels added later: Gathering Mist, Excuse Me and The Ford) and `routeGrow.ts`, `routeSpill.ts` and `routeClock.ts` (The Survey Line, The Spillway and The Bell Loft), and `routeHour.ts`, `routeLamps.ts`, `routeVault.ts` and `routeTarn.ts` (Hale's Orchard, The Lamplighter's Stair, The Records Cellar and The Frozen Tarn) hold each level's orders, at human timing: it reads
  every sign, stops to watch each scene (the fog lifting, the mountain waking, the sunset, the neighbors arriving),
  waits on the bank for the stepping stones to come up, waits for each mist step and each yard gate, rides the wind (and on the ridge's crest waits for the flag to show the wind turning or dropping), hops the stream's ripple of stones in step with the wave, searches the hollow by starlight (a pit and its ladder, two logs), rides the river's waves, and checks every blaze, acorn, gate and
  lantern scored. `routeKit.ts` has the shared orders.
- `play.ts`: the run itself, and how many ticks each level took.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1).
- `preview.ts`: PNGs of each level's blocks and whole map in its time of day, Tess and the monster pictures, every
  picture on the disk, and a contact sheet of each cartoon.
- `shots.ts`: progress pictures: the title and a screen of every level as the player sees it.
- `seams.ts`: lists cells where sky meets a neighbor's picture on two opposite sides (a prop showing sky where the
  mountain, a wall or the earth should be behind it). The few it still lists are ladders through thin floors and
  posts beside a slope's edge, which are right.
- `joins.ts`: lists art that doesn't meet: ladders, posts, legs and braces whose bottom edge stops over sky, a ladder
  through a floor drawn without the floor behind it, a ladder whose rails end in the air with no cap, and a beam that
  stops one cell short of a wall. Exits 1 if it finds any.
