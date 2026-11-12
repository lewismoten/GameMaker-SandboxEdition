/* empty css              */const n=550,f=850;function y(t,r,e){const[o,i]=[r[0]-t[0],r[1]-t[1]],a=Math.hypot(o,i),s=[o/a,i/a],c=l=>{const h=(l[0]-t[0])*s[0]+(l[1]-t[1])*s[1],m=[t[0]+h*s[0],t[1]+h*s[1]],d=[2*m[0]-l[0],2*m[1]-l[1]];return[m[0]+e*(d[0]-m[0]),m[1]+e*(d[1]-m[1])]},g=l=>[Math.round(l[0]*10)/10,Math.round(l[1]*10)/10];return{sheet:[[0,0],[n,0],r,t].map(g),flap:[t,r,c([n,f]),c([0,f])].map(g)}}const u=`
.gmc-game {
  image-rendering: pixelated;
}

.gmc-minor {
  fill: none;
  stroke: rgba(255, 255, 255, 0.13);
  stroke-width: 0.6;
}

.gmc-major {
  fill: none;
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 1;
}

.gmc-border {
  fill: none;
  stroke: rgba(255, 255, 255, 0.75);
  stroke-width: 1.5;
}

.gmc-ink {
  fill: none;
  stroke: rgba(255, 255, 255, 0.7);
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.gmc-faint {
  stroke: rgba(255, 255, 255, 0.38);
}

.gmc-thin {
  stroke-width: 0.8;
}

.gmc-fill {
  fill: rgba(255, 255, 255, 0.45);
  stroke: none;
}

.gmc-dim {
  stroke-width: 0.9;
}

text {
  stroke: none;
  fill: #fff;
  font-family: Helvetica, Arial, sans-serif;
}

.gmc-label {
  font-size: 9px;
  letter-spacing: 0.08em;
  fill: rgba(255, 255, 255, 0.85);
}

.gmc-hand {
  font: italic 15px 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive;
  fill: rgba(255, 255, 255, 0.78);
}

.gmc-kicker {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.32em;
}

.gmc-title {
  font: 900 172px/1 Impact, Haettenschweiler, 'Arial Narrow Bold', 'Arial Black', sans-serif;
  fill: url(#gmc-chrome);
  stroke: #0c2550;
  stroke-width: 3;
  paint-order: stroke;
  filter: drop-shadow(4px 6px 0 rgba(6, 20, 50, 0.55));
}

.gmc-se-ring {
  fill: #fff;
  stroke: #0c2550;
  stroke-width: 3;
}

.gmc-se {
  font: 900 46px/1 Impact, 'Arial Black', sans-serif;
  fill: #1f4f9a;
}

.gmc-edition {
  font: italic 700 38px/1 Georgia, 'Times New Roman', serif;
}

.gmc-version {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.2em;
}

.gmc-rule {
  stroke: #fff;
  stroke-width: 2;
}

.gmc-block {
  fill: none;
  stroke: rgba(255, 255, 255, 0.8);
  stroke-width: 1;
}

.gmc-block text {
  font-size: 10px;
  letter-spacing: 0.06em;
}

.gmc-fork {
  font: italic 12.5px Georgia, 'Times New Roman', serif;
  fill: rgba(255, 255, 255, 0.92);
}

.gmc-owner {
  font: 900 30px/1 'Arial Black', Arial, sans-serif;
  letter-spacing: 0.08em;
  stroke: #000;
  stroke-width: 5;
  paint-order: stroke;
}

.gmc-sticker .gmc-st-arc {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.gmc-sticker .gmc-st-num {
  font-size: 13px;
  font-weight: 800;
}

.gmc-sticker .gmc-st-small {
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
`,x=t=>t.map(([r,e])=>`${r},${e}`).join(" ");function p(t,r,e,o,i,a=-6){const s=(t+e)/2,c=(r+o)/2,g=t===e;return`<line x1="${t}" y1="${r}" x2="${e}" y2="${o}" marker-start="url(#gmc-arrow)" marker-end="url(#gmc-arrow)"/>
    <text class="gmc-label" x="${g?s+a:s}" y="${g?c:c+a}" ${g?`transform="rotate(-90 ${s+a} ${c})"`:""} text-anchor="middle">${i}</text>`}const $=["0001111000","0011111100","0011010100","0001111000","0000110000","0111111110","1001111001","0001111000","0011001100","0110000110"];function w(t,r,e){const o=$.length,i=[];for(let s=0;s<=o;s++)i.push(`<line x1="${t}" y1="${r+s*e}" x2="${t+o*e}" y2="${r+s*e}"/>`),i.push(`<line x1="${t+s*e}" y1="${r}" x2="${t+s*e}" y2="${r+o*e}"/>`);const a=$.flatMap((s,c)=>[...s].flatMap((g,l)=>g==="1"?[`<rect x="${t+l*e}" y="${r+c*e}" width="${e}" height="${e}"/>`]:[]));return`<g class="gmc-thin">${i.join("")}</g><g class="gmc-fill">${a.join("")}</g>
    <g class="gmc-dim">${p(t,r-12,t+o*e,r-12,"20 PIXELS")}${p(t-12,r,t-12,r+o*e,"20 PIXELS")}</g>`}function b(){return`
  <g class="gmc-ink">
    <!-- a picture block, pixel by pixel -->
    ${w(212,512,10)}
    <text class="gmc-hand" x="208" y="632">hero.cbl, block 0</text>
    <!-- a joystick -->
    <g transform="translate(440 548) scale(.8)">
      <rect x="-62" y="10" width="124" height="44" rx="10"/>
      <ellipse cx="0" cy="10" rx="30" ry="8"/>
      <line x1="0" y1="10" x2="10" y2="-62"/>
      <circle cx="11" cy="-72" r="13"/>
      <circle cx="-42" cy="26" r="8"/><circle cx="-42" cy="26" r="3"/>
      <line x1="-42" y1="18" x2="-90" y2="-24"/>
      <text class="gmc-label" x="-92" y="-30" text-anchor="middle">FIRE 1</text>
      <path d="M 40 -40 A 46 46 0 0 0 -30 -42" stroke-dasharray="4 4" marker-end="url(#gmc-arrow)"/>
      <text class="gmc-label" x="58" y="-46">8 WAYS</text>
    </g>
    <!-- a 3.5 inch diskette, behind the title: shutter down, label up -->
    <g transform="translate(372 96) rotate(9)" class="gmc-faint">
      <rect x="0" y="0" width="140" height="146" rx="5"/>
      <rect x="32" y="102" width="74" height="44"/>
      <rect x="42" y="108" width="18" height="30"/>
      <rect x="20" y="6" width="100" height="70"/>
      <line x1="30" y1="44" x2="110" y2="44"/><line x1="30" y1="60" x2="110" y2="60"/>
    </g>
    <!-- a protractor arc and center mark -->
    <g class="gmc-faint">
      <circle cx="120" cy="300" r="96"/>
      <circle cx="120" cy="300" r="70" stroke-dasharray="2 6"/>
      <line x1="10" y1="300" x2="230" y2="300"/><line x1="120" y1="190" x2="120" y2="410"/>
    </g>
    <text class="gmc-hand" x="330" y="618" transform="rotate(-8 330 618)">jump = 3 blocks?</text>
    <text class="gmc-hand" x="36" y="500" transform="rotate(-3 36 500)">320 x 200, 256 colors</text>
  </g>`}function M(t,r,e){const o=e*.78;return`<g class="gmc-sticker" transform="rotate(-16 ${t} ${r})">
    <circle cx="${t+2}" cy="${r+3}" r="${e}" fill="rgba(0,0,0,.35)"/>
    <circle cx="${t}" cy="${r}" r="${e}" fill="url(#gmc-red)"/>
    <path id="gmc-arc" d="M ${t-o} ${r} A ${o} ${o} 0 0 1 ${t+o} ${r}" fill="none"/>
    <text class="gmc-st-arc"><textPath href="#gmc-arc" startOffset="50%" text-anchor="middle">TECHNICAL SUPPORT</textPath></text>
    <text class="gmc-st-num" x="${t}" y="${r+e*.26}" text-anchor="middle">1-800-555-0176</text>
    <text class="gmc-st-small" x="${t}" y="${r+e*.5}" text-anchor="middle">9 AM–6 PM EASTERN</text>
    <text class="gmc-st-small" x="${t}" y="${r+e*.68}" text-anchor="middle">MONDAY–FRIDAY</text>
    <ellipse cx="${t-e*.3}" cy="${r-e*.5}" rx="${e*.42}" ry="${e*.16}" fill="rgba(255,255,255,.22)" transform="rotate(-24 ${t-e*.3} ${r-e*.5})"/>
  </g>`}const k="Owner’s Guide cover: GAME-MAKER, Sandbox Edition, Version 3.0, in white on a blue blueprint of a hero drawn pixel by pixel, a joystick, and a diskette. The bottom of the blueprint is peeled back to show a game made with Game-Maker. A red sticker reads Technical Support, 1-800-555-0176, 9 AM to 6 PM Eastern, Monday to Friday.";function E(t,r){const{sheet:e,flap:o}=y([0,792],[n,664],.3),[i,a,s,c]=o,g=[(s[0]+c[0])/2-6,(s[1]+c[1])/2-14],l=`M ${i[0]} ${i[1]} L ${a[0]} ${a[1]} L ${s[0]} ${s[1]} Q ${g[0]} ${g[1]} ${c[0]} ${c[1]} Z`,h=n*200/320,m=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${f}" preserveAspectRatio="xMidYMid slice">
  <style>${u}</style>
  <defs>
    <pattern id="gmc-grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 10 0 V 50 M 20 0 V 50 M 30 0 V 50 M 40 0 V 50 M 0 10 H 50 M 0 20 H 50 M 0 30 H 50 M 0 40 H 50" class="gmc-minor"/>
      <path d="M 0 0 V 50 M 0 0 H 50" class="gmc-major"/>
    </pattern>
    <radialGradient id="gmc-blue" cx="45%" cy="35%" r="80%">
      <stop offset="0" stop-color="#2f6cc0"/><stop offset=".6" stop-color="#1f4f9a"/><stop offset="1" stop-color="#143a76"/>
    </radialGradient>
    <linearGradient id="gmc-chrome" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#e4eefb"/><stop offset=".56" stop-color="#b9cde9"/><stop offset="1" stop-color="#f4f8ff"/>
    </linearGradient>
    <radialGradient id="gmc-red" cx="40%" cy="35%" r="70%">
      <stop offset="0" stop-color="#ef3b33"/><stop offset="1" stop-color="#b3121a"/>
    </radialGradient>
    <linearGradient id="gmc-back" gradientUnits="userSpaceOnUse" x1="${(i[0]+a[0])/2}" y1="${(i[1]+a[1])/2}" x2="${(s[0]+c[0])/2}" y2="${(s[1]+c[1])/2}">
      <stop offset="0" stop-color="#8ea6c6"/><stop offset=".35" stop-color="#e9eff7"/><stop offset=".7" stop-color="#f7f9fc"/><stop offset="1" stop-color="#b8c8de"/>
    </linearGradient>
    <linearGradient id="gmc-shade" gradientUnits="userSpaceOnUse" x1="${(i[0]+a[0])/2}" y1="${(i[1]+a[1])/2}" x2="${(i[0]+a[0])/2+12}" y2="${(i[1]+a[1])/2+60}">
      <stop offset="0" stop-color="rgba(0,0,0,.55)"/><stop offset="1" stop-color="rgba(0,0,0,0)"/>
    </linearGradient>
    <marker id="gmc-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 1 L 9 5 L 0 9 z" fill="#fff"/>
    </marker>
    <filter id="gmc-soft" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="-3" dy="-4" stdDeviation="5" flood-color="#000" flood-opacity=".45"/></filter>
    <clipPath id="gmc-sheet"><polygon points="${x(e)}"/></clipPath>
  </defs>
  <!-- under the sheet: a game -->
  <rect width="${n}" height="${f}" fill="#000"/>
  ${t?`<image href="${t}" x="0" y="${f-h}" width="${n}" height="${h}" preserveAspectRatio="none" class="gmc-game"/>`:""}
  <polygon points="${x([i,a,[n,f],[0,f]])}" fill="url(#gmc-shade)"/>
  <text class="gmc-owner" x="${n/2}" y="${f-22}" text-anchor="middle">OWNER’S GUIDE</text>
  <!-- the blueprint -->
  <g clip-path="url(#gmc-sheet)">
    <rect width="${n}" height="${f}" fill="url(#gmc-blue)"/>
    <rect width="${n}" height="${f}" fill="url(#gmc-grid)"/>
    <rect x="14" y="14" width="${n-28}" height="${f-28}" class="gmc-border"/>
    ${b()}
    <text class="gmc-kicker" x="32" y="52">DESIGN · DRAW · PLAY</text>
    <text class="gmc-title" x="32" y="222" textLength="486" lengthAdjust="spacingAndGlyphs">GAME</text>
    <text class="gmc-title" x="32" y="382" textLength="486" lengthAdjust="spacingAndGlyphs">MAKER</text>
    <text class="gmc-edition" x="32" y="434">Sandbox Edition</text>
    <g transform="rotate(-12 482 418)">
      <circle cx="482" cy="418" r="36" class="gmc-se-ring"/>
      <text class="gmc-se" x="482" y="433" text-anchor="middle">SE</text>
    </g>
    <line x1="32" y1="450" x2="430" y2="450" class="gmc-rule"/>
    <!-- the drawing's title block -->
    <g class="gmc-block" transform="translate(${n-222} 26)">
      <rect width="196" height="40"/>
      <line x1="0" y1="20" x2="196" y2="20"/><line x1="112" y1="0" x2="112" y2="20"/>
      <text x="5" y="14">VERSION 3.0</text><text x="117" y="14">SHEET 1 OF 1</text>
      <text x="5" y="34">SCALE: 1 PIXEL = 1 PIXEL</text>
    </g>
    <text class="gmc-fork" x="32" y="472">A new guide for this fork of RSD Game-Maker, not the manual RSD shipped in 1994.</text>
    ${M(100,636,58)}
  </g>
  <!-- the peeled-back flap: the back of the sheet -->
  <path d="${l}" fill="url(#gmc-back)" filter="url(#gmc-soft)"/>
  <path d="${l}" fill="none" stroke="rgba(30,50,90,.35)" stroke-width="1"/>
</svg>`,d=document.createElement("img");return d.className="gmc",d.alt=r?`${k} The game is ${r}.`:k,d.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(m)}`,d}export{f as COVER_H,n as COVER_W,E as gmCover,y as peel};
