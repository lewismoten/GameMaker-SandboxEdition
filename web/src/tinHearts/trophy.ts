// The tin heart hunt's trophy on the desk: once every counted tin heart is found (tinHearts.ts),
// the diamond heart the rotten egg's IOU promised appears at the end of the bottom shelf, on a
// riveted tin stand in Mystery Robot Joe's style with a brass plate: "Presented by Mystery
// Robot Joe". Until then there is nothing at all. Clicking it gives a closer look: the first time,
// a short scene (reveal.ts) in which Joe finds he had a golden heart all along, like the Tin Man;
// after that its last picture, the heart turning on its stand, and a short note from Joe.
// With reduced motion only the last picture, and the heart holds still (drag or ← → turn it).
// The desk's spot for it is trophySpot.ts, which loads this only once the set is whole.
import './trophy.css';
import '../eggs/eggs.css';
import { h, clear } from '../editor/core/ui';
import { drawJoe } from './joeArt';
import { LINES, revealSounds, SCENE_SECONDS, sceneAt, seenReveal, setSeenReveal } from './reveal';

type Art = typeof import('../eggs/bonusArt');

/** The riveted tin stand and its brass plate, `w` wide, its foot on `baseY`, centered on `cx`. */
function drawStand(g: CanvasRenderingContext2D, cx: number, baseY: number, w: number, allAlong = false): { top: number } {
  const hgt = w * 0.42;
  const top = baseY - hgt;
  const x0 = cx - w / 2;
  // a tin box, lighter on its left like Joe
  const tin = g.createLinearGradient(x0, 0, x0 + w, 0);
  tin.addColorStop(0, '#d9dee3');
  tin.addColorStop(0.45, '#a7afb7');
  tin.addColorStop(1, '#6d757d');
  g.fillStyle = tin;
  g.fillRect(x0, top, w, hgt);
  // its lid, a step narrower and lighter
  g.fillStyle = '#c3c9cf';
  g.fillRect(x0 + w * 0.08, top - hgt * 0.16, w * 0.84, hgt * 0.16);
  g.strokeStyle = '#3c4248';
  g.lineWidth = Math.max(0.8, w * 0.02);
  g.strokeRect(x0, top, w, hgt);
  g.strokeRect(x0 + w * 0.08, top - hgt * 0.16, w * 0.84, hgt * 0.16);
  // rivets in the corners
  const rivet = (x: number, y: number) => {
    const r = Math.max(0.9, w * 0.03);
    g.fillStyle = '#eef1f4';
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#4d545b';
    g.beginPath();
    g.arc(x + r * 0.35, y + r * 0.35, r * 0.55, 0, Math.PI * 2);
    g.fill();
  };
  for (const [fx, fy] of [
    [0.07, 0.18],
    [0.93, 0.18],
    [0.07, 0.84],
    [0.93, 0.84],
  ])
    rivet(x0 + w * fx, top + hgt * fy);
  // the brass plate, with its words (legible when the stand is drawn large)
  const pw = w * 0.7;
  const ph = hgt * 0.5;
  const px = cx - pw / 2;
  const py = top + hgt * 0.26;
  const brass = g.createLinearGradient(0, py, 0, py + ph);
  brass.addColorStop(0, '#f7dc8a');
  brass.addColorStop(0.5, '#c99a3a');
  brass.addColorStop(1, '#8a6420');
  g.fillStyle = brass;
  g.fillRect(px, py, pw, ph);
  g.strokeStyle = '#5c4210';
  g.lineWidth = Math.max(0.6, w * 0.012);
  g.strokeRect(px, py, pw, ph);
  if (w >= 120) {
    g.fillStyle = '#3a2a08';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const lines = allAlong ? ['PRESENTED BY', 'MYSTERY ROBOT JOE', 'WHO HAD ONE ALL ALONG'] : ['PRESENTED BY', 'MYSTERY ROBOT JOE'];
    const fs = Math.min(ph * (allAlong ? 0.2 : 0.26), (pw * 0.92) / Math.max(...lines.map((l) => l.length)) / 0.62);
    g.font = `600 ${Math.round(fs)}px Georgia, 'Times New Roman', serif`;
    // the estimate above is for average letters; capitals run wider, so measure and shrink to the plate
    const widest = Math.max(...lines.map((l) => g.measureText(l).width));
    if (widest > pw * 0.92) g.font = `600 ${Math.floor((fs * pw * 0.92) / widest)}px Georgia, 'Times New Roman', serif`;
    lines.forEach((l, i) => g.fillText(l, cx, py + (ph * (i + 0.55)) / lines.length));
  } else {
    g.fillStyle = 'rgba(58, 42, 8, 0.7)';
    g.fillRect(px + pw * 0.15, py + ph * 0.3, pw * 0.7, Math.max(0.7, ph * 0.12));
    g.fillRect(px + pw * 0.1, py + ph * 0.6, pw * 0.8, Math.max(0.7, ph * 0.12));
  }
  // a little tin cup on the lid that the heart sits in
  const cupY = top - hgt * 0.16;
  g.fillStyle = '#9aa2aa';
  g.beginPath();
  g.moveTo(cx - w * 0.16, cupY);
  g.lineTo(cx + w * 0.16, cupY);
  g.lineTo(cx + w * 0.1, cupY - hgt * 0.22);
  g.lineTo(cx - w * 0.1, cupY - hgt * 0.22);
  g.closePath();
  g.fill();
  g.strokeStyle = '#3c4248';
  g.stroke();
  return { top: cupY - hgt * 0.22 };
}

