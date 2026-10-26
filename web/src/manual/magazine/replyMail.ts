// A `reply` block (types.ts): the postage side of a magazine's reply card, as the post office
// had them printed: BUSINESS REPLY MAIL over its permit line, the facing marks and the thick
// bars down the right, "no postage necessary", and the address with its bar code under it
// (postnet.ts). The permit and box number are all zeros: nothing here is ever mailed.
import './replyMail.css';
import { h } from '../../editor/core/ui';
import { postnetCode } from './postnet';
import type { Block } from './types';

type ReplyBlock = Extract<Block, { t: 'reply' }>;

export function replyMail(b: ReplyBlock): HTMLElement {
  return h(
    'div',
    { class: 'mag-reply' },
    h('span', { class: 'mag-reply-fim', 'aria-hidden': 'true' }),
    h(
      'div',
      { class: 'mag-reply-stamp' },
      h('p', null, 'NO POSTAGE NECESSARY IF MAILED IN THE UNITED STATES'),
      h('span', { class: 'mag-reply-bars', 'aria-hidden': 'true' }),
    ),
    h('p', { class: 'mag-reply-head' }, 'BUSINESS REPLY MAIL'),
    h('p', { class: 'mag-reply-permit' }, 'FIRST-CLASS MAIL · PERMIT NO. 000 · PITTSBURGH, PA'),
    h('p', { class: 'mag-reply-paid' }, 'POSTAGE WILL BE PAID BY ADDRESSEE'),
    h('address', { class: 'mag-reply-to' }, ...b.to.flatMap((l, i) => (i ? [h('br'), l] : [l]))),
    postnetCode(),
  );
}
