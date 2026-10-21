// The people on the other end of the line, spoken by the browser's own speech synthesis
// (each with their own pitch and pace). Without speech, the caption alone tells it and the
// line waits about as long as the words would take to say.

export interface Voice {
  /** Shown before the caption: "Grandma". */
  who: string;
  pitch: number;
  rate: number;
  /** Voices to use if the browser has them, best first (macOS has "Grandma", for one). */
  prefer: string[];
}

const WOMAN = [
  "Samantha",
  "Victoria",
  "Karen",
  "Microsoft Zira",
  "Google US English",
];
const MAN = [
  "Fred",
  "Alex",
  "Daniel",
  "Microsoft David",
  "Google UK English Male",
];

export const VOICES = {
  dispatcher: { who: "911", pitch: 1, rate: 1.05, prefer: WOMAN },
  receptionist: { who: "Receptionist", pitch: 1.25, rate: 1.1, prefer: WOMAN },
  mom: { who: "Mom", pitch: 1.15, rate: 1.1, prefer: WOMAN },
  dad: { who: "Dad", pitch: 0.7, rate: 1.15, prefer: MAN },
  shop: { who: "Maintenance shop", pitch: 0.85, rate: 1.05, prefer: MAN },
  jenny: { who: "Jenny", pitch: 1.3, rate: 1.25, prefer: WOMAN },
  timeLady: {
    who: "Time & temperature",
    pitch: 1.05,
    rate: 0.95,
    prefer: WOMAN,
  },
  weather: { who: "Weather line", pitch: 0.9, rate: 1, prefer: MAN },
  movies: { who: "Movie Line", pitch: 0.75, rate: 1.05, prefer: MAN },
  grandma: {
    who: "Grandma",
    pitch: 1.35,
    rate: 0.8,
    prefer: ["Grandma", ...WOMAN],
  },
  recording: { who: "Recording", pitch: 1.1, rate: 0.95, prefer: WOMAN },
  machine: {
    who: "Answering machine",
    pitch: 1,
    rate: 1.05,
    prefer: [...MAN, ...WOMAN],
  },
  robot: {
    who: "Recording",
    pitch: 0.8,
    rate: 0.95,
    prefer: ["Zarvox", "Trinoids", ...MAN],
  },
} satisfies Record<string, Voice>;

function pick(v: Voice): SpeechSynthesisVoice | undefined {
  const all = speechSynthesis
    .getVoices()
    .filter((x) => x.lang.startsWith("en"));
  for (const name of v.prefer) {
    const found = all.find((x) => x.name.startsWith(name));
    if (found) return found;
  }
  return all.find((x) => x.lang === "en-US") ?? all[0];
}

/** Says the words; resolves when they have been said (or the call ended). */
export function speak(
  text: string,
  v: Voice,
  signal: AbortSignal,
): Promise<void> {
  // about how long the words take, for browsers without speech (and as a safety net)
  const estimate = (text.length * 75) / v.rate + 600;
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    let timer = 0;
    const done = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      resolve();
    };
    const cancel = () => {
      if ("speechSynthesis" in window) speechSynthesis.cancel();
      done();
    };
    signal.addEventListener("abort", cancel);
    if (!("speechSynthesis" in window)) {
      timer = setTimeout(done, estimate) as unknown as number;
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.pitch = v.pitch;
    u.rate = v.rate;
    const voice = pick(v);
    if (voice) u.voice = voice;
    u.onend = done;
    u.onerror = done;
    timer = window.setTimeout(done, estimate * 2 + 4000);
    speechSynthesis.speak(u);
  });
}
