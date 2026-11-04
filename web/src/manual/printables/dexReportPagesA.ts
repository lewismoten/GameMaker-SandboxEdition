// Dex's report, cover and pages 1 to 6: the question, how telephones work, dial tone, pulse dialing, touch-tones, the parts list.
import { ARROW, BOX, L, P, PL, RECT, SINE, T, WAVE, moon, sparky } from './dexReportArt';
import { ins, photo, red, type DrPage } from './dexReportParts';
import frontUrl from './dexReport/board-front.png';

const TAU = 2 * Math.PI;

const cover = `
<p class="big" style="font-size:4.6cqw">SCIENCE FAIR PROJECT &middot; MOON SCHOOL</p>
<h1 class="dr-title">THE POCKET<br>TELEPHONE</h1>
<p style="font-size:4.6cqw;margin-top:3cqw">How to build a phone that fits in your pocket<br>(and why it works)</p>
<div class="dr-card">
  by <b>DEX DYNAMO</b>, age 11<br>
  Hover Heights<br>
  Science Fair: 3:00 PM (on the Moon)<br>
  <i>20 pages! With diagrams!</i>
</div>
${photo(frontUrl, 'The front of the finished phone board: two red displays, the dial, the speaker and four buttons.', { width: 26, rot: 4, style: 'position:absolute;left:9cqw;bottom:7cqw' }, [])}
<svg class="dr-sk" style="position:absolute;left:40cqw;bottom:5cqw;width:30cqw;height:auto" viewBox="0 0 12 9" role="img" aria-label="Doodle of Sparky and the Moon">
  <g filter="url(#dr-rough)">${sparky(2, 3, 1.1)}${moon(10, 2.2, 1.5)}</g></svg>
<span class="dr-sticker" style="position:absolute;right:7cqw;bottom:14cqw"><span>A-<small>NICE WORK</small></span></span>
<p class="dr-red" style="position:absolute;left:40cqw;bottom:34cqw;max-width:36cqw;color:#c0242b;font-size:3.4cqw;line-height:3.2cqw;transform:rotate(-4deg);border:.3cqw solid #c0242b;border-radius:50%/40%;padding:.8cqw 1.6cqw">Impressive! See me about the bite marks.</p>
<i class="bite" aria-hidden="true"></i>`;

// the dial tone: two sine waves and their sum, 20 milliseconds of each
const dialTone = ins(
  28,
  15,
  'Graph of a 350 hertz wave, a 440 hertz wave, and the two added together',
  [
    T(0.5, 1.4, '350 Hz', 0.9, 'start', 'cb'),
    WAVE(4, 2.5, 22, (t) => 1.1 * Math.sin(TAU * 7 * t), 'cb'),
    T(0.5, 6.4, '440 Hz', 0.9, 'start', 'cg'),
    WAVE(4, 7.5, 22, (t) => 1.1 * Math.sin(TAU * 8.8 * t), 'cg'),
    T(0.5, 11.4, 'both', 0.9, 'start', 'cr'),
    WAVE(4, 12.5, 22, (t) => 0.7 * (Math.sin(TAU * 7 * t) + Math.sin(TAU * 8.8 * t)), 'cr'),
    L(4, 14.6, 26, 14.6),
    L(4, 14.35, 4, 14.85),
    L(26, 14.35, 26, 14.85),
    T(15, 14.4, '', 0.7),
    T(26.7, 14.9, '20 ms', 0.8),
  ].join(''),
  { width: 66, rot: -0.8, caption: 'Two notes at once = dial tone', style: 'margin:2cqw 0 5cqw 2cqw' },
);

