// Four deterministic PCM files. The 65536-byte file is deliberately beyond DOS's 65535 limit.
import { sample, osc } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';
import { buildSounds } from '../../starter/sounds';

export const EFFECTS = [
  { name: 'quarter', label: '0.25 SEC', seconds: 0.25, sound: 2, effect: 3, amount: 1 },
  { name: 'one', label: '1 SEC', seconds: 1, sound: 3, effect: 3, amount: -1 },
  { name: 'five', label: '5 SEC', seconds: 5, sound: 7, effect: 20, amount: 1 },
  { name: 'bound64', label: '64K LIMIT', seconds: (65536 - 33) / 11025, sound: 8, effect: 20, amount: -1 },
] as const;

export function buildEffects() {
  const sounds = buildSounds();
  const vocs: Record<string, Uint8Array> = {};
  EFFECTS.forEach((effect, i) => {
    vocs[effect.name] = sample(effect.seconds, osc.sine(330 + i * 110), { gain: 0.5 });
    sounds.digital[effect.sound] = effect.name;
  });
  return { sounds, vocs };
}
