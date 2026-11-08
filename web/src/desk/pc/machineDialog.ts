// The case's MHz button opens the desk's effective hardware settings, with a phone-sized form:
// CPU, hard drive timing, and a grid of drive sound switches (driveSwitches.ts).
import { h, modal } from '../../editor/core/ui';
import { DRIVES, SOUND_KINDS, type DriveSwitches } from './driveSwitches';
import { CPU_CHOICES, DISK_CHOICES, type MachineSettings } from './machineSettings';
import './machineDialog.css';

export async function openMachineDialog(current: MachineSettings, apply: (value: MachineSettings) => void, opener: HTMLElement): Promise<void> {
  await modal<void>('Machine settings', (close) => {
    const select = (choices: readonly { id: string; name: string }[], value: string, name: string) =>
      h('select', { 'aria-label': name }, ...choices.map((c) => h('option', { value: c.id, selected: c.id === value }, c.name)));
    const cpu = select(CPU_CHOICES, current.cpu, 'CPU');
    const disk = select(DISK_CHOICES, current.disk, 'Hard drive timing');
    const sounds = soundSwitches(current.sounds);
    return h(
      'form',
      {
        class: 'machine-settings',
        onsubmit: (e: Event) => {
          e.preventDefault();
          apply({ cpu: cpu.value as MachineSettings['cpu'], disk: disk.value as MachineSettings['disk'], sounds: sounds.value() });
          close(undefined);
        },
      },
      h('p', null, 'This browser remembers your choices. Changes apply to the running game, too.'),
      h('label', null, 'CPU', cpu),
      h('p', { class: 'machine-note' }, 'Estimated game speed, scrolling and music work. TURBO off runs at 8 MHz; on restores this choice.'),
      h('label', null, 'Hard drive timing', disk),
      h('p', { class: 'machine-note' }, 'Sets voice-read pauses and level-loading time for games on this PC, including games opened from a floppy or CD.'),
      h(
        'p',
        { class: 'machine-note' },
        'Drive capacity, floppy type/speed and RAM size are not adjustable yet. The PS/1 CPU keeps its voice-memory limit; extra RAM is not modeled.',
      ),
      sounds.el,
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
        h('button', { type: 'submit', class: 'primary' }, 'Apply'),
      ),
    );
  });
  if (opener.isConnected) opener.focus({ preventScroll: true });
}

/** The master switch and a drive-by-kind grid; the grid waits, keeping its choices, while the master is off. */
function soundSwitches(current: DriveSwitches): { el: HTMLElement; value(): DriveSwitches } {
  const box = (checked: boolean, label: string) => h('input', { type: 'checkbox', checked, 'aria-label': label });
  const all = h('input', { type: 'checkbox', checked: current.all });
  const cells = DRIVES.map((d) => SOUND_KINDS.map((k) => box(current[d.id][k.id], `${d.name} ${k.name.toLowerCase()} sounds`)));
  const sync = () => cells.flat().forEach((c) => (c.disabled = !all.checked));
  all.addEventListener('change', sync);
  sync();
  const el = h(
    'fieldset',
    { class: 'machine-sounds' },
    h('legend', null, 'Drive sounds'),
    h('label', { class: 'machine-all' }, all, 'All drive sounds'),
    h(
      'table',
      null,
      h('thead', null, h('tr', null, h('td'), ...SOUND_KINDS.map((k) => h('th', { scope: 'col' }, k.name)))),
      h('tbody', null, ...DRIVES.map((d, i) => h('tr', null, h('th', { scope: 'row' }, d.name), ...cells[i].map((c) => h('td', null, c))))),
    ),
    h('p', { class: 'machine-note' }, 'Disk and tray clicks follow All drive sounds. Sound effects off silences them all.'),
  );
  const value = (): DriveSwitches => {
    const out = { all: all.checked } as DriveSwitches;
    DRIVES.forEach((d, i) => (out[d.id] = Object.fromEntries(SOUND_KINDS.map((k, j) => [k.id, cells[i][j].checked])) as DriveSwitches[typeof d.id]));
    return out;
  };
  return { el, value };
}