// a wired telephone: voice in, electricity along the wire, voice out
const wirePhone = ins(
  26,
  10,
  'Two telephones joined by a wire: the microphone turns voice into changing electricity, the speaker turns it back',
  [
    BOX(0.5, 3, 6, 4, 'mic', 0.9),
    BOX(19.5, 3, 6, 4, 'speaker', 0.9),
    L(6.5, 4, 19.5, 4),
    L(6.5, 6, 19.5, 6),
    ARROW(10, 2.4, 16, 2.4, 'cr'),
    T(13, 1.7, 'wiggly electricity', 0.85, 'middle', 'cr'),
    T(3.5, 8.8, 'voice in', 0.85, 'middle'),
    T(22.5, 8.8, 'voice out', 0.85, 'middle'),
    SINE(9, 5, 8, 0.45, 3, 'cb'),
  ].join(''),
  { width: 62, rot: 0.6, caption: 'The old way (a wire)', style: 'margin:1.5cqw 0 4cqw 4cqw' },
);

const p1 = `
<h2>The Question</h2>
<div class="gap"></div>
<p>Telephones are BIG. Our old hall phone weighs more than Sparky's food bowl. Every phone booth is a whole booth!</p>
<p><b>Can a real working telephone be so small you can carry it in your pocket?</b></p>
<div class="gap"></div>
<h3>Hypothesis (my guess)</h3>
<p>If I use <b>one tiny computer chip</b> for the brain, <b>one chip</b> to listen for the number tones, and a <b>beam of invisible light</b> instead of a wire, then two pocket phones will send numbers (and maybe voices) to each other with no wire at all.</p>
<div class="gap"></div>
<h3>What I change / what stays the same</h3>
<ul>
<li>I change: wire &rarr; infrared light</li>
<li>Same: the numbers (touch-tones) and the dial</li>
<li>Same: you press TALK and speak</li>
</ul>
<div class="gap"></div>
<h3>What is in this report</h3>
<p>1 Question &middot; 2-4 Research (dial tone, dial, touch-tones) &middot; 5-6 Materials &middot; 7-10 How it works &middot; 11-12 The display &middot; 13-14 Building it &middot; 15-17 Programming (the hard part) &middot; 18 Results &middot; 19 Conclusion &middot; 20 Thanks</p>
${red('Clear question! Good hypothesis: it can be tested.', 'margin:2.5cqw 0 0 34cqw')}
<svg class="dr-sk dr-note" style="right:7cqw;bottom:11cqw;width:22cqw;height:12cqw" viewBox="0 0 12 6" role="img" aria-label="Doodle of Sparky"><g filter="url(#dr-rough)">${sparky(4, 1.6, 1)}</g></svg>
<p class="dr-note ghost" style="left:16cqw;top:117cqw;transform:rotate(-2deg)">my phone will be the best!!</p>`;

const p2 = `
<h2>How a Telephone Works</h2>
<p>Your voice is air wiggling. The <b>microphone</b> turns the wiggles into wiggly <b>electricity</b>. The wire carries it. The <b>speaker</b> at the other end turns it back into wiggling air. That is it! Everything else is for finding the right person.</p>
${wirePhone}
<h3>Dial tone</h3>
<p>Lift the handset and you hear the dial tone. It is <b>two notes at the same time</b>: <b>350 Hz</b> and <b>440 Hz</b>. (Hz = hertz = wiggles per second. 350 Hz is 350 wiggles every second.) It says: "I am ready, go ahead and dial."</p>
${dialTone}
<p class="ghost" style="margin-top:1cqw">(is 440 the same as a tuning fork A? yes!)</p>
${red('Good. Why two notes and not one?', 'margin:1.5cqw 2cqw 0 auto')}
<p style="position:absolute;right:6cqw;top:74cqw;max-width:26cqw;transform:rotate(1.5deg)" class="bl">Answer: so a person humming can not fake it. (I think.)</p>`;

