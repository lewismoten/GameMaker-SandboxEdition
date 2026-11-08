// The Starters' "Transcript" dialog, two tabs: Transcript (every Starter as "COURSE 101  Title  Grade" by stage, a
// GPA for each stage and overall, like a school transcript) and Honors (the six stage honors and the diploma as
// certificate pictures, locked ones grayed with what they need). One button, two tabs: both answer "how am I
// doing", and the tab bar keeps the lead row short on a phone. The name on the certificates is typed here and
// kept only in this browser (localStorage `gm-certificate-name`); no picture or name is sent anywhere.
import './transcript.css';
import { h, modal, download } from '../core/ui';
import {
  DIPLOMA,
  diplomaTier,
  allCeremonyStates,
  certificateTitle,
  transcript,
  unlockRule,
  type Ceremony,
  type TranscriptStage,
} from '../../project/ceremonies';
import { loadGameList } from '../../project/files';
import { loadFinished } from './homeDone';
import { loadGrades } from '../../achievements/courseGrades';
import { loadHonorDates } from '../../achievements/honorDates';
import { honorsLayout } from './honorsLayout';
import { NAME_MAX, certificateAlt, cleanName, drawCertificate, type DiplomaTier } from './certificateImage';
import { gpaText, gradeLabel } from './transcriptText';

const NAME_KEY = 'gm-certificate-name';

/** The saved name on the certificates ("" for none). */
function savedName(): string {
  try {
    return cleanName(localStorage.getItem(NAME_KEY) ?? '');
  } catch {
    return '';
  }
}

function saveName(v: string): void {
  try {
    if (v) localStorage.setItem(NAME_KEY, v);
    else localStorage.removeItem(NAME_KEY);
  } catch {
    /* not remembered */
  }
}

function stageTable(s: TranscriptStage, titles: Map<string, string>): HTMLElement {
  return h(
    'section',
    { class: 'tr-stage' },
    h('h3', {}, h('span', {}, s.ceremony.stage), h('span', { class: 'tr-gpa' }, gpaText(s.gpa, 'GPA'))),
    h(
      'table',
      {},
      h('caption', { class: 'sr-only' }, `${s.ceremony.stage}: courses and grades`),
      h(
        'tbody',
        {},
        ...s.rows.map((r) =>
          h(
            'tr',
            {},
            h('th', { scope: 'row', class: 'tr-num' }, `COURSE ${r.course}`),
            h('td', {}, titles.get(r.id) ?? r.id),
            h('td', { class: 'tr-grade' }, h('span', { 'aria-hidden': 'true' }, r.grade ?? '–'), h('span', { class: 'sr-only' }, gradeLabel(r.grade))),
          ),
        ),
      ),
    ),
  );
}

function transcriptPanel(titles: Map<string, string>, finished: ReadonlySet<string>): HTMLElement {
  const t = transcript(loadGrades(), finished);
  return h(
    'div',
    { class: 'tr-panel', 'data-list-area': '' },
    h('p', { class: 'tr-overall' }, h('b', {}, gpaText(t.gpa, 'Overall GPA'))),
    ...t.stages.map((s) => stageTable(s, titles)),
    h('p', { class: 'meta' }, 'You can retake any course to raise your grade.'),
  );
}

function certificateCard(c: Ceremony, name: string, date: string | undefined, tier?: DiplomaTier): HTMLElement {
  const canvas = h('canvas', { class: 'cert-canvas', role: 'img', 'aria-label': certificateAlt(c, name, date, tier) });
  drawCertificate(canvas, c, name, date, tier);
  return h(
    'figure',
    { class: 'cert earned' },
    canvas,
    h(
      'figcaption',
      {},
      h('span', {}, certificateTitle(c)),
      h(
        'button',
        {
          type: 'button',
          onclick: () => canvas.toBlob((b) => b && download(`${c.id}.png`, b, 'image/png')),
        },
        'Save picture',
      ),
    ),
  );
}

