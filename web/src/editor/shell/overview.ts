// The Overview page every game opens on: tabs for Files (the asset grid and its categories),
// Controls (what keys, buttons and counters mean), DOS player (the stand-alone player's
// screens) and Tools (the game-wide tools, overviewTools.ts). The other tabs load when first opened.
import './overview.css';
import { h, clear } from '../core/ui';
import type { FileKind, Project } from '../core/project';
import { panelTabs } from '../widgets/panelTabs';
import { assetBrowser } from './assetBrowser';
import type { OverviewTab } from './overviewLink';

interface OverviewHost {
  project: Project;
  tab: OverviewTab;
  kind?: FileKind;
  all: () => void;
  category: (kind: FileKind) => void;
  open: (file: string) => void;
  add: (kind: FileKind) => void;
  /** Play Game, Download and the First steps panel (when this game has it), for the Tools tab. */
  play: () => void;
  download: () => void;
  firstSteps: () => (() => void) | undefined;
  /** A tab was chosen: the address follows. */
  tabChanged: (tab: OverviewTab) => void;
}

const TABS: OverviewTab[] = ['files', 'controls', 'player', 'tools'];

export function overview(host: OverviewHost): { el: HTMLElement; dispose(): void } {
  const disposers: (() => void)[] = [];
  const panel = (id: string) => h('div', { class: `overview-panel overview-${id}` });
  const panels = { files: panel('files'), controls: panel('controls'), player: panel('player'), tools: panel('tools') };
  const browser = assetBrowser({
    project: host.project,
    kind: host.kind,
    all: () => host.all(),
    category: (k) => host.category(k),
    open: (f) => host.open(f),
    add: (k) => host.add(k),
  });
  panels.files.append(browser.el);
  disposers.push(() => browser.dispose());
  const filled = new Set<OverviewTab>(['files']);
  const lazy = async (tab: 'controls' | 'player' | 'tools') => {
    if (filled.has(tab)) return;
    filled.add(tab);
    const slot = panels[tab];
    slot.append(h('p', { role: 'status' }, 'Opening…'));
    try {
      if (tab === 'controls') {
        const { overviewControls } = await import('./overviewControls');
        const page = overviewControls(host.project);
        clear(slot, page.el);
        disposers.push(() => page.dispose());
      } else if (tab === 'tools') {
        const { overviewTools } = await import('./overviewTools');
        const page = overviewTools(host.project, host);
        clear(slot, page.el);
        disposers.push(() => page.dispose());
      } else {
        const { playerPanel } = await import('../editors/integrator/dosPlayer/playerPanel');
        clear(slot, h('h2', { class: 'overview-title' }, 'DOS player'), playerPanel(host.project));
      }
    } catch (error) {
      filled.delete(tab);
      clear(slot, h('p', { class: 'hint' }, `This tab could not open: ${(error as Error).message}`));
    }
  };
  const el = h(
    'div',
    { class: 'overview' },
    panelTabs(
      'Overview',
      [
        { id: 'files', label: 'Files', panel: panels.files },
        { id: 'controls', label: 'Controls', panel: panels.controls },
        { id: 'player', label: 'DOS player', panel: panels.player },
        { id: 'tools', label: 'Tools', panel: panels.tools },
      ],
      host.tab,
      (id) => {
        const tab = TABS.includes(id as OverviewTab) ? (id as OverviewTab) : 'files';
        host.tabChanged(tab);
        if (tab !== 'files') void lazy(tab);
      },
    ),
  );
  return { el, dispose: () => disposers.forEach((d) => d()) };
}
