# Pass the Pie: tools

- `route.ts`: the bot's orders, street by street: take the dish, read the signs, hop each hazard block as over spikes (take off two blocks before, land past it), climb to the coin shelves, give the bone to the dog, and run the last street before the town hall doors shut.
- `play.ts`, `sim.ts`: the headless player on the built `disk/`, level after level.
- `check.ts`: the bot plays all six streets and must win without losing a life, with at most 40 hit points lost to bumps.
- `walkthrough.ts`: re-records `walkthrough.json` (one key segment a street).
- `preview.ts`: PNGs of every block set, each street's whole map in its palette mood, every picture on the disk and a contact sheet of each cartoon.
- `heroPreview.ts`: Rory's poses at 8x.

Rules the levels keep: a level is at most 90 blocks wide (the world is 100 blocks and the level starts at block 10), every hazard is a block that takes 10 hit points once, and the neighbor's door is a gate that takes the dish.
