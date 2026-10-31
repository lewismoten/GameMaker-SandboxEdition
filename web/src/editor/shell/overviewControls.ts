// Overview › Controls: what each key, joystick button and counter means in this game, written once
// for every character. Editor-only (the .gam's companion section, core/gameControls.ts); the DOS
// files never change. Edits have their own Undo and Redo, as in the character editor.
import './overviewControls.css';
import { h, clear } from '../core/ui';
import { History } from '../core/history';
import type { Project } from '../core/project';
import { gameControls, setGameControls, SOUND_NAME_LIMIT, type GameControls } from '../core/gameControls';
import { gameKeyMap } from '../keymap/keyMap';
import { counterUses } from './counterUse';
import { soundUses } from './soundUse';
import { SOUND_NAMES } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';

const SHORT_LIMIT = 32;
const LONG_LIMIT = 240;

/** Plays a slot as the sound editor does: the Sound Blaster .voc when there is one, else the PC speaker sound. */
async function audition(project: Project, slot: number): Promise<boolean> {
  const [{ soundAuditions }, { audio }] = await Promise.all([import('../widgets/soundAuditions'), import('../widgets/mediaShared')]);
  for (const file of project.files.byExtension('snd')) {
    const bytes = project.files.get(file);
    if (!bytes) continue;
    const parts = soundAuditions(bytes, project.files).filter((p) => p.slot === slot);
    const part = parts.find((p) => p.kind === 'voc') ?? parts[0];
    if (!part) continue;
    await audio.resume();
    audio.stopSpeaker();
    audio.stopVoc();
    if (part.kind === 'voc') audio.playVoc(part.bytes);
    else audio.playSpeaker(part.freqs!);
    return true;
  }
  return false;
}

