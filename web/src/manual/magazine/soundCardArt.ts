// Pictures for the Sound Boaster ad (sections/soundCardAd.ts): the card itself, a green 8-bit
// ISA board with its FM music chip, its digital sound chip, a crystal, jumpers, gold fingers
// and a metal bracket of jacks, a volume wheel and the joystick/MIDI port; and a player's face
// before it (the PC speaker) and after. Sound Boaster and Recreative Labs are made up.
import './soundCardArt.css';

const SVG = 'http://www.w3.org/2000/svg';

function svg(cls: string, viewBox: string, markup: string, alt: string): Element {
  const el = document.createElementNS(SVG, 'svg');
  el.setAttribute('class', cls);
  el.setAttribute('viewBox', viewBox);
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', alt);
  el.innerHTML = markup;
  return el;
}

const chip = (x: number, y: number, w: number, hgt: number, label: string, sub: string) => {
  const legs = Math.floor((w - 6) / 5);
  let pins = '';
  for (let i = 0; i < legs; i++)
    pins += `<rect x="${x + 4 + i * 5}" y="${y - 2}" width="2" height="2"/><rect x="${x + 4 + i * 5}" y="${y + hgt}" width="2" height="2"/>`;
  return (
    `<g fill="#c9ccd2">${pins}</g><rect x="${x}" y="${y}" width="${w}" height="${hgt}" rx="1" fill="#1b1b1d"/>` +
    `<circle cx="${x + 4}" cy="${y + hgt / 2}" r="1.4" fill="#333"/>` +
    `<text x="${x + w / 2}" y="${y + hgt / 2 - 1}" fill="#e8e6df" font-size="6" font-family="Arial, sans-serif" font-weight="700" text-anchor="middle">${label}</text>` +
    `<text x="${x + w / 2}" y="${y + hgt / 2 + 6}" fill="#9c9a94" font-size="4" font-family="Arial, sans-serif" text-anchor="middle">${sub}</text>`
  );
};

const cap = (x: number, y: number, c = '#2a4f9c') =>
  `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/><circle cx="${x}" cy="${y}" r="2.6" fill="none" stroke="#c9ccd2" stroke-width="0.6"/>`;

function card(): string {
  let traces = '';
  for (let i = 0; i < 9; i++) traces += `<path d="M${70 + i * 18} 132 V${112 - (i % 3) * 6} H${92 + i * 14}" />`;
  let fingers = '';
  for (let i = 0; i < 31; i++) fingers += `<rect x="${74 + i * 6.2}" y="134" width="4.4" height="13" rx="0.6"/>`;
  return (
    // the board and its edge connector
    `<path d="M22 8 H312 V130 H262 V146 H70 V130 H22 Z" fill="#1d6b3a"/>` +
    `<g fill="#d9b44a">${fingers}</g>` +
    `<g fill="none" stroke="#2f8f52" stroke-width="1.4">${traces}<path d="M40 40 H120 V28"/><path d="M220 60 H290 V100"/><path d="M60 100 H140 V80"/></g>` +
    // the bracket: jacks, the volume wheel and the joystick/MIDI port
    `<rect x="4" y="2" width="20" height="132" rx="2" fill="#b9bcc2"/><rect x="21" y="2" width="3" height="132" fill="#8d9096"/>` +
    `<g fill="#1b1b1d">${[16, 32, 48].map((y) => `<circle cx="14" cy="${y}" r="4.6"/>`).join('')}</g>` +
    `<g fill="#c9ccd2">${[16, 32, 48].map((y) => `<circle cx="14" cy="${y}" r="1.6"/>`).join('')}</g>` +
    `<rect x="8" y="58" width="12" height="16" rx="1.5" fill="#3a3a3c"/><g stroke="#77777a" stroke-width="0.8">${[61, 64, 67, 70].map((y) => `<line x1="9" x2="19" y1="${y}" y2="${y}"/>`).join('')}</g>` +
    `<path d="M8 84 L20 86 V124 L8 126 Z" fill="#2a2a2c"/><g fill="#c9a640">${[90, 96, 102, 108, 114, 120].map((y) => `<circle cx="12" cy="${y}" r="1"/><circle cx="16" cy="${y + 2}" r="1"/>`).join('')}</g>` +
    // the chips, the crystal, capacitors and jumpers
    chip(140, 24, 58, 28, 'RL-FM9', 'FM MUSIC') +
    chip(212, 24, 50, 24, 'RL-DSP', 'DIGITAL SOUND') +
    chip(98, 66, 34, 18, 'RL-AMP', '4 W') +
    chip(214, 70, 40, 20, 'RL-ROM', '1995') +
    `<rect x="272" y="30" width="18" height="8" rx="4" fill="#c9ccd2"/><text x="281" y="36" font-size="4" text-anchor="middle" font-family="Arial">14.3</text>` +
    cap(56, 28) +
    cap(68, 40, '#1b1b1d') +
    cap(286, 58) +
    cap(166, 74, '#1b1b1d') +
    cap(180, 74) +
    `<g fill="#1b1b1d">${[0, 1, 2, 3].map((i) => `<rect x="${270 + i * 8}" y="${80}" width="5" height="10"/>`).join('')}</g><rect x="278" y="80" width="5" height="5" fill="#d33"/>` +
    `<text x="282" y="99" font-size="4.5" fill="#e8f5e8" font-family="Arial" text-anchor="middle">IRQ 7 · 220h</text>` +
    // the name, as big as the board allows
    `<text x="36" y="118" font-size="17" font-weight="900" fill="#f4f1e6" font-family="'Arial Black', Arial, sans-serif" letter-spacing="0.5">SOUND BOASTER</text>` +
    `<text x="38" y="126" font-size="5.2" fill="#cfe8d6" font-family="Arial, sans-serif">RECREATIVE LABS · SOUND BLASTER COMPATIBLE · REV. A</text>` +
    `<g transform="rotate(-8 60 60)"><rect x="36" y="52" width="46" height="20" fill="#ffd400"/><text x="59" y="60" font-size="5" font-weight="700" text-anchor="middle" font-family="Arial">Q.C. PASSED</text><text x="59" y="67" font-size="4" text-anchor="middle" font-family="Arial">and it knows it</text></g>`
  );
}

