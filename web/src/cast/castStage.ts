// The cast page's stage: each regular walks on in turn as the games draw them (their real sprite
// frames, public/cast/sprites.json), turns to face you in the spotlight, says hello in a speech
// box under the stage, and walks off for the next. A few have a bit of business, after the games:
//  - Gwinn zooms across with Doc Leo's hat in her mouth, his tie, sneakers, chicken and nose
//    tumbling out behind her (Teddy's Little Big Adventure's intro), and runs off with it;
//  - Doc Leo walks on without it, and Teddy runs up with the hat and gives it back;
//  - the goat screams and faints, lies there a beat, and gets up (Third Goat from the Left);
//  - Loaf #13 rolls into the light and the child carries it home (Loaf #13);
//  - Brother Camel tries the eye of a giant needle (Thread the Needle, Brother Camel);
//  - snow falls round Teenage Lewie (Snowbound's flakes).
// Pause, step back and forth, or pick someone; a pick is kept in the address (#/cast?on=carl).
// With reduced motion nobody walks and nothing happens: each simply stands there. Sound:
// castSound.ts.
import { h } from '../editor/core/ui';
import { currentRoute, type ViewState } from '../urlState';
import { spriteCanvases, type CastSprite } from './castSprite';
import type { CastMember } from './castData';
import { StageSound, type Effect } from './castSound';
import { unlockAchievement } from '../achievements';

/** The stage in its own pixels; the canvas is scaled up with smoothing off. */
const W = 160;
const H = 70;
const FLOOR = 58;
/** Logical pixels a second. */
const SPEED = 40;
const TALK_MS = 4200;
/** Running (Gwinn's zoomies, Teddy with the hat). */
const RUN = 100;

/** What each one says out loud: on walking on, and on stopping in the light. */
const ENTER_FX: Record<string, Effect> = { gwinn: 'yip' };
const HELLO_FX: Record<string, Effect> = { chicken: 'squeak', chez: 'honk', leo: 'giggle', bard: 'pop', rootbeer: 'pop', teddy: 'woof' };

interface Sprite {
  sprite: CastSprite;
  walk: HTMLCanvasElement[];
  front: HTMLCanvasElement[];
  acts: Record<string, HTMLCanvasElement[]>;
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

/** Someone helping out in another's turn: Teddy with the hat, the child who takes the loaf. */
interface Helper {
  id: string;
  x: number;
  /** Walking left (drawn turned round). */
  left: boolean;
  speed: number;
  /** What they carry, and whether it is still theirs to carry. */
  carry?: 'hat' | 'loaf';
}

/** Snowbound's flakes: a white pixel with a pale blue one below and to the right. */
interface Flake {
  x: number;
  y: number;
  v: number;
  big: boolean;
}

// enter: walking on; back: Gwinn coming back; pre: business before hello (the hat); talk: hello;
// post: business after it (scream, loaf, needle); exit: off they go
type Phase = 'enter' | 'back' | 'pre' | 'talk' | 'post' | 'exit';

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
  let helper: Helper | undefined;
  /** Doc Leo has his hat back (or never lost it: a pick while paused). */
  let hatOn = true;
  /** Loaf #13 has been picked up. */
  let carried = false;
  /** The snow's strength, 0 to 1. */
  let snow = 0;
  const flakes: Flake[] = Array.from({ length: 70 }, (_, i) => ({ x: (i * 37) % W, y: (i * 53) % H, v: 9 + ((i * 7) % 6), big: i % 4 === 0 }));

