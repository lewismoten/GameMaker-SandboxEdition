// Dex's report, pages 7 to 12: the block diagram, the two circuit diagrams, how the brain makes tones, LCD or LED, and the display.
import { ARROW, BOX, CAP, CAPV, DOT, GND, L, P, PL, RECT, RES, RESV, SEG7, T } from './dexReportArt';
import { gsk, ins, red, type DrPage } from './dexReportParts';

// ---- 7: block diagram (28 x 23 cells)
const blocks = [
  BOX(0, 1, 4, 3, 'MIC', 0.9),
  BOX(6, 1, 5, 3, 'AMP|x47', 0.85),
  BOX(13, 1, 6, 3, 'LED|DRIVER', 0.85),
  BOX(21, 1, 6, 3, 'IR LED', 0.9, 'cr'),
  ARROW(4, 2.5, 6, 2.5),
  ARROW(11, 2.5, 13, 2.5),
  ARROW(19, 2.5, 21, 2.5),
  T(24, 5, 'invisible', 0.8, 'middle', 'cr'),
  T(24, 5.7, 'light!', 0.8, 'middle', 'cr'),
  BOX(0, 7.5, 4, 3, 'DIAL', 0.9),
  BOX(6, 7.5, 5, 3, 'BRAIN|PIC', 0.85, 'cb'),
  BOX(13, 7.5, 6, 3, 'TONE|MIXER', 0.85),
  ARROW(4, 9, 6, 9),
  ARROW(11, 9, 13, 9),
  ARROW(16, 7.5, 16, 4),
  PL([10.3, 10.5, 10.3, 11.8, 24, 11.8]),
  ARROW(24, 11.8, 24, 12.2),
  BOX(21, 12.2, 6, 2.8, 'DISPLAY|BOSS', 0.8),
  ARROW(24, 15, 24, 15.8),
  BOX(21, 15.8, 6, 2.6, '2 DISPLAYS', 0.8, 'cr'),
  T(13, 6.7, 'two tones', 0.8, 'middle'),
  BOX(6, 13, 5, 3, 'EARS|CM8870', 0.85, 'cb'),
  ARROW(8.5, 13, 8.5, 10.5, 'cb'),
  T(8.2, 12.6, '4 wires + StD', 0.8, 'end', 'cb'),
  BOX(0, 19, 4, 3, 'PHOTO-|DIODE', 0.8, 'cr'),
  BOX(6, 19, 5, 3, 'AMP|x21', 0.85),
  BOX(13, 19, 6, 3, 'POWER|AMP', 0.85),
  BOX(21, 19, 6, 3, 'SPEAKER', 0.9),
  ARROW(4, 20.5, 6, 20.5),
  ARROW(11, 20.5, 13, 20.5),
  ARROW(19, 20.5, 21, 20.5),
  ARROW(8.5, 19, 8.5, 16),
  T(0, 17.4, '<- light comes in', 0.8, 'start', 'cr'),
  T(12.2, 14.8, 'SENDING = top', 0.85, 'start', 'cr'),
  T(12.2, 16.6, 'RECEIVING = bottom', 0.85, 'start', 'cg'),
].join('');

const p7 = `
<h2>How It All Fits</h2>
<p>Each box is a job. The arrows are wires (the lines from the IR LED and into the photodiode are <b>light</b>). I drew <b>sending</b> on top and <b>receiving</b> on the bottom.</p>
${gsk(23, 'Block diagram: the microphone, amplifier and LED driver send infrared light; the dial, brain, tone mixer and display boss are in the middle; the photodiode, amplifier, decoder, power amplifier and speaker receive', blocks, 'margin-top:1cqw')}
<p style="margin-top:3cqw"><b>TALK</b> turns on the mic and the LED. <b>Digits</b> are two tones from the brain. <b>CLEAR</b> restarts the brain.</p>
<p>When a number is heard, the <b>EARS</b> tell the brain, and the brain tells the <b>DISPLAY BOSS</b>. Both phones show it!</p>
${red('A block diagram first? Very scientific!', 'margin:1.5cqw 2cqw 0 auto')}`;

