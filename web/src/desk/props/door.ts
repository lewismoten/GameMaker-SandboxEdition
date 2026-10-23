// The bedroom door's brass knob (room/roomDoor.ts), tried: it's locked (making games, do not
// disturb), or someone knocks, or the door creaks open a crack and Teddy or Gwinn looks in,
// or Doc Leo honks hello from the hall.
import { h } from '../../editor/core/ui';
import { flash, hitArea, pressable, say, stillMotion, turns } from './propKit';
import { roomSound } from './propSound';

// Teddy: red-gold with a white blaze, his right ear (on your left) a little taller
const TEDDY = `<svg viewBox="0 0 120 120" aria-hidden="true">
  <path d="M22 52 L30 4 L56 40 Z" fill="#d98b3a" stroke="#7a4518" stroke-width="2"/>
  <path d="M31 16 L48 40 L28 46 Z" fill="#f2c6a0"/>
  <path d="M98 54 L92 16 L68 42 Z" fill="#d98b3a" stroke="#7a4518" stroke-width="2"/>
  <path d="M92 27 L76 43 L94 48 Z" fill="#f2c6a0"/>
  <ellipse cx="60" cy="68" rx="40" ry="36" fill="#d98b3a" stroke="#7a4518" stroke-width="2"/>
  <path d="M54 34 q6 -4 12 0 l6 40 q-12 6 -24 0 z" fill="#fbf6ec"/>
  <ellipse cx="60" cy="88" rx="22" ry="16" fill="#fbf6ec"/>
  <circle cx="44" cy="62" r="5" fill="#1a120b"/><circle cx="45.5" cy="60.5" r="1.6" fill="#fff"/>
  <circle cx="76" cy="62" r="5" fill="#1a120b"/><circle cx="77.5" cy="60.5" r="1.6" fill="#fff"/>
  <ellipse cx="60" cy="80" rx="7" ry="5" fill="#1a120b"/>
  <path d="M50 90 q10 8 20 0" fill="none" stroke="#1a120b" stroke-width="2"/>
  <path d="M56 93 q4 10 8 0" fill="#e8687a"/>
</svg>`;

// Gwinn: chocolate-brown, amber eyes, a pink collar, and a sock that isn't hers
const GWINN = `<svg viewBox="0 0 120 120" aria-hidden="true">
  <path d="M26 40 q-18 10 -14 40 q8 6 16 -4 z" fill="#3e2414"/>
  <path d="M94 40 q18 10 14 40 q-8 6 -16 -4 z" fill="#3e2414"/>
  <ellipse cx="60" cy="64" rx="38" ry="36" fill="#5a3520" stroke="#2e1a0e" stroke-width="2"/>
  <ellipse cx="60" cy="86" rx="20" ry="14" fill="#6e4429"/>
  <circle cx="45" cy="60" r="5.5" fill="#e0a030"/><circle cx="45" cy="60" r="2.6" fill="#1a0f08"/>
  <circle cx="75" cy="60" r="5.5" fill="#e0a030"/><circle cx="75" cy="60" r="2.6" fill="#1a0f08"/>
  <ellipse cx="60" cy="78" rx="7" ry="5" fill="#1a0f08"/>
  <path d="M30 100 q30 14 60 0 l0 8 q-30 14 -60 0 z" fill="#ec6aa8"/>
  <circle cx="60" cy="110" r="4" fill="#ffd400"/>
  <path d="M70 88 l40 -6 l4 14 l-12 4 l-2 -6 l-28 4 z" fill="#f7f4ea" stroke="#9a9484"/>
  <path d="M84 85 l3 11 M94 84 l3 11" stroke="#d3141c" stroke-width="3"/>
</svg>`;

interface Visit {
  text: string;
  sound: 'rattle' | 'knock' | 'creak' | 'honk';
  peek?: string;
}

const VISITS: Visit[] = [
  { sound: 'rattle', text: 'Rattle, rattle. It’s locked from this side: DO NOT DISTURB, MAKING GAMES.' },
  { sound: 'creak', peek: TEDDY, text: 'Teddy noses the door open, one ear up and one a little shorter. No snacks on the floor. He leaves.' },
  { sound: 'knock', text: 'Knock knock! “Dinner in ten minutes!” (It’s always ten more minutes.)' },
  { sound: 'creak', peek: GWINN, text: 'Gwinn pokes her head in with a sock in her mouth. It wasn’t her. (It was her.)' },
  { sound: 'honk', text: 'Honk honk! A bike horn out in the hall: Doc Leo, saying hi on his way past.' },
];

export function doorProp(door: HTMLElement): () => void {
  const leaf = door.querySelector<HTMLElement>('.rd-door');
  if (!leaf) return () => {};
  door.removeAttribute('aria-hidden');
  // the dark hall behind the door, and whoever looks round it
  const gap = h('div', { class: 'rd-gap', 'aria-hidden': 'true' });
  const peeker = h('div', { class: 'rd-peek', 'aria-hidden': 'true' });
  door.prepend(gap);
  door.append(peeker);
  // the KEEP OUT sign is read as text; the door itself is a picture around it
  leaf.querySelectorAll('.rd-panel').forEach((p) => p.setAttribute('aria-hidden', 'true'));
  const knob = hitArea('rd-knob-hit');
  leaf.append(knob);
  const next = turns(VISITS);
  const use = () => {
    const v = next();
    roomSound[v.sound]();
    if (v.peek) {
      peeker.innerHTML = v.peek;
      flash(door, 'ajar', stillMotion() ? 3000 : 3200);
    } else flash(leaf, v.sound === 'rattle' ? 'rattle' : 'knocked', 700);
    say(knob, v.text, v.peek ? peekArt(v.peek) : undefined);
  };
  return pressable(knob, 'Doorknob: try the door', use, { id: 'desk-door' });
}

/** The visitor's face, small, in the bubble too (the door is easy to miss on a big screen). */
function peekArt(svg: string): Node {
  const el = h('span');
  el.innerHTML = svg.replace('<svg ', '<svg width="64" height="64" ');
  return el.firstElementChild!;
}