// pulse dialing: the loop opens (break) 60 ms and closes (make) 40 ms for each pulse
const pulseTrace = (() => {
  const x0 = 6;
  const per = 3; // cells per pulse: 100 ms
  const pts: number[] = [x0, 2.6];
  for (let k = 0; k < 3; k++) {
    const a = x0 + 2 + k * per;
    pts.push(a, 2.6, a, 5.4, a + 1.8, 5.4, a + 1.8, 2.6, a + 3, 2.6);
  }
  pts.push(x0 + 2 + 9 + 2, 2.6);
  return [
    T(0.4, 3.1, 'wire', 0.8),
    T(0.4, 3.9, 'on/off', 0.8),
    PL(pts, 'cb'),
    PL([x0, 8.2, x0 + 2, 8.2, x0 + 2, 10, x0 + 13, 10, x0 + 13, 8.2, x0 + 15, 8.2], 'cg'),
    T(0.4, 9, 'off-normal', 0.8),
    L(x0 + 2, 6.6, x0 + 2, 11.2, 'faint'),
    L(x0 + 5, 6.6, x0 + 5, 11.2, 'faint'),
    L(x0 + 8, 6.6, x0 + 8, 11.2, 'faint'),
    L(x0 + 11, 6.6, x0 + 11, 11.2, 'faint'),
    ARROW(x0 + 2, 12.3, x0 + 5, 12.3),
    ARROW(x0 + 5, 12.3, x0 + 2, 12.3),
    T(x0 + 3.5, 13.2, '100 ms', 0.8, 'middle'),
    T(x0 + 3, 1.7, 'open 60', 0.8, 'middle', 'cb'),
    T(x0 + 4.7, 1.7, '', 0.8),
    T(x0 + 9.5, 1.7, 'closed 40', 0.8, 'middle', 'cb'),
    T(x0 + 7, 14.8, 'digit 3 = three pulses', 0.95, 'middle', 'cr'),
  ].join('');
})();

const p3 = `
<h2>Pulse Dialing</h2>
<p>Before touch-tones, phones had a <b>rotary dial</b>. You stick a finger in a hole, turn it to the stop, and let go. A spring spins it home, and a little switch <b>clicks the wire on and off</b>, once for each number. Dial a 3: click click click. Dial a 0: ten clicks.</p>
<p>The clicks go at <b>10 per second</b>, so one click takes 100 milliseconds. About <b>60 of those are "break"</b> (wire open) and about <b>40 are "make"</b> (wire closed). A second switch (<b>off-normal</b>) is closed any time the dial is away from rest. It tells the phone "numbers are coming, count!"</p>
${ins(28, 16, 'Timing chart of dial pulses: three pulses of 60 milliseconds open and 40 closed for the digit 3, with the off-normal switch closed during them', pulseTrace, { width: 78, rot: 0.5, caption: 'Timing chart for the digit 3', style: 'margin:2cqw 0 5cqw 0' })}
<h3>In MY phone</h3>
<p>I did not want a loop of wire. Two tiny push switches sit under the dial. The dial's bumps press <b>PULSE</b> once per number and <b>OFF NORMAL</b> the whole time. The brain counts pulses. If it counts <b>10</b> it shows <b>0</b>. If it counts more than 10, it ignores it.</p>
<p>Switches <b>bounce</b> (they chatter, like a ball) so the brain waits about <b>1 thousandth of a second</b> for PULSE and about <b>15 thousandths</b> for OFF NORMAL before it believes them.</p>
${red('Nice timing chart. Does everybody dial at the same speed?', 'margin:1cqw 0 0 40cqw')}`;

// the DTMF grid: rows 697 770 852 941, columns 1209 1336 1477 1633
const dtmfGrid = (() => {
  const keys = [
    ['1', '2', '3', 'A'],
    ['4', '5', '6', 'B'],
    ['7', '8', '9', 'C'],
    ['*', '0', '#', 'D'],
  ];
  const rows = ['697', '770', '852', '941'];
  const cols = ['1209', '1336', '1477', '1633'];
  let s = '';
  for (let i = 0; i <= 4; i++) s += L(6, 3 + i * 3, 22, 3 + i * 3) + L(6 + i * 4, 3, 6 + i * 4, 15);
  cols.forEach((c, i) => (s += T(8 + i * 4, 2.3, c, 0.85, 'middle', 'cb')));
  rows.forEach((r, i) => (s += T(5.5, 4.8 + i * 3, r, 0.85, 'end', 'cg')));
  keys.forEach((row, y) => row.forEach((k, x) => (s += T(8 + x * 4, 5 + y * 3, k, 1.5, 'middle', k === '5' ? 'cr' : ''))));
  s += P('M10.1 6.6a1.8 1.5 0 1 0 .1.1', 'cr');
  s += T(0.5, 1.4, 'Hz', 0.85, 'start', 'cb');
  s += ARROW(15, 17.2, 10.2, 8.6, 'cr') + T(15.4, 17.6, 'a 5 is 770 + 1336', 0.95, 'start', 'cr');
  s += T(22.4, 14.8, 'no phone', 0.8) + T(22.4, 15.6, 'has these', 0.8);
  return s;
})();

