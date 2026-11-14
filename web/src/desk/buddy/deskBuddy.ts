// Scoot, the desk buddy: a pocket LCD toy on the desk top between the PC and the Game-Maker box (on a phone, beside the Game-Maker
// box). It hears what happens on the desk (the PC's game and scenes, `DESK_PLAY` from deskPc.ts;
// new badges; a new certificate frame; quiet time) and answers with a pose and, now and then, one
// short line in a bubble (buddyLines.ts has the rules). Pressing it opens a small card with what
// it has seen (buddyStats.ts) and the courier's four sections (courierCard.ts: Mail, Postcards,
// Packages, Setup with the Quiet switch); an envelope shows when a letter is new. It never pushes play.
import './deskBuddy.css';
import { h } from '../../editor/core/ui';
import { ACHIEVEMENTS_CHANGED, ACHIEVEMENT_UNLOCKED } from '../../achievements/store';
import { stillMotion } from '../props/propKit';
import { adoptStored, newMind, react, type BuddyKept, type BuddyEvent, type Pose } from './buddyLines';
import { buddySvg } from './buddyArt';
import { loadBuddy, saveBuddy } from './buddyStore';
import { buddySummary } from './buddyStats';
import { DESK_PLAY, type DeskPlay } from './deskPlay';
import { courierCard } from './courierCard';
import { COURIER_CHANGED, hasNewMail } from '../../courier/courierStore';

/** A small envelope (a letter is new): paper, a flap, and a red seal. */
const ENVELOPE =
  '<svg viewBox="0 0 22 16" aria-hidden="true"><rect x="1" y="1" width="20" height="14" rx="1.5" fill="#fffaf0" stroke="#5a5446" stroke-width="1.2"/><path d="M1.6 1.8 11 9.2l9.4-7.4" fill="none" stroke="#5a5446" stroke-width="1.2"/><circle cx="11" cy="9" r="2" fill="#b8321a"/></svg>';

/** Quiet this long (no key, tap or pointer) and it dozes off. */
const IDLE_MS = 3 * 60_000;
const LINE_MS = 5500;
const POSE_MS = 4000;

