// The visitor's sound settings: Music, Voice (the tour's spoken lines) and Sound effects, each
// on or off with a volume from 0 to 100. One choice for the whole page, remembered in this
// browser ('gm-sound-mix') and applied live: AudioEngine puts its music and its effects
// through their own gains (engine.ts), and the tour plays its voice clips at the Voice volume.
// The settings dialog is web/src/soundSettings/. It changes nothing in a game or an export.
const KEY = 'gm-sound-mix';

export type Channel = 'music' | 'voice' | 'sfx';
export interface ChannelMix {
  on: boolean;
  /** 0 to 100. */
  volume: number;
}
export type Mix = Record<Channel, ChannelMix>;

export const CHANNELS: readonly Channel[] = ['music', 'voice', 'sfx'];

const fresh = (): Mix => ({ music: { on: true, volume: 100 }, voice: { on: true, volume: 100 }, sfx: { on: true, volume: 100 } });

function load(): Mix {
  const mix = fresh();
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (raw && typeof raw === 'object') {
      for (const c of CHANNELS) {
        const v = (raw as Record<string, Partial<ChannelMix> | undefined>)[c];
        if (typeof v?.on === 'boolean') mix[c].on = v.on;
        if (typeof v?.volume === 'number' && v.volume >= 0 && v.volume <= 100) mix[c].volume = Math.round(v.volume);
      }
    }
  } catch {
    /* none saved, or no storage */
  }
  return mix;
}

let mix = load();
const listeners = new Set<(m: Mix) => void>();

export const getMix = (): Mix => mix;

/** The gain (0 to 1) a channel plays at now: 0 when it is off. */
export const channelGain = (c: Channel): number => (mix[c].on ? mix[c].volume / 100 : 0);

export function setChannel(c: Channel, change: Partial<ChannelMix>): void {
  const next = { ...mix[c], ...change };
  next.volume = Math.max(0, Math.min(100, Math.round(next.volume)));
  mix = { ...mix, [c]: next };
  try {
    localStorage.setItem(KEY, JSON.stringify(mix));
  } catch {
    /* storage blocked: the choice holds until the page closes */
  }
  for (const f of [...listeners]) f(mix);
}

/** Calls `f` whenever a setting changes; returns a function that stops it. */
export function onMix(f: (m: Mix) => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}