// ---- 8: circuit 1, power and sending (28 x 31 cells)
const circuit1 = (() => {
  let s = '';
  // power
  s += T(0, 0.9, 'POWER', 0.9, 'start', 'cr');
  s += L(1.5, 1.7, 1.5, 3.7) + L(2.3, 2.2, 2.3, 3.2) + L(3.1, 1.7, 3.1, 3.7) + L(3.1, 2.7, 3.1, 2.7);
  s += T(1.4, 5, '4 x AAA', 0.8, 'middle') + T(3.8, 2.2, '+', 0.9);
  s += L(3.1, 2.7, 8, 2.7) + DOT(5.2, 2.7) + CAPV(5.2, 2.7) + GND(5.2, 4.7) + T(5.9, 4, 'C1 10uF', 0.75);
  s += L(1.5, 3.2, 1.5, 6.2) + GND(1.5, 6.2) + L(1.5, 6.2, 1.5, 6.2);
  s += BOX(8, 1, 5, 3.4, 'MCP1702|5 V', 0.85, 'cb') + T(8.2, 0.8, 'IN', 0.7) + T(12.8, 0.8, 'OUT', 0.7, 'end');
  s += L(13, 2.7, 22, 2.7) + DOT(16.5, 2.7) + CAPV(16.5, 2.7) + GND(16.5, 4.7) + T(17.2, 4, 'C2 10uF', 0.75) + T(22.3, 3.1, '+5 V', 1, 'start', 'cr');
  s += L(10.5, 4.4, 10.5, 5.6) + GND(10.5, 5.6) + T(11.2, 5.5, 'GND', 0.7);
  // the tone mixer
  s += T(0, 9.1, 'TONE MIXER + IR LED DRIVER', 0.9, 'start', 'cr');
  s += T(0, 11.6, 'brain', 0.8) + T(0, 12.3, 'RB2', 0.8) + RES(1.6, 12.2) + T(2.3, 11.4, '1k', 0.75, 'start');
  s += T(0, 15.8, 'brain', 0.8) + T(0, 16.5, 'RB3', 0.8) + RES(1.6, 16.4) + T(2.3, 15.6, '1k', 0.75, 'start');
  s += L(4.6, 12.2, 5.5, 12.2) + L(4.6, 16.4, 5.5, 16.4) + L(5.5, 12.2, 5.5, 16.4) + DOT(5.5, 14.3);
  s += L(5.5, 16.4, 5.5, 17) + CAPV(5.5, 17) + GND(5.5, 19) + T(6.2, 18.2, 'C6 100nF', 0.75);
  s +=
    L(5.5, 14.3, 7.4, 14.3) +
    CAP(8.4, 14.3) +
    T(8.4, 13.2, 'C7', 0.75, 'middle') +
    L(9.4, 14.3, 10, 14.3) +
    RES(10, 14.3) +
    T(11.5, 13.4, 'R15 47k', 0.75, 'middle');
  s += L(13, 14.3, 14.5, 14.3) + DOT(14.5, 14.3);
  // the TALK line and the base resistors
  s += L(10.5, 8.2, 17, 8.2, 'cb') + T(10.5, 7.8, 'TALK line (+5 V while TALK is held)', 0.8, 'start', 'cb');
  s += L(14.5, 8.2, 14.5, 9.3) + RESV(14.5, 9.3) + T(15.3, 10.9, 'R8 10k', 0.75) + L(14.5, 12.3, 14.5, 14.3);
  s += L(14.5, 14.3, 14.5, 14.9) + RESV(14.5, 14.9) + T(15.3, 16.5, 'R9 4.7k', 0.75) + GND(14.5, 18.1);
  // Q1
  s += L(14.5, 14.3, 17.8, 14.3) + `<circle class="pn" cx="19.3" cy="14.3" r="1.5"/>` + L(18.3, 13.2, 18.3, 15.4, 'th');
  s += L(18.3, 13.7, 19.6, 12.6) + L(18.3, 14.9, 19.6, 16) + ARROW(19.1, 15.7, 19.6, 16.1);
  s += T(17.4, 13.3, 'B', 0.7) + T(21, 12.9, 'C', 0.7) + T(21, 16.4, 'E', 0.7) + T(19.3, 11.9, 'Q1', 0.8, 'middle');
  // IR LED branch up
  s += L(19.6, 12.6, 19.6, 11) + L(19.6, 11, 19.6, 10.2) + P('M18.6 9L20.6 9L19.6 10.4z', 'cr') + L(18.6, 10.4, 20.6, 10.4, 'cr');
  s += ARROW(21.2, 8.9, 23.6, 7.6, 'cr') + ARROW(21.6, 10.2, 24, 8.9, 'cr') + T(24.3, 8.3, 'IR light', 0.8, 'start', 'cr');
  s += L(19.6, 9, 19.6, 8.4) + RESV(19.6, 5.2) + L(19.6, 8.2, 19.6, 9) + L(19.6, 5.2, 19.6, 4.8) + T(20.4, 7.2, 'R11 100', 0.75);
  s += L(19.6, 4.8, 19.6, 2.7) + DOT(19.6, 2.7);
  // emitter resistor
  s += L(19.6, 16, 19.6, 17) + RESV(19.6, 17) + T(20.4, 18.7, 'R10 100', 0.75) + GND(19.6, 20.1);
  s += T(0, 22.5, 'Voice from the mic joins at the base too, through R12 (10k)', 0.85, 'start', 'cb');
  s += T(0, 23.5, 'and C5, while TALK is held (the mic amp makes it bigger).', 0.85, 'start', 'cb');
  s += T(0, 25.5, 'LED current = about 8 mA. (I calculated it. I did not measure it.)', 0.85, 'start', 'cr');
  s += P('M0.2 27.3c3 .6 6-.6 9 0s6 .6 9 0', 'faint');
  return s;
})();