/** The whole trophy, w x h: the stand and the heart on it. */
export function drawTrophy(art: Art, g: CanvasRenderingContext2D, w: number, hh: number, turn: number, time: number): void {
  const sw = w * 0.86;
  const { top } = drawStand(g, w / 2, hh * 0.98, sw);
  const size = Math.min(w * 0.9, (top - hh * 0.02) * 1.05);
  art.drawHeart(g, w / 2, top - size * 0.42, size, turn, time);
}

const WORDS = 'Zero One Two Three Four Five Six Seven Eight Nine Ten Eleven Twelve Thirteen Fourteen Fifteen Sixteen Seventeen Eighteen Nineteen Twenty'.split(
  ' ',
);
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty'];
/** A count as Joe writes it at the start of a sentence: "Twenty-four". */
export const countWord = (n: number): string =>
  n < 21 ? WORDS[n] : n < 50 ? `${TENS[Math.floor(n / 10)]}${n % 10 ? `-${WORDS[n % 10].toLowerCase()}` : ''}` : String(n);

/** Joe's note, for `n` hearts. */
export const joeNote = (n: number): string =>
  `${countWord(n)} tin hearts, counted twice on my tally counter, and every one of them ticking. The Tin Man walked all the way to Oz for a heart and found he had been kind the whole way there. You went looking in every corner of every game, which is much the same thing. Here is the one I borrowed. Keep it where it can catch the light.`;

/** What the trophy view says happened, once the scene has played. */
const ALL_ALONG =
  'Then the little hatch on Joe’s tin chest, where his tally counter sits, creaked open. Behind it was a golden heart, glowing warm and ticking away. He had one all along, just like the Tin Man. The brass plate has a new line now: WHO HAD ONE ALL ALONG. He left something else on the shelf, too.';

/**
 * A closer look: the diamond heart on its stand, Mystery Robot Joe beside it, and his note.
 * `scene`: play the reveal first (it plays by itself the first time; reveal.ts). Esc closes.
 */
