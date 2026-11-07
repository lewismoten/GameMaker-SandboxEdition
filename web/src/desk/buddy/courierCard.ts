// Scoot's card's four sections, the easy web face of SCOOT.EXE: Mail (letters a BBS call brought,
// read and deleted here or on the PC), Postcards, Packages and Setup (the Quiet switch). Tabs
// along the top (←→ between them); it reads and writes the courier store (courier/courierStore.ts)
// and redraws when either side changes it.
import './courierCard.css';
import { h } from '../../editor/core/ui';
import { COURIER_CHANGED, deleteLetter, loadCourier, markRead, type Stamp } from '../../courier/courierStore';
import { PALETTES, letterById } from '../../courier/tables';
import { stampSvg } from '../../courier/stampArt';
import { catalogTitles } from '../../courier/stamps';
import { EMPTY, SECTIONS, letterDate, postcardTitle, stampText, type Section } from '../../courier/courierText';

export interface CourierCard {
  el: HTMLElement;
  /** Draws the open section again from the store. */
  refresh(): void;
  /** Stops listening. */
  dispose(): void;
}

/** The sections, with `setup` (the Quiet switch) placed in Setup. */
export function courierCard(setup: HTMLElement): CourierCard {
  let open: Section = 'Mail';
  let reading: string | undefined;
  let asking = false;

  const tabs = SECTIONS.map((name) =>
    h('button', { class: 'courier-tab', role: 'tab', id: `courier-tab-${name}`, 'aria-controls': 'courier-panel', type: 'button' }, name),
  );
  const tablist = h('div', { class: 'courier-tabs', role: 'tablist', 'aria-label': 'Scoot’s satchel' }, ...tabs);
  const panel = h('div', { class: 'courier-panel', id: 'courier-panel', role: 'tabpanel', tabindex: '0' });
  const el = h('div', { class: 'courier-sections' }, tablist, panel);

  const emptyNote = (text: string) => h('p', { class: 'courier-empty' }, text);

  const mail = () => {
    const c = loadCourier();
    const item = reading ? c.mail.find((m) => m.id === reading) : undefined;
    const letter = reading ? letterById(reading) : undefined;
    if (item && letter) {
      const back = h('button', { class: 'courier-btn', type: 'button' }, 'Back to mail');
      back.addEventListener('click', () => {
        const was = reading;
        reading = undefined;
        asking = false;
        draw();
        panel.querySelector<HTMLElement>(`[data-letter="${was}"]`)?.focus();
      });
      const actions = h('div', { class: 'courier-actions' }, back);
      if (asking) {
        const yes = h('button', { class: 'courier-btn', type: 'button' }, 'Yes, delete it');
        const no = h('button', { class: 'courier-btn', type: 'button' }, 'Keep it');
        yes.addEventListener('click', () => {
          deleteLetter(letter.id);
          reading = undefined;
          asking = false;
          draw();
          tabs[0].focus();
        });
        no.addEventListener('click', () => {
          asking = false;
          draw();
          panel.querySelector<HTMLElement>('.courier-delete')?.focus();
        });
        actions.append(h('span', { class: 'courier-ask' }, 'Delete this letter for good?'), yes, no);
      } else {
        const del = h('button', { class: 'courier-btn courier-delete', type: 'button' }, 'Delete');
        del.addEventListener('click', () => {
          asking = true;
          draw();
          panel.querySelector<HTMLElement>('.courier-actions button:nth-of-type(2)')?.focus();
        });
        actions.append(del);
      }
      return [
        h(
          'article',
          { class: 'courier-letter', 'aria-label': letter.subject },
          h('h3', null, letter.subject),
          h('p', { class: 'courier-from' }, `From ${letter.from}`, h('span', null, letterDate(item.day))),
          ...letter.body.map((p) => h('p', null, p)),
        ),
        actions,
      ];
    }
    reading = undefined;
    if (!c.mail.length) return [emptyNote(EMPTY.Mail)];
    return [
      h(
        'ul',
        { class: 'courier-mail' },
        ...c.mail.map((m) => {
          const l = letterById(m.id)!;
          const b = h(
            'button',
            { class: `courier-item${m.read ? '' : ' courier-new'}`, type: 'button', 'data-letter': m.id },
            h('span', { class: 'courier-subject' }, m.read ? '' : h('span', { class: 'courier-badge' }, 'New'), l.subject),
            h('span', { class: 'courier-meta' }, `${l.from} · ${letterDate(m.day)}`),
          );
          b.addEventListener('click', () => {
            reading = m.id;
            markRead(m.id);
            draw();
            panel.focus();
          });
          return h('li', null, b);
        }),
      ),
    ];
  };

  // catalog games' titles for their stamps, looked up once the Postcards section first shows
  let title: (id: string) => string | undefined = () => undefined;
  let titles: Promise<void> | undefined;
  const loadTitles = () =>
    (titles ??= catalogTitles()
      .then((t) => {
        title = t;
        if (open === 'Postcards' && el.isConnected) draw();
      })
      .catch(() => undefined));

  const stamp = (s: Stamp) => {
    const art = h('span', { class: 'courier-stamp-art' });
    art.innerHTML = stampSvg(s.kind); // the stamps' own art (courier/stampArt.ts), no outside text
    return h('li', { class: 'courier-stamp' }, art, h('span', { class: 'courier-stamp-words' }, stampText(s, title)));
  };

  const postcards = () => {
    const c = loadCourier();
    if (!c.postcards.length) return [emptyNote(EMPTY.Postcards)];
    void loadTitles();
    return [
      h(
        'ul',
        { class: 'courier-cards' },
        ...c.postcards.map((p) => {
          const look = PALETTES[p.world % PALETTES.length];
          return h(
            'li',
            { class: 'courier-postcard' },
            h('strong', { class: 'courier-postcard-name', style: `background:${look.sky};color:${look.ink}` }, postcardTitle(p)),
            p.stamps.length > 0 && h('ul', { class: 'courier-stamps', 'aria-label': 'Stamps' }, ...p.stamps.map(stamp)),
          );
        }),
      ),
    ];
  };

  const packages = () => {
    const c = loadCourier();
    if (!c.packages.length) return [emptyNote(EMPTY.Packages)];
    return [h('ul', { class: 'courier-cards' }, ...c.packages.map((p) => h('li', null, p)))];
  };

  const draw = () => {
    tabs.forEach((t, i) => {
      const on = SECTIONS[i] === open;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `courier-tab-${open}`);
    if (open === 'Setup') {
      panel.replaceChildren(setup);
      return;
    }
    panel.replaceChildren(...(open === 'Mail' ? mail() : open === 'Postcards' ? postcards() : packages()));
  };

  tabs.forEach((t, i) =>
    t.addEventListener('click', () => {
      open = SECTIONS[i];
      reading = undefined;
      asking = false;
      draw();
    }),
  );
  tablist.addEventListener('keydown', (e) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = (SECTIONS.indexOf(open) + step + SECTIONS.length) % SECTIONS.length;
    open = SECTIONS[i];
    reading = undefined;
    asking = false;
    draw();
    tabs[i].focus();
  });

  const onChange = () => {
    // a letter deleted on the PC while it is open here
    if (reading && !loadCourier().mail.some((m) => m.id === reading)) reading = undefined;
    if (el.isConnected && !asking) {
      const had = document.activeElement;
      draw();
      if (had instanceof HTMLElement && !had.isConnected) panel.focus();
    }
  };
  addEventListener(COURIER_CHANGED, onChange);
  draw();
  return {
    el,
    refresh: draw,
    dispose: () => removeEventListener(COURIER_CHANGED, onChange),
  };
}
