// The cast page's stage: each regular walks on in turn as the games draw them (their real sprite
// frames, public/cast/sprites.json), turns to face you in the spotlight, says hello in a speech
// box under the stage, and walks off for the next. Gwinn runs on with Doc Leo's hat, the rest of
// his costume tumbling out behind her (Teddy's Little Big Adventure's intro). Pause, step back
// and forth, or pick someone; a pick is kept in the address (#/cast?on=carl). With reduced
// motion nobody walks: each simply stands there. Sound: castSound.ts.
import { h } from '../editor/core/ui';
import { currentRoute, type ViewState } from '../urlState';
import { spriteCanvases, type CastSprite } from './castSprite';
import type { CastMember } from './castData';
import { StageSound, type Effect } from './castSound';

/** The stage in its own pixels; the canvas is scaled up with smoothing off. */
const W = 160;
const H = 70;
const FLOOR = 58;
/** Logical pixels a second. */
const SPEED = 40;
const TALK_MS = 4200;
/** Gwinn's zoomies. */
const RUN = 100;

/** What each one says out loud: on walking on, and on stopping in the light. */
const ENTER_FX: Record<string, Effect> = { gwinn: 'yip' };
const HELLO_FX: Record<string, Effect> = { teddy: 'woof', chicken: 'squeak', chez: 'honk', leo: 'giggle', bard: 'pop', rootbeer: 'pop' };

interface Sprite {
  sprite: CastSprite;
  walk: HTMLCanvasElement[];
  front: HTMLCanvasElement[];
}

/** A costume piece flying out behind Gwinn, then tumbling to a stop on the boards. */
interface Prop {
  img: HTMLCanvasElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  landed: boolean;
}
const PROPS = ['tie', 'shoes', 'chicken', 'nose'];
/** Where Gwinn is when each piece falls out. */
const DROPS = [26, 50, 74, 98];
/** Where she turns round to come back to the light. */
const TURN = 122;

