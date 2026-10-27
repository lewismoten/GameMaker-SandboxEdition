// The product registration card beside the monitor (regSide.ts). A 1995 mail-in card
// (mailCard.ts): printed with the product and this copy's serial number, the owner's address
// already written in, so only a name is left to write. Mailed, it goes off in the mail truck; a
// few days later RSD's reply comes back with the registration number, and Register now writes
// PLAYGAME.REG as GM REGISTER would. A number from an earlier reply can be written in by hand.
import { h, clear } from '../../editor/core/ui';
import type { RegDesk } from './regDesk';
import { CARD_NAME_MAX, FACTORY_SERIAL, NUMBER_MAX } from './registration';
import { BOUGHT, CD_NUMBER, COMPUTERS, MAIL_DAYS_MS, OWNER_ADDRESS, RSD_ADDRESS, mailCheck, replyTo, savedReply, saveReply, type Reply } from './mailCard';
import { PRODUCT } from '../../edition';
import type { RegSideOptions } from './regSide';

/** The name already on the card, so it can be mailed as it comes. */
const SAMPLE_NAME = 'John Smith';

/** What the card needs from the side panels (regSide.ts). */
interface CardHost extends RegSideOptions {
  desk(): RegDesk | null;
  say(text: string): void;
  close(): void;
  /** To the Owner's Guide (on a narrow window, one panel at a time). */
  toManual(): void;
  /** Gives the keyboard back to the PC. */
  focusScreen(): void;
}

