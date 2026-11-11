// The small "Color help" control: three preferences that just help (color names, a warning about
// look-alike colors, a preview as others might see it) and the optional Quick color check. The
// choices are stored only in this browser (colorHelpPrefs.ts); nothing here asks about or
// records anyone's eyes.
import { h } from '../core/ui';
import { getColorHelp, onColorHelp, setColorHelp, type Preview, type Warn } from './colorHelpPrefs';
import './colorHelp.css';

function select<T extends string>(label: string, options: [T, string][], get: () => T, set: (v: T) => void): HTMLLabelElement {
  const sel = h('select', null, ...options.map(([v, t]) => h('option', { value: v }, t)));
  sel.value = get();
  sel.addEventListener('change', () => set(sel.value as T));
  return h('label', { class: 'field' }, h('span', null, label), sel);
}

/**
 * Keeps the three inputs showing the saved choices until the control leaves the page. It is its own function holding
 * only weak references: the listener lives in a module-level set, and a closure sharing the control's scope would keep
 * the whole editor the control sat in (thousands of elements) alive after the editor closed.
 */
function keepInStep(el: HTMLElement, names: HTMLInputElement, warn: HTMLSelectElement, preview: HTMLSelectElement): void {
  const refs = [el, names, warn, preview].map((x) => new WeakRef(x));
  const sync = () => {
    const [e, n, w, p] = refs.map((r) => r.deref());
    if (!e || (e.dataset.seen && !e.isConnected)) return off(); // gone from the page
    if (e.isConnected) e.dataset.seen = '1';
    const c = getColorHelp();
    if (n) (n as HTMLInputElement).checked = c.names;
    if (w) (w as HTMLSelectElement).value = c.warn;
    if (p) (p as HTMLSelectElement).value = c.preview;
  };
  const off = onColorHelp(sync);
  sync();
}

/** The control, kept in step with the saved choices for as long as it is on the page. */
export function colorHelpControl(): HTMLElement {
  const names = h('input', { type: 'checkbox' });
  names.addEventListener('change', () => setColorHelp({ names: names.checked }));
  const warn = select<Warn>(
    'Warn me about look-alike colors',
    [
      ['off', 'Off'],
      ['rg', 'Red and green'],
      ['by', 'Blue and yellow'],
      ['both', 'Both'],
    ],
    () => getColorHelp().warn,
    (warn) => setColorHelp({ warn }),
  );
  const preview = select<Preview>(
    'Preview as others might see it',
    [
      ['normal', 'As drawn'],
      ['rg', 'Red-green'],
      ['by', 'Blue-yellow'],
      ['all', 'All side by side'],
    ],
    () => getColorHelp().preview,
    (preview) => setColorHelp({ preview }),
  );
  const quick = h(
    'button',
    {
      type: 'button',
      onclick: () => void import('./quickCheck').then((m) => m.openQuickCheck()),
    },
    'Quick color check…',
  );
  const el = h(
    'details',
    { class: 'color-help' },
    h('summary', null, 'Color help'),
    h(
      'div',
      { class: 'color-help-body' },
      h('label', { class: 'check' }, names, h('span', null, 'Show color names')),
      warn,
      preview,
      quick,
      h('p', { class: 'color-help-note' }, 'These are preferences. They are kept only in this browser and are never sent anywhere.'),
    ),
  );
  keepInStep(el, names, warn.querySelector('select')!, preview.querySelector('select')!);
  return el;
}
