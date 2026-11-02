// The Ultimate Owner's Guide, chapter 16's clock and ceilings: the one timer under the game
// clock, the music and the speaker, how keys meet it, and each file's hard caps. Checked against
// code/GM: FastTimer sets the PIT to 65535/8 and NewTimer bumps TimerCounter on every eighth
// interrupt, steps the speaker one of NUMFREQ (36) frequencies and calls PlayIt on every one
// (PLAYGAME.C 4421-4445, 4617-4623); the play loop acts only when TimerCounter has moved and
// applies pending keys there, holding them while an uninterruptible sequence is past its first
// frame (1453-1490); SimKeyPress ignores a key already down (4454); loadscene starts the song
// (4288) before playscene draws and fades the map and sets the clocks (1397-1404); touches read
// the block a cell is showing (blkmap, 3789-3799); a fire frame births its monster at the hero's
// row plus frame y / 20 - 1 (2441-2443); DoSound plays a slot's .VOC or else its speaker tune
// (4591-4607); caps from BLOC.H, MON.H, MAP.H, CHAR.H, SOUND.H, GRATOR.H and RECLEN (216).
export const CLOCK_LIMITS = `<h2>One clock under everything</h2>
  <p>PLAYGAME speeds up the PC’s timer chip eight times over, to about 146 beats a second.
  Every beat plays the next bit of the song and the next step of a speaker sound. Every
  eighth beat is a <b>game tick</b>, about 18 a second, or 55 thousandths of a second each:
  the hero, the monsters, block animations, birth times and lifetimes all move on those. So a
  game tick is exactly eight ticks of the song, and the two never drift apart while a scene
  plays.</p>
  <ul>
    <li><b>Keys count on ticks.</b> A press waits for the next tick, so a player can be up to one
    tick late without knowing it. A key held down is not pressed again; whether its sequence goes
    on repeating is the sequence’s own setting (Chapter 15, “A tap is not a hold”).</li>
    <li><b>Jumps hold the keys back.</b> While a sequence that can’t be interrupted is past its
    first frame, new presses wait their turn until it ends.</li>
    <li><b>A touch sees the picture showing.</b> When the hero touches an animated block, he gets
    the settings of the frame on the screen at that tick, not of the block you placed. Points,
    hurts, counters and refusals can all change from one frame of a ring to the next.</li>
    <li><b>The song starts first.</b> A scene’s song begins before its map is drawn and faded in,
    and the game clock starts after the fade. The music and the blocks may sit a few ticks apart,
    by an amount that depends on the PC. Anything you want judged to the tick, judge with blocks,
    births and lifetimes, never by ear, and play it in DOSBox before you build on it.</li>
  </ul>
  <h2>Every file’s ceiling</h2>
  <table>
    <tr><th>Part</th><th>The most PLAYGAME takes</th></tr>
    <tr><td>Background blocks (<code>.BBL</code>)</td><td>150 a set, 20 × 20 pixels</td></tr>
    <tr><td>Monster and character blocks</td><td>100 (<code>.MBL</code>), 50 (<code>.CBL</code>)</td></tr>
    <tr><td>Monster kinds (<code>.MON</code>)</td><td>64, each with 20 pictures that play and a path of 10 corners</td></tr>
    <tr><td>A map</td><td>100 × 100 cells that wrap both ways, 200 monsters, 50 of them drawn</td></tr>
    <tr><td>The hero (<code>.CHR</code>)</td><td>20 sequences of 10 frames, 10 things carried, 11 pixels a tick at most</td></tr>
    <tr><td>A scene</td><td>20 links out</td></tr>
    <tr><td>Sounds (<code>.SND</code>)</td><td>30 slots; a speaker tune is 36 steps, a quarter of a second</td></tr>
    <tr><td>Voice clips (<code>.VOC</code>)</td><td>one playing at a time, each under 64 KB</td></tr>
    <tr><td>Songs (<code>.CMF</code>)</td><td>146 ticks a second; nine voices, or six and the drums</td></tr>
    <tr><td>Text pages</td><td>16 lines of 30 characters</td></tr>
    <tr><td>A demo (<code>.REC</code>)</td><td>1,000 key changes</td></tr>
  </table>
  <p>Three sounds can play at once: the song, one speaker tune and one voice clip. A new speaker
  tune replaces the one sounding, and a new clip cuts off the last clip.</p>`;
