// Shows chapter title cards and the recording mode's Start card.
import { h } from '../editor/core/ui';
import { Actor } from './actor';
import { HOSTS, type HostId } from './steps';
import type { Sprite } from '../cast/castStageDraw';
import { sleep } from './tourClock';

export function titleCard(
  sprites: Map<string, Sprite> | undefined,
  caption: HTMLElement,
  getCard: () => HTMLElement | undefined,
  setCard: (card: HTMLElement | undefined) => void,
  active: () => boolean,
  end: () => void,
  title: string,
  sub: string,
  ask = false,
  who: HostId[] = ['teddy', 'gwinn'],
  ms = 2600,
): Promise<boolean> {
  const hosts = who.map((id) => {
    const s = sprites?.get(id);
    return s ? new Actor(s, HOSTS[id].scale + 1, false) : undefined;
  });
  const start = ask ? h('button', { type: 'button', class: 'primary tour-start' }, '▶ Start') : undefined;
  const card = h(
    'div',
    { class: 'tour-card', role: ask ? 'dialog' : undefined, 'aria-label': ask ? title : undefined },
    h('div', { class: 'tour-card-hosts' }, ...hosts.map((a) => a?.el)),
    h('p', { class: 'tour-card-sub' }, sub),
    h('h2', { class: 'tour-card-title' }, title),
    start,
  );
  setCard(card);
  document.body.append(card);
  caption.textContent = ask ? '' : title;
  const done = (ok: boolean) => {
    for (const a of hosts) a?.dispose();
    card.remove();
    if (getCard() === card) setCard(undefined);
    return ok;
  };
  if (start) {
    start.focus();
    return new Promise((resolve) => {
      start.addEventListener('click', () => resolve(done(active())));
      card.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        e.preventDefault();
        e.stopPropagation();
        end();
        resolve(done(false));
      });
    });
  }
  return sleep(ms).then(() => done(active()));
}
