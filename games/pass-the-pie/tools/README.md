# Pass the Pie: tools

- `route.ts`: the bot's orders, street by street, for both heroes. Rory reads the signs, hops what is in the way (a vacuum that moves is watched and hopped as it comes, so it passes under the top of the jump), takes the counter over the long vacuum and fetches the bone for the dog. Mr. Plume kicks: he walks up to a lawn turkey, dummy or the blower and presses Enter until it is down (each must take exactly its number of kicks), and waits where a vacuum turns to kick it as it comes. The last street is run before the town hall doors shut.
- `play.ts`, `sim.ts`: the headless player on the built `disk/`, level after level.
- `check.ts`: the bot plays all six streets and must win without losing a life, with at most 40 hit points lost to bumps.
- `walkthrough.ts`: re-records `walkthrough.json` (one key segment a street).
- `preview.ts`: PNGs of every block set, each street's whole map in its inks, every picture on the disk and a contact sheet of each cartoon.
- `heroPreview.ts`: Rory's and Mr. Plume's poses (his kick too) at 6x, on a street's paper: `heroPreview.ts [out.png] [mood]`.

Rules the levels keep: a level is at most 90 blocks wide (the world is 100 blocks and the level starts at block 10), every hazard block takes 10 hit points once, the neighbor's door is a gate that takes the dish, and a garden gate takes a steel key. Every picture is drawn in `src/` for this game (`print.ts` holds the block-print look); nothing comes from the Starters' block art.
