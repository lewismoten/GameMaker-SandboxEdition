// The Ultimate Owner's Guide, chapter 16's ideas to try: designs the clock and the ceilings
// (limitsClock.ts) leave room for, none of them shipped yet, each told as something to test in
// DOSBox first. Built only on the facts limitsClock.ts checks against code/GM, plus a sequence's
// own sound slot (PLAYGAME.C 2403, 4410), the song starting over with each scene (chapter 8) and
// RECLEN (216). From the instrument-game research (.for-lewis/ideas/instrument-game.md).
export const LIMIT_IDEAS = `<h2>Ideas the limits leave room for</h2>
  <p>No Sandbox game has shipped these yet. Each one rests on the clock and the ceilings above,
  and each is worth a test level in DOSBox before a whole game leans on it.</p>
  <ul>
    <li><b>A beat on whole ticks.</b> Choose a tempo whose beat is a whole number of game ticks:
    6 ticks is about 182 beats a minute, 8 is 136½, 12 is 91 and 16 is about 68. At eight song
    ticks to the game tick, an 8-tick beat is 64 ticks of the song. Blocks, births and lifetimes
    then land on the beat, every time.</li>
    <li><b>Let the picture judge.</b> A note block whose ring is worth points only while it is
    lit scores a touch made in time and nothing otherwise. Give the lit part at least two ticks,
    better three, since a press can arrive a tick late. Make what the player sees the cue, keep
    the music soft-edged (held chords, not one hard downbeat to hit), and start with a bar that
    doesn’t count.</li>
    <li><b>A key for each line of a staff.</b> A frame that fires a monster places it a number
    of rows from the hero set by the frame’s up-and-down move, and doesn’t move him. So each of
    several keys can fire into its own row, and since every sequence has a sound slot of its
    own, each key can sound its own note as well.</li>
    <li><b>A chord is a channel per note.</b> With six melody voices beside the drums, a
    three-note chord leaves three for a tune, a bass and one more. For a stab under the FM band,
    try a speaker tune that hops between three pitches over its 36 steps.</li>
    <li><b>Three layers at once.</b> The song, a speaker part and a voice clip can all sound
    together: a beeper riff over the band, and a sung word at the moment that matters.</li>
    <li><b>One phrase per scene.</b> A song starts over with every scene and every death, so a
    long piece can be a chain of short scenes, each with its own phrase, passed along by doors
    on a clock (Chapter 17, “Doors on a clock”). Leave a breath at the end of each phrase for
    the fade.</li>
    <li><b>A hero who keeps time.</b> Give every sequence, standing included, the same move each
    tick, and the hero crosses the map at a fixed number of blocks a beat: a playhead running
    over a score drawn in blocks.</li>
    <li><b>A demo that plays itself.</b> Record a clean run of a timing level and it plays
    under the title on its own, as long as it fits in 1,000 key changes.</li>
  </ul>`;