const p4 = `
<h2>Touch-Tones (DTMF)</h2>
<p>Push-button phones do not click. Each button makes <b>two tones at once</b>: one for its ROW and one for its COLUMN. The name is <b>Dual-Tone Multi-Frequency</b>, DTMF. Pressing <b>5</b> makes 770 Hz and 1336 Hz together.</p>
<p>Why two? One note can happen by accident (a whistle, a truck). A <b>pair of exact notes</b> almost never does.</p>
${ins(28, 19, 'Table of touch-tone keys: rows are 697, 770, 852 and 941 hertz, columns are 1209, 1336, 1477 and 1633 hertz', dtmfGrid, { width: 80, rot: -0.7, caption: 'The 16 buttons. Rows low, columns high.', style: 'margin:2cqw 0 5cqw 0' })}
<p>The 4th column (1633 Hz) has the letters <b>A B C D</b>. No phone I have seen has those buttons, but my decoder chip knows all <b>16</b>, so it can hear them anyway.</p>
<h3>Why my phone needs a decoder</h3>
<p>Sending is easy: the brain makes the two tones. <b>Listening</b> is hard. The CM8870 chip does it: it hears a tone pair and tells the brain <b>which button</b>, using 4 wires (a number from 0 to 15 in <b>binary</b>) and a flag wire called <b>StD</b> that means "I heard something!"</p>
${red('Excellent! (Source for the frequencies?)', 'margin:1.5cqw 2cqw 0 auto')}
`;

// materials: the brain and ears chips drawn as little DIP icons
const dip = (x: number, y: number, label: string, pins = 4): string =>
  RECT(x, y, 2.6, pins * 0.9 + 0.8) + P(`M${x + 1.1} ${y}a.2.2 0 0 0 .4 0`) + T(x + 3.2, y + (pins * 0.9 + 0.8) / 2 + 0.3, label, 0.8);

const p5 = `
<h2>Materials (1)</h2>
<p><i>the clever parts</i> &mdash; real parts you can buy. 65 parts in all.</p>
<table class="tight">
<tr><th>PART</th><th class="n">#</th><th>WHAT IT DOES (my words)</th></tr>
<tr><td><b>PIC16F628A</b><br>the BRAIN</td><td class="n">1</td><td>A whole tiny computer on a chip, 18 legs. Holds my program, counts the dial clicks, makes the tones, and tells the display what to show.</td></tr>
<tr><td><b>CM8870</b><br>the EARS</td><td class="n">1</td><td>Listens for a pair of tones and says which button (4 wires + the StD flag).</td></tr>
<tr><td><b>MAX7219</b> (a copy)<br>DISPLAY BOSS</td><td class="n">1</td><td>Runs all 8 digits by itself, so the brain only needs <b>3 wires</b>.</td></tr>
<tr><td><b>LM358</b></td><td class="n">1</td><td>Two amplifiers in one chip: one makes my voice bigger (x47), one makes the light signal bigger (x21).</td></tr>
<tr><td><b>LM386</b></td><td class="n">1</td><td>The loud amplifier that drives the speaker.</td></tr>
<tr><td><b>Crystal 3.579545 MHz</b></td><td class="n">1</td><td>A tiny quartz clock that rings 3,579,545 times a second. It is the same one color TVs use, so it is easy to get. It keeps the decoder in tune <b>and</b> runs the brain!</td></tr>
<tr><td><b>Electret mic</b></td><td class="n">1</td><td>Listens to my voice.</td></tr>
<tr><td><b>Speaker</b> 8 ohm, 28 mm</td><td class="n">1</td><td>Makes the sound.</td></tr>
</table>
<p class="ghost" style="margin-top:1cqw">(MHz = million wiggles a second. Does the quartz really wiggle? YES.)</p>
<svg class="dr-sk" style="width:60cqw;height:12cqw;margin-top:1cqw" viewBox="0 0 24 5" role="img" aria-label="Little drawings of chips with a notch at pin 1"><g filter="url(#dr-rough)">${dip(0.5, 0.3, 'pin 1 = notch', 3)}${dip(12, 0.3, 'square pad = pin 1', 3)}</g></svg>
${red('Great list!', 'margin:1.5cqw 2cqw 0 auto')}`;

