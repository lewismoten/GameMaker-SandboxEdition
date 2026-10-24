// The Ultimate Owner's Guide, chapters 6 to 8: sound sets, digitized voice and FM music.
// Checked against PLAYGAME and SBMUSIC (code/GM), web/src/engine/touch.ts, web/src/audio
// (cmfPlayer.ts, oplPresets.ts, sfxSynth.ts) and the games' kit (games/kit/songFx.ts, song/cutclips.py).
import { opening, tip, type Chapter } from './chapter';

export const SOUND_SETS: Chapter = {
  id: 'sounds',
  title: 'The Sound Set, Slot by Slot',
  head: '6. Sound Sets',
  html: `${opening(6, 'The Sound Set, Slot by Slot', 'A sound set (.SND) holds 30 sounds. Knowing which event plays which slot is the difference between a game that chirps at random and one that talks to the player.')}
  <h2>Two sounds in every slot</h2>
  <p>Each slot holds a PC speaker tune, 36 steps of 1/146 of a second (about a quarter of a
  second), and, if you like, the name of a Sound Blaster <code>.VOC</code> file. With a Sound
  Blaster, a slot that names a <code>.VOC</code> plays it; otherwise the speaker tune plays.
  Players without a card hear only the speaker, so fill in both.</p>
  <h2>A block can’t choose its sound</h2>
  <p>There is no “sound” setting on a block. The first nine slots belong to events, and
  PLAYGAME picks the slot by what the touch did:</p>
  <table>
    <tr><th>Slot</th><th>Plays when</th></tr>
    <tr><td>0</td><td>a touch adds hit points</td></tr>
    <tr><td>1</td><td>the hero’s shot kills a monster, or a weak monster touches him and makes no other sound</td></tr>
    <tr><td>2 / 3</td><td>money goes up / down</td></tr>
    <tr><td>4</td><td>an extra life</td></tr>
    <tr><td>5 / 6</td><td>the score goes up / down</td></tr>
    <tr><td>7 / 8</td><td>any other counter goes up / down</td></tr>
    <tr><td>9–29</td><td>only when a character sequence names them</td></tr>
  </table>
  <p>Being hurt plays the Hurt sequence’s own sound, and dying the Die sequence’s, so those
  come from slots you choose. One touch makes one sound: an extra life wins over everything;
  otherwise hit points come first, then money or a counter, then the score. A coin that adds
  money and points plays the money sound only.</p>
  <h2>Choosing sounds by choosing counters</h2>
  <p>Since the counter decides the sound, pick counters with your ears. Third Goat from the
  Left counts wool in a special counter, so every tuft plays slot 7, a bleat of joy. And
  because each scene loads its own sound set, the same event can say something new in each
  place: there an extra life sings “Third goat from the left!” in the fields and town, and
  whispers “He sees you.” in the stable.</p>
  <h2>One voice at a time</h2>
  <p>The Sound Blaster plays one <code>.VOC</code> at a time, and a new one cuts off the one
  playing. The PC speaker is a separate voice. So a slot with no <code>.VOC</code> name is a
  <b>speaker-only</b> sound, and it never interrupts a voice clip.</p>
  <p>Use that on purpose. Give the sounds a player makes all the time (steps, hops, a buzz, a
  tick) only a speaker tune, and save the Sound Blaster for the lines that matter. A Fly Named
  Carl keeps its flying and buzzing on the speaker so they never cut off a lyric, and the tin
  heart that hides in the Sandbox games ticks only on the speaker for the same reason.</p>
  <h2>🎛 The sound effect maker</h2>
  <p>In the sound set editor, <b>🎛 Make one with the sound effect maker…</b> builds a
  <code>.VOC</code> for the slot you are on. Start from a preset (jump, coin, hurt, explosion,
  power-up, laser and more; each press gives a new take), roll 🎲 Random, or 🧬 Mutate the one
  you have. Then shape it with sliders: pitch, slide, a jump in pitch, vibrato, the attack, hold
  and decay, repeats and tone. It saves an 8-bit, 11&nbsp;kHz <code>.VOC</code>, names it in the
  slot, and can draw the same effect as the slot’s PC speaker steps, so players without a card
  hear it too. The sliders’ settings stay with the project’s editor notes, so the sound set and
  .VOC editors can reopen them later.</p>
  ${tip('Pro tip:', 'A player can turn sound effects off with <kbd>F4</kbd> and music with <kbd>F3</kbd>. Make sure nothing in your game can only be understood by ear.')}`,
};

