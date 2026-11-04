// Dex's report, pages 13 to 20: building it, the programming attempts (the switch box that failed, the config
// word mistakes, the Nano that works), results, conclusion, bibliography and thanks.
import { ARROW, BOX, L, RECT, T, sparky, moon } from './dexReportArt';
import { gsk, ins, photo, red, type DrPage } from './dexReportParts';
import backUrl from './dexReport/board-back.png';

// ---- 13 and 14: building it
const p13 = `
<h2>Building It (1)</h2>
<p><b>Safety first:</b> the iron is hot enough to burn. Grandpa watches. Hair back. Open the window.</p>
<p>The board has the <b>boring parts on the back</b> and the <b>parts you touch on the front</b>. Back parts go in first and get soldered from the front. Front parts go in <b>last</b>.</p>
<ol>
<li><b>Check the board.</b> No two pads stuck together with copper.</li>
<li><b>Power first, and NO chips.</b> Solder the regulator (flat, find its marks G, I, O, because it is NOT in the same order as the big one!), C1 and C2 (the square pad is the <b>+</b>). Solder the battery leads (red = +). Switch on. The meter must read <b>5.0 V</b> (give or take 0.1) between the regulator OUT and GND. If not, <b>STOP</b>. <span class="x">keep going</span></li>
<li><b>Resistors and little capacitors</b>, shortest first. Then the electrolytics. Then the <b>two 18-pin sockets</b>. Pin 1 is the <b>square pad</b>.</li>
<li><b>Crystal</b>, the two transistors (flat side as drawn), then the LM358, LM386 and MAX7219 (notch toward pin 1). <b>Not</b> the brain or the ears yet.</li>
</ol>
<div class="gap"></div>
<p class="box" style="transform:rotate(-0.8deg)"><b>Why check 5 V first?</b> If something is wrong with the power, you find out before it can hurt the chips. A 5 V part given 6.4 V can cook. (4 new batteries = 6.4 V! That is why the regulator is there.)</p>
<div class="gap"></div>
${red('Good safety notes. Chips are cheaper than fingers.', 'margin:1cqw 0 0 36cqw')}
<svg class="dr-sk dr-note" style="left:17cqw;bottom:11cqw;width:15cqw;height:9cqw" viewBox="0 0 12 6" role="img" aria-label="Doodle of Sparky"><g filter="url(#dr-rough)">${sparky(4, 1.6, 1)}</g></svg>
<p class="dr-note ghost" style="right:9cqw;bottom:11cqw">stay back, Sparky!!</p>`;

const p14 = `
<h2>Building It (2)</h2>
${photo(
  backUrl,
  'The back of the board: the PIC, the decoder, the display driver, the amplifiers, the crystal, the regulator and the programming header, with pencil labels.',
  { width: 54, rot: -1.2, caption: 'the back (where the brains live)', style: 'float:right;margin:0 0 7cqw 3cqw' },
  [
    ['<-- BRAIN', 49, 80],
    ['EARS --', 15, 74],
    ['DISPLAY BOSS', 50, 30],
    ['5 V', 76, 85],
    ['crystal', 12, 66],
    ['J1', 32, 94],
  ],
)}
<ol start="5" style="margin-top:0">
<li><b>Program the brain</b> (pages 15-17) with the ears' socket <b>EMPTY</b>. Then the brain and ears go into their sockets.</li>
<li><b>Front: the two displays</b>, pin 1 at the bottom left of each. Power up: a <b>dash</b> at the left! If the display is blank, check the 10k resistor next to the display boss, and the 5 V.</li>
<li><b>TALK and CLEAR</b>, then the dial switches. Press CLEAR to restart. Make a dial by hand: hold OFF NORMAL, tap PULSE three times, let go: a <b>3</b> shows up.</li>
<li><b>Speaker and microphone</b> on short wires. A dialed digit should beep out of the speaker.</li>
<li><b>IR LED and photodiode last</b> (bend their legs 90 degrees so they face the top edge). Point two phones at each other and dial. The number should appear on BOTH.</li>
</ol>
<h3>Test after every step</h3>
<ul>
<li>[ ] 5.0 V at the regulator</li>
<li>[ ] dash on the display</li>
<li>[ ] hand-dial a 3: a 3 shows</li>
<li>[ ] a beep from the speaker</li>
<li>[ ] number shows on the OTHER phone</li>
</ul>
<p>If something is off, tune by ear: R18 and R19 (how well it hears), R20 (how loud), R9 (how bright the IR light is).</p>
${red('A test after each step. This is how real engineers work!', 'position:absolute;right:7cqw;bottom:12cqw;max-width:34cqw')}`;

