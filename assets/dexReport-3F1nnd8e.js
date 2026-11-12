/* empty css              */import{h as y}from"./watch-Ci1HG5Rl.js";import{h as N,b as F}from"./kit-DbQ1eFDD.js";import{x as H,f as B}from"./seededRandom-s0Q9d40o.js";import"./gameShots-B5zLkSfH.js";import"./shared-desk-web-play-dos-DOS3LiN4.js";import"./levelPicture-BaT01hw_.js";import"./shared-desk-web-play-BFNwQnCp.js";import"./draw-VCK-ssjd.js";import"./frameShot-DJgT1Y0f.js";import"./bbsName-C_Z_jafv.js";import"./gameTitle-UN8HXXPF.js";function S(t,a,o,i,r=""){return`<svg class="dr-sk ${r}" viewBox="0 0 ${t} ${a}" role="img" aria-label="${o.replace(/"/g,"&quot;")}"><defs><filter id="dr-rough" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="0.09"/></filter></defs><g filter="url(#dr-rough)">${i}</g></svg>`}const n=t=>String(Math.round(t*100)/100),b=(t,a="")=>`<path class="pn ${a}" d="${t}"/>`,s=(t,a,o,i,r="")=>b(`M${n(t)} ${n(a)}L${n(o)} ${n(i)}`,r);function k(t,a=""){let o="";for(let i=0;i<t.length;i+=2)o+=(i?"L":"M")+n(t[i])+" "+n(t[i+1]);return b(o,a)}const e=(t,a,o,i=.85,r="start",h="")=>`<text class="${h}" x="${n(t)}" y="${n(a)}" font-size="${i}" text-anchor="${r}">${o}</text>`,u=(t,a,o,i,r="")=>b(`M${n(t)} ${n(a)}h${n(o)}v${n(i)}h${n(-o)}z`,r);function p(t,a,o,i,r,h=.8,l=""){const d=r.split("|"),g=a+i/2-(d.length-1)*h*.55/2+h*.3;return u(t,a,o,i,l)+d.map((M,D)=>e(t+o/2,g+D*h*1.05,M,h,"middle")).join("")}function c(t,a,o,i,r=""){const h=Math.atan2(i-a,o-t),l=d=>`${n(o-.35*Math.cos(h+d))} ${n(i-.35*Math.sin(h+d))}`;return s(t,a,o,i,r)+b(`M${l(.45)}L${n(o)} ${n(i)}L${l(-.45)}`,r)}const v=(t,a)=>b(`M${n(t)} ${n(a)}h.5l.25-.45l.4.9l.4-.9l.4.9l.4-.9l.25.45h.4`),A=(t,a)=>b(`M${n(t)} ${n(a)}v.5l-.45.25l.9.4l-.9.4l.9.4l-.9.4l.45.25v.4`),R=(t,a)=>s(t-1,a,t-.15,a)+s(t-.15,a-.6,t-.15,a+.6)+s(t+.15,a-.6,t+.15,a+.6)+s(t+.15,a,t+1,a),$=(t,a)=>s(t,a,t,a+.85)+s(t-.6,a+.85,t+.6,a+.85)+s(t-.6,a+1.15,t+.6,a+1.15)+s(t,a+1.15,t,a+2),w=(t,a)=>s(t,a,t,a+.4)+s(t-.6,a+.4,t+.6,a+.4)+s(t-.38,a+.7,t+.38,a+.7)+s(t-.16,a+1,t+.16,a+1),f=(t,a)=>`<circle class="pd" cx="${n(t)}" cy="${n(a)}" r=".17"/>`;function G(t,a,o,i,r,h=""){const l=Math.max(24,Math.round(r*24)),d=[];for(let g=0;g<=l;g++)d.push(`${n(t+o*g/l)} ${n(a-i*Math.sin(2*Math.PI*r*g/l))}`);return b("M"+d.join("L"),h)}function L(t,a,o,i,r=""){const h=[];for(let l=0;l<=160;l++)h.push(`${n(t+o*l/160)} ${n(a-i(l/160))}`);return b("M"+h.join("L"),r)}function E(t,a,o=1){return`<g transform="translate(${n(t)} ${n(a)}) scale(${o})">`+b("M0 0h3.2v2.4h-3.2z")+b("M.2 0L.4-1.1L1.1 0")+b("M2.1 0L2.8-1.1L3 0")+b("M3.2 1.1h1v1.1h-1")+'<circle class="pn" cx="1" cy="1" r=".28"/><circle class="pn" cx="2.2" cy="1" r=".28"/><circle class="pd" cx="1.05" cy="1.02" r=".1"/><circle class="pd" cx="2.25" cy="1.02" r=".1"/>'+b("M0 2.4v1.4M3.2 2.4v1.4M0 3.8h3.2")+b("M-.1 1.2q-1-.1-1.4-1.1")+'<circle class="pn cr" cx="-1.5" cy="0" r=".28" style="fill:#c0392b"/>'+b("M3.3 1.8q.5.4 1 0","cr")+"</g>"}function O(t,a,o=1.4){return`<circle class="pn" cx="${n(t)}" cy="${n(a)}" r="${n(o)}"/><circle class="pn" cx="${n(t-o*.3)}" cy="${n(a-o*.25)}" r="${n(o*.28)}"/><circle class="pn" cx="${n(t+o*.35)}" cy="${n(a+o*.3)}" r="${n(o*.2)}"/><circle class="pn" cx="${n(t+o*.45)}" cy="${n(a-o*.45)}" r="${n(o*.12)}"/>`+s(t-o*.1,a-o,t-o*.1,a-o-.9)+b(`M${n(t-o*.1)} ${n(a-o-.9)}l.7.25l-.7.25`,"cr")}function P(t,a,o,i="cr"){const r={a:[.5,0,2.5,0],b:[3,.5,3,2.25],c:[3,2.75,3,4.5],d:[.5,5,2.5,5],e:[0,2.75,0,4.5],f:[0,.5,0,2.25],g:[.5,2.5,2.5,2.5]};let h="";for(const l of"abcdefg"){const[d,g,M,D]=r[l];h+=s(t+d,a+g,t+M,a+D,o.includes(l)?i+" th":"faint")}return h+(o.includes("p")?`<circle class="pd cr" cx="${n(t+3.5)}" cy="${n(a+5)}" r=".22"/>`:"")}function T(t,a,o,i,r){return`<figure class="dr-ins${r.plain?" plain":""}" style="width:${r.width}%;--gw:${t};--gh:${a};transform:rotate(${r.rot??0}deg);${r.style??""}"><i class="dr-tape a"></i><i class="dr-tape b"></i>${S(t,a,o,i)}`+(r.caption?`<figcaption>${r.caption}</figcaption>`:"")+"</figure>"}function x(t,a,o,i=[]){return`<figure class="dr-photo" style="width:${o.width}%;transform:rotate(${o.rot??0}deg);${o.style??""}"><i class="dr-tape a"></i><i class="dr-tape b"></i><img src="${t}" alt="${a.replace(/"/g,"&quot;")}">`+i.map(([r,h,l])=>`<span class="dr-mark" style="left:${h}%;top:${l}%">${r}</span>`).join("")+(o.caption?`<figcaption>${o.caption}</figcaption>`:"")+"</figure>"}function q(t,a,o,i=""){return`<div style="width:calc(28 * var(--cell));height:calc(${t} * var(--cell));${i}">${S(28,t,a,o)}</div>`}const m=(t,a="")=>`<p class="dr-red" style="${a}">${t}</p>`,V=""+new URL("board-front-CogWXEn6.png",import.meta.url).href,I=2*Math.PI,W=`
<p class="big" style="font-size:4.6cqw">SCIENCE FAIR PROJECT &middot; MOON SCHOOL</p>
<h1 class="dr-title">THE POCKET<br>TELEPHONE</h1>
<p style="font-size:4.6cqw;margin-top:3cqw">How to build a phone that fits in your pocket<br>(and why it works)</p>
<div class="dr-card">
  by <b>DEX DYNAMO</b>, age 11<br>
  Hover Heights<br>
  Science Fair: 3:00 PM (on the Moon)<br>
  <i>20 pages! With diagrams!</i>
</div>
${x(V,"The front of the finished phone board: two red displays, the dial, the speaker and four buttons.",{width:26,rot:4,style:"position:absolute;left:9cqw;bottom:7cqw"},[])}
<svg class="dr-sk" style="position:absolute;left:40cqw;bottom:5cqw;width:30cqw;height:auto" viewBox="0 0 12 9" role="img" aria-label="Doodle of Sparky and the Moon">
  <g filter="url(#dr-rough)">${E(2,3,1.1)}${O(10,2.2,1.5)}</g></svg>
<span class="dr-sticker" style="position:absolute;right:7cqw;bottom:14cqw"><span>A-<small>NICE WORK</small></span></span>
<p class="dr-red" style="position:absolute;left:40cqw;bottom:34cqw;max-width:36cqw;color:#c0242b;font-size:3.4cqw;line-height:3.2cqw;transform:rotate(-4deg);border:.3cqw solid #c0242b;border-radius:50%/40%;padding:.8cqw 1.6cqw">Impressive! See me about the bite marks.</p>
<i class="bite" aria-hidden="true"></i>`,z=T(28,15,"Graph of a 350 hertz wave, a 440 hertz wave, and the two added together",[e(.5,1.4,"350 Hz",.9,"start","cb"),L(4,2.5,22,t=>1.1*Math.sin(I*7*t),"cb"),e(.5,6.4,"440 Hz",.9,"start","cg"),L(4,7.5,22,t=>1.1*Math.sin(I*8.8*t),"cg"),e(.5,11.4,"both",.9,"start","cr"),L(4,12.5,22,t=>.7*(Math.sin(I*7*t)+Math.sin(I*8.8*t)),"cr"),s(4,14.6,26,14.6),s(4,14.35,4,14.85),s(26,14.35,26,14.85),e(15,14.4,"",.7),e(26.7,14.9,"20 ms",.8)].join(""),{width:66,rot:-.8,caption:"Two notes at once = dial tone",style:"margin:2cqw 0 5cqw 2cqw"}),j=T(26,10,"Two telephones joined by a wire: the microphone turns voice into changing electricity, the speaker turns it back",[p(.5,3,6,4,"mic",.9),p(19.5,3,6,4,"speaker",.9),s(6.5,4,19.5,4),s(6.5,6,19.5,6),c(10,2.4,16,2.4,"cr"),e(13,1.7,"wiggly electricity",.85,"middle","cr"),e(3.5,8.8,"voice in",.85,"middle"),e(22.5,8.8,"voice out",.85,"middle"),G(9,5,8,.45,3,"cb")].join(""),{width:62,rot:.6,caption:"The old way (a wire)",style:"margin:1.5cqw 0 4cqw 4cqw"}),K=`
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
${m("Clear question! Good hypothesis: it can be tested.","margin:2.5cqw 0 0 34cqw")}
<svg class="dr-sk dr-note" style="right:7cqw;bottom:11cqw;width:22cqw;height:12cqw" viewBox="0 0 12 6" role="img" aria-label="Doodle of Sparky"><g filter="url(#dr-rough)">${E(4,1.6,1)}</g></svg>
<p class="dr-note ghost" style="left:16cqw;top:117cqw;transform:rotate(-2deg)">my phone will be the best!!</p>`,U=`
<h2>How a Telephone Works</h2>
<p>Your voice is air wiggling. The <b>microphone</b> turns the wiggles into wiggly <b>electricity</b>. The wire carries it. The <b>speaker</b> at the other end turns it back into wiggling air. That is it! Everything else is for finding the right person.</p>
${j}
<h3>Dial tone</h3>
<p>Lift the handset and you hear the dial tone. It is <b>two notes at the same time</b>: <b>350 Hz</b> and <b>440 Hz</b>. (Hz = hertz = wiggles per second. 350 Hz is 350 wiggles every second.) It says: "I am ready, go ahead and dial."</p>
${z}
<p class="ghost" style="margin-top:1cqw">(is 440 the same as a tuning fork A? yes!)</p>
${m("Good. Why two notes and not one?","margin:1.5cqw 2cqw 0 auto")}
<p style="position:absolute;right:6cqw;top:74cqw;max-width:26cqw;transform:rotate(1.5deg)" class="bl">Answer: so a person humming can not fake it. (I think.)</p>`,Y=(()=>{const o=[6,2.6];for(let i=0;i<3;i++){const r=8+i*3;o.push(r,2.6,r,5.4,r+1.8,5.4,r+1.8,2.6,r+3,2.6)}return o.push(19,2.6),[e(.4,3.1,"wire",.8),e(.4,3.9,"on/off",.8),k(o,"cb"),k([6,8.2,8,8.2,8,10,19,10,19,8.2,21,8.2],"cg"),e(.4,9,"off-normal",.8),s(8,6.6,8,11.2,"faint"),s(11,6.6,11,11.2,"faint"),s(14,6.6,14,11.2,"faint"),s(17,6.6,17,11.2,"faint"),c(8,12.3,11,12.3),c(11,12.3,8,12.3),e(6+3.5,13.2,"100 ms",.8,"middle"),e(9,1.7,"open 60",.8,"middle","cb"),e(6+4.7,1.7,"",.8),e(6+9.5,1.7,"closed 40",.8,"middle","cb"),e(13,14.8,"digit 3 = three pulses",.95,"middle","cr")].join("")})(),X=`
<h2>Pulse Dialing</h2>
<p>Before touch-tones, phones had a <b>rotary dial</b>. You stick a finger in a hole, turn it to the stop, and let go. A spring spins it home, and a little switch <b>clicks the wire on and off</b>, once for each number. Dial a 3: click click click. Dial a 0: ten clicks.</p>
<p>The clicks go at <b>10 per second</b>, so one click takes 100 milliseconds. About <b>60 of those are "break"</b> (wire open) and about <b>40 are "make"</b> (wire closed). A second switch (<b>off-normal</b>) is closed any time the dial is away from rest. It tells the phone "numbers are coming, count!"</p>
${T(28,16,"Timing chart of dial pulses: three pulses of 60 milliseconds open and 40 closed for the digit 3, with the off-normal switch closed during them",Y,{width:78,rot:.5,caption:"Timing chart for the digit 3",style:"margin:2cqw 0 5cqw 0"})}
<h3>In MY phone</h3>
<p>I did not want a loop of wire. Two tiny push switches sit under the dial. The dial's bumps press <b>PULSE</b> once per number and <b>OFF NORMAL</b> the whole time. The brain counts pulses. If it counts <b>10</b> it shows <b>0</b>. If it counts more than 10, it ignores it.</p>
<p>Switches <b>bounce</b> (they chatter, like a ball) so the brain waits about <b>1 thousandth of a second</b> for PULSE and about <b>15 thousandths</b> for OFF NORMAL before it believes them.</p>
${m("Nice timing chart. Does everybody dial at the same speed?","margin:1cqw 0 0 40cqw")}`,J=(()=>{const t=[["1","2","3","A"],["4","5","6","B"],["7","8","9","C"],["*","0","#","D"]],a=["697","770","852","941"],o=["1209","1336","1477","1633"];let i="";for(let r=0;r<=4;r++)i+=s(6,3+r*3,22,3+r*3)+s(6+r*4,3,6+r*4,15);return o.forEach((r,h)=>i+=e(8+h*4,2.3,r,.85,"middle","cb")),a.forEach((r,h)=>i+=e(5.5,4.8+h*3,r,.85,"end","cg")),t.forEach((r,h)=>r.forEach((l,d)=>i+=e(8+d*4,5+h*3,l,1.5,"middle",l==="5"?"cr":""))),i+=b("M10.1 6.6a1.8 1.5 0 1 0 .1.1","cr"),i+=e(.5,1.4,"Hz",.85,"start","cb"),i+=c(15,17.2,10.2,8.6,"cr")+e(15.4,17.6,"a 5 is 770 + 1336",.95,"start","cr"),i+=e(22.4,14.8,"no phone",.8)+e(22.4,15.6,"has these",.8),i})(),Q=`
<h2>Touch-Tones (DTMF)</h2>
<p>Push-button phones do not click. Each button makes <b>two tones at once</b>: one for its ROW and one for its COLUMN. The name is <b>Dual-Tone Multi-Frequency</b>, DTMF. Pressing <b>5</b> makes 770 Hz and 1336 Hz together.</p>
<p>Why two? One note can happen by accident (a whistle, a truck). A <b>pair of exact notes</b> almost never does.</p>
${T(28,19,"Table of touch-tone keys: rows are 697, 770, 852 and 941 hertz, columns are 1209, 1336, 1477 and 1633 hertz",J,{width:80,rot:-.7,caption:"The 16 buttons. Rows low, columns high.",style:"margin:2cqw 0 5cqw 0"})}
<p>The 4th column (1633 Hz) has the letters <b>A B C D</b>. No phone I have seen has those buttons, but my decoder chip knows all <b>16</b>, so it can hear them anyway.</p>
<h3>Why my phone needs a decoder</h3>
<p>Sending is easy: the brain makes the two tones. <b>Listening</b> is hard. The CM8870 chip does it: it hears a tone pair and tells the brain <b>which button</b>, using 4 wires (a number from 0 to 15 in <b>binary</b>) and a flag wire called <b>StD</b> that means "I heard something!"</p>
${m("Excellent! (Source for the frequencies?)","margin:1.5cqw 2cqw 0 auto")}
`,C=(t,a,o,i=4)=>u(t,a,2.6,i*.9+.8)+b(`M${t+1.1} ${a}a.2.2 0 0 0 .4 0`)+e(t+3.2,a+(i*.9+.8)/2+.3,o,.8),Z=`
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
<svg class="dr-sk" style="width:60cqw;height:12cqw;margin-top:1cqw" viewBox="0 0 24 5" role="img" aria-label="Little drawings of chips with a notch at pin 1"><g filter="url(#dr-rough)">${C(.5,.3,"pin 1 = notch",3)}${C(12,.3,"square pad = pin 1",3)}</g></svg>
${m("Great list!","margin:1.5cqw 2cqw 0 auto")}`,_=`
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
${m("Do not put the batteries in backwards!","margin:1cqw 0 0 42cqw")}
<p class="dr-note ghost" style="left:16cqw;bottom:13cqw">(the board looks like a little city from above)</p>`,tt=[{paper:"cover",body:W},{paper:"lined",body:K},{paper:"lined",body:U},{paper:"lined",body:X},{paper:"lined",body:Q},{paper:"lined",body:Z},{paper:"lined",body:_}],et=[p(0,1,4,3,"MIC",.9),p(6,1,5,3,"AMP|x47",.85),p(13,1,6,3,"LED|DRIVER",.85),p(21,1,6,3,"IR LED",.9,"cr"),c(4,2.5,6,2.5),c(11,2.5,13,2.5),c(19,2.5,21,2.5),e(24,5,"invisible",.8,"middle","cr"),e(24,5.7,"light!",.8,"middle","cr"),p(0,7.5,4,3,"DIAL",.9),p(6,7.5,5,3,"BRAIN|PIC",.85,"cb"),p(13,7.5,6,3,"TONE|MIXER",.85),c(4,9,6,9),c(11,9,13,9),c(16,7.5,16,4),k([10.3,10.5,10.3,11.8,24,11.8]),c(24,11.8,24,12.2),p(21,12.2,6,2.8,"DISPLAY|BOSS",.8),c(24,15,24,15.8),p(21,15.8,6,2.6,"2 DISPLAYS",.8,"cr"),e(13,6.7,"two tones",.8,"middle"),p(6,13,5,3,"EARS|CM8870",.85,"cb"),c(8.5,13,8.5,10.5,"cb"),e(8.2,12.6,"4 wires + StD",.8,"end","cb"),p(0,19,4,3,"PHOTO-|DIODE",.8,"cr"),p(6,19,5,3,"AMP|x21",.85),p(13,19,6,3,"POWER|AMP",.85),p(21,19,6,3,"SPEAKER",.9),c(4,20.5,6,20.5),c(11,20.5,13,20.5),c(19,20.5,21,20.5),c(8.5,19,8.5,16),e(0,17.4,"<- light comes in",.8,"start","cr"),e(12.2,14.8,"SENDING = top",.85,"start","cr"),e(12.2,16.6,"RECEIVING = bottom",.85,"start","cg")].join(""),at=`
<h2>How It All Fits</h2>
<p>Each box is a job. The arrows are wires (the lines from the IR LED and into the photodiode are <b>light</b>). I drew <b>sending</b> on top and <b>receiving</b> on the bottom.</p>
${q(23,"Block diagram: the microphone, amplifier and LED driver send infrared light; the dial, brain, tone mixer and display boss are in the middle; the photodiode, amplifier, decoder, power amplifier and speaker receive",et,"margin-top:1cqw")}
<p style="margin-top:3cqw"><b>TALK</b> turns on the mic and the LED. <b>Digits</b> are two tones from the brain. <b>CLEAR</b> restarts the brain.</p>
<p>When a number is heard, the <b>EARS</b> tell the brain, and the brain tells the <b>DISPLAY BOSS</b>. Both phones show it!</p>
${m("A block diagram first? Very scientific!","margin:1.5cqw 2cqw 0 auto")}`,ot=(()=>{let t="";return t+=e(0,.9,"POWER",.9,"start","cr"),t+=s(1.5,1.7,1.5,3.7)+s(2.3,2.2,2.3,3.2)+s(3.1,1.7,3.1,3.7)+s(3.1,2.7,3.1,2.7),t+=e(1.4,5,"4 x AAA",.8,"middle")+e(3.8,2.2,"+",.9),t+=s(3.1,2.7,8,2.7)+f(5.2,2.7)+$(5.2,2.7)+w(5.2,4.7)+e(5.9,4,"C1 10uF",.75),t+=s(1.5,3.2,1.5,6.2)+w(1.5,6.2)+s(1.5,6.2,1.5,6.2),t+=p(8,1,5,3.4,"MCP1702|5 V",.85,"cb")+e(8.2,.8,"IN",.7)+e(12.8,.8,"OUT",.7,"end"),t+=s(13,2.7,22,2.7)+f(16.5,2.7)+$(16.5,2.7)+w(16.5,4.7)+e(17.2,4,"C2 10uF",.75)+e(22.3,3.1,"+5 V",1,"start","cr"),t+=s(10.5,4.4,10.5,5.6)+w(10.5,5.6)+e(11.2,5.5,"GND",.7),t+=e(0,9.1,"TONE MIXER + IR LED DRIVER",.9,"start","cr"),t+=e(0,11.6,"brain",.8)+e(0,12.3,"RB2",.8)+v(1.6,12.2)+e(2.3,11.4,"1k",.75,"start"),t+=e(0,15.8,"brain",.8)+e(0,16.5,"RB3",.8)+v(1.6,16.4)+e(2.3,15.6,"1k",.75,"start"),t+=s(4.6,12.2,5.5,12.2)+s(4.6,16.4,5.5,16.4)+s(5.5,12.2,5.5,16.4)+f(5.5,14.3),t+=s(5.5,16.4,5.5,17)+$(5.5,17)+w(5.5,19)+e(6.2,18.2,"C6 100nF",.75),t+=s(5.5,14.3,7.4,14.3)+R(8.4,14.3)+e(8.4,13.2,"C7",.75,"middle")+s(9.4,14.3,10,14.3)+v(10,14.3)+e(11.5,13.4,"R15 47k",.75,"middle"),t+=s(13,14.3,14.5,14.3)+f(14.5,14.3),t+=s(10.5,8.2,17,8.2,"cb")+e(10.5,7.8,"TALK line (+5 V while TALK is held)",.8,"start","cb"),t+=s(14.5,8.2,14.5,9.3)+A(14.5,9.3)+e(15.3,10.9,"R8 10k",.75)+s(14.5,12.3,14.5,14.3),t+=s(14.5,14.3,14.5,14.9)+A(14.5,14.9)+e(15.3,16.5,"R9 4.7k",.75)+w(14.5,18.1),t+=s(14.5,14.3,17.8,14.3)+'<circle class="pn" cx="19.3" cy="14.3" r="1.5"/>'+s(18.3,13.2,18.3,15.4,"th"),t+=s(18.3,13.7,19.6,12.6)+s(18.3,14.9,19.6,16)+c(19.1,15.7,19.6,16.1),t+=e(17.4,13.3,"B",.7)+e(21,12.9,"C",.7)+e(21,16.4,"E",.7)+e(19.3,11.9,"Q1",.8,"middle"),t+=s(19.6,12.6,19.6,11)+s(19.6,11,19.6,10.2)+b("M18.6 9L20.6 9L19.6 10.4z","cr")+s(18.6,10.4,20.6,10.4,"cr"),t+=c(21.2,8.9,23.6,7.6,"cr")+c(21.6,10.2,24,8.9,"cr")+e(24.3,8.3,"IR light",.8,"start","cr"),t+=s(19.6,9,19.6,8.4)+A(19.6,5.2)+s(19.6,8.2,19.6,9)+s(19.6,5.2,19.6,4.8)+e(20.4,7.2,"R11 100",.75),t+=s(19.6,4.8,19.6,2.7)+f(19.6,2.7),t+=s(19.6,16,19.6,17)+A(19.6,17)+e(20.4,18.7,"R10 100",.75)+w(19.6,20.1),t+=e(0,22.5,"Voice from the mic joins at the base too, through R12 (10k)",.85,"start","cb"),t+=e(0,23.5,"and C5, while TALK is held (the mic amp makes it bigger).",.85,"start","cb"),t+=e(0,25.5,"LED current = about 8 mA. (I calculated it. I did not measure it.)",.85,"start","cr"),t+=b("M0.2 27.3c3 .6 6-.6 9 0s6 .6 9 0","faint"),t})(),st=`
<h2>Circuit 1: Sending</h2>
<p>This is my circuit, copied neat from the big messy drawing in my lab notebook. Zig-zags are <b>resistors</b>, two bars are <b>capacitors</b>, the ground is the 3 lines that get shorter.</p>
${q(31,"Circuit diagram: the battery feeds a 5 volt regulator; two brain pins go through 1 kilo-ohm resistors and a capacitor into the base of a transistor that switches the infrared LED",ot,"margin-top:1cqw")}
${m("Check your resistor values against the parts list.","margin:1.5cqw 2cqw 0 auto")}`,it=(()=>{let t="";t+=e(0,.9,"RECEIVING",.9,"start","cr"),t+=s(2,1.5,2,2.2)+e(2.4,1.6,"+5 V",.8,"start","cr"),t+=b("M1 3.9L3 3.9L2 2.5z","cr")+s(1,2.5,3,2.5,"cr")+s(2,3.9,2,4.5),t+=c(-.4,1.7,1,2.9,"cr")+c(-.4,3,.9,3.7,"cr"),t+=f(2,4.5)+s(2,4.5,2,5)+A(2,5)+w(2,8.1)+e(2.8,6.8,"R17 47k",.75),t+=e(3.3,2.5,"D1",.8)+s(2,4.5,3.6,4.5)+R(4.6,4.5)+s(5.6,4.5,6,4.5)+v(6,4.5)+e(7.5,3.6,"R18 4.7k",.75,"middle"),t+=s(9,4.5,10,4.5),t+=b("M10 3.2L10 7.6L14.8 5.4z","th")+e(10.3,4.6,"-",1)+e(10.3,6.9,"+",1)+e(11.9,5.6,"B",.8),t+=s(9.2,4.5,9.2,2)+s(9.2,2,11.3,2)+v(11.3,2)+s(14.3,2,15.4,2)+s(15.4,2,15.4,5.4)+f(15.4,5.4)+e(12.8,1.1,"R19 100k",.75,"middle"),t+=s(14.8,5.4,16.6,5.4)+e(15.2,6.6,"LM358",.75,"middle"),t+=s(10,6.4,8.4,6.4)+e(3.4,7.7,"half of 5 V (VMID)",.75,"start"),t+=e(15.8,4.5,"OUT (x21)",.8,"start","cb"),t+=s(15.4,5.4,15.4,5.4)+s(16.6,5.4,17.6,5.4)+R(18.6,5.4)+s(19.6,5.4,20,5.4)+v(20,5.4)+e(21.5,6.6,"R20 47k",.75,"middle"),t+=u(23,3.4,4.6,4,"cb")+e(25.3,5.6,"LM386",.85,"middle")+s(23,5.4,23,5.4),t+=s(25.3,7.4,25.3,9)+$(25.3,9)+s(25.3,11,25.3,11.4)+u(24.3,11.4,2,1.8)+b("M26.3 11.4L27.6 10.6L27.6 14L26.3 13.2")+w(25.3,13.2)+e(25.3,15.6,"speaker",.8,"middle"),t+=s(15.4,5.4,15.4,8)+f(15.4,5.4)+$(15.4,8)+A(15.4,10)+e(16.2,9,"C10",.75)+e(16.2,11.6,"R22 100k",.75)+s(15.4,13,15.4,14.2),t+=u(8.4,14.2,8.2,9.4,"cb")+e(12.5,17.6,"CM8870",1,"middle","cb")+e(12.5,19,"the EARS",.8,"middle");for(let a=0;a<4;a++)t+=c(16.6,15.5+a*1.4,19.6,15.5+a*1.4,"cb")+e(20,15.8+a*1.4,`Q${a+1} to RB${a+4}`,.8);return t+=c(16.6,21.3,19.6,21.3,"cr")+e(20,21.6,"StD to RA4",.8,"start","cr"),t+=s(8.4,16.5,6.4,16.5)+s(8.4,20.5,6.4,20.5)+s(6.4,16.5,6.4,17.6)+s(6.4,19.5,6.4,20.5),t+=s(5.4,17.6,7.4,17.6)+u(5.7,17.9,1.4,1.2)+s(5.4,19.5,7.4,19.5)+e(5.2,18.8,"X1",.8,"end")+e(8.2,21.9,"3.579545 MHz",.8,"end"),t+=s(12.5,23.6,12.5,25)+$(12.5,24.9)+e(13.4,26,"C12 100 nF",.75),t+=s(12.5,26.9,12.5,27.2)+s(12.5,27.2,19,27.2)+c(18.4,27.2,20,27.2)+e(20.4,27.5,"brain clock pin",.8,"start","cr"),t+=e(0,29.6,"The crystal runs the ears AND, through C12, the brain.",.85,"start","cb"),t+=e(0,30.6,"(R23 + R24 + C11 hold the decoder steady: see my big drawing)",.8,"start"),t})(),rt=`
<h2>Circuit 2: Receiving</h2>
<p>The photodiode makes a tiny signal when light hits it. The amplifier makes it bigger (<b>x21</b>, because R19 is 21 times R18). Then it goes <b>two ways</b>: to the speaker amp so I can hear it, and to the decoder that hears the numbers. (The - and + are the amp's two inputs.)</p>
${q(31,"Circuit diagram: the photodiode feeds an amplifier; its output goes to the speaker amplifier and to the CM8870 tone decoder, which sends four code wires and a flag to the brain",it,"margin-top:1cqw")}
`,nt=(()=>{let t='<circle class="pn" cx="5" cy="5" r="3.6"/>';for(let a=0;a<12;a++){const o=a*Math.PI/6;t+=s(5+3.6*Math.cos(o),5+3.6*Math.sin(o),5+3.1*Math.cos(o),5+3.1*Math.sin(o))}return t+=c(5,5,7.9,2.4,"cr")+e(5,9.9,"a 16-bit counter",.8,"middle"),t+=e(1.3,5.3,"0",.8)+e(9,5.3,"32768",.7)+e(5,1,"top half = HIGH",.7,"middle","cb"),t+=k([11,7,11,3,14,3,14,7,17,7,17,3,20,3,20,7,23,7,23,3,26,3],"cb"),t+=e(18.5,9,"the top bit = the tone",.85,"middle","cb"),t})(),ht=`
<h2>Making the Tones</h2>
<p>The brain has no speaker pin and no sine waves. It does a <b>counting trick</b>. Picture a clock with <b>65,536</b> ticks around it. Every time through its loop, the brain moves the hand forward by a number. When the hand is in the top half, the pin is HIGH, and in the bottom half it is LOW. A square wave! Faster hand = higher note.</p>
${T(28,10.5,"A clock face with a hand: the counter. Below it, the square wave made by the top bit.",nt,{width:80,rot:-.5,caption:"The hand moves a little every loop",style:"margin:2cqw 0 5cqw 0"})}
<p><b>How fast does it loop?</b> The crystal rings at 3,579,545 per second. The brain does 1 instruction per 4 rings = <b>894,886</b> per second. My loop takes exactly <b>24</b> instructions, so it goes round <b>37,287</b> times a second.</p>
<p><b>The number to add for 697 Hz:</b> 697 x 65,536 / 37,287 = <b>1,225</b>. (For 770 it is 1,353. For 1336 it is 2,348. The program does the rest.)</p>
<p>Two counters run at once, one per pin: <b>RB2</b> is the row note and <b>RB3</b> the column. Two 1k resistors and a 100 nF capacitor add them and round off the corners (page 8). A tone lasts about <b>0.1 second</b> (103 ms).</p>
<p class="box" style="margin-top:2cqw"><b>Try it on a calculator:</b> keep adding 1,225. Every time you go past 65,536, take 65,536 away. It takes <b>53.5 adds</b> to go once around. And 37,287 loops a second / 53.5 = <b>697</b> times around every second. That is the note!</p>
${m("Wow. Is that really how it works?","margin:1cqw 0 0 40cqw")}`,dt=(()=>{let t="";return t+=u(.4,.4,7.2,8.6)+P(2,2,"abcdg","faint")+e(4,10.7,"LCD",.9,"middle"),t+=u(10.4,.4,7.2,8.6,"cr")+P(12,2,"abcdg")+e(14,10.7,"LED",.9,"middle","cr"),t+=`<g>${[...Array(5)].map((a,o)=>c(11+o*1.2,10,11.4+o*1.2,9.4,"cr")).join("")}</g>`.slice(0,0),t})(),ct=`
<h2>LCD or LED?</h2>
<p>I wanted a screen like on a calculator (an <b>LCD</b>). But I picked <b>LED</b> numbers. Here is why.</p>
${T(18,11.5,"A gray LCD digit 3 next to a red LED digit 3",dt,{width:40,rot:1,caption:"same 3, different guts",style:"float:right;margin:0 0 4cqw 3cqw"})}
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
${m("A fair test of two designs: you listed pros and cons!","margin:1.5cqw 2cqw 0 auto")}`,lt=(()=>{const t="0000000100000011";let a=e(0,.9,"DIN",.9,"start","cb")+e(0,4.2,"CLK",.9,"start","cr")+e(0,7.3,"LOAD",.9,"start","cg");const o=3,i=1.5,r=[];let h=1.7;for(let d=0;d<16;d++){const g=t[d]==="1"?.6:1.8;d===0?r.push(o,g):r.push(o+d*i,h,o+d*i,g),r.push(o+(d+1)*i,g),h=g,a+=e(o+d*i+i/2,3,t[d],.75,"middle")}a+=k(r,"cb");const l=[o,5.6];for(let d=0;d<16;d++)l.push(o+d*i+i*.3,5.6,o+d*i+i*.3,4.4,o+d*i+i*.8,4.4,o+d*i+i*.8,5.6);return l.push(o+16*i+1,5.6),a+=k(l,"cr"),a+=k([o,8.6,o+16*i+.4,8.6,o+16*i+.4,7.4,o+16*i+1.8,7.4,o+16*i+1.8,8.6,o+16*i+3,8.6],"cg"),a+=s(o+8*i,.2,o+8*i,2.4,"faint"),a+=e(o+4*i,-.4,"address = 01 (digit 1)",.75,"middle")+e(o+12*i,-.4,"data = 03 (show a 3)",.75,"middle"),a+=e(o+16*i+1.8,7.2,"latch!",.75,"middle","cg"),a})(),bt=(()=>{let t=P(1,1.5,"abcdg")+e(1.8,1,"a",.8,"middle")+e(4.6,3.3,"b",.8)+e(4.6,6.5,"c",.8)+e(1.8,8,"d",.8,"middle")+e(.1,6.5,"e",.8)+e(.1,3.3,"f",.8)+e(1.8,5.3,"g",.8,"middle");return t+=e(7,3,"The 3 lights",.9,"start","cr")+e(7,4,"a b c d g",.9,"start","cr")+e(7,5.2,"(the dot is the 8th)",.75),t})(),pt=`
<h2>Driving the Display</h2>
<p>Each digit is <b>7 little lines</b> (a to g) and a <b>dot</b>. To show a 3, light a, b, c, d and g. The <b>MAX7219</b> knows all that, so I just send it the number.</p>
${q(9,"A seven-segment digit 3 with its segments labeled a to g",bt,"margin-top:0")}
<p><b>3 wires</b> from the brain: <b>DIN</b> (data), <b>CLK</b> (clock), <b>LOAD</b>. I send <b>16 bits</b> in a row, one for each clock pulse, biggest bit first: 8 bits say <b>which digit</b>, 8 bits say <b>what to show</b>. When LOAD goes up, the chip keeps it.</p>
${q(9.5,"Timing chart: sixteen bits on DIN, sixteen clock pulses, and LOAD going high at the end",lt,"margin-top:2.5cqw")}
<p style="margin-top:2cqw"><b>First the brain sets it up</b> (4 words): scan all 8 digits, decode numbers for me, brightness low, turn on.</p>
<p><b>Multiplexing:</b> the chip lights <b>one digit at a time</b>, super fast (the whole set about 800 times a second), and your eye blends it. All digits share the same 8 segment wires, so there are fewer wires. Nothing typed yet? A dash (-) shows.</p>`,gt=[{paper:"graph",body:at},{paper:"graph",body:st},{paper:"graph",body:rt},{paper:"lined",body:ht},{paper:"lined",body:ct},{paper:"graph",body:pt}],mt=""+new URL("board-back-DHf-GcOf.png",import.meta.url).href,ut=`
<h2>Building It (1)</h2>
<p><b>Safety first:</b> the iron can burn you. Grandpa watches. Hair back. Open a window.</p>
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
${m("Good safety notes. Chips can be replaced. Fingers cannot.","margin:1cqw 0 0 36cqw")}
<svg class="dr-sk dr-note" style="left:17cqw;bottom:11cqw;width:15cqw;height:9cqw" viewBox="0 0 12 6" role="img" aria-label="Doodle of Sparky"><g filter="url(#dr-rough)">${E(4,1.6,1)}</g></svg>
<p class="dr-note ghost" style="right:9cqw;bottom:11cqw">stay back, Sparky!!</p>`,wt=`
<h2>Building It (2)</h2>
${x(mt,"The back of the board: the PIC, the decoder, the display driver, the amplifiers, the crystal, the regulator and the programming header, with pencil labels.",{width:46,rot:-1.2,caption:"the back (where the brains live)",style:"float:right;margin:0 0 7cqw 3cqw"},[["<-- BRAIN",49,80],["EARS --",15,74],["DISPLAY BOSS",50,30],["5 V",76,85],["crystal",12,66],["J1",32,94]])}
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
${m("A test after each step. This is how real engineers work!","margin:1.5cqw 2cqw 0 auto")}`,ft=(()=>{let t=u(0,0,28,13.5,"th")+e(14,1.2,"DEX MARK 1 HAND PROGRAMMER",1,"middle","cr");const a=[1,0,1,0,0,0,0,0,0,0,0,1,0,1];t+=e(.5,2.6,"WORD (to remember where I am):",.8);for(let o=0;o<14;o++){const i=1.9+o*1.85;t+=u(i-.4,4.2,.8,1.4)+s(i,4.9,i,a[o]?3.4:6.4,"th")+e(i,7.4,String(13-o),.7,"middle")}return t+=e(.5,8.6,"14 switches: bit 13 ... bit 0   (0x2805 = goto 5)",.8),t+='<circle class="pn th" cx="5" cy="11.2" r="1.4"/>'+e(5,13.3,"CLOCK",.9,"middle","cr"),t+=u(10.4,10.2,1.2,2)+s(11,11.2,11,9.6,"th")+e(11,13.3,"DIN",.9,"middle","cb"),t+=u(16.4,10.2,1.2,2)+s(17,11.2,17,12.8,"th")+e(17,13.3,"Vpp",.9,"middle","cg"),t+='<circle class="pn" cx="22.6" cy="11" r=".7"/><circle class="pn" cx="25" cy="11" r=".7"/>'+e(22.6,12.9,"PGD",.75,"middle")+e(25,12.9,"PGC",.75,"middle"),t+=c(7,11.2,9.4,11.2),t})(),yt=`
<h2>Programming (1): Switches</h2>
<p>The brain is empty when you buy it. My program is <b>337 words</b> (the assembler said). First idea: <b>do it by hand</b> with toggle switches, like the card computer in the library book.</p>
${q(13.5,"Drawing of a hand programmer: fourteen word switches, a clock push-button, a data switch, a Vpp switch and two lamps",ft,"margin-top:1cqw")}
<p style="margin-top:2cqw"><b>The chip takes one bit at a time:</b> set DIN, press CLOCK. A word is a 6-bit command (LOAD DATA) and 16 bits (a 0, the 14 bits, a 0).</p>
<p><b>My math:</b> 6 + 16 = <b>22</b> presses a word. x 337 = <span class="x">7,414</span> ... <b>wait!</b> I forgot BEGIN PROGRAMMING (6) and NEXT ADDRESS (6): <b>34</b> a word. x 337 = <b>11,458</b>. And the empty spaces (463 of them) still need NEXT ADDRESS, 6 each = <b>2,778</b> more. <b>14,236 presses!</b> One a second = <b>4 hours</b>, no sneezing.</p>
<p>I tried. I got to <b>word 41</b> (1,394 presses) and flipped DIN wrong somewhere. No way to see which bit.</p>
<p class="box"><b>Paper tape?</b> 337 words x 2 rows = 674 rows, 10 to the inch = <b>67 inches</b> of tape and about 2,400 holes with my hole punch. And no tape reader. <b>Out.</b></p>
<p style="font-size:4.4cqw;transform:rotate(-2deg);margin:1cqw 0 0 4cqw">GAVE UP AT WORD 41.</p>
${m("Failure is data. What did you try next?","margin:1.5cqw 2cqw 0 auto")}`,kt=`
<h2>Programming (2): Oops</h2>
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
`,Tt=(()=>{let t=p(0,.5,8,11,"ARDUINO|NANO",1);const a=[["D6","MCLR","1"],["5V","+5 V","2"],["GND","GND","3"],["D7","PGD","4"],["D8","PGC","5"],["D9","PGM","6"]];return a.forEach(([o],i)=>{const r=2.4+i*1.6;t+=e(7.6,r+.3,o,.85,"end")+s(8,r,16,r,i===1?"cr":i===2?"":"cb")}),t+=u(16,.5,8,11)+e(20,1.7,"J1",.95,"middle"),a.forEach(([,o,i],r)=>{const h=2.4+r*1.6;t+=e(16.3,h+.3,i,.85,"start")+e(23.6,h+.3,o,.85,"end")}),t+=e(12,13.4,"chip in, CM8870 socket EMPTY",.9,"middle","cr"),t})(),At=`
<h2>Programming (3): It Works</h2>
<p>A small <b>Arduino Nano</b> plus a free program called <b>ZEPPP</b> (Zero External Parts PIC Programmer, by battlecoder) can talk to the chip through the board's 6-pin header, <b>J1</b>. No extra parts!</p>
${T(28,14.4,"Wiring chart: six wires from the Arduino Nano pins D6, 5V, GND, D7, D8 and D9 to header J1 pins 1 to 6",Tt,{width:76,rot:.6,caption:"Six wires. Pin 1 of J1 is the square pad.",style:"margin:1cqw 0 6cqw 0"})}
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
${m("Verify then read it back: very careful!","margin:1.5cqw 2cqw 0 auto")}`,vt=[[697,1225,"697.0","0.00"],[770,1353,"769.8","-0.03"],[852,1498,"852.3","+0.03"],[941,1654,"941.0","+0.01"],[1209,2125,"1209.0","0.00"],[1336,2348,"1335.9","-0.01"],[1477,2596,"1477.0","0.00"],[1633,2870,"1632.9","-0.01"]].map(([t,a,o,i])=>`<tr><td class="n">${t}</td><td class="n">${a}</td><td class="n">${o}</td><td class="n">${i}%</td><td class="n x">&nbsp;</td></tr>`).join(""),$t=`
<h2>Results</h2>
<h3>Table 1: the tones</h3>
<table class="tight">
<tr><th>it should be (Hz)</th><th>number to add</th><th>my chip makes (Hz)</th><th>off by</th><th>MEASURED</th></tr>
${vt}
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
${m("Calculated vs measured: you labeled them. A+ for honesty.","margin:1.5cqw 2cqw 0 auto")}`,qt=`
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
${m("A fine report, Dex! Next time, please keep it away from the dog.","margin:1.5cqw 2cqw 0 auto")}`,It=`
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
<svg class="dr-sk" style="position:absolute;right:9cqw;bottom:7cqw;width:32cqw;height:auto" viewBox="0 0 14 8" role="img" aria-label="Doodle of Sparky and the Moon"><g filter="url(#dr-rough)">${E(1,3,1.3)}${O(11,2.5,1.8)}</g></svg>
<p class="ghost" style="margin-top:3cqw">THE END (really).</p>
${m("Wonderful. Good luck at the Science Fair!","margin:1.5cqw 2cqw 0 auto")}`,Et=[{paper:"lined",body:ut},{paper:"lined",body:wt},{paper:"graph",body:yt},{paper:"lined",body:kt},{paper:"lined",body:At},{paper:"lined",body:$t},{paper:"lined",body:qt},{paper:"lined",body:It}],Mt=[...tt,...gt,...Et];function Dt(t){const a=[];for(let o=0;o<3;o++)a.push(y("i",{class:"dr-smudge","aria-hidden":"true",style:`left:${(t()*80+5).toFixed(1)}%;top:${(t()*85+4).toFixed(1)}%;--s:${(8+t()*14).toFixed(1)}cqw;--r:${(t()*80-40).toFixed(0)}deg`}));return y("div",{class:"dr-wear"},...a)}async function Vt(t){return Mt.map((a,o)=>{const i=H(B(`dex${o}${t.title}`)),r=N("div","dr-in",a.body),h=a.paper==="cover"?null:y("p",{class:"dr-head"},"Dex Dynamo",y("br"),y("span",null,"Moon School Science Fair")),l=a.paper==="cover"?null:y("span",{class:"dr-no"},String(o)),d=a.paper==="cover"?null:y("i",{class:"dr-holes","aria-hidden":"true"}),g=F(8.5,11,`dr dr-${a.paper}`,Dt(i),h,r,l,d);return g.el.setAttribute("role","group"),g.el.setAttribute("aria-label",o===0?"Cover of THE POCKET TELEPHONE":`Page ${o} of THE POCKET TELEPHONE`),g})}export{Mt as DEX_PAGES,Vt as dexReportSheets};