  const soundBtn = h('button', {
    type: 'button',
    class: 'cast-stage-sound',
    onclick: () => {
      // wanted but not started yet (no gesture until now): this click starts it, not turns it off
      if (sound.wanted && !sound.playing) sound.start();
      else sound.set(!sound.wanted);
      showSound();
    },
  });
  const showSound = () => {
    soundBtn.setAttribute('aria-pressed', String(sound.playing));
    soundBtn.textContent = sound.playing
      ? '🔊 Sound on'
      : sound.wanted
        ? `🔈 ${matchMedia('(pointer: coarse)').matches ? 'Tap' : 'Click'} for sound`
        : '🔇 Sound off';
  };
  const playBtn = h('button', { type: 'button', class: 'cast-stage-play', onclick: () => setPlaying(!playing) });
  const prevBtn = h('button', { type: 'button', 'aria-label': 'Previous character', onclick: () => go(at - 1, true) }, '◀');
  const nextBtn = h('button', { type: 'button', 'aria-label': 'Next character', onclick: () => go(at + 1, true) }, '▶');
  const pick = h('select', {
    'aria-label': 'Pick a character',
    onchange: () =>
      go(
        lineup.findIndex((m) => m.id === pick.value),
        true,
      ),
  });

  const current = () => lineup[at];
  let paraded = 0;
  const spriteOf = (m: CastMember | { id: string }) => sprites.get(m.id);
  const centre = (m: CastMember) => Math.round(W / 2 - (spriteOf(m)?.sprite.w ?? 0) / 2);
  const has = (...ids: string[]) => ids.every((id) => sprites.has(id));
  const isGwinn = (m: CastMember) => m.id === 'gwinn' && has('prop:hat');
  const hatGag = (m: CastMember) => m.id === 'leo' && has('teddy', 'prop:hat') && !!spriteOf(m)?.acts.bareWalk;
  const loafGag = (m: CastMember) => m.id === 'loaf' && has('prop:girl');
  const needleGag = (m: CastMember) => m.id === 'camel' && has('prop:needle');
  const needleX = () => W - 20 - (sprites.get('prop:needle')?.sprite.w ?? 0);
  /** The needle's eye on the stage (castNeedle.ts NEEDLE_EYE: 8 across, 14 down its picture). */
  const eyeX = () => needleX() + 8;
  const eyeY = () => FLOOR + 1 - (sprites.get('prop:needle')?.sprite.h ?? 0) + 14;
  const speed = (m: CastMember) => (isGwinn(m) ? RUN : SPEED);
  const talkMs = (m: CastMember) => TALK_MS + m.hi.length * 25;

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

  function into(next: Phase, now: number): void {
    phase = next;
    t0 = now;
  }

  function hello(m: CastMember, now: number): void {
    x = centre(m);
    into('talk', now);
    say(m);
    const fx = HELLO_FX[m.id];
    if (fx && playing) sound.effect(fx);
  }

  /** Stopped in the light: business first (Teddy with the hat), else hello. */
  function arrive(m: CastMember, now: number): void {
    x = centre(m);
    if (hatGag(m) && !hatOn) {
      into('pre', now);
      helper = { id: 'teddy', x: -24, left: false, speed: RUN, carry: 'hat' };
    } else hello(m, now);
  }

