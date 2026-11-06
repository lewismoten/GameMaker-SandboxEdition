// The framed certificate above the desk's wall phone: nothing at all until a graduation game is played to its
// ending (its id in the achievements' finished set, the same record the web player, play.html, the desk's PC
// and the DOS page fill), then a frame for the highest level earned (frameLevel.ts). It follows new honors
// while the desk is open (ACHIEVEMENTS_CHANGED, from this tab or another) and on coming back to the window.
// Pressing it opens the Honors tab of the Starters' transcript dialog.
import './diploma.css';
import { h } from '../../editor/core/ui';
import { cover, pressable } from '../props/propKit';
import { loadFinished } from '../../editor/shell/homeDone';
import { ACHIEVEMENTS_CHANGED } from '../../achievements/store';
import { frameLook } from './frameLevel';
import { diplomaSvg } from './diplomaArt';

/** Shows nothing before the first graduation, then refreshes as honors are earned. */
export function diplomaFrame(place: (el: HTMLElement) => void): () => void {
  const frame = h('div', { class: 'diploma-frame', hidden: true });
  const art = h('span', { class: 'diploma-art', 'aria-hidden': 'true' });
  frame.append(art);
  const press = cover(frame, 'Framed certificate');
  place(frame);
  let shown = '';
  const refresh = async () => {
    const look = frameLook(await loadFinished());
    frame.hidden = !look;
    if (!look) return;
    const key = `${look.metal}:${look.ribbon}`;
    if (key !== shown) art.innerHTML = diplomaSvg(look);
    shown = key;
    frame.dataset.level = look.level;
    press.setAttribute('aria-label', look.name);
    press.title = look.title;
  };
  const unpress = pressable(
    press,
    press.getAttribute('aria-label') ?? '',
    () => void import('../../editor/shell/transcriptDialog').then((m) => m.showTranscript('honors')),
  );
  const changed = () => void refresh();
  window.addEventListener(ACHIEVEMENTS_CHANGED, changed);
  window.addEventListener('focus', changed);
  void refresh();
  return () => {
    unpress();
    window.removeEventListener(ACHIEVEMENTS_CHANGED, changed);
    window.removeEventListener('focus', changed);
    frame.remove();
  };
}