export const VOICE: Chapter = {
  id: 'voice',
  title: 'Digitized Voice',
  head: '7. Voice',
  html: `${opening(7, 'Digitized Voice', 'Nothing sells a moment like a real voice: a cheer, a gasp, a line of a song. A few short clips, used well, go further than a dozen used everywhere.')}
  <h2>The clip’s size is the limit</h2>
  <p>A <code>.VOC</code> is 8-bit sound, one channel, at a rate you choose. PLAYGAME reads the
  whole file with a byte count that stops at 65,535, so on a real PC a bigger file plays wrong.
  The Sandbox and Bard games keep every clip under 40,000 bytes to be safe:</p>
  <table>
    <tr><th>Rate</th><th>Sounds like</th><th>Longest clip in 40,000 bytes</th></tr>
    <tr><td>11,025 Hz</td><td>clear speech and singing</td><td>about 3.6 seconds</td></tr>
    <tr><td>8,000 Hz</td><td>a telephone: fine for longer lines</td><td>about 4.9 seconds</td></tr>
  </table>
  <h2>Recording and trimming</h2>
  <ul>
    <li>Record close to the microphone in a quiet room, and say the line a few ways.</li>
    <li>Trim the silence at both ends right up to the voice. Dead air at the start makes the
    sound feel late; at the end it only wastes bytes.</li>
    <li>Give each end a very short fade so it doesn’t click, and bring the level up until the
    loudest part is nearly full scale. Eight bits are noisy when quiet.</li>
    <li>Cut on a breath or a pause, never mid-word.</li>
  </ul>
  <p>In this edition the sample editor selects and trims, inserts a pause, records from the
  microphone, and saves 8-bit sound at the clip’s own rate, the way the Sound Blaster plays it.</p>
  <h2>Story beats</h2>
  <p>Put voice where the story turns: an extra life, a gate that opens, a goal reached, a
  boss’s first appearance. The Bard of Bizarre games cut their clips from the song itself, so
  the hook line plays when you earn a life and the big moments get their lyrics.</p>
  <h2>Timing</h2>
  <ul>
    <li>A clip that starts as a level opens is cut by the next digital sound. Leave the first
    second or so quiet (Chapter 5).</li>
    <li>A clip at a gate needs a walk-off before the next link (Chapter 5).</li>
    <li>A clip on a sequence the player can start again before it ends cuts itself off; keep
    the sounds of repeatable moves short.</li>
  </ul>
  <p>The Sandbox and Bard games are checked with a tool that plays the whole walkthrough, writes down every
  clip, and complains about any that is cut off before its end. Your own version of that is
  simple: play your game through with the sound up and listen to the end of every line.</p>`,
};

