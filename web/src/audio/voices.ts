// The people on the other end of the line (the desk's wall phone, and whoever picks up an
// extension during a BBS call), spoken by the browser's own speech synthesis (each with their
// own pitch and pace). Without speech, the caption alone tells it and the line waits about as
// long as the words would take to say. They follow the Voice setting (sound settings dialog):
// off or 0 keeps them silent (the caption and the wait stay), the volume sets each line's
// loudness, and switching Voice off mid-line stops the speech (a volume change shows in the
// next line: the browser can't change a line already being said).
import { channelGain, onMix } from '@lewismoten/gamemaker-sandbox-engine/audio/mix';

export interface Voice {
  /** Shown before the caption: "Grandma". */
  who: string;
  pitch: number;
  rate: number;
  /** Voices to use if the browser has them, best first (macOS has "Grandma", for one). */
  prefer: string[];
}

const WOMAN = ['Samantha', 'Victoria', 'Karen', 'Microsoft Zira', 'Google US English'];
const MAN = ['Fred', 'Alex', 'Daniel', 'Microsoft David', 'Google UK English Male'];

export const VOICES = {
  dispatcher: { who: '911', pitch: 1, rate: 1.05, prefer: WOMAN },
  // Linda, who answers Mom's work line: another woman's voice than Mom's where the browser has one, and higher
  receptionist: {
    who: 'Receptionist',
    pitch: 1.45,
    rate: 1.15,
    prefer: ['Victoria', 'Karen', 'Moira', 'Tessa', 'Microsoft Hazel', 'Microsoft Susan', 'Google UK English Female', ...WOMAN],
  },
  mom: { who: 'Mom', pitch: 1.05, rate: 1.05, prefer: WOMAN },
  dad: { who: 'Dad', pitch: 0.7, rate: 1.15, prefer: MAN },
  shop: { who: 'Maintenance shop', pitch: 0.85, rate: 1.05, prefer: MAN },
  jenny: { who: 'Jenny', pitch: 1.3, rate: 1.25, prefer: WOMAN },
  timeLady: {
    who: 'Time & temperature',
    pitch: 1.05,
    rate: 0.95,
    prefer: WOMAN,
  },
  weather: { who: 'Weather line', pitch: 0.9, rate: 1, prefer: MAN },
  movies: { who: 'Movie Line', pitch: 0.75, rate: 1.05, prefer: MAN },
  grandma: {
    who: 'Grandma',
    pitch: 1.35,
    rate: 0.8,
    prefer: ['Grandma', ...WOMAN],
  },
  recording: { who: 'Recording', pitch: 1.1, rate: 0.95, prefer: WOMAN },
  machine: {
    who: 'Answering machine',
    pitch: 1,
    rate: 1.05,
    prefer: [...MAN, ...WOMAN],
  },
  robot: {
    who: 'Recording',
    pitch: 0.8,
    rate: 0.95,
    prefer: ['Zarvox', 'Trinoids', ...MAN],
  },
} satisfies Record<string, Voice>;

function pick(v: Voice): SpeechSynthesisVoice | undefined {
  const all = speechSynthesis.getVoices().filter((x) => x.lang.startsWith('en'));
  for (const name of v.prefer) {
    const found = all.find((x) => x.name.startsWith(name));
    if (found) return found;
  }
  return all.find((x) => x.lang === 'en-US') ?? all[0];
}

/** Says the words; resolves when they have been said (or the call ended). */
export function speak(text: string, v: Voice, signal: AbortSignal): Promise<void> {
  // about how long the words take, for browsers without speech (and as a safety net)
  const estimate = (text.length * 75) / v.rate + 600;
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    let timer = 0;
    const done = () => {
      clearTimeout(timer);
      unmix();
      signal.removeEventListener('abort', cancel);
      resolve();
    };
    let silenced = false;
    const unmix = onMix(() => {
      if (channelGain('voice') > 0 || silenced) return;
      silenced = true; // muted mid-line: stop talking, wait out the rest as for a caption
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      clearTimeout(timer);
      timer = window.setTimeout(done, estimate);
    });
    const cancel = () => {
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      done();
    };
    signal.addEventListener('abort', cancel);
    if (!('speechSynthesis' in window) || channelGain('voice') <= 0) {
      timer = setTimeout(done, estimate) as unknown as number;
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.pitch = v.pitch;
    u.rate = v.rate;
    const voice = pick(v);
    if (voice) u.voice = voice;
    u.volume = channelGain('voice');
    u.onend = () => (silenced ? undefined : done());
    u.onerror = () => (silenced ? undefined : done());
    timer = window.setTimeout(done, estimate * 2 + 4000);
    speechSynthesis.speak(u);
  });
}