export function deskBuddy(place: (el: HTMLElement) => void): () => void {
  const saved = loadBuddy();
  const mind = newMind(saved);
  let known: BuddyKept = { quiet: mind.quiet, met: mind.met, helloDay: mind.helloDay };
  const remember = () => {
    known = { quiet: mind.quiet, met: mind.met, helloDay: mind.helloDay };
    saveBuddy(known);
  };
  let playing: string | undefined;
  let pose: Pose = 'idle';

  const screen = h('span', { class: 'buddy-art' });
  const bubble = h('span', { class: 'buddy-bubble', role: 'status', 'aria-live': 'polite' });
  const press = h('button', {
    class: 'buddy-press',
    'aria-label': 'Scoot, your desk buddy',
    title: 'Scoot: what it has seen',
    'aria-expanded': 'false',
    'aria-controls': 'buddy-card',
  });
  press.append(screen);
  const card = h('div', { class: 'buddy-card courier', id: 'buddy-card', role: 'dialog', 'aria-labelledby': 'buddy-title', hidden: true });
  const envelope = h('span', { class: 'buddy-envelope', hidden: true });
  envelope.innerHTML = ENVELOPE;
  const el = h('div', { class: 'desk-buddy' }, bubble, press, envelope, card);
  place(el);

  const draw = (p: Pose | 'blink') => (screen.innerHTML = buddySvg(p));
  let poseTimer = 0;
  const show = (p: Pose) => {
    pose = p;
    draw(p);
    el.dataset.pose = p;
    clearTimeout(poseTimer);
    if (p !== 'sleep' && p !== 'idle') poseTimer = window.setTimeout(() => show('idle'), POSE_MS);
  };
  let lineTimer = 0;
  const speak = (line: string) => {
    bubble.textContent = line;
    el.classList.add('speaking');
    clearTimeout(lineTimer);
    lineTimer = window.setTimeout(() => {
      el.classList.remove('speaking');
      bubble.textContent = '';
    }, LINE_MS);
  };
  const hear = (ev: BuddyEvent) => {
    const r = react(mind, ev, Date.now());
    if (!r) return;
    show(r.pose);
    if (r.line) speak(r.line);
    if (ev.kind === 'open') remember();
  };

  // a blink now and then while it stands idle (not with reduced motion)
  const blinker = window.setInterval(() => {
    if (pose !== 'idle' || stillMotion() || document.hidden) return;
    draw('blink');
    window.setTimeout(() => pose === 'idle' && draw('idle'), 160);
  }, 4700);

  // the PC's game
  const onPlay = (e: Event) => {
    const d = (e as CustomEvent<DeskPlay>).detail;
    if ('title' in d) {
      playing = d.title || undefined;
      hear({ kind: 'game', title: d.title });
    } else if ('scene' in d) {
      if (d.demo) return;
      if (d.scene === 1) hear({ kind: 'won', title: playing });
      else hear({ kind: 'level', scene: d.scene });
    } else {
      playing = undefined;
      hear({ kind: 'stop' });
    }
    if (!card.hidden) void fillCard();
  };
  // a new badge, by its title
  const onBadge = (e: Event) => {
    const id = (e as CustomEvent<{ id: string }>).detail?.id;
    if (!id) return;
    void import('../../achievements/catalog').then(({ achievementById }) => {
      const a = achievementById(id);
      if (a) hear({ kind: 'badge', title: a.title });
    });
  };
  // a new or better certificate frame (the first look is only where it starts from)
  let frame: string | undefined;
  let framed = false;
  const onHonors = () =>
    void Promise.all([import('../../editor/shell/homeDone'), import('../diploma/frameLevel')]).then(async ([{ loadFinished }, { frameLook }]) => {
      const look = frameLook(await loadFinished());
      const key = look ? `${look.metal}:${look.ribbon}` : undefined;
      if (framed && key && key !== frame) hear({ kind: 'certificate' });
      frame = key;
      framed = true;
    });

  // quiet time: it dozes, and wakes when you come back
  let idleTimer = 0;
  let stirred = 0;
  const awake = () => {
    if (mind.sleeping) hear({ kind: 'back' });
    else if (Date.now() - stirred < 1000) return;
    stirred = Date.now();
    clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => hear({ kind: 'idle' }), IDLE_MS);
  };

  // the card
  const quiet = h('input', { type: 'checkbox', checked: mind.quiet });
  quiet.addEventListener('change', () => {
    mind.quiet = quiet.checked;
    remember();
    if (mind.quiet) bubble.textContent = '';
  });
  const facts = h('dl', { class: 'buddy-facts courier-facts' });
  const sections = courierCard(h('label', { class: 'buddy-quiet' }, quiet, ' Quiet (no words, just waves)'));
  // a new letter: the envelope (no number), and the toy's name says so too
  const mailed = () => {
    const fresh = hasNewMail();
    envelope.hidden = !fresh;
    press.setAttribute('aria-label', fresh ? 'Scoot, your desk buddy: a new letter' : 'Scoot, your desk buddy');
  };
  // SCOOT.EXE (or another tab) changed the mail or the Quiet switch
  const onCourier = () => {
    mailed();
    const stored = loadBuddy();
    if (adoptStored(mind, known, stored)) known = stored;
    quiet.checked = mind.quiet;
    if (mind.quiet) bubble.textContent = '';
  };
  const close = h('button', { class: 'buddy-close', 'aria-label': 'Close Scoot’s card' }, '×');
  card.append(
    h('h2', { id: 'buddy-title' }, 'Scoot'),
    h('p', { class: 'buddy-blurb' }, 'Your desk buddy. It sits here and watches the PC with you.'),
    facts,
    sections.el,
    close,
  );
  const fillCard = async () => {
    const s = await buddySummary(playing, pose);
    facts.replaceChildren(
      h('dt', null, 'Games played'),
      h('dd', null, String(s.played)),
      h('dt', null, 'Badges'),
      h('dd', null, String(s.badges)),
      h('dt', null, 'On the PC'),
      h('dd', null, s.playing ?? 'Nothing right now'),
    );
  };
  const openCard = (open: boolean) => {
    card.hidden = !open;
    press.setAttribute('aria-expanded', String(open));
    if (open) {
      void fillCard();
      sections.refresh();
      if (pose === 'sleep') hear({ kind: 'back' });
      else show('wave');
      close.focus();
    }
  };
  press.addEventListener('click', () => openCard(card.hidden));
  close.addEventListener('click', () => {
    openCard(false);
    press.focus();
  });
  card.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    openCard(false);
    press.focus();
  });

  addEventListener(DESK_PLAY, onPlay);
  addEventListener(COURIER_CHANGED, onCourier);
  addEventListener('storage', onCourier);
  addEventListener(ACHIEVEMENT_UNLOCKED, onBadge);
  addEventListener(ACHIEVEMENTS_CHANGED, onHonors);
  for (const t of ['keydown', 'pointerdown', 'pointermove', 'wheel'] as const) addEventListener(t, awake, { passive: true });
  draw('idle');
  mailed();
  onHonors();
  awake();
  hear({ kind: 'open', today: new Date().toLocaleDateString('en-CA') });

  return () => {
    removeEventListener(DESK_PLAY, onPlay);
    removeEventListener(COURIER_CHANGED, onCourier);
    removeEventListener('storage', onCourier);
    sections.dispose();
    removeEventListener(ACHIEVEMENT_UNLOCKED, onBadge);
    removeEventListener(ACHIEVEMENTS_CHANGED, onHonors);
    for (const t of ['keydown', 'pointerdown', 'pointermove', 'wheel'] as const) removeEventListener(t, awake);
    clearTimeout(idleTimer);
    clearTimeout(lineTimer);
    clearTimeout(poseTimer);
    clearInterval(blinker);
    el.remove();
  };
}