// ---- 15: attempt 1, the switch box (graph)
const switchBoard = (() => {
  let s = RECT(0, 0, 28, 15, 'th') + T(14, 1.2, 'DEX MARK 1 HAND PROGRAMMER', 1, 'middle', 'cr');
  const word = [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1]; // 0x2805, bit 13 down to bit 0
  s += T(0.5, 2.6, 'WORD (to remember where I am):', 0.8);
  for (let i = 0; i < 14; i++) {
    const x = 1.9 + i * 1.85;
    s += RECT(x - 0.4, 4.2, 0.8, 1.4) + L(x, 4.9, x, word[i] ? 3.4 : 6.4, 'th') + T(x, 7.4, String(13 - i), 0.7, 'middle');
  }
  s += T(0.5, 8.6, '14 switches: bit 13 ... bit 0   (0x2805 = goto 5)', 0.8);
  // controls
  s += `<circle class="pn th" cx="5" cy="12" r="1.6"/>` + T(5, 14.5, 'CLOCK', 0.9, 'middle', 'cr');
  s += RECT(10.4, 11, 1.2, 2) + L(11, 12, 11, 10.4, 'th') + T(11, 14.5, 'DIN', 0.9, 'middle', 'cb');
  s += RECT(16.4, 11, 1.2, 2) + L(17, 12, 17, 13.6, 'th') + T(17, 14.5, 'Vpp', 0.9, 'middle', 'cg');
  s += `<circle class="pn" cx="22.6" cy="11.4" r=".7"/>` + `<circle class="pn" cx="25" cy="11.4" r=".7"/>` + T(22.6, 13.6, 'PGD', 0.75, 'middle') + T(25, 13.6, 'PGC', 0.75, 'middle');
  s += ARROW(7.6, 12, 9.6, 12) + T(8.6, 11.5, '', 0.7);
  return s;
})();

const p15 = `
<h2>Programming (1): Switches</h2>
<p>The brain is empty when you buy it. The program (<b>337 words</b>, the assembler said) has to be put in. My first idea: <b>do it by hand</b>, like the card computer in the library book, with toggle switches.</p>
${gsk(15, 'Drawing of a hand programmer: fourteen word switches, a clock push-button, a data switch, a Vpp switch and two lamps', switchBoard, 'margin-top:1cqw')}
<p style="margin-top:2cqw"><b>The chip wants one bit at a time.</b> Set DIN, press CLOCK. Each word is a 6-bit command (LOAD DATA) and then 16 bits (a 0, the 14 bits of the word, a 0).</p>
<p><b>My math:</b> 6 + 16 = <b>22</b> presses a word. x 337 = <span class="x">7,414</span> ... <b>wait!</b> I forgot BEGIN PROGRAMMING (6) and NEXT ADDRESS (6): <b>34</b> a word. x 337 = <b>11,458</b>. And the empty spaces (463 of them) still need NEXT ADDRESS, 6 each = <b>2,778</b> more. <b>14,236 presses!</b> At one a second that is <b>4 hours</b>, no mistakes, no sneezing.</p>
<p>I tried. I got to <b>word 41</b> (1,394 presses). I flipped DIN wrong somewhere. There is no way to see which bit.</p>
<p class="box"><b>Paper tape idea:</b> 337 words x 2 rows = 674 rows. 10 rows to the inch = <b>67 inches</b> (5 and a half feet!), about 2,400 holes with my hole punch. And I have no tape reader. <b>Out.</b></p>
<p class="rd" style="font-size:4.4cqw;transform:rotate(-2deg);margin-top:1.5cqw;color:#45474f">GAVE UP AT WORD 41.</p>
${red('Failure is data. What did you try next?', 'position:absolute;right:9cqw;bottom:11cqw;max-width:32cqw')}`;

