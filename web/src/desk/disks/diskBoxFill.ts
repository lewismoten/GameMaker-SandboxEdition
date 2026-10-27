// The disk box on the desk, closed: two stacks of floppies standing in it, the site's games on
// the left and the user's own disks on the right, each disk behind peeking over the one in front.
import { h, clear } from '../../editor/core/ui';
import type { Disk } from '../../retro/dos/disks';
import { floppyElement } from './diskBox';

export function fillDiskBox(box: HTMLElement, disks: Disk[]): void {
  // two stacks standing in the box: the site's disks (Sandbox's games in front) on the
  // left, the user's own on the right (a blank one when there are none yet)
  const site = disks.filter((d) => d.kind === 'original' || d.kind === 'rsd' || d.kind === 'gameware').slice(0, 6);
  const own = disks.filter((d) => d.kind === 'project').slice(0, 5);
  const mine = [...own, ...disks.filter((d) => d.kind === 'blank')];
  // a row seen from the front and a little above: each disk behind stands a little
  // higher, smaller and darker, so its top shows over the one in front
  const row = (i: number) => ({
    bottom: 8 + i * 10,
    scale: 1 - i * 0.035,
    dim: 1 - i * 0.07,
  });
  const stack = (list: Disk[], x0: number, tabAt = -1) =>
    [...list].reverse().flatMap((d, k) => {
      const i = list.length - 1 - k; // drawn back to front, so the first stands in front
      const { bottom, scale, dim } = row(i);
      const el = floppyElement(d, true);
      el.classList.add('peek');
      if (i === 0) el.classList.add('front'); // the one whose label shows whole
      el.style.left = `${x0}px`;
      el.style.bottom = `${bottom}px`;
      el.style.transform = `scale(${scale})`;
      el.style.setProperty('--dim', String(dim));
      if (i !== tabAt) return [el];
      // an index card standing just behind this disk
      const tab = h('div', { class: 'bx-tab' });
      const t = row(i + 0.5);
      tab.style.cssText = `left:${x0}px;bottom:${t.bottom}px;transform:scale(${t.scale});transform-origin:50% 100%;filter:brightness(${t.dim})`;
      return [tab, el];
    });
  // back to front: the lid and back wall, the rows of disks, the walls around them
  clear(
    box,
    h('div', { class: 'lid' }),
    h('div', { class: 'bx-back' }),
    h('div', { class: 'bx-div' }),
    ...stack(site, 17, 2),
    ...stack(mine, 99),
    h('div', { class: 'bx-side l' }),
    h('div', { class: 'bx-side r' }),
    // embossed label-maker tape stuck on the front, one over each compartment
    h('div', { class: 'bx-front' }, h('span', { class: 'dymo l' }, 'GAMES'), h('span', { class: 'dymo r' }, 'MY DISKS')),
  );
}
