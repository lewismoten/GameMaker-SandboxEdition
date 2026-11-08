// Art course 5, "Block animation": the words of its lessons. Its figures are drawn by scripts/artCourseFigures5.ts. What it says
// about how blocks animate is what PLAYGAME's changeblks and really_checktouch do (code/GM/PLAYGAME.C:2322 and :3524), the web
// engine's changeBlocks (engine/src/engine/scene.ts:381) and Programmer's Guide chapter 5. The ring counts are from a survey of the
// CD and the built games (each block file counted once).
import type { Course } from './courses';

export const ANIMATION: Course = {
  id: 'animation',
  no: 5,
  title: 'Block animation',
  about: 'Water, torches and doors from a few frames: a block that turns into another, a loop that closes without a jump, and what each frame costs.',
  starters: ['Heat Waves', 'Switches', 'Keys and Doors'],
  lessons: [
    {
      id: 'ring',
      title: '1. A block that turns into another',
      parts: [
        {
          p: 'A ground block can be told two things: which block to turn into, and how long to wait first. When the wait is over, every place on the map that shows the block shows the next one instead. Give the next block the same two settings and a chain of blocks turns one after another. Point the last one back at the first and the chain is a ring: a loop that runs as long as the scene does.',
        },
        {
          p: 'The wait is counted in ticks, and a tick is about 55 thousandths of a second (18.2 a second). A frame that waits 4 ticks shows for a bit over a fifth of a second.',
        },
        {
          fig: 'anim-heat',
          alt: 'Six blocks side by side with an arrow between each pair. Each shows a pale sky above a strip of reddish-brown ground. The ground edge has a small notch at the right end that moves a pixel or two from block to block.',
          caption:
            'A ring of six blocks from the Heat Waves Starter, level one, each waiting 4 ticks. The sixth turns back into the first, so the notch keeps moving.',
        },
        {
          p: 'A ring of six blocks at 4 ticks takes 24 ticks (about 1.3 seconds) to come round. The art of the loop is what changes between neighbors. In the ring above a pixel or two of the edge moves, and the eye reads motion, not a change of picture.',
        },
        {
          ul: [
            'Only ground blocks animate this way. Monsters and the hero animate by frame lists, which is course 4.',
            'The first block in the ring is the one the map holds. Start the ring where you want a level to open.',
            'A block that never changes has no next block (or itself as its next block) and a wait of 0.',
          ],
        },
      ],
    },
    {
      id: 'water',
      title: '2. Water that closes its loop',
      parts: [
        {
          p: 'A loop only looks smooth if its last frame leads into its first. The easiest way to get that is to move something by the same step each frame and make the steps add up to a whole repeat. A wave with a repeat of 20 pixels, moved 5 pixels a frame, is back where it began after four frames.',
        },
        {
          fig: 'anim-water',
          alt: 'Top: four blocks of blue water with a wave crest and a white glint on top, the crest moving a quarter of a wave to the right in each block. Bottom: six water blocks in a row, in the order one, two, three, four, one, two, forming a continuous rolling wave with no join between blocks.',
          caption:
            'Top: four frames, each 5 pixels further along. Bottom: the frames laid in a row, then the ring starting again. The wave runs on across every join.',
        },
        {
          p: 'The same rule makes water tile. The wave goes up and down by the same amount at the left and right edges of the block, so a row of water blocks is one long wave. Move the whole block by whole pixels and every frame keeps that edge.',
        },
        {
          ul: [
            'Pick a repeat that divides 20: 5, 10 or 20 pixels. Then 4, 2 or 1 frames close the loop.',
            'Keep the colors the same and move the shapes. Water that changes color from frame to frame flickers.',
            'A white glint on a crest is the cheapest way to say that the surface is wet.',
          ],
        },
      ],
    },
    {
      id: 'fire',
      title: '3. Fire and torches',
      parts: [
        {
          p: 'Fire is the opposite of water. It does not travel, it flickers: the flame leans, grows and shrinks in place while the torch under it stays still. Draw the torch once. Draw the flame four times, each a little taller or leaning another way, on the same torch.',
        },
        {
          fig: 'anim-torch',
          alt: 'Four blocks, each a stone wall with a wooden torch on it and a flame. The flame is red at the edge, yellow inside and white at the heart. In the four blocks it is a different height and leans a little left, straight or right.',
          caption: 'Four frames of one torch. The bracket and the wall are the same in all of them; only the flame changes.',
        },
        {
          p: 'Flames also want an uneven beat. A ring where every frame waits the same time ticks like a clock, and a flame that ticks is not a flame. Give one frame a longer wait, or waits of 2 and 3 ticks mixed. The cost is the same four blocks.',
        },
        {
          ul: [
            'Everything that is not fire stays pixel for pixel the same, so that only the flame moves.',
            'Use three or four colors in the flame: an outline, a body, a bright heart. A fifth color rarely shows.',
            'A flame that moves a lot looks lively but costs attention. In a corridor of torches, keep them small.',
          ],
        },
      ],
    },
    {
      id: 'touch',
      title: '4. Doors and levers: change once, when touched',
      parts: [
        {
          p: 'A block can also turn into another when the hero touches it. That is not a loop. It happens once, and the new block stays for the rest of the visit to the scene. It is how a shut door becomes open air and a lever stays flipped.',
        },
        {
          fig: 'anim-door',
          alt: 'A wooden door with a gold padlock on the left, an arrow, and on the right a plain light blue block of sky.',
          caption:
            'The door block of the Keys and Doors Starter: solid on every side, it spends one from a counter (a key), and when touched it turns into block 0, plain sky.',
        },
        {
          fig: 'anim-lever',
          alt: 'A gray lever box with a red knob on a stick, an arrow, and the same box with the stick flipped and a yellow knob.',
          caption: 'A lever of the Switches Starter and the block it turns into when touched. It adds planks to a counter as it flips.',
        },
        {
          p: 'A block like that needs two pictures, before and after, and each is a block. The swap only happens when the cell is on the screen, so keep a lever or a door where the hero will see it change.',
        },
        {
          ul: [
            'Draw the after picture so it still fits the picture around it: an open door is the doorway behind it.',
            'Leave a hint in the picture of what the block will do: a lock on a door, a knob on a lever.',
            'Make the change easy to see. A door that opens is not a hard thing to miss; a lever that shifts one pixel is.',
          ],
        },
      ],
    },
    {
      id: 'cost',
      title: '5. Timing, and what each frame costs',
      parts: [
        {
          p: 'Every frame is a block, and a game has 150 of them for its whole ground. A ring of four frames takes four of the 150. Count it as you drew it: a four-frame torch, a four-frame water, and the doors and levers with their after pictures are already a dozen blocks before any plain ground.',
        },
        {
          p: 'In the CD’s games and the Library (not counting the Starters) there are 1,537 closed rings in 210 block files. Two frames is by far the most common, 999 of them; then four (218) and three (197). Rings of five frames or more are rare: 123 in all.',
        },
        {
          fig: 'anim-stagger',
          alt: 'Two rows of six wall torches. In the top row every torch has the same flame. In the bottom row the flames are different heights and lean different ways, as if each flickered on its own.',
          caption:
            'The same four torch blocks. Top: every cell uses the first block, so all flames move together. Bottom: different cells use different blocks of the ring.',
        },
        {
          p: 'Every cell that uses the same block changes on the same tick, so a row of torches made from one block flickers in step. The cure costs nothing. A ring has as many members as frames, and any member can be put in the map. Put member 1 in one place, member 3 in the next and member 2 after that, and the flames are out of step with only the same four blocks. For water, keep them in step, so that the wave stays one wave.',
        },
        {
          ul: [
            'The wait for each frame counts from the end of the last one, so a ring does not drift out of time.',
            'A changed block is redrawn as one of at most 170 screen boxes, which monsters and the hero use too (the Guide’s chapter 5 counts it, and has not tried it in DOSBox). A few torches and a pool will not run out; a screen full of animation and a crowd of monsters might.',
            'Two rings may not share a block. A block has only one next block.',
            'Give a ring waits of 2 to 6 ticks for most things. Longer is for a slow pulse; 1 tick is the fastest.',
          ],
        },
      ],
    },
  ],
};
