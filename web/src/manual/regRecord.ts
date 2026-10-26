// The Owner's Guide's registration record: "This copy is registered to", printed on page 1 with
// the serial number filled in at the factory, and a short one on the back cover. The owner wrote
// the name and registration number in by hand once the reply card came back, so once the desk's
// C:\GM\PLAYGAME.REG registers Game-Maker (GM REGISTER, the card beside the monitor or GMCRACK)
// they appear in ink; delete it or unregister it and the lines are blank again. It is real text,
// so a screen reader reads it (and "not filled in" for a blank line). The ink is Caveat, kept
// with the site (fonts/caveat-600.woff2, SIL Open Font License; regRecord.css), so the page asks
// no other server for it.
import './regRecord.css';
import { h } from '../editor/core/ui';
import { pcExtras } from '../retro/hacks/pcExtras';
import { SERIAL, checkRegistration, registrationNumber } from '../retro/gmReg/registration';

type Field = 'name' | 'number';

/** The name and registration number PLAYGAME.REG registers this copy to, or none. */
export function registeredTo(reg: string | null | undefined): Record<Field, string> | undefined {
  const r = checkRegistration(reg);
  return r.kind === 'registered' ? { name: r.userName, number: String(registrationNumber(r.userName, SERIAL)) } : undefined;
}

/** The printed records (each page's copies are clones of these), kept while they are in use. */
const records = new Set<WeakRef<HTMLElement>>();
let listening = false;

function write(root: ParentNode, to: Record<Field, string> | undefined): void {
  for (const el of root.querySelectorAll<HTMLElement>('.rr-hand[data-reg]')) {
    const text = to?.[el.dataset.reg as Field] ?? '';
    const blank = el.nextElementSibling;
    if (el.textContent !== text) el.textContent = text;
    if (blank instanceof HTMLElement) blank.hidden = !!text;
  }
}

function refresh(): void {
  const to = registeredTo(pcExtras().reg);
  write(document, to);
  for (const ref of records) {
    const el = ref.deref();
    if (el) write(el, to);
    else records.delete(ref);
  }
}

function line(label: string, field: Field | undefined, printed?: string): HTMLElement {
  const value = field
    ? h('span', { class: 'rr-line' }, h('span', { class: `rr-hand rr-${field}`, 'data-reg': field }), h('span', { class: 'rr-blank' }, 'not filled in'))
    : h('span', { class: 'rr-line rr-printed' }, printed ?? '');
  return h('div', { class: 'rr-row' }, h('dt', null, label), h('dd', null, value));
}

/**
 * The record as the guide prints it: `page` on page 1 (name, serial number, registration
 * number and a word on keeping them), `cover` on the back cover (name and number).
 */
export function regRecord(kind: 'page' | 'cover'): HTMLElement {
  const el =
    kind === 'page'
      ? h(
          'div',
          { class: 'rr rr-page' },
          h('div', { class: 'rr-head' }, 'This copy is registered to'),
          h('dl', null, line('Name', 'name'), line('Serial number', undefined, String(SERIAL)), line('Registration number', 'number')),
          h('div', { class: 'rr-small' }, 'Write them in when the reply card comes back: GM REGISTER asks for both.'),
        )
      : h('div', { class: 'rr rr-cover' }, h('dl', null, line('Registered to', 'name'), line('Registration number', 'number')));
  write(el, registeredTo(pcExtras().reg));
  records.add(new WeakRef(el));
  if (!listening) {
    listening = true;
    pcExtras().listen(refresh);
  }
  return el;
}