// ---- 16: the config word troubles
const p16 = `
<h2>Programming (2): What Went Wrong</h2>
<p>A program is not enough. A chip also has a <b>configuration word</b>: settings like "which clock?" and "watchdog on?". It is stored with the program, at the very end, in the hex file as a line starting <b>:02400E00</b>. I got it wrong three ways.</p>
<h3>Try A: dead chip</h3>
<p>I left out the <b>__CONFIG</b> line. The chip kept its factory word, <b>0x3FFF</b> (line <b>:02400E00FF3F10</b>). That means "wait for a clock from a resistor". I had no resistor. <b>The chip did NOTHING.</b> No dash. Nothing.</p>
<h3>Try B: the wrong clock</h3>
<p>I copied a config line from another example: the chip's <b>built-in 4 MHz clock</b> (<b>0x3F30</b>, <b>:02400E00303F41</b>). It ran! But everything was <b>11.75% too fast</b>: 1,000,000 instructions a second, not 894,886. My 697 Hz tone came out at <b>779 Hz</b>. That is close enough to 770 that the decoder thinks it is a 770. And 1209 Hz came out near 1336. So <b>I dialed a 1 and the other phone showed a 5!!</b> (697 + 1209 turned into 770 + 1336, which is the button 5.) Funny. Not funny.</p>
<p>The crystal must run the chip: that is the <b>XT</b> setting.</p>
<h3>Try C: LVP left on</h3>
<p><b>LVP</b> = low-voltage programming. With it ON, the chip's pin RB4 is stuck being the "PGM" pin. But RB4 is where the ears' <b>Q1</b> wire comes in! Word <b>0x3FA1</b> (<b>:02400E00A13FD0</b>): odd numbers came out wrong, like a 5 showing up as a 4.</p>
<p class="box" style="transform:rotate(0.6deg)"><b>The right word is 0x3F21</b> (:02400E00213F50): XT clock, watchdog OFF, power-up timer ON, reset pin ON, brown-out OFF, <b>LVP OFF</b>, no code protection.</p>
<p><b>WARNING:</b> once LVP is off, the plain Nano can't program that chip again (it needs 12 to 13 volts). Get it right the first time, or use a new chip.</p>
${red('Great detective work with the hex lines!', 'position:absolute;right:7cqw;top:111cqw;max-width:30cqw')}`;

// ---- 17: the method that works
const nano = (() => {
  let s = BOX(0, 0.5, 8, 11, 'ARDUINO|NANO', 1);
  const rows: [string, string, string][] = [
    ['D6', 'MCLR', '1'],
    ['5V', '+5 V', '2'],
    ['GND', 'GND', '3'],
    ['D7', 'PGD', '4'],
    ['D8', 'PGC', '5'],
    ['D9', 'PGM', '6'],
  ];
  rows.forEach(([a], i) => {
    const y = 2.4 + i * 1.6;
    s += T(7.6, y + 0.3, a, 0.85, 'end') + L(8, y, 16, y, i === 1 ? 'cr' : i === 2 ? '' : 'cb');
  });
  s += RECT(16, 0.5, 8, 11) + T(20, 1.7, 'J1', 0.95, 'middle');
  rows.forEach(([, b, n], i) => {
    const y = 2.4 + i * 1.6;
    s += T(16.3, y + 0.3, n, 0.85, 'start') + T(23.6, y + 0.3, b, 0.85, 'end');
  });
  s += T(12, 13.4, 'chip in, CM8870 socket EMPTY', 0.9, 'middle', 'cr');
  return s;
})();

