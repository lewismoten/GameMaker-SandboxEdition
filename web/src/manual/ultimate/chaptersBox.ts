// The Ultimate Owner's Guide, chapter 18: what goes in the box. The paper and plastic extras
// games shipped with (code wheels, code sheets, cloth maps, hint books under red film, plastic
// trinkets): what each adds, what it costs to make, how much it protects, and how to build the
// puzzle that uses one out of plain Game-Maker parts. The Sandbox examples are real:
// Quest for the Round Tuit's Royal Code Wheel, Cloth Map and Royal Hint Book (games/realm/
// printables.json and manual.json: runes read by the wheel, miners' marks in its three windows),
// Maximus's clearance gate (wrong hatches only sigh), the red-film answers (printables/redFilm.ts)
// and the toy box's 3D-printable trinkets (library/toyBox.ts). Game-Maker has no text box, so a
// code check is a choice of place: links and look-alike blocks (chapters 2, 4 and 5).
import { opening, tip, type Chapter } from './chapter';
import { INSTALL_LESSON } from './installScript';

export const BOX: Chapter = {
  id: 'box',
  title: 'What Goes in the Box',
  head: '18. In the Box',
  html: `${opening(18, 'What Goes in the Box', 'A game on a disk is a game. A game in a box with a map, a wheel and a little plastic something is an occasion. Here is what authors packed with their games, what each piece adds, what it costs to make, and how to build the puzzle that needs it.')}
  <h2>Why put paper in the box</h2>
  <p>Three reasons, in order of how much they matter. Paper makes the world bigger than the
  screen: a map you can unfold, a letter from a character, a wheel that reads a dead language. It
  gives players a reason to register: shareware gives the game away, so the paper is what a
  registered player finds in the mailbox. And it gets in the way of casual copying, a little.
  Plan for the first two. The third is a bonus, and a small one.</p>
  <h2>Code wheels</h2>
  <p>Two or three discs of card on one fastener. Turn the small disc until one symbol sits against
  another, and the answer shows in a window. The game asks; the wheel answers. Quest for the
  Round Tuit’s Royal Code Wheel turns Old Procrastian runes into letters, and its three windows
  show the miners’ marks that tell you which door in the mines to take.</p>
  <p>A wheel is the fanciest paper in the box and the hardest to make. The discs must be cut
  round and the windows cut clean, and a wheel cut by machine needs a die made for it. A wheel
  meant to be printed at home should say where to cut and come out right with scissors: square
  windows, symbols of even width, a big center hole for a paper fastener. Odd-shaped windows and
  symbols of different widths look grand, and make a wheel very hard to copy by hand, for the
  same reason they are hard to cut out.</p>
  <h2>Code sheets</h2>
  <p>A look-up grid: find the row, find the column, read the square. The cheapest protection
  there is, one ink on colored card. The card’s color does the work. Dark red paper comes out of
  a photocopier nearly black, print and all, and light cyan barely comes out at all. A sheet
  that is all letters and numbers can still be copied out by hand, so keep the grid big and the
  answers short and many.</p>
  <h2>Cloth maps</h2>
  <p>A map on cloth folds a hundred times and still looks like treasure. It is also the dearest
  piece per copy, so most authors print paper and call it cloth: Quest for the Round Tuit’s map
  of Procrastia is printed on genuine imitation cloth. Whatever it is printed on, put on it what
  the screen can’t show: the names of places, which way is north, how far the road runs, and one
  joke in the margin.</p>
  <h2>Hint books and red film</h2>
  <p>Write the book as you test (Chapter 10, “Writing a hint book”). Then hide the answers: print
  them in very pale cyan under a mesh of red lines, and put a sheet of red film in the box. Through
  the film the red mesh vanishes and the cyan reads dark, one answer at a time, so nobody reads
  the next answer by accident. The film is cheap, and players remember it.</p>
  <h2>Plastic trinkets</h2>
  <p>A coin, a badge, the hero’s ball: something from the world to keep on the desk. A molded
  piece is cheap per copy and dear to start, since the mold costs more than a whole run of
  paper, so it only pays on a big run. In this edition the Sandbox games’ trinkets come as files
  for a 3D printer, in the Library’s toy box.</p>
  <h2>What each piece costs</h2>
  <p>From cheapest to dearest: one ink on plain paper; one ink on colored card; full color; card
  cut to a shape (a wheel, a punch-out); film; cloth; anything molded. The first copy of any of
  them costs the most, since the setup is paid once and the paper a little at a time. So print
  the extras for the registered players you have, not the ones you hope for, and make the next
  batch when the first runs out.</p>
  <h2>Copy protection that doesn’t punish</h2>
  <p>A copied floppy without its paper gets stuck at the first gate that needs it. But paper
  doesn’t stop a library photocopier, or a friend with a pencil and a free afternoon. So never let a lost wheel end a
  paying player’s game.</p>
  <ul>
    <li><b>Wrong costs a little.</b> A wrong door sends the hero back a room or shows a sigh; it
    never takes the last life. Maximus’s clearance gate has three hatches, and the wrong two only
    sigh.</li>
    <li><b>Say what you need.</b> The manual names the piece a puzzle uses and where it is, so a
    player knows what to look for in the box.</li>
    <li><b>Offer a spare.</b> Print the address for a replacement in the manual. A player who
    writes in for a lost wheel is a player who cares.</li>
  </ul>
  <h2>Paper puzzles in Game-Maker</h2>
  <p>Game-Maker has no box to type an answer into, so the game shows the question and the answer
  is a place. Put the question in the level: a carving, a sign, a symbol over a door. The paper
  turns it into an answer: a letter, a number, a mark. Then the answer is which way to go: one door
  of three (each a link, Chapter 5), one block of a row to touch, one path out of a crossroads.
  Look-alike blocks make the doors match (Chapter 2), and a counter can count a run of right
  answers before the last gate opens (Chapter 4).</p>
  ${tip('Test it without the paper.', 'Play the puzzle once with the wheel in a drawer. If it is only slower, it is fair. If it is impossible, add a way round: a longer road, or a hint in the level for players who look hard.')}
  ${INSTALL_LESSON}
  <h2>Make it a keepsake</h2>
  <p>Write every piece in the world’s own voice: the king’s seal on the map, a stamp on the
  sheet, a note from the hero’s friend tucked into the manual. Long after the last level, the
  paper is what stays on the shelf.</p>`,
};
