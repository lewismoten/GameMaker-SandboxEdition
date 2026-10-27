// The buttons beside drive A: for the disk in it: Play, Design (or New game on a blank disk),
// open it in today's web, and the game's manual where it has one.
import { h, clear } from '../../editor/core/ui';
import type { Disk } from '../../retro/dos/disks';
import { diskFacts, type DiskAction } from './diskBox';

export function fillDriveActions(el: HTMLElement, d: Disk, on: { act(a: DiskAction): void; manual(): void }): void {
  const act = (a: DiskAction) => () => on.act(a);
  clear(
    el,
    h('span', { class: 'drive-actions-title', title: diskFacts(d) }, d.kind === 'blank' ? 'Blank disk in A:' : `${d.title} in A:`),
    d.gam ? h('button', { class: 'primary', onclick: act('play') }, '▶ Play') : null,
    h('button', { onclick: act('design') }, d.kind === 'blank' ? '✎ New game' : '✎ Design'),
    d.kind !== 'blank'
      ? h(
          'button',
          {
            onclick: act('modern'),
            title: 'Open it in today’s web Game-Maker',
          },
          'Today’s web →',
        )
      : null,
    d.kind === 'original' && d.catalog?.original?.manual ? h('button', { onclick: () => on.manual() }, '📖 Manual') : null,
  );
}