const p8 = `
<h2>Circuit 1: Sending</h2>
<p>I copied this from the real schematic and made it look like how I'd draw it. Zig-zags are <b>resistors</b>, two bars are <b>capacitors</b>, the ground is the 3 lines that get shorter.</p>
${gsk(31, 'Circuit diagram: the battery feeds a 5 volt regulator; two brain pins go through 1 kilo-ohm resistors and a capacitor into the base of a transistor that switches the infrared LED', circuit1, 'margin-top:1cqw')}
${red('Check your resistor values against the parts list.', 'margin:1.5cqw 2cqw 0 auto')}`;

// ---- 9: circuit 2, receiving (28 x 31 cells)
const circuit2 = (() => {
  let s = '';
  s += T(0, 0.9, 'RECEIVING', 0.9, 'start', 'cr');
  s += L(2, 1.5, 2, 2.2) + T(2.4, 1.6, '+5 V', 0.8, 'start', 'cr');
  // photodiode, cathode up
  s += P('M1 3.9L3 3.9L2 2.5z', 'cr') + L(1, 2.5, 3, 2.5, 'cr') + L(2, 3.9, 2, 4.5);
  s += ARROW(-0.4, 1.7, 1, 2.9, 'cr') + ARROW(-0.4, 3, 0.9, 3.7, 'cr');
  s += DOT(2, 4.5) + L(2, 4.5, 2, 5) + RESV(2, 5) + GND(2, 8.1) + T(2.8, 6.8, 'R17 47k', 0.75);
  s += T(3.3, 2.5, 'D1', 0.8) + L(2, 4.5, 3.6, 4.5) + CAP(4.6, 4.5) + L(5.6, 4.5, 6, 4.5) + RES(6, 4.5) + T(7.5, 3.6, 'R18 4.7k', 0.75, 'middle');
  s += L(9, 4.5, 10, 4.5);
  // op-amp B of the LM358
  s += P('M10 3.2L10 7.6L14.8 5.4z', 'th') + T(10.3, 4.6, '-', 1) + T(10.3, 6.9, '+', 1) + T(11.9, 5.6, 'B', 0.8);
  s +=
    L(9.2, 4.5, 9.2, 2) +
    L(9.2, 2, 11.3, 2) +
    RES(11.3, 2) +
    L(14.3, 2, 15.4, 2) +
    L(15.4, 2, 15.4, 5.4) +
    DOT(15.4, 5.4) +
    T(12.8, 1.1, 'R19 100k', 0.75, 'middle');
  s += L(14.8, 5.4, 16.6, 5.4) + T(15.2, 6.6, 'LM358', 0.75, 'middle');
  s += L(10, 6.4, 8.4, 6.4) + T(3.4, 7.7, 'half of 5 V (VMID)', 0.75, 'start');
  s += T(15.8, 4.5, 'OUT (x21)', 0.8, 'start', 'cb');
  // to the speaker amp
  s += L(15.4, 5.4, 15.4, 5.4) + L(16.6, 5.4, 17.6, 5.4) + CAP(18.6, 5.4) + L(19.6, 5.4, 20, 5.4) + RES(20, 5.4) + T(21.5, 6.6, 'R20 47k', 0.75, 'middle');
  s += RECT(23, 3.4, 4.6, 4, 'cb') + T(25.3, 5.6, 'LM386', 0.85, 'middle') + L(23, 5.4, 23, 5.4);
  s +=
    L(25.3, 7.4, 25.3, 9) +
    CAPV(25.3, 9) +
    L(25.3, 11, 25.3, 11.4) +
    RECT(24.3, 11.4, 2, 1.8) +
    P('M26.3 11.4L27.6 10.6L27.6 14L26.3 13.2') +
    GND(25.3, 13.2) +
    T(25.3, 15.6, 'speaker', 0.8, 'middle');
  // to the decoder
  s +=
    L(15.4, 5.4, 15.4, 8) +
    DOT(15.4, 5.4) +
    CAPV(15.4, 8) +
    RESV(15.4, 10) +
    T(16.2, 9, 'C10', 0.75) +
    T(16.2, 11.6, 'R22 100k', 0.75) +
    L(15.4, 13, 15.4, 14.2);
  s += RECT(8.4, 14.2, 8.2, 9.4, 'cb') + T(12.5, 17.6, 'CM8870', 1, 'middle', 'cb') + T(12.5, 19, 'the EARS', 0.8, 'middle');
  for (let i = 0; i < 4; i++) s += ARROW(16.6, 15.5 + i * 1.4, 19.6, 15.5 + i * 1.4, 'cb') + T(20, 15.8 + i * 1.4, `Q${i + 1} to RB${i + 4}`, 0.8);
  s += ARROW(16.6, 21.3, 19.6, 21.3, 'cr') + T(20, 21.6, 'StD to RA4', 0.8, 'start', 'cr');
  // crystal
  s += L(8.4, 16.5, 6.4, 16.5) + L(8.4, 20.5, 6.4, 20.5) + L(6.4, 16.5, 6.4, 17.6) + L(6.4, 19.5, 6.4, 20.5);
  s +=
    L(5.4, 17.6, 7.4, 17.6) + RECT(5.7, 17.9, 1.4, 1.2) + L(5.4, 19.5, 7.4, 19.5) + T(5.2, 18.8, 'X1', 0.8, 'end') + T(8.2, 21.9, '3.579545 MHz', 0.8, 'end');
  s += L(12.5, 23.6, 12.5, 25) + CAPV(12.5, 24.9) + T(13.4, 26, 'C12 100 nF', 0.75);
  s += L(12.5, 26.9, 12.5, 27.2) + L(12.5, 27.2, 19, 27.2) + ARROW(18.4, 27.2, 20, 27.2) + T(20.4, 27.5, 'brain clock pin', 0.8, 'start', 'cr');
  s += T(0, 29.6, 'The crystal runs the ears AND, through C12, the brain.', 0.85, 'start', 'cb');
  s += T(0, 30.6, '(R23 + R24 + C11 hold the decoder steady: see the real schematic)', 0.8, 'start');
  return s;
})();

