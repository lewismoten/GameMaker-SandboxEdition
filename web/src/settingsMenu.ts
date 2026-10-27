// Today's web header: the ⚙ Settings menu (playing offline, the source code, the theme, AI setup
// and back up / restore), and the same items for the ⋯ menu on narrow windows (main.ts). The
// Offline dialog, AI setup and back up / restore load when chosen.
import { h, toast } from './editor/core/ui';
import { themeItem } from './theme';

const SOURCE_URL = 'https://github.com/lewismoten/GameMaker-SandboxEdition';

/** "Play offline": the whole site downloaded on request (offline/offlineDialog.ts). */
const openOffline = () => void import('./offline/offlineDialog').then((m) => m.openOfflineDialog());

/** AI setup for the assistant (assistant/chat/settingsDialog.ts). */
const openAi = () => void import('./assistant/chat/settingsDialog').then((m) => m.openAiSetup());

/**
 * Back up / restore (backup/openDataBackup.ts, being built separately). A glob, so the menu
 * works (and says so) before that module exists, and it loads only when chosen once it does.
 */
const backupModule = import.meta.glob<{ openDataBackup(): unknown }>('./backup/openDataBackup.ts');
const openBackup = () => {
  const load = Object.values(backupModule)[0];
  if (!load) return toast('Back up / restore is not ready yet.', 'error');
  void load().then((m) => m.openDataBackup());
};

const icon = (s: string) => h('span', { 'aria-hidden': 'true' }, s);

/** The settings in their order, each given `attrs` (the ⚙ menu's role and tabindex). */
export function settingsItems(attrs: Record<string, string> = {}): HTMLElement[] {
  return [
    h(
      'button',
      { ...attrs, type: 'button', onclick: openOffline, title: 'Download the whole site to play and make games with no connection' },
      icon('⤓'),
      ' Play offline',
    ),
    h('a', { ...attrs, href: SOURCE_URL, target: '_blank', rel: 'noopener' }, icon('</>'), ' Source on GitHub'),
    themeItem(attrs),
    h('button', { ...attrs, type: 'button', onclick: openAi, title: 'Set up your own AI (Ollama or OpenAI) for the Assistant' }, icon('✦'), ' AI setup…'),
    h(
      'button',
      { ...attrs, type: 'button', onclick: openBackup, title: 'Save everything this browser keeps to a file, or bring it back from one' },
      icon('💾'),
      ' Back up / restore…',
    ),
  ];
}

/**
 * The ⚙ button and its menu: arrow keys, Home and End move through it, Escape closes it and
 * returns to the button, and Tab or a click elsewhere closes it. Theme stays open to show the
 * theme it changed to.
 */
export function settingsMenu(): HTMLElement {
  const gear = h(
    'button',
    {
      type: 'button',
      class: 'topbar-gear',
      'aria-label': 'Settings',
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
      'aria-controls': 'settings-menu',
      title: 'Settings: play offline, the source code, the theme, AI setup',
    },
    icon('⚙'),
  );
  const items = settingsItems({ role: 'menuitem', tabindex: '-1' });
  const menu = h('div', { id: 'settings-menu', class: 'topbar-menu', role: 'menu', 'aria-label': 'Settings', hidden: true }, ...items);
  const wrap = h('div', { class: 'topbar-settings hide-narrow' }, gear, menu);

  const isOpen = () => !menu.hidden;
  const focusItem = (i: number) => items[(i + items.length) % items.length].focus();
  const open = (at: number) => {
    menu.hidden = false;
    gear.setAttribute('aria-expanded', 'true');
    focusItem(at);
  };
  const close = (refocus: boolean) => {
    if (!isOpen()) return;
    menu.hidden = true;
    gear.setAttribute('aria-expanded', 'false');
    if (refocus) gear.focus();
  };

  gear.addEventListener('click', () => (isOpen() ? close(false) : open(0)));
  gear.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      open(e.key === 'ArrowDown' ? 0 : -1);
    }
  });
  menu.addEventListener('keydown', (e) => {
    const i = items.indexOf(document.activeElement as HTMLElement);
    const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: -1 }[e.key];
    if (to !== undefined) {
      e.preventDefault();
      focusItem(to);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
    } else if (e.key === 'Tab') close(false);
  });
  menu.addEventListener('click', (e) => {
    if (!(e.target as Element).closest('.theme-item')) close(false);
  });
  // a click elsewhere closes it (and once the header is replaced, this stops listening)
  const outside = (e: MouseEvent) => {
    if (!wrap.isConnected) document.removeEventListener('click', outside);
    else if (!wrap.contains(e.target as Node)) close(false);
  };
  document.addEventListener('click', outside);
  return wrap;
}
