// The sound a demo plays with, one choice for every demo on the page (the home page's
// previews, the demo video dialog and the walkthrough player), remembered between visits:
//  - Sound Blaster: the OPL music and the digitized (.voc) effects, as PLAYGAME played them
//    with a card;
//  - PC speaker: what PLAYGAME did when SoundCard() found no card (code/GM/SBMUSIC.C): no
//    songs, and every effect on the speaker (the session's speakerOnly, engine/scene.ts),
//    the way the desk PC plays with its Sound Blaster switched off (retro/computer/soundBlaster.ts);
//  - None: silent.
// A change applies at once to a demo playing: DemoAudioEngine (demoAudioEngine.ts, apart so a
// page that only reads the choice does not load the audio engine) remembers the song the game
// asked for, so switching back to the card starts it again.
import './demoAudio.css';

export type DemoAudio = 'none' | 'blaster' | 'speaker';

const DEMO_AUDIO: readonly DemoAudio[] = ['none', 'blaster', 'speaker'];

export const DEMO_AUDIO_LABEL: Record<DemoAudio, string> = {
  none: 'None',
  blaster: 'Sound Blaster',
  speaker: 'PC speaker',
};

/** What fits over a small picture. */
const SHORT_LABEL: Record<DemoAudio, string> = { none: 'Off', blaster: 'SB', speaker: 'PC' };

const TIP: Record<DemoAudio, string> = {
  none: 'No sound',
  blaster: 'Sound Blaster: music and digitized sound effects',
  speaker: 'PC speaker: no music, every sound effect beeped on the speaker (a PC without a sound card)',
};

const KEY = 'gm-demo-audio';

function load(): DemoAudio {
  try {
    const v = localStorage.getItem(KEY) as DemoAudio | null;
    return v && DEMO_AUDIO.includes(v) ? v : 'blaster';
  } catch {
    return 'blaster';
  }
}

let mode = load();
const listeners = new Set<(m: DemoAudio) => void>();

/** While something else is talking (the guided tour), demos are silent; the choice itself is kept. */
let hushed = false;

/** The sound demos play with (Sound Blaster until another is picked; none while hushed). */
export function demoAudio(): DemoAudio {
  return hushed ? 'none' : mode;
}

/** Silences every demo for a while, or gives back the visitor's choice; never saved. */
export function hushDemos(on: boolean): void {
  if (on === hushed) return;
  hushed = on;
  for (const f of [...listeners]) f(demoAudio());
}

/** Picks the sound; `again` tells the demos even when it is the same (a click on the choice already made). */
export function setDemoAudio(m: DemoAudio, again = false): void {
  if (m === mode && !again) return;
  mode = m;
  try {
    localStorage.setItem(KEY, m);
  } catch {
    /* storage blocked: the choice holds until the page closes */
  }
  for (const f of [...listeners]) f(demoAudio());
}

/** Calls `f` whenever the choice changes; returns a function that stops it. */
export function onDemoAudio(f: (m: DemoAudio) => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}

let groups = 0;

interface DemoAudioPickerOptions {
  /** The owner's lifetime: unsubscribe immediately when its dialog or page closes. */
  signal?: AbortSignal;
  /** Short labels (Off · SB · PC), for over a small picture; the full names stay for screen readers. */
  compact?: boolean;
  /** The group's name for screen readers (default "Demo sound"). */
  label?: string;
  /** Show the label in front of the choices. */
  showLabel?: boolean;
  className?: string;
}

/**
 * None · Sound Blaster · PC speaker, as one row of buttons (radio buttons, so the arrow keys
 * move between them). Every picker on the page shows the same choice.
 */
export function demoAudioPicker(o: DemoAudioPickerOptions = {}): HTMLElement {
  const name = `demo-audio-${++groups}`;
  const label = o.label ?? 'Demo sound';
  const el = document.createElement('div');
  el.className = `demo-audio${o.compact ? ' compact' : ''}${o.className ? ` ${o.className}` : ''}`;
  el.setAttribute('role', 'radiogroup');
  el.setAttribute('aria-label', label);
  if (o.showLabel) {
    const span = document.createElement('span');
    span.className = 'demo-audio-label';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = label;
    el.append(span);
  }
  const inputs = DEMO_AUDIO.map((m) => {
    const lab = document.createElement('label');
    lab.title = TIP[m];
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.value = m;
    input.checked = m === mode;
    // (a click, or an arrow key, which clicks too; clicking the choice already made starts a
    // sound that waited for the visitor to use the page)
    input.addEventListener('click', () => input.checked && setDemoAudio(m, true));
    // over a picture that plays the demo when clicked, a choice is only a choice
    lab.addEventListener('click', (e) => e.stopPropagation());
    const text = document.createElement('span');
    if (o.compact) {
      text.setAttribute('aria-hidden', 'true');
      text.textContent = SHORT_LABEL[m];
      const full = document.createElement('span');
      full.className = 'demo-audio-sr';
      full.textContent = DEMO_AUDIO_LABEL[m];
      lab.append(input, text, full);
    } else {
      text.textContent = DEMO_AUDIO_LABEL[m];
      lab.append(input, text);
    }
    el.append(lab);
    return input;
  });
  let seen = false;
  const off = onDemoAudio((m) => {
    if (el.isConnected) seen = true;
    else if (seen) return off();
    for (const i of inputs) i.checked = i.value === m;
  });
  if (o.signal?.aborted) off();
  else o.signal?.addEventListener('abort', () => void off(), { once: true });
  return el;
}