const p17 = `
<h2>Programming (3): The Way That Works</h2>
<p>A <b>$9 Arduino Nano</b> plus a free program called <b>ZEPPP</b> (Zero External Parts PIC Programmer, by battlecoder) can talk to the chip through the board's 6-pin header, <b>J1</b>. No extra parts!</p>
${ins(28, 14.4, 'Wiring chart: six wires from the Arduino Nano pins D6, 5V, GND, D7, D8 and D9 to header J1 pins 1 to 6', nano, { width: 76, rot: 0.6, caption: 'Six wires. Pin 1 of J1 is the square pad.', style: 'margin:1cqw 0 6cqw 0' })}
<ol>
<li>Make the hex file: <b>phone.hex</b>.</li>
<li>Put ZEPPP's sketch on the Nano, once.</li>
<li>Phone <b>OFF</b>, CM8870 socket <b>EMPTY</b>. Wire it as above. Put the blank brain in its socket.</li>
<li>Run: <b>java -jar zeppp-cli.jar -c &lt;port&gt; -wait 2000 -d 16f628a -i phone.hex -p</b> (erase and program).</li>
<li>Check: same command with <b>-va</b> (verify).</li>
<li><b>Look at the config word!</b> Read the chip back and find <b>:02400E00213F50</b>. If it says anything else, it will NOT run right (page 16).</li>
<li>Unplug the Nano. Ears in their socket. Now go on to step 6 on page 14.</li>
</ol>
<p class="ghost">(Nano's USB complains? use the phone's own batteries and leave the 5 V wire off.)</p>
${red('Verify then read it back: very careful!', 'position:absolute;right:7cqw;bottom:11cqw;max-width:32cqw')}`;

// ---- 18: results
const freqRows = [
  [697, 1225, '697.0', '0.00'],
  [770, 1353, '769.8', '-0.03'],
  [852, 1498, '852.3', '+0.03'],
  [941, 1654, '941.0', '+0.01'],
  [1209, 2125, '1209.0', '0.00'],
  [1336, 2348, '1335.9', '-0.01'],
  [1477, 2596, '1477.0', '0.00'],
  [1633, 2870, '1632.9', '-0.01'],
]
  .map(([f, a, m, e]) => `<tr><td class="n">${f}</td><td class="n">${a}</td><td class="n">${m}</td><td class="n">${e}%</td><td class="n x">&nbsp;</td></tr>`)
  .join('');

const p18 = `
<h2>Results</h2>
<h3>Table 1: the tones</h3>
<table class="tight">
<tr><th>it should be (Hz)</th><th>number to add</th><th>my chip makes (Hz)</th><th>off by</th><th>MEASURED</th></tr>
${freqRows}
</table>
<p style="margin-top:1.5cqw"><b>How I got "my chip makes":</b> the add-number x 37,287 loops per second / 65,536. It is <b>calculated</b>, not measured, because I have no frequency counter yet. The last column is for when I do. The decoder accepts tones up to about <b>1.5%</b> off, so these should be fine.</p>
<h3>Table 2: what I know</h3>
<table class="tight">
<tr><th>thing</th><th>value</th><th>how I know</th></tr>
<tr><td>supply</td><td class="n">5.0 V</td><td>the regulator</td></tr>
<tr><td>IR LED current</td><td class="n">~8 mA</td><td>calculated</td></tr>
<tr><td>tone length</td><td class="n">103 ms</td><td>the program</td></tr>
<tr><td>dial pulses</td><td class="n">10 per s</td><td>the old standard</td></tr>
</table>
<h3>Battery life: <u>ESTIMATE</u></h3>
<p>8 digits lit, amp, LED: about <b>60 to 80 mA</b>. A set of AAA batteries is about 1000 mA-hours. 1000 / 70 = about <b>14 hours</b>. So <b>maybe 12 to 16 hours</b>. <b>This is a guess from math. I have NOT run it down.</b></p>
${red('Calculated vs measured: you labeled them. A+ for honesty.', 'position:absolute;right:6cqw;bottom:11cqw;max-width:34cqw')}`;

