// Life in the Library room (libraryRoom.ts): now and then one of the site's cast (Teddy, Gwinn, Doc
// Leo, Teenage Lewie, from public/cast/sprites.json) wanders in, browses and leaves, and, once the
// visitor has clicked or pressed a key on the page (so the browser allows sound), a very quiet cough, page
// turn or chair creak is made now and then with Web Audio. Both stop when the visitor leaves the page; the
// sound follows the site's demo sound choice (None is silent). With reduced motion the visitors stand
// still where they appear and the sounds are the same.
import { output } from '@lewismoten/gamemaker-sandbox-engine/audio/output';
import { demoAudio } from '../media/demoAudio';
import { place } from './roomObjects';

const CAST = ['teddy', 'gwinn', 'leo', 'lewie'];
const between = (a: number, b: number) => a + Math.random() * (b - a);

/** One short quiet sound, played through `ctx`. */
function makeSound(ctx: AudioContext, kind: number): void {
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = 0.05;
  out.connect(output(ctx)); // through the speakers' volume knob, like the desk's sounds
  const noise = (len: number) => {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  };
  const shape = (g: GainNode, at: number, peak: number, len: number) => {
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak, at + len * 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, at + len);
  };
  if (kind === 0) {
    // a soft cough: two short bursts of voiced noise
    for (const dt of [0, 0.22]) {
      const src = noise(0.14);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 650;
      f.Q.value = 1.2;
      const g = ctx.createGain();
      shape(g, t + dt, 1, 0.14);
      src.connect(f).connect(g).connect(out);
      src.start(t + dt);
    }
  } else if (kind === 1) {
    // a page turning: a soft swish of high noise
    const src = noise(0.4);
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 2600;
    const g = ctx.createGain();
    shape(g, t, 0.7, 0.4);
    src.connect(f).connect(g).connect(out);
    src.start(t);
  } else {
    // a chair creaking: a low saw gliding up, filtered dark
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(85, t);
    o.frequency.linearRampToValueAtTime(130, t + 0.5);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 420;
    const g = ctx.createGain();
    shape(g, t, 0.6, 0.55);
    o.connect(f).connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.6);
  }
}

/** Starts the visitors and the sounds for `room`; they end themselves once the room leaves the page. */
export function startAmbience(room: HTMLElement): void {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timers = new Set<number>();
  let ctx: AudioContext | undefined;
  let gestured = false;
  const gone = () => {
    if (room.isConnected) return false;
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
    void ctx?.close().catch(() => undefined);
    ctx = undefined;
    for (const e of ['pointerdown', 'keydown']) removeEventListener(e, onGesture, true);
    return true;
  };
  const later = (f: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      if (!gone()) f();
    }, ms);
    timers.add(id);
  };
  const onGesture = () => (gestured = true);
  for (const e of ['pointerdown', 'keydown']) addEventListener(e, onGesture, { capture: true, once: true });
  // leaving the page: the next page may draw a moment after the address changes, so look again shortly after
  addEventListener('hashchange', () => {
    for (const ms of [100, 600, 2000]) setTimeout(gone, ms);
  });
  const sound = () => {
    if (gestured && !document.hidden && demoAudio() !== 'none') {
      try {
        ctx ??= new AudioContext();
        void ctx.resume();
        makeSound(ctx, Math.floor(Math.random() * 3));
      } catch {
        /* no audio here */
      }
    }
    later(sound, between(40_000, 90_000));
  };
  later(sound, between(25_000, 45_000));

  const visit = async () => {
    const layer = room.querySelector('.lib-visitors');
    if (!layer || document.hidden) return later(visit, between(20_000, 40_000));
    const { loadSprites } = await import('../tour/actor');
    const all = await loadSprites();
    // never a second copy of someone the tour has on screen (the tour takes over a visitor already here)
    const free = CAST.filter((who) => !document.querySelector(`.tour-actor[data-host="${who}"]`));
    if (!free.length) return later(visit, between(20_000, 40_000));
    const id = free[Math.floor(Math.random() * free.length)];
    const sprite = all.get(id);
    if (!sprite || gone()) return;
    const frames = (walking: boolean) => (walking && sprite.walk.length ? sprite.walk : sprite.front);
    const c = document.createElement('canvas');
    c.className = 'lib-visitor';
    c.dataset.cast = id;
    c.width = sprite.sprite.w;
    c.height = sprite.sprite.h;
    // standing on the floor in front of the desk, sized for that depth (a sprite pixel is about 4 cm)
    place(c, 0, -0.95, sprite.sprite.w * 0.035);
    const g = c.getContext('2d');
    let walking = true;
    let n = 0;
    const draw = () => {
      const f = frames(walking)[n++ % frames(walking).length];
      g?.clearRect(0, 0, c.width, c.height);
      if (f) g?.drawImage(f, 0, 0);
    };
    draw();
    const spot = between(22, 70);
    const fromLeft = Math.random() < 0.5;
    // the sprites face right: face the way each walk goes, and the viewer while browsing
    const faceHeading = (left: boolean) => (c.style.transform = left ? 'scaleX(-1)' : '');
    const end = () => {
      c.remove();
      later(visit, between(25_000, 55_000));
    };
    if (still) {
      // reduced motion: a still figure that appears, stays a while and goes
      c.style.left = `${spot}%`;
      layer.append(c);
      return later(end, 20_000);
    }
    c.style.left = fromLeft ? '-12%' : '104%';
    faceHeading(!fromLeft);
    layer.append(c);
    const tick = window.setInterval(() => (room.isConnected && c.isConnected ? draw() : clearInterval(tick)), sprite.sprite.ms);
    void c.offsetWidth;
    c.style.left = `${spot}%`;
    later(() => {
      walking = false; // browsing: stands facing the room
      faceHeading(false);
      later(
        () => {
          walking = true;
          faceHeading(fromLeft);
          c.style.left = fromLeft ? '-12%' : '104%';
          later(() => (clearInterval(tick), end()), 6200);
        },
        between(5000, 9000),
      );
    }, 6200);
  };
  later(visit, between(6000, 12_000));
}
