// The mouse pad chooser, opened from Square Deal Pad Co.'s ad in TURBO BUTTON: the five
// prints (padPrints.ts) as a radio group with a little picture of each, the Sandbox BBS one
// the desk came with first. Apply lays the print on the desk's pad (padChoice.ts remembers it
// in this browser) and offers a link to go and see it; Close or Esc puts focus back on the ad.
import './padChooser.css';
import { h, modal } from '../../editor/core/ui';
import { DEFAULT_PAD, PAD_PRINTS, isPadPrint, loadPad, padName, savePad } from './padChoice';
import { padSvg } from './padPrints';
import { unlockAchievement } from '../../achievements';

export interface PadChooserOptions {
  /** Where focus goes back to once it closes (the ad's button). */
  opener?: HTMLElement | null;
  /** The desk's address for the "See it on the desk" link. */
  deskHref: string;
  /** On the desk itself: puts the magazine down and points at the pad, instead of following the link. */
  onSeeIt?: () => void;
}

export async function openPadChooser(o: PadChooserOptions): Promise<void> {
  await modal<void>('Change your mouse pad', (close) => {
    const current = loadPad();
    const choices = PAD_PRINTS.map((p) => {
      const thumb = h('span', { class: 'padc-thumb' });
      thumb.innerHTML = padSvg(p.id);
      return h(
        'label',
        { class: 'padc-choice' },
        h('input', { type: 'radio', name: 'pad-print', value: p.id, checked: p.id === current }),
        thumb,
        h('span', { class: 'padc-name' }, p.name.replace('THE CHEZ', 'THE CHEZ')),
        h('span', { class: 'padc-note' }, p.id === DEFAULT_PAD ? `(${p.note})` : p.note),
      );
    });
    const see = h(
      'a',
      {
        href: o.deskHref,
        onclick: (e: MouseEvent) => {
          close(undefined);
          if (o.onSeeIt) {
            e.preventDefault();
            o.onSeeIt();
          }
        },
      },
      'See it on the desk',
    );
    const said = h('span');
    const status = h('p', { class: 'padc-status', role: 'status' });
    const form = h(
      'form',
      {
        class: 'padc',
        method: 'dialog',
        onsubmit: (e: Event) => {
          e.preventDefault();
          const v = new FormData(form).get('pad-print');
          if (!isPadPrint(v)) return;
          savePad(v);
          if (v !== DEFAULT_PAD) unlockAchievement('desk-mousepad');
          said.textContent = `${padName(v).replace('THE CHEZ', 'THE CHEZ')} is on the desk’s mouse pad now. `;
          status.replaceChildren(said, see);
        },
      },
      h('p', { class: 'padc-intro' }, 'Square Deal Pad Co. lends you one of each. Pick a print for the desk’s mouse pad; this browser remembers it.'),
      h('fieldset', { class: 'padc-choices' }, h('legend', null, 'Mouse pad print'), ...choices),
      status,
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Close'),
        h('button', { type: 'submit', class: 'primary' }, 'Apply'),
      ),
    );
    // once it is open: name the dialog by its heading, size it for the pictures, start on the print in use
    requestAnimationFrame(() => {
      const dlg = form.closest('dialog');
      const title = dlg?.querySelector('h2');
      if (!dlg || !title) return;
      title.id = 'padc-title';
      dlg.setAttribute('aria-labelledby', title.id);
      dlg.classList.add('padc-dialog');
      form.querySelector<HTMLInputElement>('input:checked')?.focus();
    });
    return form;
  });
  o.opener?.focus({ preventScroll: true });
}