export const MUSIC: Chapter = {
  id: 'music',
  title: 'FM Music on the OPL2',
  head: '8. Music',
  html: `${opening(8, 'FM Music on the OPL2', 'The Sound Blaster’s music comes from a little FM synthesizer chip, the OPL2. It has nine voices, two “operators” each, and more tricks than its size suggests.')}
  <h2>What PLAYGAME plays</h2>
  <ul>
    <li>Songs are Creative Music Files (<code>.CMF</code>) timed at Game-Maker’s own 146 ticks a
    second. A file made for another clock stays silent.</li>
    <li>Each MIDI channel drives one FM voice and plays <b>one note at a time</b>. A chord takes
    a channel per note.</li>
    <li><b>Melody mode</b> has nine voices on channels 0–8. <b>Rhythm mode</b>, switched on with
    controller <code>0x67</code>, has six voices on channels 0–5 plus a drum kit on channels 11–15:
    bass drum, snare, tom-tom, cymbal and hi-hat. The bass drum takes a whole voice; the snare
    and hi-hat share one voice’s pitch, and the tom-tom and cymbal share another’s.</li>
    <li>Pitch bend and transpose are ignored. Velocity is honored: it scales the instrument’s
    loudness.</li>
    <li>At the end of the song it starts over at once. A song loops cleanly if its last bar
    leads back into its first.</li>
    <li>The tempo is written into the timing of every note, so a song that speeds up is simply
    written faster.</li>
  </ul>
  <h2>When music starts over</h2>
  <p>Every scene starts its song from the top: when the scene begins, and again every time the
  hero dies and the scene restarts. The title song plays under the title, the menu song comes
  back after each game, and the storyline has a song of its own. Write level songs whose first
  bars can stand being heard often.</p>
  <h2>Patches</h2>
  <p>An instrument is 11 bytes: two operators and how they connect. The <i>modulator</i> bends
  the <i>carrier</i>, the one you hear, and the more it bends the brighter the sound. The
  music editor’s instrument list writes them in a short shorthand: <code>x</code> the frequency
  multiple, <code>tl</code> the level (0 loudest, 63 silent), <code>ar dr sl rr</code> the attack,
  decay, sustain level and release, <code>hold</code> to hold while the key is down, <code>w</code>
  the waveform, <code>vib trem</code> the chip’s vibrato and tremolo, <code>fb</code> feedback, and
  <code>add</code> to hear both operators side by side. A few from the list:</p>
  <table class="ug-patches">
    <tr><th>Instrument</th><th>Modulator / carrier / voice</th></tr>
    <tr><td><b>Square Lead</b><br><small>a modulator at twice the pitch leaves only odd harmonics: hollow, like a square wave or a clarinet</small></td><td><code>x2 tl24 ar15 dr0 sl0 rr5 hold</code><br><code>x1 ar15 dr0 sl0 rr5 hold</code><br><code>fb0</code></td></tr>
    <tr><td><b>Pipe Organ</b><br><small>both operators heard: two pipes an octave apart</small></td><td><code>x2 tl8 ar9 dr0 sl0 rr5 hold</code><br><code>x1 ar8 dr0 sl0 rr5 hold</code><br><code>fb2 add</code></td></tr>
    <tr><td><b>Tubular Bells</b><br><small>a 2 : 7 ratio is out of tune with itself, which is what makes a bell clang</small></td><td><code>x7 tl30 ar15 dr3 sl4 rr3</code><br><code>x2 ar15 dr2 sl3 rr3</code><br><code>fb0</code></td></tr>
    <tr><td><b>Vocal “Aah”</b><br><small>a slow attack and vibrato on both operators: the games’ singing voice</small></td><td><code>x2 tl29 ar6 dr4 sl1 rr6 hold vib</code><br><code>x1 ar7 dr5 sl1 rr7 hold vib</code><br><code>fb6</code></td></tr>
    <tr><td><b>Deep Sub-Bass</b><br><small>a quiet modulator leaves a nearly pure, deep tone that holds</small></td><td><code>x1 tl44 ar15 dr4 sl6 rr6</code><br><code>x1 ar15 dr1 sl1 rr6 hold</code><br><code>fb0</code></td></tr>
  </table>
  <h2>Tricks that push a CMF</h2>
  <p>The Bard of Bizarre songs use these, all made of plain events that PLAYGAME understands:</p>
  <ul>
    <li><b>Swells and sweeps.</b> A program change loads a new instrument even under a held note,
    and a song can carry up to 128 instruments. Step through copies of one patch that differ
    only in level and a held chord swells, or brightens like a filter opening.</li>
    <li><b>A seventh melodic voice.</b> In rhythm mode the bass drum is a full voice whose pitch
    follows its note, so with a long patch it plays a sub bass line. The tom-tom is tunable too.</li>
    <li><b>Chords on one channel.</b> A fast arpeggio sounds like a chord; a harp spreads its
    chord across several channels so each note rings out.</li>
    <li><b>Slides.</b> With no pitch bend, a glide is a quick run of semitone steps.</li>
    <li><b>A choir from two voices.</b> The same notes on two channels whose patches differ
    only in the vibrato setting beat against each other like a section.</li>
    <li><b>Echoes and dynamics.</b> The line again later and softer on another channel; a
    crescendo is a ramp of velocities.</li>
  </ul>`,
};
