# The Noodle Observatory: tools

A Special (a limited-time game for Monkey Day): twenty-one scenes, three of them scenes you watch unfold.

Each room is painted from a plan (`src/place.ts`): the things Nell meets from left to right. The bot plays the same
plan, so a room's map and its route cannot drift apart.

- `check.ts`: the bot plays every scene without losing a life and prints how long each took it. It also fails on
  an invisible wall (a solid block drawn as backdrop). `route.ts` holds the orders, at human timing: it reads every
  sign, climbs to every shelf, waits on the ladder for a wobbly shelf to come level, hops the gaps, takes every part
  and star washer and fits each part in its socket; in the pantry it steers the ring with Left and Right only; in
  the three scenes to watch it stops for the lens, the ring, each constellation, the bakery window and the
  tablecloth. `routeKit.ts` has the shared orders.
- `play.ts`: the run itself, and how many ticks each scene took.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (the first scene).
- `preview.ts`: PNGs of each scene's blocks and whole map in its look, Nell, the ring and the actors, and every
  picture on the disk.
- `shots.ts`: progress pictures in PLAYGAME's own view: the title, a screen of every scene, and (`--frames
  lensroll,bakery`) the frames of a watched scene for a GIF.
