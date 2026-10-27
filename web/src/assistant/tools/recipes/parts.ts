// Recipes for the parts most levels use: links between levels, the screens around play, words,
// keys and locks, pickups, hazards, monsters' moves, animation, clocks, spawners, bosses, currents
// and what makes a level good. Checked against PLAYGAME (web/src/engine: touch.ts, character.ts,
// monsters.ts, scene.ts) and the Sandbox games.
import type { Recipe } from '../recipeTools';

export const PART_RECIPES: Recipe[] = [
  {
    id: 'levels',
    about: 'doors, links, more levels, start, win',
    text: `Scenes: 0 title, 1 game won, 2 and up levels. Links join them.
1. game_summary; get_scene(scene) and get_links(scene).
2. Start: set_links(scene: 0, links: [{index: 0, to_scene: 2, to_x, to_y}]): play starts in scene 2 at to_x, to_y.
3. A new level: set_map(file: level2.map, fill) makes its map; then add_scene(name, files) with the slots of an existing level (get_scene) but that map in slot 1. It returns the scene number.
4. A door: set_links(scene: 2, links: [{index: 1, to_scene: 3, from_x, from_y, to_x, to_y}]). Touching cell from_x, from_y goes to scene 3 at to_x, to_y. Draw a door block there; arrive on a clear cell, never on another link.
5. A way back works the same, arriving beside the door, not on it.
6. Win: a link with to_scene: 1 at the goal. Every level needs a way on.
7. Each visit reloads a level fresh (collected things return); score, lives, counters and carried things go along.
8. Up to 20 links a scene (index 0-19). level_check finds bad links; bot_playtest.`,
  },
  {
    id: 'title_win',
    about: 'title, story, how to play, endings',
    text: `The screens around play are file slots of scene 0 and scene 1.
1. get_scene(scene: 0): slot 0 Title graphic, 4 Storyline graphic, 6 Game instructions. get_scene(scene: 1): slot 0 Game won graphic, 2 Game lost graphic.
2. A page of words: set_text(file: story.txt, text). Plain ASCII, 30 characters a line or fewer, 16 lines a page.
3. Put it in a slot: set_scene(scene: 0, files: [{slot: 4, file: story.txt}]). Slots take .gif, .fli, .lst, .bkd or .txt.
4. Instructions (slot 6): the keys and the goal in a few lines.
5. Game won (scene 1, slot 0): a short happy ending. Game lost (slot 2): a cheerful "try again".
6. A slide show: set_slides(file: title.lst, slides: [{name, pause}]) shows pictures and pages in turn.
7. The game's name: set_scene(scene: 0, name).
8. render_png(what: title) shows the title, when the person asks to see it.`,
  },
  {
    id: 'talk',
    about: 'NPC chat, signs, story text',
    text: `Game-Maker shows no words during play; words come between scenes.
1. Before a level: set_text(file: intro2.txt, text), then set_scene(scene, files: [{slot: 9, file: intro2.txt}]). Slot 9 shows as the level starts (again after a lost life); slot 10 as it is left by a link.
2. A friend: a monster that stays (set_monster(file, index, power: 100, end: -2)) and does no harm (its .mbl blocks have hit_points: 0), pacing slowly by its spot (recipe monsters).
3. Talking: a link on the cell in front of the friend to a copy of the level (add_scene with the same files, plus a slot 9 page of what the friend says), arriving beside the friend; give the copy the original's other links. A level reloads fresh, so do this where nothing is collected, such as a town.
4. Signs: a few letters drawn into block pixels (set_block(file, index, pixels)); short words.
5. Pages: plain ASCII, 30 characters a line or fewer, friendly words.`,
  },
  {
    id: 'keys_locks',
    about: 'keys, locked doors, counters, shops',
    text: `A key adds to a special counter (20-29); a lock takes from it and opens.
1. list_blocks(file) of the .bbl; choose free block numbers for key, lock and open door.
2. Key: set_block(file, index, effect: 20, effect_amount: 1, touch_block, score: 50), touch_block the floor block's number, so it is taken once.
3. Lock: set_block(file, index, solid: 15, effect: 20, effect_amount: -1, touch_block) with touch_block the open door. Bumped without a key nothing happens; with one, it opens and uses the key.
4. Open door: set_block(file, index, solid: 0), drawn open.
5. Another color of key and door: counter 21, and so on to 29.
6. set_map: the key where exploring finds it, the lock across the only way on.
7. Counters go along to later levels; a level reloads fresh, so its lock is shut again on a return visit.
8. A shop works the same with money (effect: 3) after set_character(file, money: 0); a touch that would leave 0 is refused, so a price of 10 needs 11.
9. bot_playtest.`,
  },
  {
    id: 'pickups',
    about: 'coins, score, health, extra lives',
    text: `Pickups are blocks that pay when touched and turn into floor.
1. list_blocks(file); draw a coin with set_block(file, index, pixels) or fill_color.
2. Coin: set_block(file, index, score: 10, touch_block) with touch_block the floor's number; left as itself it pays every tick.
3. Health: hit_points: 25. Extra life: effect: 1, effect_amount: 1. Money: effect: 3, effect_amount: 5 (after set_character(file, money: 0), so money counts).
4. Things to carry: pickup: 1. Only the pick-up move takes them (sequence 3), so it needs a key: set_sequence(file, sequence: 3, key_scan). A move with needs_item_block works only while that block is carried.
5. Moving prizes are monsters under power 100 whose .mbl block has score: 100: a touch pays and removes them.
6. set_map: a trail of coins that leads the way, a bonus behind a detour.
7. level_check finds ones out of reach; bot_playtest.`,
  },
  {
    id: 'hazards',
    about: 'hurts, lives, pits, fair danger',
    text: `Hazards take hit points; at 0 the hero loses a life and the level starts again from where he came in.
1. Start values: set_character(file, hit_points: 100, lives: 3).
2. Spikes, fire: set_block(file, index, hit_points: -5). It hurts every tick it is touched, so keep it small, or make it hurt once: touch_block a look-alike with no hurt.
3. A pit: hit_points: -999 ends a life at once; use it rarely and in plain sight.
4. A monster hurts through the .mbl block it shows: set_block on that block, hit_points: -10. Power under 100 is gone after one touch; 100 or more hurts as long as it is touched.
5. Hazards that warn first: recipe animated.
6. Relief: health blocks (hit_points: 25) after a hard part, an extra life (effect: 1, effect_amount: 1) off the path.
7. Nothing harmful at the start or where a link arrives.
8. bot_playtest (it should win without losing a life); level_check.`,
  },
  {
    id: 'monsters',
    about: 'pace, patrol, chase, flee, wander',
    text: `set_monster(file, index, ...) sets how a monster moves; set_map(file, monsters: [{monster, x, y}]) places it.
1. get_monsters(file) shows them. Pictures are .mbl blocks: frames: [{block, ticks}].
2. Pacer: path: [{x: 0, y: 0, speed: 2}, {x: 5, y: 0, speed: 2}, {x: 0, y: 0, speed: 2, orient: 4}]. Corners are blocks from where it starts; end back at 0,0 or it drifts away. orient: 4 faces left.
3. Patrol a square: corners 0,0 then 4,0 then 4,4 then 0,4 then 0,0.
4. Chaser: towards: 2 (pixels a tick). Fleer: towards: -2. Wanderer: towards: 64 (128 is faster).
5. stops_at_solid: 1 keeps it out of walls; end a pacer's path two blocks short of a wall.
6. Harm comes from its .mbl block's hit_points. Power under 100: a touch removes it. 100 or more: only a stronger monster (a shot) beats it.
7. becomes: the monster it turns into when it dies (64 none); score: points when a shot ends it.
8. Speeds 1-3 are fair; leave room to get past. bot_playtest.`,
  },
  {
    id: 'animated',
    about: 'animated blocks, timed hazards',
    text: `Blocks animate in rings: each turns into next_block after next_time ticks (18 a second).
1. list_blocks(file); choose free block numbers, e.g. 40, 41, 42.
2. Water in two pictures: set_block(file, index: 40, next_block: 41, next_time: 9) and set_block(file, index: 41, next_block: 40, next_time: 9), each drawn a little different.
3. Every copy of a block shares one clock from the scene's start, so all copies change together. For a ripple, give each spot its own ring, started at a different picture.
4. A hazard that warns first, three blocks: rest (next_time: 32), then warning (12, drawn in a warning color), then danger (22, hit_points: -6), back to rest. Danger shorter than safety.
5. A floor that flickers out: floor (solid: 15, 28 ticks), flicker (8), gap (solid: 0, 40), floor again.
6. A block whose next_block is itself never changes.
7. set_map places a ring's first block.`,
  },
  {
    id: 'timer',
    about: 'countdowns, doors on a clock',
    text: `Time is told with block timers; every copy of a block shares one clock that starts with the scene (18 ticks a second).
1. A door on a clock: set_block(file, index, solid: 15, next_block, next_time: 540), next_block an open look-alike with solid: 0. It opens 30 seconds in: "hold out until the door opens".
2. Show the wait, players love a visible countdown: ten digit blocks 9 down to 0, each next_time: 18 with next_block the next digit; the 0 keeps itself. Place the 9: it counts down in seconds. Tens: a second chain with next_time: 180.
3. A lamp beside the door turning from red to green at the same tick.
4. Time up: floor that turns, at that tick, into a look-alike with gravity toward the exit link (1 up, 2 right, 4 down, 8 left), so the round ends itself.
5. A lost life restarts the level and its clock.
6. Draw digits with set_block(file, index, pixels): 20 rows of 20 palette numbers.`,
  },
  {
    id: 'spawners',
    about: 'blocks that give birth to monsters',
    text: `A background block can give birth to monsters on a timer.
1. set_block(file, index, birth_monster: 3, birth_time: 90): monster 3 is born every 90 ticks (5 seconds) in every cell showing that block, while it is near the screen (up to half a screen past its edges).
2. A nest, pipe or cloud on the map; the monster's path or towards sets where it goes (recipe monsters). Give it end (a lifetime in ticks) so they don't pile up.
3. Spawners nobody sees: just off the edge of the screen.
4. Once at a set time: a block in a next_block chain that is on the map only around its birth_time gives birth once.
5. Rain, falling rocks, waves of foes, traffic.
6. bot_playtest.`,
  },
  {
    id: 'boss',
    about: 'bosses in stages',
    text: `"becomes" chains monsters into a boss with stages.
1. Stages: set_monster(file, index: 10, power: 95, becomes: 11, score: 20, end: 0); index 11 the same pictures looking hurt, becomes: 12; and so on. The last becomes a short-lived burst (end: 18) worth score: 1000.
2. Each stage's power under the hero's shot (recipe shooter) so a shot ends it; under 100, a touch does too.
3. Each stage can move differently: a wider path, a faster towards.
4. A breather: a stage with power 150 and end: 36 (can't be hurt for 2 seconds) that becomes the next.
5. A prize: the last stage becomes a monster whose .mbl block has effect: 20, effect_amount: 1, the key to the exit (recipe keys_locks).
6. A monster file holds 64 monsters; count them first.
7. bot_playtest.`,
  },
  {
    id: 'currents',
    about: 'wind, conveyors, rivers, ice',
    text: `Gravity can pull any way (1 up, 2 right, 4 down, 8 left, added together), from the block the hero is in.
1. Conveyor or river: set_block(file, index, gravity: 2) pulls right, gravity: 8 left.
2. Updraft: a column of air with gravity: 1 above a fan, two pictures swapping (next_block, next_time: 3).
3. Gusts: a ring of air blocks: calm (gravity: 4, 26 ticks), stirring (wisps drawn, 12), blowing (gravity: 2, 28). Leave calm shelter behind solid vents.
4. A slope that keeps speed: gravity: 5 (up and down cancel).
5. Ice or a sled: moves with momentum: 1 (set_sequence) and small pushes (x: 1); speed builds and fades.
6. An open door can pull the hero onto its link.
7. bot_playtest.`,
  },
  {
    id: 'design',
    about: 'what makes a level good',
    text: `Good levels in brief (the Level check uses the same rules):
1. Start safe: no hazard or foe within 5 blocks of the start or of a link's arrival.
2. Teach, then test: show each new thing once where it can't hurt, then use it harder.
3. Lead the eye: a path or a trail of pickups toward the goal; an exit that looks like one.
4. Fair foes: slow (speed 1-3), seen before they arrive, room to get past.
5. Reward exploring: a bonus in a side room.
6. Short levels: a minute or two each; more levels rather than bigger ones.
7. Every level can be won: bot_playtest must win without losing a life; level_check.
8. Family-friendly words and friendly characters.`,
  },
];
