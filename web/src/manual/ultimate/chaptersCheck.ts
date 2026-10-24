// The Ultimate Owner's Guide, chapter 14: the editor's own play-testers. The map editor's 🩺 Level
// check (heat map, stuck areas, findings, ✨ fixes and Undo), the badges in the block, monster and
// sound editors, the self-ticking Before You Upload list, the Integrator's 🤖 Make a walkthrough,
// and the links from the editor into this guide. Checked against web/src/editor/check
// (explore.ts, stuck.ts, findings.ts, generators/fixes.ts, walk/autoWalk.ts) and its panels
// (editors/map/check/checkPanel.ts, widgets/checkBadges.ts, uploadChecklist.ts, walkDialog.ts).
import { opening, tip, type Chapter } from './chapter';

export const CHECK: Chapter = {
  id: 'check',
  title: 'The Level Check and the Walkthrough Bot',
  head: '14. The Level Check',
  html: `${opening(14, 'The Level Check and the Walkthrough Bot', 'This edition’s editor can play your game for you. It won’t tell you whether the game is fun, but it will find the traps, the prizes nobody can reach and the hurts nobody can dodge, long before a friend does.')}
  <h2>What the Level check plays</h2>
  <p>Open a map and press 🩺 <b>Level check</b>. The bot plays the scene that uses the map, on
  the same engine the player uses, entering where play enters it and carrying the hit points,
  score and inventory the hero would bring. From every place the hero comes to rest it tries
  every move the character has, each place once. Choose how long it may play: Quick (15
  seconds), Thorough (a minute) or Exhaustive (four minutes). When it is done it says how many
  places it tried, and whether it tried every move from every one or the time ran out first.</p>
  <h2>The heat map</h2>
  <p>The map is colored where the bot went, from dark for a moment to bright for a long while,
  with a legend beside it. Switch it to <i>how soon it got there</i> to see the order a player
  is likely to find things. The useful part is what stays <i>uncolored</i>: a room you built
  that the bot never entered is a room no player will see either. Turn the heat map and the
  marks on and off with the boxes above the list.</p>
  <h2>Stuck spots</h2>
  <p>Places the hero can reach but never leave are hatched, with the likeliest reason: a pit
  with no way up, a drop that only goes one way, or a lock whose key can no longer be had. A
  place is only called stuck once every place it leads to has been tried, so a run cut short
  by the clock doesn’t cry wolf; it says how far it got instead.</p>
  <h2>Findings</h2>
  <p>The list below the map holds about thirty kinds of finding: blind drops, hazard art smaller
  than its cell, opposite blocks side by side, hurts that hold the hero, scores that pay every
  tick, counters that run out before their gate, crowded screens, chasers that never let go,
  keys never taught, long waits and more. Each is marked a problem, a warning or a note; the
  buttons at the top show one kind at a time. Click a finding to go to its place on the map.
  Each one says, in a line, why players mind, and its 📒 link opens the part of this guide that
  explains it.</p>
  <h2>✨ Fixes, and Undo</h2>
  <p>Many findings offer a one-click fix: stretch the hazard art to fill its cell, outline a
  monster in a standout color, add a ladder out of a pit, open a one-block gap, shorten a
  timed cycle to about 3 seconds, speed up a slow lift, add the keys to the instructions,
  put landmarks at a maze’s crossroads, or halve the healing in the second half. A fix changes
  your files at once. <b>↶ Undo fix</b>, beside <b>▶ Run check</b>, takes back the last fix,
  and the one before that. Run the check again to see the difference. Under <b>Make…</b>, select an area at
  least 7 blocks each way and the panel builds a maze in it, with landmarks at its crossroads;
  the map’s own Undo takes that back.</p>
  <h2>Badges in the other editors</h2>
  <p>The block, monster and sound editors run the same file checks on every scene that uses the
  file. When one finds something about the item you are editing (a block whose hurt is drawn
  too small, a monster the color of the scenery, a long sound that plays all the time), a small
  badge beside it says what, why players mind, and where in this guide to read more. The
  badges only read; they change nothing, and update each time the editor saves.</p>
  <h2>A checklist that ticks itself</h2>
  <p><b>☑ Before you upload…</b>, in the map’s Level check and in the Integrator, opens
  Appendix B as a checklist. A line the checks can judge completely ticks itself when nothing
  is found. A line they can judge only in part says “nothing found; the rest is your call”. A
  line with findings says how many, and of which kinds. The lines about play need a Level
  check on every map first, and some lines (smooth loops, a demo that plays the same twice,
  three friends) only you can tick. Your ticks are kept with the project’s editor notes, never
  in the game’s own files.</p>
  <h2>🤖 Make a walkthrough</h2>
  <p>In the Integrator, <b>🤖 Make a walkthrough…</b> lets the bot play the whole game, from the
  title’s first link, scene by scene. In each scene it tries bot styles from quickest to most
  thorough until one reaches a scene it hasn’t seen yet without dying:</p>
  <ol>
    <li><b>Run and hop</b>, in scenes with gravity, or <b>Maze walker</b>, in scenes without.</li>
    <li><b>Every move</b> the character has.</li>
    <li><b>Every move, waiting out hazards</b> at every place, for timed blocks and lifts.</li>
    <li><b>Collect everything, then go on</b>, for a side room whose prize is the point, or a
    way on that opens only for what the hero carries.</li>
  </ol>
  <p>The path it found is played again on the engine from the scene’s start, and the keys are
  kept tick by tick, so the walkthrough plays back exactly. Pick the time for each scene, from
  30 seconds to 10 minutes. Where no style gets through, it stops and says so, lists the styles
  it tried, and leaves its heat map on that scene’s map for you to read. The walkthrough ends
  where the bot got to; it never pretends.</p>
  <p>A stop is not proof of a broken game. Riddles, secret doors and tight timing beat the bot
  often: of the 31 games on the original CD, it plays 2 from start to end. It is best at
  telling you a scene you thought was easy isn’t.</p>
  <h2>What is still your job</h2>
  <p>No check can tell you whether the first minute is fun, whether the story hangs together,
  whether a joke lands, or whether the boss is a good fight rather than merely a long one. The
  bot finds what is broken; your friends find what is dull. Use both.</p>
  ${tip('From the editor to this page:', 'Every 📒 link opens the web Guide’s Ultimate page in a new tab, turned to the right chapter, with the section to read named in the link’s tooltip. The addresses look like <code>#/help/ultimate?chapter=levels</code>, so a link to any chapter can be shared.')}`,
};