const p9 = `
<h2>Circuit 2: Receiving</h2>
<p>The photodiode makes a tiny signal when light hits it. The amplifier makes it bigger (<b>x21</b>, because R19 is 21 times R18). Then it goes <b>two ways</b>: to the speaker amp so I can hear it, and to the decoder that hears the numbers. (The - and + are the amp's two inputs.)</p>
${gsk(31, 'Circuit diagram: the photodiode feeds an amplifier; its output goes to the speaker amplifier and to the CM8870 tone decoder, which sends four code wires and a flag to the brain', circuit2, 'margin-top:1cqw')}
`;

// ---- 10: the brain makes tones (lined)
const phaseWheel = (() => {
  let s = `<circle class="pn" cx="5" cy="5" r="3.6"/>`;
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    s += L(5 + 3.6 * Math.cos(a), 5 + 3.6 * Math.sin(a), 5 + 3.1 * Math.cos(a), 5 + 3.1 * Math.sin(a));
  }
  s += ARROW(5, 5, 7.9, 2.4, 'cr') + T(5, 9.9, 'a 16-bit counter', 0.8, 'middle');
  s += T(1.3, 5.3, '0', 0.8) + T(9, 5.3, '32768', 0.7) + T(5, 1, 'top half = HIGH', 0.7, 'middle', 'cb');
  s += PL([11, 7, 11, 3, 14, 3, 14, 7, 17, 7, 17, 3, 20, 3, 20, 7, 23, 7, 23, 3, 26, 3], 'cb');
  s += T(18.5, 9, 'the top bit = the tone', 0.85, 'middle', 'cb');
  return s;
})();