type Phase = 'enter' | 'back' | 'talk' | 'exit';

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
  ctx.imageSmoothingEnabled = false;
  const name = h('strong', { class: 'cast-say-name' });
  const line = h('span', { class: 'cast-say-line' });
  const bubble = h('p', { class: 'cast-say', 'aria-live': 'polite' }, name, line);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sprites = new Map<string, Sprite>();
  const sound = new StageSound();
  let lineup: CastMember[] = [];
  let at = 0;
  let playing = !still;
  let phase: Phase = still ? 'talk' : 'enter';
  let x = 0;
  let t0 = 0;
  let last = 0;
  let raf = 0;
  let visible = true;
  let lastFrame = -1;
  let props: Prop[] = [];
  let dropped = 0;

  const soundBtn = h('button', {
    type: 'button',
    class: 'cast-stage-sound',
    onclick: () => {
      sound.set(!sound.wanted);
      showSound();
    },
  });
  const showSound = () => {
    soundBtn.setAttribute('aria-pressed', String(sound.wanted));
    soundBtn.textContent = sound.wanted ? '🔊 Sound on' : '🔇 Sound off';
  };
  const playBtn = h('button', { type: 'button', class: 'cast-stage-play', onclick: () => setPlaying(!playing) });
  const prevBtn = h('button', { type: 'button', 'aria-label': 'Previous character', onclick: () => go(at - 1, true) }, '◀');
  const nextBtn = h('button', { type: 'button', 'aria-label': 'Next character', onclick: () => go(at + 1, true) }, '▶');
  const pick = h('select', { 'aria-label': 'Pick a character', onchange: () => go(lineup.findIndex((m) => m.id === pick.value), true) });

  const current = () => lineup[at];
  const spriteOf = (m: CastMember) => sprites.get(m.id);
  const centre = (m: CastMember) => Math.round(W / 2 - (spriteOf(m)?.sprite.w ?? 0) / 2);
  const isGwinn = (m: CastMember | undefined) => m?.id === 'gwinn' && sprites.has('prop:hat');
  const speed = (m: CastMember) => (isGwinn(m) ? RUN : SPEED);

  function say(m: CastMember | undefined): void {
    name.textContent = m ? `${m.name}: ` : '';
    line.textContent = m ? m.hi : '';
    bubble.classList.toggle('quiet', !m);
  }

  function setPlaying(on: boolean): void {
    playing = on;
    playBtn.textContent = on ? '❚❚ Pause' : '▶ Play';
    playBtn.setAttribute('aria-pressed', String(!on));
    bubble.setAttribute('aria-live', on ? 'off' : 'polite');
    sound.pause(!on);
    if (on && phase === 'talk') t0 = performance.now();
    loop();
  }

  function arrive(m: CastMember, now: number): void {
    x = centre(m);
    phase = 'talk';
    t0 = now;
    say(m);
    const fx = HELLO_FX[m.id];
    if (fx && playing) sound.effect(fx);
  }

  /** Someone on stage now: walking on when playing, else standing in the light. */
  function go(i: number, chosen = false): void {
    if (!lineup.length) return;
    at = (i + lineup.length) % lineup.length;
    const m = current();
    pick.value = m.id;
    props = [];
    dropped = 0;
    if (chosen) state.set({ on: m.id });
    t0 = performance.now();
    if (playing && !still) {
      phase = 'enter';
      x = -(spriteOf(m)?.sprite.w ?? 20) - (isGwinn(m) ? 10 : 0);
      say(undefined);
      const fx = ENTER_FX[m.id];
      if (fx) sound.effect(fx);
    } else {
      phase = 'talk';
      x = centre(m);
      say(m);
      // a pick while paused: the costume already lies where Gwinn dropped it
      if (isGwinn(m)) for (const [k, p] of PROPS.entries()) props.push(prop(p, DROPS[k] - 6, FLOOR, true));
    }
    draw(t0);
    loop();
  }

  function prop(id: string, px: number, py: number, landed = false): Prop {
    const img = sprites.get(`prop:${id}`)!.walk[0];
    return { img, x: px, y: py - (landed ? img.height / 2 : 0), vx: -10, vy: -62, angle: landed ? Math.PI / 2 : 0, spin: 9 + Math.random() * 5, landed };
  }

  function stepProps(dt: number): void {
    for (const p of props) {
      if (p.landed) continue;
      p.vy += 230 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
      const rest = FLOOR - Math.min(p.img.width, p.img.height) / 2 + 1;
      if (p.y >= rest) {
        p.y = rest;
        if (p.vy > 50) {
          // a bounce, slower each time
          p.vy = -p.vy * 0.38;
          p.vx *= 0.5;
          p.spin *= 0.5;
          sound.effect('flop');
        } else {
          p.landed = true;
          // it lies flat, on whichever side it came down on
          p.angle = Math.round(p.angle / (Math.PI / 2)) * (Math.PI / 2);
        }
      }
    }
  }

  function drawProps(alpha: number): void {
    ctx.globalAlpha = alpha;
    for (const p of props) {
      ctx.save();
      ctx.translate(Math.round(p.x), Math.round(p.y));
      ctx.rotate(p.angle);
      ctx.drawImage(p.img, -Math.round(p.img.width / 2), -Math.round(p.img.height / 2));
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function draw(now: number): void {
    backdrop(ctx);
    const m = current();
    const s = m && spriteOf(m);
    if (!s) return;
    const moving = phase !== 'talk' && s.sprite.walk;
    const left = phase === 'back';
    const frames = moving ? s.walk : s.front;
    const ms = isGwinn(m) && moving ? 70 : s.sprite.ms;
    const frame = frames[still && !playing ? 0 : Math.floor(now / ms) % frames.length];
    if (props.length) drawProps(phase === 'exit' ? Math.max(0, 1 - (now - t0) / 700) : 1);
    const fade = !s.sprite.walk && phase !== 'talk' ? Math.min(1, Math.max(0, (now - t0) / 600)) : 1;
    ctx.globalAlpha = phase === 'exit' && !s.sprite.walk ? 1 - fade : fade;
    // a shadow under them, then the sprite standing on the boards (a waddle for one who walks
    // on in a single frame, a hop for the tin heart)
    const lift = moving ? (s.sprite.hop ? Math.round(Math.abs(Math.sin((now / 260) * Math.PI)) * 7) : s.walk.length === 1 ? Math.floor(now / 160) % 2 : 0) : 0;
    const top = FLOOR - s.sprite.h + 1 - lift;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(Math.round(x) + 2, FLOOR, s.sprite.w - 4, 2);
    if (left) {
      ctx.save();
      ctx.translate(Math.round(x) + s.sprite.w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(frame, 0, top);
      ctx.restore();
    } else ctx.drawImage(frame, Math.round(x), top);
    // Gwinn has Doc Leo's hat: in her mouth on the run, on her head to say hello
    if (isGwinn(m)) {
      const hat = sprites.get('prop:hat')!.walk[0];
      if (!moving) ctx.drawImage(hat, Math.round(x), top - hat.height + 4);
      else ctx.drawImage(hat, left ? Math.round(x) + s.sprite.w - 9 - hat.width : Math.round(x) + 9, top + 1);
    }
    ctx.globalAlpha = 1;
    // sounds with the frames: footsteps, the tick-tock, the whirr
    const n = frames.indexOf(frame) + (moving ? 0 : 100);
    if (n !== lastFrame && playing) {
      if (s.sprite.tick) sound.tick(n);
      else if (moving && m.id === 'chez') sound.whirr();
      else if (moving && n % 2 === 0) sound.step();
    }
    lastFrame = n;
  }

  function tick(now: number): void {
    raf = 0;
    const dt = Math.min(0.1, (now - (last || now)) / 1000);
    last = now;
    const m = current();
    const s = m && spriteOf(m);
    if (playing && s) {
      if (phase === 'enter') {
        x = s.sprite.walk ? x + speed(m) * dt : centre(m);
        // the costume falls out behind her as she runs
        while (isGwinn(m) && dropped < PROPS.length && x >= DROPS[dropped]) {
          props.push(prop(PROPS[dropped], x + 2, FLOOR - 14));
          dropped++;
        }
        // Gwinn runs right across first and comes back; everyone else stops in the light
        if (isGwinn(m) && x >= TURN) phase = 'back';
        else if (!isGwinn(m) && x >= centre(m) && (s.sprite.walk || now - t0 > 600)) arrive(m, now);
      } else if (phase === 'back') {
        x -= speed(m) * dt;
        if (x <= centre(m)) arrive(m, now);
      } else if (phase === 'talk') {
        if (now - t0 > TALK_MS + m.hi.length * 25) {
          phase = 'exit';
          t0 = now;
          say(undefined);
        }
      } else {
        x = s.sprite.walk ? x + speed(m) * dt : x;
        if (x > W || (!s.sprite.walk && now - t0 > 600)) {
          go(at + 1);
          return;
        }
      }
    }
    stepProps(dt);
    draw(now);
    loop(false);
  }

  /** Asks for the next frame; `fresh` after a pause, so the time away is not walked at once. */
  function loop(fresh = true): void {
    if (raf || !visible || document.hidden || (still && !playing)) return;
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
  // the sound starts with a tap on the stage or its controls (browsers, and iPhones most of all,
  // only let it start from a gesture)
  root.addEventListener('click', () => sound.start());
  canvas.addEventListener('click', () => setPlaying(!playing));

  const seen = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    loop();
  });
  seen.observe(root);
  const onVisibility = () => loop();
  document.addEventListener('visibilitychange', onVisibility);
  // leaving the cast page: stop the music and the frames
  const onLeave = () => {
    if (currentRoute().path[0] === 'cast' && root.isConnected) return;
    sound.dispose();
    seen.disconnect();
    cancelAnimationFrame(raf);
    raf = 0;
    visible = false;
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('hashchange', onLeave);
  };
  window.addEventListener('hashchange', onLeave);

  fetch('./cast/sprites.json')
    .then((r) => (r.ok ? (r.json() as Promise<Record<string, CastSprite>>) : {}))
    .catch(() => ({}) as Record<string, CastSprite>)
    .then((all) => {
      for (const [id, sprite] of Object.entries(all)) {
        const frames = spriteCanvases(sprite);
        const n = sprite.nWalk ?? frames.length;
        sprites.set(id, { sprite, walk: frames.slice(0, n), front: n < frames.length ? frames.slice(n) : frames.length === 2 ? frames : [frames[0]] });
      }
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
  showSound();
  backdrop(ctx);
  say(undefined);
  return root;
}
