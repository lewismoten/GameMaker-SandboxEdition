// The Ultimate Owner's Guide, chapter 14: the editor's own play-testers. The map editor's 🩺 Level
// check (heat map, stuck areas, findings, ✨ fixes and Undo), the badges in the block, monster and
// sound editors, the self-ticking Before You Upload list, the Integrator's 🤖 Make a walkthrough,
// the report and its checklists, the author's own play in a walkthrough, watching the bot, and the
// links from the editor into this guide. Checked against web/src/editor/check
// (explore.ts, stuck.ts, findings.ts, generators/fixes.ts, walk/autoWalk.ts) and its panels
// (editors/map/check/checkPanel.ts, widgets/checkBadges.ts, uploadChecklist.ts, walkDialog.ts,
// checkReport.ts, playScene.ts, watchScene.ts),
// and the First steps checklist of a new starter game (editor/shell/firstSteps.ts).
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
  places it tried, and whether it tried every move from every one or the time ran out first.
  While it plays, a bar fills and says how long is left: <i>up to</i> the time you chose, or
  <i>about</i> so many seconds once the places still waiting to be tried are clearly running
  out, with the count of places tried so far.</p>
  <h2>The heat map</h2>
  <p>The map is colored where the bot went, from dark for a moment to bright for a long while,
  with a legend beside it. Switch it to <i>how soon it got there</i> to see the order a player
  is likely to find things. The useful part is what stays <i>uncolored</i>: a room you built
  that the bot never entered is a room no player will see either. Turn the heat map and the
  marks on and off with the boxes above the list. Tick <b>Gray level</b> to draw the map in
  shades of gray, from the lightness of each color in the scene’s palette, so the heat map’s
  colors stand out from the blocks under them. It only changes how the editor shows the map, and
  the editor remembers it for every map. The heat map fills in about once a second while the
  check runs, so you can watch the bot spread out from the start, and its deaths appear as it
  finds them.</p>
  <h2>The marks</h2>
  <p>On top of the heat map: a white <b>✕</b> where the hero died (the tooltip says how many
  tries ended there), red <b>hatching</b> over a stuck spot, a cyan <b>○</b> on each cell a
  finding is about, and a dashed yellow square around the place you picked from the list.
  Rest the pointer on a cell and a tooltip says what each mark there is, and what the heat
  color means (<i>Time spent: a lot</i>). The legend under the heat map lists each kind of
  mark with how many there are; press one to go to the next, and its meaning is read out, so
  the marks work from the keyboard too. Zoomed out to 25% or 10%, the marks become small
  filled squares in the same colors, and the tooltip finds the nearest one.</p>
  <h2>Your own heat map</h2>
  <p>The bot tries everything, but it can’t tell which places matter. Press <b>▶ Play and
  record</b> and play the scene yourself: it opens at this scene, and everywhere your hero goes,
  and how long it stays, is kept as your own heat map, saved with the project’s editor notes
  (never in the game’s files) and added to each time you play. The same session can keep your
  play for the walkthrough too (see below). Then choose what to <b>Show</b>: the bot’s
  heat map, yours, both combined, or <b>Compare</b>, which colors the places only the bot
  reached orange, the places only you reached blue, and the places you both reached light
  gray. A line underneath says how much of the bot’s ground you’ve covered (a place counts when
  you passed within a block of it) and how many areas it found that you haven’t;
  <b>→ Next place you haven’t been</b> takes you to each. Keep playing until the orange is
  only where you don’t mind a player not going. <b>Clear my heat map</b> starts yours again.</p>
  <h2>Stuck spots</h2>
  <p>Places the hero can reach but never leave are hatched, with the likeliest reason: a pit
  with no way up, a drop that only goes one way, or a lock whose key can no longer be had. A
  place is only called stuck once every place it leads to has been tried, so a run cut short
  by the clock doesn’t cry wolf; it says how far it got instead.</p>
  <h2>Findings</h2>
  <p>The list below the map holds about thirty kinds of finding: blind drops, hazard art smaller
  than its cell, opposite blocks side by side, hurts that hold the hero, scores that pay every
  tick, counters that run out before their gate, crowded screens, chasers that never let go,
  keys never taught, long waits, a hero who walks sideways facing you and a monster that never
  turns round, and more. Each is marked a problem, a warning, a suggestion or a note; the
  buttons at the top show one kind at a time. Problems and warnings are facts the bot
  measured: the hero can get stuck here, this exit is never reached, this block hurts through
  its whole cell. 💡 Suggestions, and many notes, are design habits instead (crowded screens,
  an idea used once, a chaser that never lets go, a long scene, a slow hero): prompts to look
  again, not rules. Many great games break one on purpose, and the check can’t know which. Click a finding to go to its place on the map.
  Each one says, in a line, why players mind, and its 📒 link opens the part of this guide that
  explains it. When you have looked at a finding and it is how you want it (a boss meant to
  hold on, a swarm meant to overwhelm, a maze meant to confuse), <b>✓ That’s on purpose</b> on
  a suggestion, or <b>✓ Mark as checked: it’s meant to be</b> on anything else, takes it out of
  the list, the counts, the badges and Before You Upload; <b>N accepted · show</b> lists those
  again, each with a button to put it back.</p>
  <h2>The report, and a checklist to fix from</h2>
  <p>A long list is easier to work through with room to read. <b>📋 Open as a report…</b>
  shows every finding of the map’s last check in a large window, grouped into problems,
  warnings, suggestions and notes, each with its scene and cell, why players mind, its 📒
  link and its fix and accept buttons. The same buttons pick one kind at a time; <b>Show
  accepted</b> lists the ones you kept as they are. Pick a finding to close the report and go
  to it on the map. Two checklists come with it: <b>⬇ Download CSV checklist</b> saves one row a
  finding (kind, check, scene, map, x, y, what, the measures, why it matters, the guide’s
  section, and whether it is open, accepted or on purpose) for a spreadsheet, and <b>🖨 Print
  or save as PDF</b> prints them with a box to tick by each; your browser’s Print can save
  the page as a PDF. In Before You Upload, <b>📋 Every map’s findings as a report…</b> does the
  same for the whole game at once.</p>
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
  <h2>Your own play, and watching the bot</h2>
  <p>Where the bot can’t get through, or plays a scene in a way you would rather not show, play
  it yourself. <b>▶ Play and record</b>, in the map’s Level check, is one session for both
  jobs: while you play, your heat map grows, and the keys you press are kept tick by tick. A
  death starts the scene over. When you reach an exit, play stops and offers <b>✓ Keep this
  play for the walkthrough</b> beside <b>↺ Try again</b>; keep another try later and it
  replaces the one before. <b>■ Done</b> ends the session. In <b>🤖 Make a walkthrough…</b>,
  each scene you kept a play of can use <b>Mine</b> or <b>Bot</b>. The bot plays your keys
  from wherever the walkthrough has got to and plays the rest itself, and the whole
  walkthrough is checked on the engine as before. If your play no longer reaches an exit (you
  changed the map since, or the hero arrives carrying something else), the list says so and
  the bot plays that scene instead.</p>
  <p><b>▶ Watch the bot</b> plays the bot’s route through this scene in the walkthrough player,
  with play, pause and a seek bar: the game’s walkthrough, started at this scene, or, when it
  has no route here yet, one the bot makes for this scene alone. A route made that way stays
  as it was when you edit the map, so the panel says <i>The map changed since the bot’s route
  was made</i>, and <b>↻ Make the bot’s route again</b> lets it look again. <b>▶ Watch my
  play</b> plays yours the same way, so you can compare the two.</p>
  <h2>First steps for a first game</h2>
  <p>A game started as <b>▶ Ready to play</b> comes with <b>🎓 First steps</b>, beside Play
  test: ten small jobs that make the starter yours. Play it, change a color, draw a block,
  build the level, change the hero and a monster, give it a sound, add a way to win and a Game
  won screen, then run the Level check. Each step ticks itself the moment the game changes,
  opens the file to do it in, and links to the page of this guide that explains it.</p>
  <h2>What is still your job</h2>
  <p>No check can tell you whether the first minute is fun, whether the story hangs together,
  whether a joke lands, or whether the boss is a good fight rather than merely a long one. The
  bot finds what is broken; your friends find what is dull. Use both.</p>
  ${tip('From the editor to this page:', 'Every 📒 link opens the web Guide’s Ultimate page in a new tab, turned to the right chapter, with the section to read named in the link’s tooltip. The addresses look like <code>#/help/ultimate?chapter=levels</code>, so a link to any chapter can be shared.')}`,
};