  /** Someone on stage now: walking on when playing, else standing in the light. */
  function go(i: number, chosen = false): void {
    if (!lineup.length) return;
    // the whole parade, start to end with no one picked: an achievement
    paraded = chosen ? 0 : paraded + 1;
    if (paraded > lineup.length) unlockAchievement('cast-parade');
    at = (i + lineup.length) % lineup.length;
    const m = current();
    pick.value = m.id;
    props = [];
    dropped = 0;
    helper = undefined;
    carried = false;
    if (chosen) state.set({ on: m.id });
    t0 = performance.now();
    const walking = playing && !still;
    hatOn = !(walking && hatGag(m));
    snow = m.id === 'lewie' && !walking ? 1 : 0;
    if (walking) {
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

  /** A frame standing on the boards at x (bottom at the floor, `lift` above it), turned round or squeezed. */
  /**
   * A frame with a soft light rim round it (the stage is dark, and so are some outlines: Carl's,
   * Joe's, the camel's), made once per frame.
   */
  const rims = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
  function rimmed(img: HTMLCanvasElement): HTMLCanvasElement {
    let out = rims.get(img);
    if (!out) {
      out = document.createElement('canvas');
      out.width = img.width + 2;
      out.height = img.height + 2;
      const c = out.getContext('2d')!;
      for (const [dx, dy] of [
        [0, 1],
        [2, 1],
        [1, 0],
        [1, 2],
      ])
        c.drawImage(img, dx, dy);
      c.globalCompositeOperation = 'source-in';
      c.fillStyle = 'rgba(232,226,255,0.55)';
      c.fillRect(0, 0, out.width, out.height);
      c.globalCompositeOperation = 'source-over';
      c.drawImage(img, 1, 1);
      rims.set(img, out);
    }
    return out;
  }

  function put(img0: HTMLCanvasElement, px: number, lift = 0, left = false, squeeze = 1, tilt = 0): number {
    const img = rimmed(img0);
    px -= 1;
    lift -= 1;
    const top = FLOOR - img.height + 1 - lift;
    const w = Math.max(1, Math.round(img.width * squeeze));
    const ox = Math.round(px + (img.width - w) / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(ox + 2, FLOOR, Math.max(1, w - 4), 2);
    ctx.save();
    // rocking on its bottom (the Easter egg)
    if (tilt) {
      ctx.translate(ox + w / 2, FLOOR);
      ctx.rotate(tilt);
      ctx.translate(-(ox + w / 2), -FLOOR);
    }
    if (left) {
      ctx.translate(ox + w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, top, w, img.height);
    } else ctx.drawImage(img, ox, top, w, img.height);
    ctx.restore();
    return top + 1;
  }

  const cycle = (frames: HTMLCanvasElement[], now: number, ms: number) => frames[Math.floor(now / ms) % frames.length];

  function drawSnow(): void {
    if (snow <= 0) return;
    ctx.globalAlpha = snow;
    for (const f of flakes) {
      const fx = Math.round(f.x);
      const fy = Math.round(f.y);
      ctx.fillStyle = '#a9b8d6';
      ctx.fillRect(fx + 1, fy + 1, 1, 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(fx, fy, f.big ? 2 : 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  function drawHelper(now: number): void {
    if (!helper) return;
    const hs = sprites.get(helper.id === 'girl' ? 'prop:girl' : helper.id);
    if (!hs) return;
    const top = put(cycle(hs.walk, now, helper.id === 'teddy' ? 70 : hs.sprite.ms), helper.x, 0, helper.left);
    if (helper.carry === 'hat') {
      const hat = sprites.get('prop:hat')!.walk[0];
      ctx.drawImage(hat, Math.round(helper.x) + (helper.left ? -6 : 8), top - 1);
    } else if (helper.carry === 'loaf') {
      const loaf = sprites.get('loaf')!.front[0];
      ctx.drawImage(loaf, Math.round(helper.x) + 6, top + 10);
    }
  }

  function draw(now: number): void {
    backdrop(ctx);
    const m = current();
    const s = m && spriteOf(m);
    if (!s) return;
    const t = now - t0;
    const moving = (phase === 'enter' || phase === 'back' || phase === 'exit') && s.sprite.walk;
    let left = phase === 'back' || (phase === 'exit' && needleGag(m));
    if (s.sprite.mirror) left = !left;
    let frames = moving ? s.walk : s.front;
    let ms = isGwinn(m) && moving ? 70 : s.sprite.ms;
    let squeeze = 1;
    let gone = false;
    // the business
    if (m.id === 'leo' && !hatOn) frames = moving ? s.acts.bareWalk : s.acts.bareSide;
    else if (m.id === 'leo' && phase === 'pre') frames = s.acts.side;
    if (m.id === 'goat' && phase === 'post') {
      const scream = s.acts.scream ?? s.front;
      const faint = s.acts.faint ?? s.front;
      if (t < 900) frames = scream;
      else if (t < 1300) frames = [faint[Math.min(faint.length - 1, Math.floor((t - 900) / 140))]];
      else if (t < 2800) frames = [faint[faint.length - 1]];
      else frames = s.front;
      ms = 120;
    }
    // Brother Camel's needle: it stands at the right all through his turn; he tries its eye,
    // squeezing in behind it so he shows through the hole
    let behind = false;
    let up = 0;
    let drawNeedle = () => {};
    if (needleGag(m)) {
      const needle = sprites.get('prop:needle')!.walk[0];
      const alpha = phase === 'enter' ? Math.min(1, t / 700) : phase === 'exit' ? Math.max(0, 1 - t / 900) : 1;
      drawNeedle = () => {
        ctx.globalAlpha = alpha;
        put(needle, needleX());
        ctx.globalAlpha = 1;
      };
      if (phase === 'post') {
        // lifted so his middle is at the eye
        const reach = Math.max(0, FLOOR + 1 - s.sprite.h / 2 - eyeY());
        if (t < 1600) {
          frames = s.walk;
          const k = Math.max(0, (t - 1200) / 400);
          up = reach * k;
          squeeze = 1 - 0.4 * k;
          behind = k > 0.4;
        } else if (t < 2900) {
          frames = s.walk;
          up = reach;
          // thinner and thinner, with a wobble
          squeeze = 0.6 - 0.34 * Math.min(1, (t - 1600) / 900) + (Math.floor(t / 90) % 2) * 0.05;
          behind = true;
        } else if (t < 3200) {
          // pop! back out
          frames = s.front;
          up = reach * (1 - (t - 2900) / 300);
          squeeze = 1.2;
        } else frames = s.front;
      }
      if (!behind) drawNeedle();
    }
    if (loafGag(m) && carried) gone = true;
    if (props.length) drawProps(phase === 'exit' ? Math.max(0, 1 - t / 700) : 1);
    const fade = !s.sprite.walk && (phase === 'enter' || phase === 'exit') ? Math.min(1, Math.max(0, t / 600)) : 1;
    const frame = still && !playing ? frames[0] : cycle(frames, now, ms);
    if (!gone) {
      ctx.globalAlpha = phase === 'exit' && !s.sprite.walk ? 1 - fade : fade;
      // a waddle for one who walks on in a single frame, a hop for the tin heart
      const lift = moving
        ? s.sprite.hop
          ? Math.round(Math.abs(Math.sin((now / 260) * Math.PI)) * 7)
          : s.walk.length === 1
            ? Math.floor(now / 160) % 2
            : 0
        : 0;
      const tilt = moving && s.sprite.wobble ? Math.sin(now / 140) * 0.28 : 0;
      const top = put(frame, x, lift + Math.round(up), left, squeeze, tilt);
      ctx.globalAlpha = 1;
      // Gwinn has Doc Leo's hat in her mouth, all the way off
      if (isGwinn(m)) {
        const hat = sprites.get('prop:hat')!.walk[0];
        if (moving) ctx.drawImage(hat, left ? Math.round(x) + s.sprite.w - 9 - hat.width : Math.round(x) + 9, top + 1);
        else ctx.drawImage(hat, Math.round(x), top + 8);
      }
    }
    if (behind) drawNeedle();
    drawHelper(now);
    drawSnow();
    // sounds with the frames: footsteps, the tick-tock, the whirr
    const n = frames.indexOf(frame) + (moving ? 0 : 100);
    if (n !== lastFrame && playing) {
      if (s.sprite.tick) sound.tick(n);
      else if (moving && m.id === 'chez') sound.whirr();
      else if (moving && n % 2 === 0) sound.step();
    }
    lastFrame = n;
  }

  /** The business after hello; true when it is over. */
  function post(m: CastMember, now: number, dt: number): boolean {
    const t = now - t0;
    if (m.id === 'goat') {
      if (t >= 900 && t - dt * 1000 < 900) sound.effect('goat/faint');
      return t > 3300;
    }
    if (needleGag(m)) {
      // up to the needle, in line with its eye, and back out
      const beside = eyeX() - 10 - 16;
      if (t < 1200) x = Math.min(beside, x + SPEED * dt);
      else if (t < 1600) x = Math.min(eyeX() - 10, x + 30 * dt);
      else if (t >= 2900 && t < 3200) x = Math.max(beside, x - 60 * dt);
      if (t >= 1200 && t - dt * 1000 < 1200) sound.effect('needle/squeeze');
      if (t >= 2900 && t - dt * 1000 < 2900) sound.effect('needle/sigh');
      return t > 3900;
    }
    if (loafGag(m)) {
      if (!helper) helper = { id: 'girl', x: -22, left: false, speed: SPEED };
      if (!carried) {
        helper.x += helper.speed * dt;
        if (helper.x >= x - 10) {
          carried = true;
          helper.carry = 'loaf';
          sound.effect('loaf/mama');
        }
      } else helper.x += helper.speed * dt;
      return helper.x > W;
    }
    return true;
  }

  function tick(now: number): void {
    raf = 0;
    const dt = Math.min(0.1, (now - (last || now)) / 1000);
    last = now;
    const m = current();
    const s = m && spriteOf(m);
    if (playing && s) {
      const t = now - t0;
      if (m.id === 'lewie') snow = phase === 'exit' ? Math.max(0, snow - dt * 1.4) : Math.min(1, snow + dt * 1.2);
      if (phase === 'enter') {
        x = s.sprite.walk ? x + speed(m) * dt : centre(m);
        // the costume falls out behind her as she runs
        while (isGwinn(m) && dropped < PROPS.length && x >= DROPS[dropped]) {
          props.push(prop(PROPS[dropped], x + 2, FLOOR - 14));
          dropped++;
        }
        // Gwinn runs right across first and comes back; everyone else stops in the light
        if (isGwinn(m) && x >= TURN) into('back', now);
        else if (!isGwinn(m) && x >= centre(m) && (s.sprite.walk || t > 600)) arrive(m, now);
      } else if (phase === 'back') {
        x -= speed(m) * dt;
        if (x <= centre(m)) hello(m, now);
      } else if (phase === 'pre' && helper) {
        // Teddy runs up with the hat, hands it over with a happy bark, and runs back off
        if (helper.carry) {
          helper.x += helper.speed * dt;
          if (helper.x >= x - 15) {
            helper.carry = undefined;
            helper.left = true;
            hatOn = true;
            sound.effect('woof');
            t0 = now;
          }
        } else if (t > 450) {
          helper.x -= helper.speed * dt;
          if (helper.x < -24) {
            helper = undefined;
            hello(m, now);
          }
        }
      } else if (phase === 'talk') {
        if (t > talkMs(m)) {
          if (loafGag(m) || m.id === 'goat' || needleGag(m)) {
            into('post', now);
            if (m.id === 'goat') sound.effect('goat/scream');
          } else {
            into('exit', now);
            say(undefined);
          }
        }
      } else if (phase === 'post') {
        if (post(m, now, dt)) {
          if (loafGag(m)) {
            go(at + 1);
            return;
          }
          into('exit', now);
          say(undefined);
        }
      } else {
        const off = needleGag(m) ? -1 : 1;
        x = s.sprite.walk ? x + off * speed(m) * dt : x;
        if (x > W || x < -s.sprite.w - 2 || (!s.sprite.walk && t > 600)) {
          go(at + 1);
          return;
        }
      }
      for (const f of flakes) {
        f.y += f.v * dt;
        if (f.y > H) [f.y, f.x] = [-2, (f.x + 61) % W];
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
  root.addEventListener('click', () => (sound.start(), showSound()));
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

  void fetch('./cast/sprites.json')
    .then((r) => (r.ok ? (r.json() as Promise<Record<string, CastSprite>>) : {}))
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- without it the chain's value is unknown
    .catch(() => ({}) as Record<string, CastSprite>)
    .then((all) => {
      for (const [id, sprite] of Object.entries(all)) {
        const frames = spriteCanvases(sprite);
        const n = sprite.nWalk ?? frames.length;
        const acts = Object.fromEntries(Object.entries(sprite.acts ?? {}).map(([k, [a, c]]) => [k, frames.slice(a, a + c)]));
        const end = Math.min(frames.length, ...Object.values(sprite.acts ?? {}).map(([a]) => a));
        sprites.set(id, { sprite, walk: frames.slice(0, n), front: n < end ? frames.slice(n, end) : frames.length === 2 ? frames : [frames[0]], acts });
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
