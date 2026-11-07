// The case's MHz button opens the desk's effective hardware settings, with a phone-sized form.
import { h, modal } from '../../editor/core/ui';
import { CPU_CHOICES, DISK_CHOICES, type MachineSettings } from './machineSettings';
import './machineDialog.css';

export async function openMachineDialog(current: MachineSettings, apply: (value: MachineSettings) => void, opener: HTMLElement): Promise<void> {
  await modal<void>('Machine settings', (close) => {
    const select = (choices: readonly { id: string; name: string }[], value: string, name: string) =>
      h('select', { 'aria-label': name }, ...choices.map((c) => h('option', { value: c.id, selected: c.id === value }, c.name)));
    const cpu = select(CPU_CHOICES, current.cpu, 'CPU');
    const disk = select(DISK_CHOICES, current.disk, 'Hard drive timing');
    return h(
      'form',
      {
        class: 'machine-settings',
        onsubmit: (e: Event) => {
          e.preventDefault();
          apply({ cpu: cpu.value as MachineSettings['cpu'], disk: disk.value as MachineSettings['disk'] });
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
