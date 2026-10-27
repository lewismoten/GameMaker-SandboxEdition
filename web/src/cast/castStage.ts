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
// castSound.ts; the small stage that floats in a corner once this one scrolls away: castMini.ts.
// One frame is drawn by castStageScene.ts (with castStageDraw.ts); the goat's and the camel's
// poses, and who has which business, are castStageGags.ts.
import { h } from '../editor/core/ui';
import { currentRoute, type ViewState } from '../urlState';
import { spriteCanvases, type CastSprite } from './castSprite';
import type { CastMember } from './castData';
import { StageSound, type Effect } from './castSound';
import { unlockAchievement } from '../achievements';
import { castMini } from './castMini';
import { backdrop, cutSprite, FLOOR, H, newFlakes, newProp, stagePut, stepFlakes, stepProps, W, type Prop, type Sprite } from './castStageDraw';
import { stageGags } from './castStageGags';
import { drawScene, type Helper, type Phase } from './castStageScene';

/** Logical pixels a second. */
const SPEED = 40;
const TALK_MS = 4200;
/** Running (Gwinn's zoomies, Teddy with the hat). */
const RUN = 100;

/** What each one says out loud: on walking on, and on stopping in the light. */
const ENTER_FX: Record<string, Effect> = { gwinn: 'yip' };
const HELLO_FX: Record<string, Effect> = { chicken: 'squeak', chez: 'honk', leo: 'giggle', bard: 'pop', rootbeer: 'pop', teddy: 'woof' };

const PROPS = ['tie', 'shoes', 'chicken', 'nose'];
/** Where Gwinn is when each piece falls out. */
const DROPS = [26, 50, 74, 98];
/** Where she turns round to come back to the light. */
const TURN = 122;

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
  const flakes = newFlakes();

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
  const center = (m: CastMember) => Math.round(W / 2 - (spriteOf(m)?.sprite.w ?? 0) / 2);
  const gags = stageGags(sprites);
  const { isGwinn, hatGag, loafGag, needleGag, eyeX } = gags;
  const speed = (m: CastMember) => (isGwinn(m) ? RUN : SPEED);
  const talkMs = (m: CastMember) => TALK_MS + m.hi.length * 25;

  function say(m: CastMember | undefined): void {
    mini.say(m?.name ?? '');
    name.textContent = m ? `${m.name}: ` : '';
    line.textContent = m ? m.hi : '';
    bubble.classList.toggle('quiet', !m);
  }

  function setPlaying(on: boolean): void {
    playing = on;
    playBtn.textContent = on ? '❚❚ Pause' : '▶ Play';
    playBtn.setAttribute('aria-pressed', String(!on));
    mini.setPlaying(on);
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
    x = center(m);
    into('talk', now);
    say(m);
    const fx = HELLO_FX[m.id];
    if (fx && playing) sound.effect(fx);
  }

  /** Stopped in the light: business first (Teddy with the hat), else hello. */
  function arrive(m: CastMember, now: number): void {
    x = center(m);
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
      x = center(m);
      say(m);
      // a pick while paused: the costume already lies where Gwinn dropped it
      if (isGwinn(m)) for (const [k, p] of PROPS.entries()) props.push(prop(p, DROPS[k] - 6, FLOOR, true));
    }
    draw(t0);
    mini.mirror();
    loop();
  }

  function prop(id: string, px: number, py: number, landed = false): Prop {
    return newProp(sprites.get(`prop:${id}`)!.walk[0], px, py, landed);
  }

  /** A frame standing on the boards at x (bottom at the floor, `lift` above it), turned round or squeezed. */
  const put = stagePut(ctx);

  function draw(now: number): void {
    const m = current();
    const drawn = drawScene(ctx, put, sprites, gags, { m, phase, t0, x, hatOn, carried, props, helper, snow, flakes, frozen: still && !playing }, now);
    if (!drawn) return;
    // sounds with the frames: footsteps, the tick-tock, the whirr
    const { n, moving } = drawn;
    if (n !== lastFrame && playing) {
      if (drawn.sprite.tick) sound.tick(n);
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
        x = s.sprite.walk ? x + speed(m) * dt : center(m);
        // the costume falls out behind her as she runs
        while (isGwinn(m) && dropped < PROPS.length && x >= DROPS[dropped]) {
          props.push(prop(PROPS[dropped], x + 2, FLOOR - 14));
          dropped++;
        }
        // Gwinn runs right across first and comes back; everyone else stops in the light
        if (isGwinn(m) && x >= TURN) into('back', now);
        else if (!isGwinn(m) && x >= center(m) && (s.sprite.walk || t > 600)) arrive(m, now);
      } else if (phase === 'back') {
        x -= speed(m) * dt;
        if (x <= center(m)) hello(m, now);
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
      stepFlakes(flakes, dt);
    }
    stepProps(props, dt, () => sound.effect('flop'));
    draw(now);
    mini.mirror();
    loop(false);
  }

  /** Asks for the next frame; `fresh` after a pause, so the time away is not walked at once. */
  function loop(fresh = true): void {
    if (raf || !(visible || mini.shown) || document.hidden || (still && !playing)) return;
    if (fresh) last = 0;
    raf = requestAnimationFrame(tick);
  }

  const box = h('div', { class: 'cast-stage-box' }, canvas, bubble);
  const mini = castMini(canvas, {
    toggle: () => setPlaying(!playing),
    // up to the full stage, with the keyboard on its play button
    back: () => {
      playBtn.focus({ preventScroll: true });
      root.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' });
    },
    change: () => loop(),
  });
  const root = h(
    'section',
    { class: 'cast-stage', 'aria-labelledby': 'cast-stage-h' },
    h('h2', { id: 'cast-stage-h' }, 'On stage'),
    box,
    h('div', { class: 'cast-stage-controls' }, prevBtn, playBtn, nextBtn, pick, soundBtn),
    mini.el,
  );
  // the sound starts with a tap on the stage or its controls (browsers, and iPhones most of all,
  // only let it start from a gesture)
  root.addEventListener('click', () => (sound.start(), showSound()));
  canvas.addEventListener('click', () => setPlaying(!playing));

  // the frames stop while none of the stage is in view, unless the small one shows them; it shows
  // once the stage has scrolled away above
  const seen = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    mini.stageInView(e.isIntersecting || e.boundingClientRect.top > 0);
    loop();
  });
  seen.observe(box);
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
      for (const [id, sprite] of Object.entries(all)) sprites.set(id, cutSprite(sprite, spriteCanvases(sprite)));
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
