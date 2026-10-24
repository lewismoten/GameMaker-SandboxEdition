// "Before You Upload": The Ultimate Owner's Guide's Appendix B as a checklist that ticks
// itself where the level check can tell (the file checks, run now, and the last Level check of
// each map, kept in the companion file), and leaves the rest for the designer to tick. Those
// ticks are kept in the companion file too (editor-only, never in the game's files).
import './uploadChecklist.css';
import { h, modal } from '../core/ui';
import type { Project } from '../core/project';
import { CHECKS, type CheckId, type Finding } from '../check/findings';
import { sameEverySide } from '../check/sameEverySide';
import { runChecks } from '../check/report';
import { guideLink } from './guideLink';
import { unlockAchievement } from '../../achievements';

/** One line of Appendix B, and the checks that can speak for it. */
export interface ChecklistItem {
  text: string;
  checks: CheckId[];
  /** The checks cover all of it (else the designer ticks it once they agree). */
  full?: boolean;
  /** It needs a playtest (the map panel's Level check). */
  play?: boolean;
}

export const APPENDIX_B: ChecklistItem[] = [
  { text: 'The first minute is fun; the hero’s speed feels right to someone new', checks: ['hero-speed', 'response'] },
  { text: 'The hero faces the way he walks; pacing monsters turn round', checks: ['facing'] },
  { text: 'Every jump has a block to spare; every landing is in sight before the jump', checks: ['blind-drop', 'hazard-landing'], play: true },
  { text: 'Each level asks a little more; the last is the best, not the meanest', checks: ['curve'], play: true },
  { text: 'Long levels are split into scenes, so a death costs little', checks: ['checkpoints'], play: true, full: true },
  { text: 'Every danger shows before it can kill; hazard blocks fill their cells', checks: ['hazard-art', 'start-threat'] },
  { text: 'Nowhere to get stuck: every pit has a way out, every lock its key', checks: ['stuck', 'counters', 'link-unreached'], play: true, full: true },
  { text: 'Two or three enemies on a screen, each with a job; birth blocks rest', checks: ['density', 'births'], full: true },
  {
    text: 'Enemies stand out in every palette; a touch costs little and pushes clear',
    checks: ['contrast', 'hurt-lock', 'every-tick', 'speed', 'chasers'],
    full: true,
  },
  { text: 'Every item can be reached; mazes have landmarks; no wait over 3 seconds', checks: ['unreachable', 'waits', 'maze'], play: true },
  { text: 'The final boss has stages; the ending is a real scene, not an ad', checks: ['ending'] },
  { text: 'Something new every level or two; the gimmick has its own level', checks: ['variety'] },
  { text: 'Any key beyond the arrows and fire is taught in the game itself, and sits under the left hand', checks: ['controls', 'reach'], full: true },
  { text: 'Animations loop smoothly; menu, F2 and text screens are readable', checks: [] },
  { text: 'Frequent sounds are short; no voice line is cut off; music fits', checks: ['sounds'] },
  { text: 'Storyline, instructions, credits, won and lost screens are filled in', checks: ['ending'], full: true },
  { text: 'The demo plays the same way twice', checks: [] },
  { text: 'Three friends played it through, and you fixed where they got stuck', checks: [] },
];

const SECTION = 'uploadChecklist';

/** What the checks say about an item: problems found, nothing found, or not checked yet. */
export function itemState(item: ChecklistItem, findings: Finding[], played: boolean): { kind: 'problems' | 'clear' | 'unchecked' | 'manual'; count: number } {
  if (!item.checks.length) return { kind: 'manual', count: 0 };
  const count = findings.filter((f) => item.checks.includes(f.check) && f.severity !== 'info').length;
  if (count) return { kind: 'problems', count };
  return { kind: item.play && !played ? 'unchecked' : 'clear', count: 0 };
}

/** The findings of the last Level check of every map, from the companion file. */
function savedFindings(project: Project): { findings: Finding[]; maps: number; checked: number } {
  const maps = project.files.byExtension('map');
  let checked = 0;
  const findings: Finding[] = [];
  for (const m of maps) {
    const s = project.extras<{ findings?: Finding[] } | undefined>(m, 'levelCheck', undefined);
    if (!s) continue;
    checked++;
    findings.push(
      ...(s.findings ?? []).filter((f) =>
        ['stuck', 'unreachable', 'link-unreached', 'blind-drop', 'hazard-landing', 'hurt-lock', 'every-tick', 'checkpoints', 'curve'].includes(f.check),
      ),
    );
  }
  return { findings, maps: maps.length, checked };
}

export async function uploadChecklist(project: Project): Promise<void> {
  const ticks = new Set(project.extras<number[]>(project.gam, SECTION, []));
  let fileFindings: Finding[] = [];
  try {
    fileFindings = (await runChecks(project.files, { play: false, sameEverySide: sameEverySide(project) })).findings;
  } catch {
    /* a game without levels: every item is the designer's */
  }
  const saved = savedFindings(project);
  const findings = [...fileFindings, ...saved.findings];
  const played = saved.maps > 0 && saved.checked === saved.maps;
  const boxes: HTMLInputElement[] = [];
  /** Every line ticked, by the checks or by hand. */
  const allTicked = () => {
    if (boxes.every((b) => b.checked)) unlockAchievement('check-upload');
  };
  await modal<void>('Before You Upload', () =>
    h(
      'div',
      { class: 'stack upl' },
      h(
        'p',
        { class: 'hint' },
        'The Ultimate Owner’s Guide’s Appendix B. Lines the level check can judge tick themselves; tick the rest when you agree. ',
        played
          ? `Play findings come from the Level check of all ${saved.maps} maps.`
          : `Play findings come from the Level check of ${saved.checked} of ${saved.maps} maps; run it on each map (🩺 in the map editor) for the rest.`,
        ' ',
        guideLink({ chapter: 'upload', section: 'Before You Upload' }, '📒 Appendix B in the guide'),
      ),
      h(
        'ol',
        { class: 'upl-list' },
        ...APPENDIX_B.map((item, i) => {
          const st = itemState(item, findings, played);
          const auto = st.kind === 'clear' && item.full;
          const box = h('input', { type: 'checkbox', checked: auto || ticks.has(i), disabled: auto, id: `upl-${i}` });
          boxes.push(box);
          box.addEventListener('change', () => {
            allTicked();
            if (box.checked) ticks.add(i);
            else ticks.delete(i);
            project.setExtras(
              project.gam,
              SECTION,
              [...ticks].sort((a, b) => a - b),
            );
          });
          const note =
            st.kind === 'problems'
              ? `⚠ ${st.count} finding${st.count === 1 ? '' : 's'} to look at (${[...new Set(item.checks.filter((c) => findings.some((f) => f.check === c && f.severity !== 'info')).map((c) => CHECKS[c].name))].join(', ')})`
              : st.kind === 'clear'
                ? auto
                  ? '✓ Checked: nothing found'
                  : '✓ Nothing found by the checks; the rest is your call'
                : st.kind === 'unchecked'
                  ? 'Run the Level check on every map to judge this'
                  : 'Only you can judge this';
          return h('li', { class: `upl-item upl-${st.kind}` }, box, h('label', { for: `upl-${i}` }, item.text, h('small', null, note)));
        }),
      ),
    ),
  );
}