// ---- 19: conclusion
const p19 = `
<h2>Conclusion</h2>
<p><b>My hypothesis:</b> one brain chip, one ears chip, and a beam of light can make a pocket telephone that sends numbers to another one.</p>
<p><b>What I think:</b> YES, it should. The tones match the standard to better than 0.1%. The display needs only 3 wires. The power has the right voltage. Two phones should show the same number.</p>
<p><b>What I still have to test</b> (I will not pretend):</p>
<ul>
<li>How far the light goes. (A hand's length? The Moon? Probably less.)</li>
<li>How good the voice sounds. It may be quiet and scratchy.</li>
<li>How long the batteries last.</li>
</ul>
<p><b>What went wrong, and what I learned:</b></p>
<ul>
<li>You cannot program 337 words by hand. Let a machine do it.</li>
<li>A <b>config word</b> matters as much as the program. Read it back.</li>
<li>Check the power <b>before</b> you put chips in.</li>
<li>Say what you <b>measured</b> and what you only <b>calculated</b>.</li>
</ul>
<p><b>What I would do next:</b> a box so it really fits in a pocket, and more phones, so a whole class can call each other.</p>
<p class="big c" style="margin-top:3cqw">THE END (almost).</p>
<span class="dr-sticker" style="position:absolute;right:10cqw;bottom:18cqw"><span>A-<small>NICE WORK</small></span></span>
${red('A fine report, Dex! Next time, please keep it away from the dog.', 'position:absolute;left:18cqw;bottom:12cqw;max-width:36cqw')}`;

// ---- 20: bibliography and thanks
const p20 = `
<h2>Bibliography</h2>
<ol>
<li>A library book on how telephones work, with a rotary dial on the cover. (Hover Heights library, the science shelf)</li>
<li>The big encyclopedia at the library, volume T for <i>Telephone</i>, and volume S for <i>Sound</i>.</li>
<li>The decoder chip's data sheet (CM8870), the brain chip's data sheet (PIC16F628A), and the display driver's data sheet (MAX7219).</li>
<li>The standard list of touch-tone frequencies, from the international telephone committee.</li>
<li>The free ZEPPP programmer for the Arduino Nano, by battlecoder (found on the Superhighway). It is open source.</li>
<li>My own phone's schematic, and a pencil.</li>
</ol>
<div class="gap"></div>
<h2>Thank You</h2>
<ul>
<li><b>Grandpa</b>: for watching the soldering iron, and for letting me use the garage bench. (And the CitiCar for getting me to the Moon.)</li>
<li><b>Sparky 3000</b>, assistant: for testing every page. <span class="x">for eating</span> <span class="ghost">no comment</span></li>
<li>The judges at the Moon School Science Fair, for reading all 20 pages.</li>
</ul>
<svg class="dr-sk" style="position:absolute;right:9cqw;bottom:12cqw;width:36cqw;height:auto" viewBox="0 0 14 8" role="img" aria-label="Doodle of Sparky and the Moon"><g filter="url(#dr-rough)">${sparky(1, 3, 1.3)}${moon(11, 2.5, 1.8)}</g></svg>
<p class="ghost" style="margin-top:3cqw">THE END (really).</p>
${red('Wonderful. Good luck at the Science Fair!', 'position:absolute;left:18cqw;bottom:14cqw;max-width:32cqw')}`;

export const pagesC: DrPage[] = [
  { paper: 'lined', body: p13 },
  { paper: 'lined', body: p14 },
  { paper: 'graph', body: p15 },
  { paper: 'lined', body: p16 },
  { paper: 'lined', body: p17 },
  { paper: 'lined', body: p18 },
  { paper: 'lined', body: p19 },
  { paper: 'lined', body: p20 },
];
