// The page's one AudioContext, shared by everything that makes a sound (the game player,
// the demos, the walkthrough, the desk's clicks and squeaks, the phone, the music box).
//
// Browsers only let sound start from a user gesture, and iOS Safari is the strictest:
//  - a context starts 'suspended' and resume() only works inside a touchend/pointerup/click
//    (or keydown) handler, synchronously, not after an await; pointerdown from a finger does
//    not count. So the page listens for every such gesture (capture phase, so a control that
//    stops the event still unlocks) and resumes the context right there, and plays a
//    one-sample silent buffer, which is what finally opens the output on older iOS.
//  - one context for the page: each new one would need a gesture of its own, and iOS limits
//    how many a page may have.
//  - a phone call, Siri or another app's audio puts the context in 'interrupted' (and the
//    page going to the background 'suspended'): it is resumed when the page is shown again
//    (visibilitychange, pageshow) and on the next gesture.
//  - the ring/silent switch mutes Web Audio by default ("ambient" audio). Safari 17+ has
//    navigator.audioSession: setting its type to 'playback' makes the page's sound play with
//    the switch on, like a video does. Older iOS stays silent with the switch on (routing
//    through a MediaStreamDestination into an <audio> element works there too, but adds
//    latency to every key's sound effect, and the "Now Playing" controls appear; not done).
// The context runs at the device's rate (48000 on most iPhones); every sound here works at
// ctx.sampleRate (the OPL worklet's global sampleRate, VOC buffers at their own rate, which
// Web Audio resamples), so nothing assumes 44100.

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

let ctx: AudioContext | undefined;
let unlocked = false;
const unlockListeners = new Set<() => void>();

const GESTURES = ['pointerup', 'touchend', 'click', 'keydown', 'mousedown'] as const;

function Ctor(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

/** Sound plays with the ring/silent switch on (Safari 17+); elsewhere nothing happens. */
function playbackSession(): void {
  try {
    const s = (navigator as AudioSessionNavigator).audioSession;
    if (s && s.type !== 'playback') s.type = 'playback';
  } catch {
    /* not supported */
  }
}

/** The page's AudioContext (made on first use; undefined where there is no Web Audio). */
export function audioContext(): AudioContext | undefined {
  if (ctx) return ctx;
  const C = Ctor();
  if (!C) return undefined;
  try {
    playbackSession();
    ctx = new C({ latencyHint: 'interactive' });
  } catch {
    return undefined;
  }
  listen();
  ctx.addEventListener('statechange', () => {
    // iOS interrupts for a call or Siri and does not always come back on its own
    if (ctx && ctx.state !== 'running' && unlocked && document.visibilityState === 'visible') void ctx.resume().catch(() => undefined);
  });
  // made inside a gesture (a click on Play): it may run at once
  if (navigator.userActivation?.isActive) unlock();
  return ctx;
}

/** True once a gesture has let the page's sound start (the context is running, or was). */
export function soundUnlocked(): boolean {
  return unlocked && !!ctx && ctx.state === 'running';
}

/** Calls `f` (inside the gesture's handler, so it may create and start nodes) each time sound unlocks. */
export function onSoundUnlocked(f: () => void): () => void {
  unlockListeners.add(f);
  return () => unlockListeners.delete(f);
}

/**
 * Resumes the context; must run inside a user gesture's handler the first time (iOS).
 * Called by the page's own gesture listeners; call it too from a handler that also starts
 * a sound, before any await.
 */
export function unlock(): void {
  const c = audioContext();
  if (!c) return;
  playbackSession();
  const first = !unlocked;
  unlocked = true;
  if (c.state !== 'running') void c.resume().catch(() => undefined);
  if (first) {
    // one silent sample: older iOS only opens the output once something has played
    try {
      const src = c.createBufferSource();
      src.buffer = c.createBuffer(1, 1, c.sampleRate);
      src.connect(c.destination);
      src.start(0);
    } catch {
      /* closed */
    }
  }
  for (const f of [...unlockListeners]) {
    try {
      f();
    } catch (e) {
      console.warn(e);
    }
  }
}

let listening = false;

function onGesture(e: Event): void {
  // a finger's pointerup counts as a gesture on iOS, a mouse's does too; a key needs to be a real one
  if (e.type === 'keydown' && ((e as KeyboardEvent).key === 'Shift' || (e as KeyboardEvent).key === 'Meta')) return;
  if (!e.isTrusted) return;
  if (soundUnlocked()) return;
  // (the context is made here if nothing has asked for one yet: one made later, outside a
  // gesture, would start suspended on iOS)
  unlock();
}

function wake(): void {
  if (ctx && unlocked && ctx.state !== 'running' && document.visibilityState === 'visible') void ctx.resume().catch(() => undefined);
}

function listen(): void {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  for (const t of GESTURES) window.addEventListener(t, onGesture, { capture: true, passive: true });
  document.addEventListener('visibilitychange', wake);
  window.addEventListener('pageshow', wake);
  window.addEventListener('focus', wake);
}

// the gestures count from the page's first tap, even before anything asks for sound
if (typeof window !== 'undefined') listen();