export function cardPanel(host: CardHost) {
  const cardTitle = h('h2', { id: 'rs-card-h' });
  const cardLead = h('p', { class: 'rs-lead' });
  // the serial printed on the card: CHK.EXE's (RegDesk.serial) once GM asks
  let serial = FACTORY_SERIAL;
  let reply: Reply | undefined = savedReply(serial);
  let days: ReturnType<typeof setTimeout> | undefined;

  const printed = (label: string, value: string) => [h('dt', null, label), h('dd', null, value)];
  const serialDd = h('dd', null, String(serial));
  const pick = (legend: string, name: string, options: readonly string[]) =>
    h(
      'fieldset',
      { class: 'rs-pick' },
      h('legend', null, legend, ' ', h('small', null, '(optional)')),
      options.map((o) => h('label', null, h('input', { type: 'radio', name, value: o }), o)),
    );

  // the front: the owner writes a name and mails it
  // filled in with a stand-in name, ready to mail (or type your own over it)
  const nameIn = h('input', {
    id: 'rs-name',
    class: 'rs-in',
    type: 'text',
    maxLength: CARD_NAME_MAX,
    value: SAMPLE_NAME,
    autocomplete: 'off',
    spellcheck: false,
    'aria-required': 'true',
  });
  // focusing it selects the stand-in, so typing replaces it
  nameIn.addEventListener('focus', () => nameIn.select());
  const postMsg = h('p', { id: 'rs-post-msg', class: 'rs-msg' });
  const postcard = h(
    'form',
    { class: 'rs-postcard', novalidate: true, 'aria-label': 'Registration card', onsubmit: (e: Event) => (e.preventDefault(), mail()) },
    h('div', { class: 'rs-pc-band' }, h('b', null, 'REGISTRATION CARD'), h('span', null, 'Please print · Mail today')),
    h(
      'dl',
      { class: 'rs-printed' },
      printed('Product', PRODUCT),
      printed('Version', '3.0'),
      [h('dt', null, 'Serial no.'), serialDd],
      printed('CD #', CD_NUMBER),
    ),
    h('label', { for: 'rs-name', class: 'rs-name-l' }, 'Your name ', h('small', null, '(please print)')),
    nameIn,
    h(
      'p',
      { class: 'rs-filled' },
      h('span', null, 'Address '),
      h('span', { class: 'rs-hand' }, OWNER_ADDRESS.join(', ')),
      h('small', null, ' (written in for you; make-believe)'),
    ),
    pick('Where did you buy it?', 'rs-bought', BOUGHT),
    pick('Your computer', 'rs-pc', COMPUTERS),
    postMsg,
    h('div', { class: 'rs-actions' }, h('button', { type: 'submit', class: 'rs-btn rs-apply' }, 'Mail the card')),
  );

  // for a number from an earlier reply: written in by hand, as GM REGISTER asks
  const keyName = h('input', { id: 'rs-key-name', class: 'rs-in', type: 'text', maxLength: CARD_NAME_MAX, autocomplete: 'name', spellcheck: false });
  const numIn = h('input', {
    id: 'rs-number',
    class: 'rs-in rs-num',
    type: 'text',
    inputMode: 'numeric',
    maxLength: NUMBER_MAX,
    autocomplete: 'off',
    spellcheck: false,
  });
  const keyMsg = h('p', { id: 'rs-key-msg', class: 'rs-msg' });
  const byHand = h(
    'details',
    { class: 'rs-byhand' },
    h('summary', null, 'Already have your reply? Enter the number'),
    h(
      'form',
      { class: 'rs-form', novalidate: true, onsubmit: (e: Event) => (e.preventDefault(), applyByHand()) },
      h('label', { for: 'rs-key-name' }, 'Name ', h('small', null, '(exactly as on the reply)')),
      keyName,
      h('label', { for: 'rs-number' }, 'Registration number'),
      numIn,
      keyMsg,
      h('div', { class: 'rs-actions' }, h('button', { type: 'submit', class: 'rs-btn' }, 'Apply')),
    ),
  );

  // the back, as it goes in the mail: Business Reply Mail to RSD, then a few days
  const fromLines = h('span', { class: 'rs-hand' });
  const skipBtn = h('button', { type: 'button', class: 'rs-btn', onclick: () => arrive() }, 'Skip ahead');
  const mailing = mailingBack(fromLines, skipBtn);

  // RSD's reply: a letter off their dot-matrix printer with the registration number
  const replyMsg = h('p', { id: 'rs-reply-msg', class: 'rs-msg' });
  const registerBtn = h('button', { type: 'button', class: 'rs-btn rs-apply', onclick: () => registerNow() }, 'Register now');
  const letter = h('div', { class: 'rs-letter', hidden: true });

  function drawLetter(r: Reply): void {
    clear(
      letter,
      h('div', { class: 'rs-lh' }, h('b', null, 'RECREATIONAL SOFTWARE DESIGNS'), h('span', null, RSD_ADDRESS.slice(1).join(' · '))),
      h('h3', { id: 'rs-letter-h', tabIndex: -1 }, 'Your registration'),
      h('p', null, `Dear ${r.name},`),
      h('p', null, `Thank you for registering ${PRODUCT} 3.0! Here is your registration. Write it in exactly as it is here:`),
      h('dl', { class: 'rs-keyed' }, printed('Name', r.name), printed('Serial no.', String(r.serial)), printed('Registration no.', r.number)),
      h('p', null, 'Choose Register now, or type GM REGISTER at the C:\\GM> prompt. Game-Maker stops asking for words from the Owner’s Guide.'),
      h('p', { class: 'rs-sign' }, 'Happy game making!', h('br'), '— RSD Registration Dept.'),
      replyMsg,
      h('div', { class: 'rs-actions' }, h('button', { type: 'button', class: 'rs-btn', onclick: () => again() }, 'Mail another card'), registerBtn),
    );
  }

  const toManual = h('button', { type: 'button', class: 'rs-btn rs-swap', onclick: () => host.toManual() }, 'Owner’s Guide');
  const card = h(
    'section',
    { class: 'rs-panel rs-card', 'aria-labelledby': 'rs-card-h', hidden: true, onkeydown: (e: KeyboardEvent) => e.key === 'Escape' && host.close() },
    h(
      'header',
      { class: 'rs-head rs-card-head' },
      h('div', { class: 'rs-brand' }, h('b', null, 'PRODUCT REGISTRATION'), h('span', null, `${PRODUCT} 3.0`)),
      toManual,
      h('button', { type: 'button', class: 'rs-x', 'aria-label': 'Close the registration card', onclick: () => host.close() }, '×'),
    ),
    h('div', { class: 'rs-card-body' }, cardTitle, cardLead, postcard, byHand, mailing, letter),
    h('p', { class: 'rs-note' }, 'In 1995 RSD’s reply took a few weeks; here it takes a few seconds. The addresses are make-believe.'),
  );

  function stage(s: 'card' | 'mailing' | 'reply'): void {
    postcard.hidden = byHand.hidden = s !== 'card';
    mailing.hidden = s !== 'mailing';
    letter.hidden = s !== 'reply';
    card.dataset.stage = s;
  }
  if (reply) drawLetter(reply);
  stage(reply ? 'reply' : 'card');

  function problem(where: HTMLElement, text?: string, field?: HTMLInputElement): void {
    where.textContent = text ?? '';
    where.classList.toggle('error', !!text);
    where.setAttribute('role', text ? 'alert' : 'status');
    for (const f of [nameIn, keyName, numIn]) {
      if (!where.parentElement?.contains(f)) continue;
      const bad = !!text && f === field;
      f.setAttribute('aria-invalid', String(bad));
      if (bad) f.setAttribute('aria-describedby', where.id);
      else f.removeAttribute('aria-describedby');
    }
    if (field) field.focus();
  }
  const noProblems = () => [postMsg, keyMsg, replyMsg].forEach((m) => problem(m));

  function mail(): void {
    const wrong = mailCheck(nameIn.value);
    if (wrong) return problem(postMsg, wrong, nameIn);
    problem(postMsg);
    const picked = (name: string) => postcard.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value;
    reply = replyTo({ name: nameIn.value, bought: picked('rs-bought'), computer: picked('rs-pc') }, serial);
    saveReply(reply);
    drawLetter(reply);
    clear(
      fromLines,
      [reply.name, ...OWNER_ADDRESS].map((l) => h('span', null, l)),
    );
    stage('mailing');
    skipBtn.focus();
    host.onMailed?.();
    host.say('Card mailed. The mail truck drives off with it. A few days later…');
    clearTimeout(days);
    days = setTimeout(arrive, MAIL_DAYS_MS);
  }

  function arrive(): void {
    clearTimeout(days);
    if (!reply || card.dataset.stage !== 'mailing') return;
    const here = card.contains(document.activeElement);
    stage('reply');
    if (here) registerBtn.focus();
    host.say(`Reply arrived from Recreational Software Designs: registration number ${reply.number} for ${reply.name}. Choose Register now.`);
    host.onReply?.(reply);
  }

  function again(): void {
    reply = undefined;
    saveReply(undefined);
    nameIn.value = SAMPLE_NAME;
    noProblems();
    stage('card');
    nameIn.focus();
  }

  function registered(name: string): void {
    host.say(`Game-Maker is registered to ${name.trim()}.`);
    host.focusScreen();
  }

  function registerNow(): void {
    const desk = host.desk();
    if (!desk || !reply) return;
    const wrong = desk.apply(reply.name, reply.number);
    if (wrong) return problem(replyMsg, wrong);
    problem(replyMsg);
    registered(reply.name);
  }

  function applyByHand(): void {
    const desk = host.desk();
    if (!desk) return;
    const wrong = desk.apply(keyName.value, numIn.value);
    if (wrong) return problem(keyMsg, wrong, /number/.test(wrong) ? numIn : keyName);
    problem(keyMsg);
    registered(keyName.value);
  }

  return {
    el: card,
    toManual,
    noProblems,
    /** What the card says above it, for what GM is doing. */
    setLead(title: string, lead: string): void {
      cardTitle.textContent = title;
      cardLead.textContent = lead;
    },
    /** Where the keyboard goes in the card: what to do next. */
    focus(): void {
      const s = card.dataset.stage;
      (s === 'mailing' ? skipBtn : s === 'reply' ? registerBtn : nameIn).focus();
    },
    /** GMCRACK stamped another serial into PLAYGAME.EXE: the card shows it, and a reply for the old one is no use. */
    setSerial(n: number): void {
      if (n === serial) return;
      serial = n;
      serialDd.textContent = String(serial);
      reply = savedReply(serial);
      if (reply) drawLetter(reply);
      else if (card.dataset.stage === 'reply') stage('card');
    },
    dispose: () => clearTimeout(days),
  };
}