export async function openTrophy(n: number, scene = !seenReveal()): Promise<void> {
  const art = await import('../eggs/bonusArt');
  return new Promise((resolve) => {
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let turn = 0.45;
    let spin = still ? 0 : 0.5;
    let clock = 0;
    let last = performance.now();
    let raf = 0;
    let drag: { x: number; turn: number } | undefined;
    /** Seconds into the scene; undefined once it is over (its last picture). */
    let at: number | undefined;
    let said = 0;
    let sounds: ReturnType<typeof revealSounds> | undefined;
    let ticks = 0;
    const canvas = h('canvas', { class: 'eggv-canvas', tabindex: 0, role: 'img' });
    const say = h('p', { class: 'trophy-say', 'aria-live': 'polite' });
    const stage = h('div', { class: 'eggv-stage' }, canvas, say, h('p', { class: 'eggv-hint', 'aria-hidden': 'true' }, 'Drag or use ← → to turn the heart'));
    const label = () =>
      canvas.setAttribute(
        'aria-label',
        at === undefined
          ? 'Mystery Robot Joe, a tin box robot, stands beside a diamond heart on a riveted tin stand. The little hatch on his chest is open, and a golden heart glows inside it. The brass plate reads: Presented by Mystery Robot Joe, who had one all along.'
          : 'Mystery Robot Joe walks in carrying a diamond heart and sets it on a riveted tin stand.',
      );
    /** Joe's words: the latest as the scene plays; `all` of them at once when it is skipped or still. */
    const speak = (k: number, all = false) => {
      said = k;
      say.textContent = (all ? LINES.slice(0, k) : LINES.slice(k - 1, k)).map((l) => `Joe: “${l.text}”`).join('\n');
      say.hidden = !k;
    };

    const draw = () => {
      const r = stage.getBoundingClientRect();
      const k = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(160, Math.round(r.width));
      const hh = Math.max(160, Math.round(r.height));
      if (canvas.width !== w * k || canvas.height !== hh * k) {
        canvas.width = w * k;
        canvas.height = hh * k;
      }
      const g = canvas.getContext('2d')!;
      g.setTransform(k, 0, 0, k, 0, 0);
      g.clearRect(0, 0, w, hh);
      const pose = sceneAt(at ?? SCENE_SECONDS + 1);
      const floor = hh * 0.86;
      // the stand on the right, Joe on the left
      const sw = Math.min(w * 0.36, hh * 0.42);
      const sx = w * 0.64;
      const glowAt = { x: sx, y: floor - sw * 0.9 };
      const light = g.createRadialGradient(glowAt.x, glowAt.y, 0, glowAt.x, glowAt.y, sw * 1.3);
      light.addColorStop(0, `rgba(255, 236, 244, ${0.08 + 0.14 * pose.heart})`);
      light.addColorStop(1, 'rgba(255, 236, 244, 0)');
      g.fillStyle = light;
      g.fillRect(0, 0, w, hh);
      g.fillStyle = 'rgba(0, 0, 0, 0.35)';
      g.beginPath();
      g.ellipse(sx, floor + 2, sw * 0.6, sw * 0.06, 0, 0, Math.PI * 2);
      g.fill();
      const { top } = drawStand(g, sx, floor, sw, pose.hatch >= 1 && at === undefined);
      const px = Math.max(2, Math.floor(Math.min((hh * 0.6) / 20, (w * 0.34) / 20)));
      const jx = w * 0.27 - 10 * px;
      const x = -20 * px + (jx + 20 * px) * pose.walk + pose.shake * px;
      const y = floor - 20 * px;
      g.fillStyle = 'rgba(0, 0, 0, 0.35)';
      g.beginPath();
      g.ellipse(x + 10 * px, floor + 2, 8 * px, px, 0, 0, Math.PI * 2);
      g.fill();
      drawJoe(g, x, y, px, { frame: pose.frame, mirror: pose.mirror, hatch: pose.hatch, glow: pose.glow, time: clock });
      // the diamond heart: carried in front of him, then set in the cup
      const size = Math.min(sw * 0.7, (top - hh * 0.12) * 0.9);
      const hand = { x: x + (pose.mirror ? 17 : 10) * px, y: y + 12 * px, s: 7 * px };
      const cup = { x: sx, y: top - size * 0.42, s: size };
      const f = pose.heart;
      art.drawHeart(
        g,
        hand.x + (cup.x - hand.x) * f,
        hand.y + (cup.y - hand.y) * f - Math.sin(f * Math.PI) * hh * 0.08,
        hand.s + (cup.s - hand.s) * f,
        turn,
        still ? 0.3 : clock,
      );
    };

    const finish = () => {
      // played to the end, the last words are said already; skipped (or still), both are
      if (said < LINES.length || at === undefined) speak(LINES.length, true);
      at = undefined;
      sounds?.stop();
      sounds = undefined;
      setSeenReveal(true);
      clear(controls, still ? null : again);
      clear(more, h('h3', null, 'And then'), h('p', null, ALL_ALONG));
      label();
    };
    const play = () => {
      at = 0;
      ticks = 0;
      speak(0);
      sounds = revealSounds();
      clear(controls, skip);
      clear(more);
      label();
      skip.focus();
    };

    const frame = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      clock += dt;
      if (at !== undefined) {
        const before = at;
        at += dt;
        const pose = sceneAt(at);
        if (pose.said > said) speak(pose.said);
        if (before < 3.9 && at >= 3.9) sounds?.creak();
        if (before < LINES[1].at && at >= LINES[1].at) sounds?.chime();
        // the golden heart ticks: tick, tock
        while (at >= 4.4 + ticks * 0.5 && ticks < 6) sounds?.tick(ticks++ % 2 === 1);
        if (at >= SCENE_SECONDS) finish();
      } else if (!drag) turn += spin * dt;
      draw();
      raf = requestAnimationFrame(frame);
    };
    canvas.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, turn };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (drag) turn = drag.turn + ((e.clientX - drag.x) / Math.max(100, canvas.clientWidth)) * Math.PI * 2;
    });
    canvas.addEventListener('pointerup', () => {
      if (drag) spin = 0;
      drag = undefined;
    });
    const opener = document.activeElement as HTMLElement | null;
    const close = () => {
      if (at !== undefined) setSeenReveal(true);
      sounds?.stop();
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
      opener?.focus();
      resolve();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !(e.target instanceof HTMLButtonElement)) {
        spin = 0;
        turn += e.key === 'ArrowLeft' ? -0.25 : 0.25;
        e.preventDefault();
      } else if (e.key === 'Tab') {
        const stops = [closeBtn, canvas, ...controls.querySelectorAll('button')];
        const i = stops.indexOf(document.activeElement as HTMLButtonElement);
        stops[(i + (e.shiftKey ? stops.length - 1 : 1)) % stops.length].focus();
        e.preventDefault();
      }
      e.stopImmediatePropagation(); // not for the PC underneath
    };
    window.addEventListener('keydown', onKey, true);
    const closeBtn = h('button', { type: 'button', onclick: close }, 'Close (Esc)');
    const skip = h('button', { type: 'button', onclick: () => (finish(), canvas.focus()) }, 'Skip');
    const again = h('button', { type: 'button', onclick: play }, 'Play it again');
    const controls = h('div', { class: 'eggv-nav' });
    const more = h('div');
    const card = h(
      'div',
      { class: 'eggv-card' },
      h('h2', { id: 'trophy-title' }, 'The Diamond Heart'),
      h('p', { class: 'eggv-where' }, `Presented by Mystery Robot Joe, for finding all ${n} tin hearts`),
      h(
        'p',
        null,
        'A heart cut from one flawless diamond, faceted like an imperial jeweled egg and caged in gold filigree, sitting in a tin cup on a riveted tin box that Joe made himself. The brass plate reads: PRESENTED BY MYSTERY ROBOT JOE.',
      ),
      h('h3', null, 'A note from Joe'),
      h('p', { class: 'eggv-lore' }, `“${joeNote(n)}” — Joe`),
      more,
      controls,
    );
    const overlay = h(
      'div',
      { class: 'eggv heart-trophy-view', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'trophy-title' },
      h('div', { class: 'eggv-bar' }, h('strong', null, 'On the shelf'), closeBtn),
      h('div', { class: 'eggv-main' }, stage, card),
    );
    document.body.append(overlay);
    // with reduced motion the scene is only its last picture, its words said at once
    if (scene && !still) play();
    else finish();
    raf = requestAnimationFrame(frame);
    if (at === undefined) canvas.focus();
  });
}
