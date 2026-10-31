// Teddy's Desk piggy bank: a pressable little bank that reports every catalog game's last win.
import './piggyBank.css';
import { h } from '../editor/core/ui';
import { pressable, say } from '../desk/props/propKit';
import { loadMoney, MONEY_CHANGED, type MoneyRecord } from './money';

const cash = (r: MoneyRecord) => Object.values(r).reduce((sum, amount) => sum + amount, 0);
const count = (r: MoneyRecord) => Object.keys(r).length;

function words(r: MoneyRecord): string {
  const games = count(r);
  if (!games) return 'Teddy’s piggy bank is ready for a winning game. It has not swallowed a single pretend coin yet.';
  const total = cash(r).toLocaleString('en-US');
  return `Teddy saved ${total} pretend coin${cash(r) === 1 ? '' : 's'} left after ${games} winning game${games === 1 ? '' : 's'}. He says every coin is for emergency biscuits, even the imaginary ones.`;
}

const art = () => {
  const el = h('span', { class: 'piggy-art', 'aria-hidden': 'true' });
  el.innerHTML = `<svg viewBox="0 0 100 76"><path d="M18 47q-8-12 3-20l10-4q5-14 20-14 18 0 25 16l13 5 9-8 4 5-9 11q3 7-1 16l5 12H76l-3-7H37l-3 7H16l5-13q-3-3-3-3z" fill="#f28e9e" stroke="#682d43" stroke-width="3" stroke-linejoin="round"/><path d="M33 15l-6-9 13 5" fill="#f28e9e" stroke="#682d43" stroke-width="3" stroke-linejoin="round"/><circle cx="62" cy="31" r="3" fill="#38212a"/><ellipse cx="83" cy="42" rx="7" ry="5" fill="#e7768a" stroke="#682d43" stroke-width="2"/><path d="M43 22v12M37 28h12" stroke="#ffe57d" stroke-width="3" stroke-linecap="round"/><circle cx="47" cy="48" r="9" fill="#ffd54f" stroke="#925f10" stroke-width="2"/><text x="47" y="52" text-anchor="middle" font-size="10" font-weight="bold" fill="#784d00">¢</text><path d="M10 42q-9 4-5 13t12 1" fill="none" stroke="#682d43" stroke-width="3" stroke-linecap="round"/></svg>`;
  return el;
};

/** Shows nothing before the first catalog win, then refreshes in this or another tab. */
export function piggyBank(place: (el: HTMLElement) => void): () => void {
  const bank = h('button', { type: 'button', class: 'piggy-bank', hidden: true });
  bank.append(art());
  place(bank);
  let record: MoneyRecord = {};
  const refresh = async () => {
    record = await loadMoney();
    const hasMoney = count(record) > 0;
    bank.hidden = !hasMoney;
    bank.title = hasMoney ? `Teddy’s piggy bank: ${cash(record).toLocaleString('en-US')} pretend coins` : '';
    bank.setAttribute('aria-label', `${words(record)} Press for details.`);
  };
  const unpress = pressable(bank, '', () => say(bank, words(record), art()));
  const changed = () => void refresh();
  window.addEventListener(MONEY_CHANGED, changed);
  window.addEventListener('focus', changed);
  void refresh();
  return () => {
    unpress();
    window.removeEventListener(MONEY_CHANGED, changed);
    window.removeEventListener('focus', changed);
    bank.remove();
  };
}
