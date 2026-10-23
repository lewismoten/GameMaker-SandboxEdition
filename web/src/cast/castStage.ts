// The cast page's stage: each regular walks on in turn as the games draw them (their real sprite
// frames, public/cast/sprites.json), stops in the spotlight, says hello in a speech box, and
// walks off for the next. Pause, step back and forth, or pick someone; a pick is kept in the
// address (#/cast?on=carl). With reduced motion nobody walks: each simply stands there.
import { h } from '../editor/core/ui';
import type { ViewState } from '../urlState';
import { spriteCanvases, type CastSprite } from './castSprite';
import type { CastMember } from './castData';

/** The stage in its own pixels; the canvas is scaled up with smoothing off. */
const W = 160;
const H = 70;
const FLOOR = 58;
/** Logical pixels a second. */
const SPEED = 40;
const TALK_MS = 4200;

type Phase = 'enter' | 'talk' | 'exit';

function backdrop(ctx: CanvasRenderingContext2D): void {
  // the back wall, a spotlight, the boards and the curtains
  ctx.fillStyle = '#1b1430';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#2a1f48';
  for (let y = 0; y < FLOOR; y += 6) ctx.fillRect(0, y, W, 1);
  const g = ctx.createRadialGradient(W / 2, FLOOR, 4, W / 2, FLOOR, 38);
  g.addColorStop(0, 'rgba(255,240,170,0.55)');
  g.addColorStop(1, 'rgba(255,240,170,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#6b3d1f';
  ctx.fillRect(0, FLOOR, W, H - FLOOR);
  ctx.fillStyle = '#8a5229';
  for (let y = FLOOR + 1; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  ctx.fillStyle = '#4a2a14';
  for (let x = 7; x < W; x += 23) ctx.fillRect(x, FLOOR + 1, 1, H - FLOOR);
  ctx.fillStyle = '#ffd400';
  ctx.fillRect(0, FLOOR, W, 1);
  for (const [x0, dir] of [
    [0, 1],
    [W - 1, -1],
  ] as const) {
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = i % 4 === 0 ? '#5c0a10' : i % 4 === 2 ? '#c3242c' : '#9b1820';
      ctx.fillRect(x0 + dir * i, 0, 1, FLOOR + 6 - (i > 9 ? (i - 9) * 2 : 0));
    }
  }
  ctx.fillStyle = '#9b1820';
  ctx.fillRect(0, 0, W, 5);
  ctx.fillStyle = '#ffd400';
  for (let x = 2; x < W; x += 6) ctx.fillRect(x, 5, 2, 1);
}

export function castStage(cast: CastMember[], state: ViewState): HTMLElement {
  const canvas = h('canvas', { width: W, height: H, class: 'cast-stage-canvas', 'aria-hidden': 'true' });
  const ctx = canvas.getContext('2d')!;
  const name = h('strong', { class: 'cast-say-name' });
  const line = h('span', { class: 'cast-say-line' });
  const bubble = h('p', { class: 'cast-say', 'aria-live': 'polite' }, name, line);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sprites = new Map<string, { sprite: CastSprite; frames: HTMLCanvasElement[] }>();
  let lineup: CastMember[] = [];
  let at = 0;
  let playing = !still;
  let phase: Phase = still ? 'talk' : 'enter';
  let x = 0;
  let t0 = 0;
  let last = 0;
  let raf = 0;
  let visible = true;

  // sound: off until asked for (a tick-tock for the tin heart)
  let audio: AudioContext | undefined;
  let sound = false;
  let lastFrame = -1;
  function tickTock(n: number): void {
    if (!sound) return;
    audio ??= new AudioContext();
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'square';
    osc.frequency.value = n % 2 ? 1400 : 1000;
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(gain).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }
  const soundBtn = h('button', {
    type: 'button',
    'aria-pressed': 'false',
    onclick: () => {
      sound = !sound;
      soundBtn.setAttribute('aria-pressed', String(sound));
      soundBtn.textContent = sound ? '🔊 Sound on' : '🔈 Sound off';
      if (sound) void (audio ??= new AudioContext()).resume();
    },
  }, '🔈 Sound off');
  const playBtn = h('button', { type: 'button', class: 'cast-stage-play', onclick: () => setPlaying(!playing) });
  const prevBtn = h('button', { type: 'button', 'aria-label': 'Previous character', onclick: () => go(at - 1, true) }, '◀');
  const nextBtn = h('button', { type: 'button', 'aria-label': 'Next character', onclick: () => go(at + 1, true) }, '▶');
  const pick = h('select', { 'aria-label': 'Pick a character', onchange: () => go(lineup.findIndex((m) => m.id === pick.value), true) });

  const current = () => lineup[at];
  const spriteOf = (m: CastMember) => sprites.get(m.id);
  const centre = (m: CastMember) => Math.round(W / 2 - (spriteOf(m)?.sprite.w ?? 0) / 2);

  function say(m: CastMember | undefined): void {
    name.textContent = m ? `${m.name}: ` : '';
    line.textContent = m ? m.hi : '';
    bubble.hidden = !m;
  }

  function setPlaying(on: boolean): void {
    playing = on;
    playBtn.textContent = on ? '❚❚ Pause' : '▶ Play';
    playBtn.setAttribute('aria-pressed', String(!on));
    bubble.setAttribute('aria-live', on ? 'off' : 'polite');
    if (on && phase === 'talk') t0 = performance.now();
    loop();
  }

  /** Someone on stage now: walking on when playing, else standing in the light. */
  function go(i: number, chosen = false): void {
    if (!lineup.length) return;
    at = (i + lineup.length) % lineup.length;
    const m = current();
    pick.value = m.id;
    if (chosen) {
      state.set({ on: m.id });
      if (playing && !still) {
        phase = 'enter';
        x = -(spriteOf(m)?.sprite.w ?? 20);
        say(undefined);
      } else {
        phase = 'talk';
        x = centre(m);
        say(m);
      }
    } else {
      phase = still ? 'talk' : 'enter';
      x = still ? centre(m) : -(spriteOf(m)?.sprite.w ?? 20);
      say(still ? m : undefined);
    }
    t0 = performance.now();
    draw(t0);
    loop();
  }

  function draw(now: number): void {
    backdrop(ctx);
    const m = current();
    const s = m && spriteOf(m);
    if (!s) return;
    const moving = phase !== 'talk' && s.sprite.walk;
    const frame = moving || s.frames.length === 2 ? s.frames[Math.floor(now / s.sprite.ms) % s.frames.length] : s.frames[0];
    const alpha = !s.sprite.walk && phase !== 'talk' ? Math.min(1, Math.max(0, (now - t0) / 600)) : 1;
    ctx.globalAlpha = phase === 'exit' && !s.sprite.walk ? 1 - alpha : alpha;
    // a shadow under them, then the sprite standing on the boards
    const lift = s.sprite.hop && moving ? Math.round(Math.abs(Math.sin((now / 260) * Math.PI)) * 7) : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(Math.round(x) + 2, FLOOR, s.sprite.w - 4, 2);
    ctx.drawImage(frame, Math.round(x), FLOOR - s.sprite.h + 1 - lift);
    const n = s.frames.indexOf(frame);
    if (s.sprite.tick && n !== lastFrame && playing) tickTock(n);
    lastFrame = n;
    ctx.globalAlpha = 1;
  }

  function tick(now: number): void {
    raf = 0;
    const dt = Math.min(0.1, (now - (last || now)) / 1000);
    last = now;
    const m = current();
    const s = m && spriteOf(m);
    if (playing && s) {
      if (phase === 'enter') {
        x = s.sprite.walk ? x + SPEED * dt : centre(m);
        if (x >= centre(m) && (s.sprite.walk || now - t0 > 600)) {
          x = centre(m);
          phase = 'talk';
          t0 = now;
          say(m);
        }
      } else if (phase === 'talk') {
        if (now - t0 > TALK_MS + m.hi.length * 25) {
          phase = 'exit';
          t0 = now;
          say(undefined);
        }
      } else {
        x = s.sprite.walk ? x + SPEED * dt : x;
        if (x > W || (!s.sprite.walk && now - t0 > 600)) {
          go(at + 1);
          return;
        }
      }
    }
    draw(now);
    loop(false);
  }

  /** Asks for the next frame; `fresh` after a pause, so the time away is not walked at once. */
  function loop(fresh = true): void {
    if (raf || !visible || document.hidden) return;
    // standing still and paused needs no frames (a two-frame idle like the rooster still flaps)
    const m = current();
    const s = m && spriteOf(m);
    if (!playing && (!s || s.frames.length !== 2)) return;
    if (fresh) last = 0;
    raf = requestAnimationFrame(tick);
  }

  const root = h(
    'section',
    { class: 'cast-stage', 'aria-labelledby': 'cast-stage-h' },
    h('h2', { id: 'cast-stage-h' }, 'On stage'),
    h('div', { class: 'cast-stage-box' }, canvas, bubble),
    h('div', { class: 'cast-stage-controls' }, prevBtn, playBtn, nextBtn, pick, soundBtn),
  );

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    loop();
  }).observe(root);
  document.addEventListener('visibilitychange', () => loop());

  fetch('./cast/sprites.json')
    .then((r) => (r.ok ? (r.json() as Promise<Record<string, CastSprite>>) : {}))
    .catch(() => ({}) as Record<string, CastSprite>)
    .then((all) => {
      for (const [id, sprite] of Object.entries(all)) sprites.set(id, { sprite, frames: spriteCanvases(sprite) });
      lineup = cast.filter((m) => sprites.has(m.id));
      pick.replaceChildren(...lineup.map((m) => h('option', { value: m.id }, m.name)));
      const want = state.get('on');
      const i = lineup.findIndex((m) => m.id === want);
      if (i >= 0) {
        playing = false;
        go(i, true);
      } else go(0);
      setPlaying(playing);
    });
  setPlaying(playing);
  backdrop(ctx);
  say(undefined);
  return root;
}