/** A player's face, bored at the PC speaker's beep or blown back by the card. */
function face(boom: boolean): string {
  const skin = '#f2c9a0';
  const base = `<rect width="120" height="120" fill="${boom ? '#ffe14d' : '#d9d6cc'}"/>`;
  if (!boom)
    return (
      base +
      `<path d="M30 52 Q60 18 90 52 Z" fill="#6b3f1f"/><circle cx="60" cy="66" r="30" fill="${skin}"/>` +
      `<path d="M31 56 Q60 34 89 56 L89 50 Q60 26 31 50 Z" fill="#6b3f1f"/>` +
      `<path d="M44 64 h10 M66 64 h10" stroke="#222" stroke-width="2.4"/><path d="M44 61 h10 M66 61 h10" stroke="${skin}" stroke-width="3"/>` +
      `<path d="M52 82 h16" stroke="#7a3b2c" stroke-width="2.4"/>` +
      `<path d="M78 18 h34 v18 h-22 l-6 6 v-6 h-6 Z" fill="#fff" stroke="#222"/><text x="95" y="30" font-size="9" font-family="Georgia, serif" font-style="italic" text-anchor="middle">beep.</text>`
    );
  return (
    base +
    `<g stroke="#ff7a00" stroke-width="3" fill="none">${[18, 28, 38].map((r) => `<path d="M${10 + r * 0.2} ${66 - r} A${r} ${r} 0 0 0 ${10 + r * 0.2} ${66 + r}" />`).join('')}</g>` +
    `<path d="M38 44 Q70 18 112 34 L104 44 L114 50 L100 56 Q86 40 60 44 Z" fill="#6b3f1f"/>` +
    `<circle cx="64" cy="68" r="30" fill="${skin}"/>` +
    `<circle cx="52" cy="60" r="7" fill="#fff" stroke="#222"/><circle cx="76" cy="60" r="7" fill="#fff" stroke="#222"/><circle cx="52" cy="60" r="2.6" fill="#222"/><circle cx="76" cy="60" r="2.6" fill="#222"/>` +
    `<ellipse cx="64" cy="83" rx="11" ry="9" fill="#7a2a22"/><ellipse cx="64" cy="87" rx="6" ry="3.4" fill="#e0675c"/>` +
    `<text x="62" y="114" font-size="15" font-weight="900" font-family="Impact, 'Arial Black', sans-serif" fill="#d4200c" text-anchor="middle" transform="rotate(-4 62 110)">KA-BOOM!</text>`
  );
}

/** The card, or a face: 'card', 'before' or 'after'. */
export function soundCardArt(what: 'card' | 'before' | 'after', alt: string): Element {
  if (what === 'card') return svg('mag-boaster', '0 0 316 150', card(), alt);
  return svg('mag-boaster-face', '0 0 120 120', face(what === 'after'), alt);
}
