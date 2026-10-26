// What came in the envelope the mail jeep brought (retro/gmReg/replyMail.ts, desk/props/mailDrop.ts):
// RSD's registration confirmation letter, off their dot-matrix printer, with a Registered Owner
// card at its foot to cut out for a wallet. Both carry the name and registration number from the reply, so
// GM REGISTER can be done from the printout too. The address is the made-up one on the desk's
// registration card (mailCard.ts).
import '../regRecord.css'; // its Caveat ink, for the name on the card
import './regConfirm.css';
import { h } from '../../editor/core/ui';
import { PRODUCT } from '../../edition';
import { RSD_ADDRESS } from '../../retro/gmReg/mailCard';
import type { ReplyMail } from '../../retro/gmReg/replyMail';
import { sheet, type Sheet } from './kit';
import type { BoxItem } from './viewer';

const row = (label: string, value: string) => [h('dt', null, label), h('dd', null, value)];

async function confirmation(m: ReplyMail): Promise<Sheet[]> {
  const card = h(
    'div',
    { class: 'rcf-cut' },
    h('p', { class: 'rcf-scissors' }, '✂ Cut out and keep in your wallet'),
    h(
      'div',
      { class: 'rcf-card' },
      h('div', { class: 'rcf-band' }, h('b', null, 'REGISTERED OWNER'), h('span', null, 'GM 3.0')),
      h('p', { class: 'rcf-name' }, m.name),
      h('dl', { class: 'rcf-nums' }, row('Serial', String(m.serial)), row('Reg. no.', m.number)),
      h('p', { class: 'rcf-foot' }, 'Recreational Software Designs · 1995'),
    ),
  );
  return [
    sheet(
      8.5,
      11,
      'rcf',
      h('header', { class: 'rcf-lh' }, h('b', null, RSD_ADDRESS[0].toUpperCase()), h('span', null, RSD_ADDRESS.slice(1).join(' · '))),
      h('h3', null, 'REGISTRATION CONFIRMATION'),
      h('p', null, `Dear ${m.name},`),
      h(
        'p',
        null,
        `Thank you for registering ${PRODUCT} 3.0! Your card came in, and your copy is now on file. Here is your registration again, and a Registered Owner card for your wallet.`,
      ),
      h('dl', { class: 'rcf-keyed' }, row('Name', m.name), row('Serial no.', String(m.serial)), row('Registration no.', m.number)),
      h(
        'p',
        null,
        'Type GM REGISTER at the C:\\GM> prompt and enter the name and number exactly as they are printed here. Game-Maker stops asking for words from the Owner’s Guide.',
      ),
      h('p', null, 'Keep this letter with your Owner’s Guide. Upgrade news will find you at the address on your card.'),
      h('p', { class: 'rcf-sign' }, 'Happy game making!', h('br'), '— RSD Registration Dept.'),
      card,
      h('p', { class: 'rcf-note' }, '(The address is make-believe.)'),
    ),
  ];
}

/** The confirmation as a piece of paper in the Game-Maker box's tray. */
export function regConfirmItem(m: ReplyMail): BoxItem {
  return {
    id: 'regconfirm',
    title: 'Registration confirmation',
    note: `RSD’s letter and owner card for ${m.name}`,
    icon: '✉️',
    render: () => confirmation(m),
  };
}