const p10 = `
<h2>Making the Tones</h2>
<p>The brain has no speaker pin and no sine waves. It does a <b>counting trick</b>. Picture a clock with <b>65,536</b> ticks around it. Every time through its loop, the brain moves the hand forward by a number. When the hand is in the top half, the pin is HIGH, and in the bottom half it is LOW. A square wave! Faster hand = higher note.</p>
${ins(28, 10.5, 'A clock face with a hand: the counter. Below it, the square wave made by the top bit.', phaseWheel, { width: 80, rot: -0.5, caption: 'The hand moves a little every loop', style: 'margin:2cqw 0 5cqw 0' })}
<p><b>How fast does it loop?</b> The crystal rings at 3,579,545 per second. The brain does 1 instruction per 4 rings = <b>894,886</b> per second. My loop takes exactly <b>24</b> instructions, so it goes round <b>37,287</b> times a second.</p>
<p><b>The number to add for 697 Hz:</b> 697 x 65,536 / 37,287 = <b>1,225</b>. (For 770 it is 1,353. For 1336 it is 2,348. The program does the rest.)</p>
<p>Two counters run at once, one per pin: <b>RB2</b> is the row note and <b>RB3</b> the column. Two 1k resistors and a 100 nF capacitor add them and round off the corners (page 8). A tone lasts about <b>0.1 second</b> (103 ms).</p>
<p class="box" style="margin-top:2cqw"><b>Try it on a calculator:</b> keep adding 1,225. Every time you go past 65,536, take 65,536 away. It takes <b>53.5 adds</b> to go once around. And 37,287 loops a second / 53.5 = <b>697</b> times around every second. That is the note!</p>
${red('Wow. Is that really how it works?', 'margin:1cqw 0 0 40cqw')}`;

// ---- 11: LCD or LED?
const digits = (() => {
  let s = '';
  s += RECT(0.4, 0.4, 7.2, 8.6) + SEG7(2, 2, 'abcdg', 'faint') + T(4, 10.7, 'LCD', 0.9, 'middle');
  s += RECT(10.4, 0.4, 7.2, 8.6, 'cr') + SEG7(12, 2, 'abcdg') + T(14, 10.7, 'LED', 0.9, 'middle', 'cr');
  s += `<g>${[...Array(5)].map((_, i) => ARROW(11 + i * 1.2, 10, 11.4 + i * 1.2, 9.4, 'cr')).join('')}</g>`.slice(0, 0);
  return s;
})();

const p11 = `
<h2>LCD or LED?</h2>
<p>I wanted a screen like on a calculator (an <b>LCD</b>). But I picked <b>LED</b> numbers. Here is why.</p>
${ins(18, 11.5, 'A gray LCD digit 3 next to a red LED digit 3', digits, { width: 40, rot: 1, caption: 'same 3, different guts', style: 'float:right;margin:0 0 4cqw 3cqw' })}
<p><b>LCD</b> (liquid crystal): makes <b>no light</b>. It just blocks light, so it needs a <b>backlight</b> or room light. Great for a watch. Hard in a dark pocket! LCD segments also want their voltage <b>flipped back and forth</b>, so they need a special driver.</p>
<p><b>LED</b> (light-emitting diode): <b>each segment is a tiny glowing light</b>. Red numbers show in the dark and in the sun. A pocket phone needs to be seen.</p>
<div class="gap"></div>
<table class="tight">
<tr><th>feature</th><th>LCD</th><th>LED</th></tr>
<tr><td>Own light?</td><td>no</td><td>YES</td></tr>
<tr><td>Power</td><td>very low</td><td>more (but I dim it)</td></tr>
<tr><td>Driver</td><td>special, AC</td><td>MAX7219 does it</td></tr>
<tr><td>Wires to brain</td><td>lots</td><td><b>3</b></td></tr>
<tr><td>In the dark</td><td>needs backlight</td><td>great</td></tr>
</table>
<p style="margin-top:2cqw"><b>I chose: LED.</b> The 7219 chip scans all the digits by itself, so the brain only sends numbers. I set the brightness low (3 out of 32) to save batteries.</p>
<p class="ghost">(LCD would be cooler in a movie though.)</p>
${red('A fair test of two designs: you listed pros and cons!', 'margin:1.5cqw 2cqw 0 auto')}`;