const p6 = `
<h2>Materials (2)</h2>
<table class="tight">
<tr><th>PART</th><th class="n">#</th><th>WHAT IT DOES</th></tr>
<tr><td><b>MCP1702</b> 5 V regulator</td><td class="n">1</td><td>Turns 4 batteries (about 6 volts) into a steady <b>5.0 V</b> for every chip.</td></tr>
<tr><td><b>2N3904</b> transistor</td><td class="n">2</td><td>A switch run by electricity. One drives the IR light, one mutes the receiver while I talk.</td></tr>
<tr><td><b>IR LED</b> (940 nm)</td><td class="n">1</td><td>The invisible light beam. <b>Your eyes can't see it.</b> A TV remote uses one.</td></tr>
<tr><td><b>IR photodiode</b></td><td class="n">1</td><td>Catches the beam and makes a tiny signal.</td></tr>
<tr><td><b>4-digit red display</b></td><td class="n">2</td><td>8 digits in all, each made of 7 little LED lines plus a dot.</td></tr>
<tr><td><b>Push switches</b> 6 mm</td><td class="n">4</td><td>PULSE, OFF NORMAL (under the dial), TALK, CLEAR.</td></tr>
<tr><td><b>4 x AAA</b> holder</td><td class="n">1</td><td>The power, with a cover and an ON/OFF switch.</td></tr>
<tr><td><b>Resistors</b></td><td class="n">25</td><td>Hold back the electricity. Only 7 kinds: 100, 1k, 4.7k, 10k, 47k, 100k, 470k ohms.</td></tr>
<tr><td><b>Capacitors</b></td><td class="n">19</td><td>Tiny batteries that smooth things out. 4 kinds: 100 nF, 1 uF, 10 uF, 100 uF.</td></tr>
<tr><td><b>Sockets</b> 18 pin</td><td class="n">2</td><td>For the brain and the ears, so they can come out.</td></tr>
<tr><td><b>6-pin header</b></td><td class="n">1</td><td>Where the programmer plugs in (page 17).</td></tr>
<tr><td><b>The board</b></td><td class="n">1</td><td>99 x 99 mm (about 4 inches square). It has everything printed on it.</td></tr>
</table>
<h3>Tools</h3>
<p>Soldering iron (<b>ask Grandpa to watch</b>), thin solder, cutters, a meter, four AAA batteries. To program: an Arduino Nano and 6 wires.</p>
${red('Do not put the batteries in backwards!', 'margin:1cqw 0 0 42cqw')}
<p class="dr-note ghost" style="left:16cqw;bottom:13cqw">(the board looks like a little city from above)</p>`;

export const pagesA: DrPage[] = [
  { paper: 'cover', body: cover },
  { paper: 'lined', body: p1 },
  { paper: 'lined', body: p2 },
  { paper: 'lined', body: p3 },
  { paper: 'lined', body: p4 },
  { paper: 'lined', body: p5 },
  { paper: 'lined', body: p6 },
];