export function overviewControls(project: Project): { el: HTMLElement; dispose(): void } {
  const locked = !!project.readOnly;
  const history = new History<GameControls>();
  let base = gameControls(project);
  let lastChange = 0;
  const undoBtn = h('button', { type: 'button', title: 'Undo (Ctrl+Z)', disabled: true, onclick: () => step(true) }, '↶ Undo');
  const redoBtn = h('button', { type: 'button', title: 'Redo (Ctrl+Y)', disabled: true, onclick: () => step(false) }, '↷ Redo');
  const sync = () => {
    undoBtn.disabled = !history.canUndo;
    redoBtn.disabled = !history.canRedo;
  };
  const commit = (next: GameControls) => {
    if (JSON.stringify(next) === JSON.stringify(base)) return;
    const now = Date.now();
    if (now - lastChange > 500) history.record(base);
    lastChange = now;
    setGameControls(project, next);
    base = gameControls(project);
    sync();
  };
  function step(back: boolean): void {
    const to = back ? history.undo(base) : history.redo(base);
    if (!to) return;
    setGameControls(project, to);
    base = gameControls(project);
    lastChange = 0;
    sync();
    render();
  }
  const onKey = (e: KeyboardEvent) => {
    if (!el.isConnected || !(e.ctrlKey || e.metaKey) || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    const k = e.key.toLowerCase();
    if (k === 'z' || k === 'y') {
      e.preventDefault();
      step(k === 'z' && !e.shiftKey);
    }
  };
  window.addEventListener('keydown', onKey);

  const input = (label: string, value: string, limit: number, placeholder: string, save: (v: string) => void) => {
    const field = h('input', { type: 'text', maxLength: limit, value, 'aria-label': label, placeholder, disabled: locked });
    field.addEventListener('change', () => {
      save(field.value);
      field.value = field.value.replace(/\s+/g, ' ').trim();
    });
    return field;
  };
  const textPair = (name: string, now: { short: string; long: string } | undefined, save: (t: { short: string; long: string }) => void) => {
    let cur = { short: now?.short ?? '', long: now?.long ?? '' };
    return [
      h(
        'label',
        { class: 'ovc-field' },
        h('span', null, 'Short'),
        input(`${name} short description`, cur.short, SHORT_LIMIT, 'For example: Jump', (v) => save((cur = { ...cur, short: v }))),
      ),
      h(
        'label',
        { class: 'ovc-field' },
        h('span', null, 'Long'),
        input(`${name} long description`, cur.long, LONG_LIMIT, 'For example: Hold to jump higher', (v) => save((cur = { ...cur, long: v }))),
      ),
    ];
  };

  const keyMap = (() => {
    try {
      return gameKeyMap(project.files, project.gam);
    } catch {
      return undefined;
    }
  })();

  function render(): void {
    const c = base;
    const keyRows = (keyMap?.keys ?? []).map((k) => {
      const meaning = [...new Set(k.uses.map((u) => u.action.title))].join('; ');
      const characters = [...new Set(k.uses.flatMap((u) => u.chrs))].map((n) => n.toUpperCase()).join(', ');
      return h(
        'li',
        { class: 'ovc-row' },
        h('div', { class: 'ovc-what' }, h('kbd', null, k.name), h('span', null, meaning), h('small', { class: 'meta' }, characters)),
        ...textPair(`${k.name} key`, c.keys[k.scan], (t) => commit({ ...base, keys: { ...base.keys, [k.scan]: t } })),
      );
    });
    const joyRows = ([1, 2] as const).map((n) =>
      h(
        'li',
        { class: 'ovc-row' },
        h('div', { class: 'ovc-what' }, h('kbd', null, `Button ${n}`)),
        ...textPair(`Button ${n}`, c.joystick[n], (t) => commit({ ...base, joystick: { ...base.joystick, [n]: t } })),
      ),
    );
    const uses = counterUses(project);
    const meters = [...Array.from({ length: 15 }, (_, i) => 5 + i), ...Array.from({ length: 5 }, (_, i) => 20 + i)];
    const counters = meters.map((m) => {
      const u = uses.get(m);
      const label = m < 20 ? `Repetition counter ${m - 4}` : `Hidden counter ${m - 19}`;
      const where = [u?.characters.length ? `Counted by ${u.characters.join(', ')}` : '', u?.blocks.length ? `Changed by ${u.blocks.join('; ')}` : '']
        .filter(Boolean)
        .join('. ');
      return h(
        'li',
        { class: 'ovc-row ovc-counter' },
        h('div', { class: 'ovc-what' }, h('b', null, label), h('small', { class: 'meta' }, where || 'Not used yet')),
        h(
          'label',
          { class: 'ovc-field' },
          h('span', null, 'Name'),
          input(`${label} name`, c.counters[m] ?? '', 80, 'For example: Gold keys', (v) => {
            const counters = { ...base.counters };
            if (v.trim()) counters[m] = v;
            else delete counters[m];
            commit({ ...base, counters });
          }),
        ),
      );
    });
    const soundUse = soundUses(project);
    const sounds = [...soundUse.keys()]
      .filter((slot) => slot < 30)
      .sort((a, b) => a - b)
      .map((slot) => {
        const u = soundUse.get(slot)!;
        const builtIn = SOUND_NAMES[slot];
        const label = `Sound ${slot}`;
        const where = u.characters.length ? `Played by ${u.characters.join('; ')}` : builtIn ? 'Played by the game itself' : 'No character plays it yet';
        const play = h(
          'button',
          {
            type: 'button',
            class: 'ovc-play',
            title: `Hear ${label}`,
            'aria-label': `Hear ${label}`,
            onclick: () => void audition(project, slot).then((ok) => (play.title = ok ? `Hear ${label}` : `${label} has no sound to play`)),
          },
          '▶',
        );
        return h(
          'li',
          { class: 'ovc-row ovc-counter' },
          h('div', { class: 'ovc-what' }, h('b', null, `${slot}. ${builtIn ?? (c.sounds[slot] || 'Effect')}`), h('small', { class: 'meta' }, where)),
          builtIn
            ? h('div', { class: 'ovc-sound-end' }, h('small', { class: 'meta' }, 'Named by the game engine'), play)
            : h(
                'div',
                { class: 'ovc-sound-end' },
                h(
                  'label',
                  { class: 'ovc-field' },
                  h('span', null, 'Name'),
                  input(`${label} name`, c.sounds[slot] ?? '', SOUND_NAME_LIMIT, 'For example: Door creak', (v) => {
                    const names = { ...base.sounds };
                    if (v.trim()) names[slot] = v;
                    else delete names[slot];
                    commit({ ...base, sounds: names });
                  }),
                ),
                play,
              ),
        );
      });
    clear(
      body,
      h(
        'section',
        { class: 'ovc-group', 'aria-labelledby': 'ovc-keys' },
        h('h2', { id: 'ovc-keys' }, 'Keys'),
        h(
          'p',
          { class: 'meta' },
          'Each key the game uses, as worked out from its characters. The short and long descriptions are yours: they show in the Keys dialog and in the character editor.',
        ),
        keyRows.length ? h('ul', { class: 'ovc-list' }, ...keyRows) : h('p', { class: 'meta' }, 'No keys are set in this game’s characters yet.'),
      ),
      h(
        'section',
        { class: 'ovc-group', 'aria-labelledby': 'ovc-joy' },
        h('h2', { id: 'ovc-joy' }, 'Joystick buttons'),
        h('p', { class: 'meta' }, 'The two buttons keep their numbers; these words explain them in the character editor.'),
        h('ul', { class: 'ovc-list' }, ...joyRows),
      ),
      h(
        'section',
        { class: 'ovc-group', 'aria-labelledby': 'ovc-counters' },
        h('h2', { id: 'ovc-counters' }, 'Counters'),
        h(
          'p',
          { class: 'meta' },
          'Names for the 15 repetition counters (the uses of a sequence) and the 5 hidden counters blocks can change. One name serves every character.',
        ),
        h('ul', { class: 'ovc-list' }, ...counters),
      ),
      h(
        'section',
        { class: 'ovc-group', 'aria-labelledby': 'ovc-sounds' },
        h('h2', { id: 'ovc-sounds' }, 'Sounds'),
        h(
          'p',
          { class: 'meta' },
          'Every sound slot in the game’s sound sets. The game plays the first nine itself; name the rest for what they sound like. The name shows wherever the sound editor lists them.',
        ),
        sounds.length ? h('ul', { class: 'ovc-list' }, ...sounds) : h('p', { class: 'meta' }, 'This game has no sound set.'),
      ),
    );
  }

  const body = h('div', { class: 'ovc-body' });
  const keysButton = h(
    'button',
    {
      type: 'button',
      onclick: () =>
        void import('../keymap/keyMapView').then(({ showKeyMap }) => showKeyMap(project.files, project.gam, project.name, undefined, gameControls(project))),
    },
    '⌨ Keys dialog',
  );
  const el = h(
    'section',
    { class: 'ovc', 'aria-label': 'Controls' },
    h(
      'header',
      { class: 'ovc-head' },
      h('h1', null, 'Controls'),
      h('div', { class: 'row' }, keysButton, undoBtn, redoBtn),
      locked ? h('p', { class: 'meta' }, 'This game is look-only.') : null,
    ),
    body,
  );
  render();
  return { el, dispose: () => window.removeEventListener('keydown', onKey) };
}