// ---- 12: how the chip drives the display (graph, 28 cells wide)
const word = (() => {
  // the 16-bit word: address 0x01 then data 0x03 (the digit 3 in the first place), clocked in on 16 clock pulses
  const bits = '0000000100000011';
  let s = T(0, 0.9, 'DIN', 0.9, 'start', 'cb') + T(0, 4.2, 'CLK', 0.9, 'start', 'cr') + T(0, 7.3, 'LOAD', 0.9, 'start', 'cg');
  const x0 = 3;
  const w = 1.5;
  const din: number[] = [];
  let prev = 1.7;
  for (let i = 0; i < 16; i++) {
    const y = bits[i] === '1' ? 0.6 : 1.8;
    if (i === 0) din.push(x0, y);
    else din.push(x0 + i * w, prev, x0 + i * w, y);
    din.push(x0 + (i + 1) * w, y);
    prev = y;
    s += T(x0 + i * w + w / 2, 3, bits[i], 0.75, 'middle');
  }
  s += PL(din, 'cb');
  const clk: number[] = [x0, 5.6];
  for (let i = 0; i < 16; i++) clk.push(x0 + i * w + w * 0.3, 5.6, x0 + i * w + w * 0.3, 4.4, x0 + i * w + w * 0.8, 4.4, x0 + i * w + w * 0.8, 5.6);
  clk.push(x0 + 16 * w + 1, 5.6);
  s += PL(clk, 'cr');
  s += PL([x0, 8.6, x0 + 16 * w + 0.4, 8.6, x0 + 16 * w + 0.4, 7.4, x0 + 16 * w + 1.8, 7.4, x0 + 16 * w + 1.8, 8.6, x0 + 16 * w + 3, 8.6], 'cg');
  s += L(x0 + 8 * w, 0.2, x0 + 8 * w, 2.4, 'faint');
  s += T(x0 + 4 * w, -0.4, 'address = 01 (digit 1)', 0.75, 'middle') + T(x0 + 12 * w, -0.4, 'data = 03 (show a 3)', 0.75, 'middle');
  s += T(x0 + 16 * w + 1.8, 7.2, 'latch!', 0.75, 'middle', 'cg');
  return s;
})();

const seg = (() => {
  let s =
    SEG7(1, 1.5, 'abcdg') +
    T(1.8, 1, 'a', 0.8, 'middle') +
    T(4.6, 3.3, 'b', 0.8) +
    T(4.6, 6.5, 'c', 0.8) +
    T(1.8, 8, 'd', 0.8, 'middle') +
    T(0.1, 6.5, 'e', 0.8) +
    T(0.1, 3.3, 'f', 0.8) +
    T(1.8, 5.3, 'g', 0.8, 'middle');
  s += T(7, 3, 'The 3 lights', 0.9, 'start', 'cr') + T(7, 4, 'a b c d g', 0.9, 'start', 'cr') + T(7, 5.2, '(the dot is the 8th)', 0.75);
  return s;
})();

const p12 = `
<h2>Driving the Display</h2>
<p>Each digit is <b>7 little lines</b> (a to g) and a <b>dot</b>. To show a 3, light a, b, c, d and g. The <b>MAX7219</b> knows all that, so I just send it the number.</p>
${gsk(9, 'A seven-segment digit 3 with its segments labeled a to g', seg, 'margin-top:0')}
<p><b>3 wires</b> from the brain: <b>DIN</b> (data), <b>CLK</b> (clock), <b>LOAD</b>. I send <b>16 bits</b> in a row, one for each clock pulse, biggest bit first: 8 bits say <b>which digit</b>, 8 bits say <b>what to show</b>. When LOAD goes up, the chip keeps it.</p>
${gsk(9.5, 'Timing chart: sixteen bits on DIN, sixteen clock pulses, and LOAD going high at the end', word, 'margin-top:2.5cqw')}
<p style="margin-top:2cqw"><b>First the brain sets it up</b> (4 words): scan all 8 digits, decode numbers for me, brightness low, turn on.</p>
<p><b>Multiplexing:</b> the chip lights <b>one digit at a time</b>, super fast (the whole set about 800 times a second), and your eye blends it. All digits share the same 8 segment wires, so there are fewer wires. Nothing typed yet? A dash (-) shows.</p>`;

export const pagesB: DrPage[] = [
  { paper: 'graph', body: p7 },
  { paper: 'graph', body: p8 },
  { paper: 'graph', body: p9 },
  { paper: 'lined', body: p10 },
  { paper: 'lined', body: p11 },
  { paper: 'graph', body: p12 },
];
