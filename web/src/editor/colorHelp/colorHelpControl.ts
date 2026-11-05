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
  const sync = () => {
    if (!el.isConnected && el.dataset.seen) return off(); // gone from the page
    if (el.isConnected) el.dataset.seen = '1';
    const c = getColorHelp();
    names.checked = c.names;
    (warn.querySelector('select') as HTMLSelectElement).value = c.warn;
    (preview.querySelector('select') as HTMLSelectElement).value = c.preview;
  };
  const off = onColorHelp(sync);
  return el;
}