function honorsPanel(finished: ReadonlySet<string>): HTMLElement {
  const dates = loadHonorDates();
  const grades = loadGrades();
  const grid = h('div', { class: 'cert-grid' });
  const name = h('input', { type: 'text', maxLength: NAME_MAX, value: savedName(), autocomplete: 'off', spellcheck: false });
  const draw = () => {
    const states = allCeremonyStates(grades, finished);
    const t = diplomaTier(grades, finished);
    const tierNow: DiplomaTier = t === 'diploma' ? undefined : t;
    const diplomaEarned = states[states.length - 1]?.state.state === 'earned';
    grid.classList.toggle('with-diploma', diplomaEarned);
    const cards = states.map(({ ceremony, state }) =>
      state.state === 'earned'
        ? certificateCard(ceremony, cleanName(name.value), dates[ceremony.id], ceremony === DIPLOMA ? tierNow : undefined)
        : h(
            'figure',
            { class: 'cert locked' },
            h('div', { class: 'cert-lock' }, h('span', { 'aria-hidden': 'true' }, '🔒')),
            h(
              'figcaption',
              {},
              h('span', {}, certificateTitle(ceremony)),
              h(
                'small',
                {},
                state.state === 'open' ? 'Open: finish its graduation to earn it.' : `${unlockRule(ceremony)} ${state.done} of ${state.needed} so far.`,
              ),
            ),
          ),
    );
    grid.replaceChildren(
      ...honorsLayout(cards.length, diplomaEarned).map((slot) => {
        const card = cards[slot.index];
        card.classList.add(`cert-${slot.place}`);
        if (slot.row) card.style.gridRow = String(slot.row);
        return card;
      }),
    );
  };
  name.addEventListener('input', () => {
    saveName(cleanName(name.value));
    draw();
  });
  draw();
  return h(
    'div',
    { class: 'tr-panel', 'data-list-area': '' },
    h(
      'div',
      { class: 'cert-name-row' },
      h('label', { class: 'cert-name' }, 'Name on your honors (optional) ', name),
      h('p', { class: 'meta' }, 'Kept only in this browser. It is never sent anywhere.'),
    ),
    grid,
  );
}

/** Opens the dialog on its Transcript tab, or Honors. */
export async function showTranscript(tab: 'transcript' | 'honors' = 'transcript'): Promise<void> {
  const [finished, list] = await Promise.all([loadFinished(), loadGameList().catch(() => [])]);
  const titles = new Map(list.map((e) => [e.id, e.title]));
  void modal('Transcript', () => {
    const panels = { transcript: transcriptPanel(titles, finished), honors: honorsPanel(finished) };
    const tabs = h('div', { class: 'tr-tabs', role: 'tablist', 'aria-label': 'Transcript and honors' });
    const show = (k: 'transcript' | 'honors', focus = false) => {
      for (const [key, el] of Object.entries(panels)) el.hidden = key !== k;
      for (const b of tabs.querySelectorAll<HTMLButtonElement>('[role=tab]')) {
        const on = b.dataset.tab === k;
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      }
    };
    for (const [k, label] of [
      ['transcript', 'Transcript'],
      ['honors', 'Honors'],
    ] as const)
      tabs.append(
        h(
          'button',
          {
            type: 'button',
            role: 'tab',
            class: 'tr-tab',
            id: `tr-tab-${k}`,
            'aria-controls': `tr-panel-${k}`,
            dataset: { tab: k },
            onclick: () => show(k),
            onkeydown: (e: KeyboardEvent) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
                e.preventDefault();
                show(k === 'transcript' ? 'honors' : 'transcript', true);
              }
            },
          },
          label,
        ),
      );
    for (const [k, el] of Object.entries(panels)) {
      el.id = `tr-panel-${k}`;
      el.setAttribute('role', 'tabpanel');
      el.setAttribute('aria-labelledby', `tr-tab-${k}`);
    }
    show(tab);
    return h('div', { class: 'tr-dialog' }, tabs, panels.transcript, panels.honors);
  });
}
