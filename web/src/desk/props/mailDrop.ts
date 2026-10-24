// RSD's reply to the registration card, on paper (retro/gmReg/replyMail.ts): when the reply comes
// (a 'gm-reg-reply' event from the card beside the monitor), the mail jeep pulls up outside the
// window and drives off (outside/mailjeep.ts), and a moment later a dog in the hall noses the
// envelope in under the bedroom door: Teddy's paw or Gwinn's nose (the same two who look round
// the door, door.ts), with a sniff and a slide across the floor. It lies by the door, a button
// to open, until it is opened (remembered per browser); then its letter and owner card show in
// the box viewer and go into the Game-Maker box's tray. Without motion it is just there. If it
// comes while the door isn't drawn (a narrow window), it goes straight into the box.
import './mailDrop.css';
import { h } from '../../editor/core/ui';
import { currentMail, deliverMail, openMail, type ReplyMail } from '../../retro/gmReg/replyMail';
import type { Reply } from '../../retro/gmReg/mailCard';
import { flash, pressable, say, stillMotion, turns } from './propKit';
import { roomSound } from './propSound';

const REPLY_EVENT = 'gm-reg-reply';
/** How long after the jeep has gone the envelope comes under the door. */
const AFTER_JEEP_MS = 900;
/** If the window never says the jeep has gone (no window), the envelope comes anyway. */
const JEEP_AT_MOST_MS = 20_000;

// Teddy's red-gold paw with its white toes, and Gwinn's chocolate nose, poking under the door
const PAW = `<svg viewBox="0 0 60 24" aria-hidden="true">
  <path d="M8 0 h36 v8 q0 14 -18 14 q-18 0 -18 -14 z" fill="#d98b3a" stroke="#7a4518" stroke-width="1.5"/>
  <ellipse cx="16" cy="16" rx="5" ry="4.5" fill="#fbf6ec"/><ellipse cx="26" cy="18" rx="5" ry="4.5" fill="#fbf6ec"/>
  <ellipse cx="36" cy="16" rx="5" ry="4.5" fill="#fbf6ec"/>
</svg>`;
const NOSE = `<svg viewBox="0 0 60 24" aria-hidden="true">
  <path d="M6 0 h48 v6 q-4 16 -24 16 q-20 0 -24 -16 z" fill="#5a3520" stroke="#2e1a0e" stroke-width="1.5"/>
  <ellipse cx="30" cy="12" rx="10" ry="7" fill="#1a0f08"/>
  <ellipse cx="26" cy="11" rx="2.4" ry="1.6" fill="#3e2a20"/><ellipse cx="34" cy="11" rx="2.4" ry="1.6" fill="#3e2a20"/>
  <ellipse cx="27" cy="8.5" rx="2" ry="1" fill="#fff" opacity="0.5"/>
</svg>`;

const DOGS = [
  { art: PAW, text: 'Scritch, scritch, slide! Teddy’s paw pushes an envelope under the door. Mail from Recreational Software Designs!' },
  { art: NOSE, text: 'Snuffle, snuffle, shove! Gwinn noses an envelope under the door. (She only licked it a little.) Mail from RSD!' },
];

/** Shows the letter and owner card in the box viewer. */
async function showConfirmation(m: ReplyMail): Promise<void> {
  const [{ openBox }, { regConfirmItem }] = await Promise.all([import('../../manual/printables/viewer'), import('../../manual/printables/regConfirm')]);
  await openBox('From the mail', [], [regConfirmItem(m)], { trayHeading: 'In the envelope' });
}

export function mailDropProp(door: HTMLElement): () => void {
  const dog = h('div', { class: 'rd-dog', 'aria-hidden': 'true' });
  door.append(dog);
  const nextDog = turns(DOGS);
  let envelope: HTMLElement | undefined;
  let offEnvelope = () => {};
  const timers: number[] = [];
  let waitJeep: (() => void) | undefined;
  const shown = () => getComputedStyle(door).display !== 'none';

  function place(m: ReplyMail, arriving: boolean): HTMLElement {
    envelope?.remove();
    offEnvelope();
    const el = h('div', { class: 'rd-mail' }, h('span', { class: 'rd-mail-stamp' }), h('span', { class: 'rd-mail-to' }, h('i'), h('i'), h('i')));
    door.append(el);
    envelope = el;
    offEnvelope = pressable(el, `Envelope from Recreational Software Designs for ${m.name}: open it`, () => open(), { id: 'desk-mail' });
    if (arriving && !stillMotion()) flash(el, 'sliding', 1400);
    return el;
  }

  function open(): void {
    const m = openMail();
    offEnvelope();
    offEnvelope = () => {};
    envelope?.remove();
    envelope = undefined;
    if (!m) return;
    roomSound.crinkle();
    void showConfirmation(m);
  }

  function arrive(m: ReplyMail): void {
    if (!door.isConnected) return;
    if (!shown()) {
      // no door on a narrow window: straight into the box
      openMail();
      say(document.querySelector('.monitor') ?? document.body, 'RSD’s reply came in the mail. Its registration confirmation is in the Game-Maker box.');
      return;
    }
    const d = nextDog();
    const el = place(m, true);
    roomSound.slide();
    if (!stillMotion()) {
      dog.innerHTML = d.art;
      flash(dog, 'nudge', 1400);
    }
    say(el, d.text);
  }

  const onReply = (e: Event) => {
    const reply = (e as CustomEvent<Reply>).detail;
    const m = reply && deliverMail(reply);
    if (!m) return;
    // the jeep first, then the envelope a moment after it has gone
    waitJeep?.();
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      waitJeep?.();
      waitJeep = undefined;
      timers.push(window.setTimeout(() => arrive(m), AFTER_JEEP_MS));
    };
    const ended = (ev: Event) => (ev as CustomEvent<{ kind?: string }>).detail?.kind === 'mailjeep' && go();
    addEventListener('gm-window-event-end', ended);
    const most = window.setTimeout(go, JEEP_AT_MOST_MS);
    waitJeep = () => {
      removeEventListener('gm-window-event-end', ended);
      clearTimeout(most);
    };
    dispatchEvent(new CustomEvent('gm-window-event', { detail: { kind: 'mailjeep' } }));
  };
  addEventListener(REPLY_EVENT, onReply);

  // one that came on an earlier visit and wasn't opened is still lying there
  const waiting = currentMail();
  if (waiting && !waiting.opened) place(waiting, false);

  return () => {
    removeEventListener(REPLY_EVENT, onReply);
    waitJeep?.();
    timers.forEach(clearTimeout);
    offEnvelope();
    envelope?.remove();
    dog.remove();
  };
}