/** The card's back, as it goes in the mail: Business Reply Mail to RSD, then a few days. */
function mailingBack(fromLines: HTMLElement, skipBtn: HTMLElement): HTMLElement {
  return h(
    'div',
    { class: 'rs-mailing', hidden: true },
    h(
      'div',
      { class: 'rs-brm' },
      h('p', { class: 'rs-from' }, h('small', null, 'From: '), fromLines),
      h('p', { class: 'rs-nopost' }, 'NO POSTAGE NECESSARY IF MAILED IN THE UNITED STATES'),
      h(
        'div',
        { class: 'rs-bars', 'aria-hidden': 'true' },
        Array.from({ length: 7 }, () => h('i')),
      ),
      h(
        'p',
        { class: 'rs-brm-h' },
        h('b', null, 'BUSINESS REPLY MAIL'),
        h('span', null, 'FIRST-CLASS MAIL · PERMIT NO. 1995 · AMHERST, NH'),
        h('small', null, 'POSTAGE WILL BE PAID BY ADDRESSEE'),
      ),
      h(
        'p',
        { class: 'rs-to' },
        RSD_ADDRESS.map((l, i) => h('span', null, i ? l : l.toUpperCase())),
      ),
      h('span', { class: 'rs-postmark', 'aria-hidden': 'true' }, 'MAILED'),
    ),
    h('p', { class: 'rs-days' }, 'The mail truck has your card. ', h('b', null, 'A few days later…')),
    h('div', { class: 'rs-actions' }, skipBtn),
  );
}
