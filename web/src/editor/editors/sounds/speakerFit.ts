// The sound editor's Fit choice for turning a slot's .voc into PC speaker steps: squeeze the
// whole sound into the speaker's quarter second, or keep its first quarter second as timed.
// Each slot's choice is remembered in the project's companion file (the sound set's
// "speakerFit" section), which no DOS, native or web-page export carries.
import { h } from '../../core/ui';
import { NUMFREQ } from '../../../formats/sound';
import { SPEAKER_STEP, type SpeakerFit } from '../../../audio/vocToSpeaker';

/** The companion section: slot number -> its fit, only for slots the author changed. */
const SECTION = 'speakerFit';
const DEFAULT_FIT: SpeakerFit = 'whole';
/** How long the PC speaker sound lasts, in seconds (36 steps). */
const SPEAKER_SECONDS = NUMFREQ * SPEAKER_STEP;

interface Extras {
  extras<T>(file: string, section: string, fallback: T): T;
  setExtras(file: string, section: string, value: unknown): void;
}

/** The fit remembered for one slot of a sound set (the whole sound when none was chosen). */
export function slotFit(project: Extras, file: string, slot: number): SpeakerFit {
  const v = project.extras<Record<string, unknown>>(file, SECTION, {})[slot];
  return v === 'start' || v === 'whole' ? v : DEFAULT_FIT;
}

/** Remembers one slot's fit; the default is not stored, so an untouched set keeps no section. */
export function setSlotFit(project: Extras, file: string, slot: number, fit: SpeakerFit): void {
  const next = { ...project.extras<Record<string, unknown>>(file, SECTION, {}) };
  if (fit === DEFAULT_FIT) delete next[slot];
  else next[slot] = fit;
  project.setExtras(file, SECTION, Object.keys(next).length ? next : undefined);
}

const OPTIONS: [SpeakerFit, string, string][] = [
  ['whole', 'Squeeze the whole sound', 'Speeds a longer .voc up so all of it plays in the quarter second; its pitches stay the same.'],
  ['start', 'Keep the first ¼ second', 'Plays its start at its own speed and pitch; anything after a quarter second is left out.'],
];

/**
 * The Fit choice as a labeled group of two radio buttons, each with a line saying what it does.
 * `seconds` is the .voc's length: when it already fits, both give the same steps and the group says so.
 */
export function fitChoice(get: () => SpeakerFit, set: (v: SpeakerFit) => void, seconds: number | undefined): HTMLFieldSetElement {
  const fits = seconds !== undefined && seconds <= SPEAKER_SECONDS + 1e-9;
  const id = 'snd-fit-note';
  const note = h(
    'p',
    { id, class: 'hint snd-fit-note' },
    seconds === undefined
      ? `The PC speaker sound lasts a quarter of a second (${NUMFREQ} steps).`
      : fits
        ? `This .voc lasts ${seconds.toFixed(2)} s, short enough to fit as it is, so both give the same steps.`
        : `This .voc lasts ${seconds.toFixed(2)} s; the PC speaker sound lasts a quarter of a second (${NUMFREQ} steps).`,
  );
  return h(
    'fieldset',
    { class: 'snd-fit', 'aria-describedby': id },
    h('legend', null, 'Fit a long .voc'),
    note,
    ...OPTIONS.map(([v, name, about]) => {
      const radio = h('input', { type: 'radio', name: 'snd-fit', value: v, checked: v === get() });
      radio.addEventListener('change', () => radio.checked && set(v));
      return h('label', { class: 'snd-fit-option' }, radio, h('span', null, h('b', null, name), h('small', null, about)));
    }),
  );
}
