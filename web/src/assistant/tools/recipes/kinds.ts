// Recipes for kinds of level: side view, top down, shooters, driving, the pseudo-3D road, the
// endless track on the wrap, parallax and rooms of doors. Each is a few steps in the tools' own
// names and arguments, checked against PLAYGAME (web/src/engine) and the Sandbox games; the
// Ultimate Owner's Guide (manual/ultimate) tells the same tricks at length.
import type { Recipe } from '../recipeTools';

export const KIND_RECIPES: Recipe[] = [
  {
    id: 'platformer',
    about: 'side scroller, gravity, jumps, ledges',
    text: `Side view: gravity pulls the hero down; he walks and hops.
1. Look first: get_scene(scene), list_blocks(file) of the .bbl, get_character(file) for which sequence has which key.
2. Air: set_block(file, index, gravity: 4, solid: 0) on every sky block. Gravity acts from the block the hero is in.
3. Ground: solid: 15. A ledge to hop up through: solid: 1 (top only). A ladder: gravity: 0, with up and down moves.
4. Walk: set_sequence(file, sequence, key_scan: 77, frames: [{x: 4, top, bottom}]); left key_scan: 75, x: -4, bottom_orient: 4 (mirrored).
5. Hop: key_scan: 72, one frame y: -12. It repeats while Up is held; gravity wins after about 3 blocks. A sideways hop needs its own key (one key works at a time): x: 4, y: -12.
6. Frames need top and bottom, the hero's .cbl blocks (top: 50 is none): copy them from get_character(file, sequence).
7. set_map: a floor near the bottom, ledges at most 3 blocks above the last, gaps under 4 blocks, the start on ground.
8. bot_playtest, then level_check.`,
  },
  {
    id: 'top_down',
    about: 'adventure map seen from above',
    text: `Seen from above: no gravity; walls block, doors lead on.
1. get_scene(scene), list_blocks(file) of the .bbl, get_character(file).
2. Floors: set_block(file, index, gravity: 0, solid: 0). Walls, trees, water: solid: 15.
3. Moves: set_sequence(file, sequence, key_scan, frames) for up (key_scan: 72, y: -4), down (80, y: 4), left (75, x: -4), right (77, x: 4). Diagonals need keys of their own (71, 73, 79, 81 on the keypad).
4. set_map rows: an outer wall, rooms joined by gaps two blocks wide, a path (a floor that looks different) toward the goal.
5. Doors are links to other scenes (recipe levels); houses can be small scenes of their own.
6. Something in each corner: pickups (recipe pickups), a key and its lock (recipe keys_locks).
7. Monsters patrol the paths (recipe monsters), never near the start.
8. bot_playtest, then level_check.`,
  },
  {
    id: 'shooter',
    about: 'shots, foes, scrolling shooter',
    text: `Shots are monsters the hero gives birth to.
1. Shot: set_monster(file, index, frames: [{block, ticks: 2}], power: 120, towards: 8, end: 30, stops_at_solid: 1, becomes: 64). With a speed (towards) and no path it flies straight the way the hero last moved; end is its range in ticks.
2. Fire: set_sequence(file, sequence, key_scan: 57, no_repeat: 1, uninterruptible: 1, frames: [{x: 1, top: 50, bottom: 0}, {top: 9, bottom: 100, y: 20}, {x: -1, top: 50, bottom: 0}]). A frame with bottom: 100 gives birth to monster number top (here 9, the shot); y: 20 puts it on the hero's row; the 1-pixel nudge aims it.
3. Foes: power under the shot's (60 dies to a touch too; 110 only to shots), score: 50 for the shot that ends it.
4. A ship that flies on: every move, idle (sequence 0) too, adds y: -2, so the view scrolls by itself; foes come from blocks ahead (recipe spawners).
5. bot_playtest.`,
  },
  {
    id: 'driving',
    about: 'car or craft the hero drives',
    text: `A vehicle is a hero file of its own: a level's Character slot (5) and Character block set slot (6) put the player in it. Score and counters ride along.
1. set_block(file: car.cbl, index: 0, pixels) draws it facing right (makes the .cbl); set_character(file: car.chr, hit_points: 100, lives: 3) makes the .chr.
2. Moves: set_sequence(file: car.chr, sequence: 5, key_scan: 77, frames: [{x: 5, top: 50, bottom: 0}]); left x: -5, bottom_orient: 4; up y: -5, bottom_orient: 3; down y: 5, bottom_orient: 1 (turned). 11 pixels a tick is the most a hero moves.
3. Drift: momentum: 1 with small pushes (x: 1): speed builds and fades, like ice or a hovercraft.
4. set_scene(scene, files: [{slot: 5, file: car.chr}, {slot: 6, file: car.cbl}]).
5. Road plain; grass hit_points: -1 (it drains the battery); barriers solid: 15.
6. A horn that clears the road: recipe shooter. Checkpoints: counters (recipe keys_locks). A finish link to the next scene.
7. bot_playtest.`,
  },
  {
    id: 'road_3d',
    about: 'pseudo-3D driving, road rushing at you',
    text: `A one-screen road that seems to rush at the player. Ambitious: make a plain level work first.
1. set_scene(scene, scroll: false). The screen is 16x10 blocks around the start: columns to_x-8 to to_x+7, rows to_y-5 to to_y+4.
2. set_map: sky above a horizon row; below it a road a block wider on each side every row down, grass beside it.
3. Rush: down each roadside, each row gets its own block drawn as ground, with next_time one tick longer than the row above (1, 2, 3...), all with next_block the same pair: a rock (next_time: 1) then ground (next_time: 6), round and round. Rocks seem to whip past.
4. Hero: every move, idle too, adds y: -5, and the row above it is solid look-alikes of road, so only steering moves it. Steering left or right is 4 frames of x: 10 (or -10), uninterruptible: 1, so it lands in a lane.
5. Finish: one block of that solid row turns after 990 ticks (next_block, next_time) into a look-alike, solid: 0, gravity: 1, that lets the push carry the hero to a link.
6. Traffic: spawner blocks just off screen (recipe spawners); monster frames that grow as the path slides down a lane.`,
  },
  {
    id: 'wrap_track',
    about: 'endless diagonal track on the wrap',
    text: `The 100x100 map wraps: off the right comes back at the left, off the top at the bottom, so a course can have no end.
1. Always moving: the idle sequence (0) moves the hero every tick, e.g. frames: [{x: 10, y: -10, top: 50, bottom: 0}], up and to the right; every other move adds the same push. Each frame 11 pixels or less.
2. Course: lanes of track drawn corner to corner, bottom left to top right, with solid: 15 tree lines between them; the track pulls along with gravity: 3 (up and right).
3. Keys turned with the view: Up boosts (3 frames of x: 10, y: -10), Down nearly stops, Left and Right step to the next lane (y: -10 or x: 10 frames).
4. Where the map wraps, jog each lane over by one, so each lane runs on into the next: one long course through every lane.
5. Put the finish link in a lane the hero doesn't start in, so changing lanes matters.
6. bot_playtest.`,
  },
  {
    id: 'parallax',
    about: 'world sliding by on a still screen',
    text: `On a screen that doesn't scroll, rows whose pictures shift make the world slide past.
1. set_scene(scene, scroll: false).
2. A band is a ring of blocks: each shows the same picture shifted 2 pixels left of the one before, so 10 blocks bring it back round (20 divided by the shift). Each block's next_block is the next; the last's is the first.
3. Draw each band to repeat every 20 pixels so the seam never shows (set_block(file, index, pixels)).
4. Depth: far hills next_time: 4, the town next_time: 2, a near fence next_time: 1 with a 4-pixel shift (5 blocks). Slow a band with a longer timer, not more blocks.
5. set_map: fill each band's row with its ring's first block; every copy moves together.
6. The hero stays put while foes and prizes come in from the right (recipe spawners) and he hops or ducks.`,
  },
  {
    id: 'choices',
    about: 'menus you walk into, hubs, pointers',
    text: `A choice is a room of doors, each a link to a different scene.
1. A small start room, walled, with no foes; set_links(scene: 0, links: [{index: 0, to_scene: 2, to_x, to_y}]) starts there.
2. Doors a few blocks apart, so one step can't take the wrong one: set_links(scene, links: [{index, to_scene, from_x, from_y, to_x, to_y}]), each on a door block, with a label drawn on the floor in front.
3. Skill doors lead to an easy and a hard copy of a level (more monsters on the hard one's map).
4. A hub: each world links back beside its door, so the hub is a place to wander. A last door behind a lock counts the wins (recipe keys_locks).
5. A pointer menu: set_scene(scene, scroll: false), the hero drawn as an arrow, no gravity, doors 5 blocks apart; each arrow key moves 10 frames of 10 pixels, exactly 5 blocks a press.
6. Make each door two cells wide: two links to the same place.`,
  },
];
