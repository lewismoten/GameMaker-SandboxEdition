// Level check badges for the block, monster and sound editors: the file checks (editor/check)
// run on the scenes that use the file, and the findings about the item being edited show as
// small notes beside it, each with why players mind and a link to the guide. Findings the
// designer accepted as meant to be (check/accepted.ts) are left out. Only reads.
import { h, clear, debounce } from '../core/ui';
import type { Project } from '../core/project';
import { normalize } from '../../project/files';
import { CHECKS, kindOf, type Finding, type Kind } from '../check/findings';
import { scenesOf } from '../check/sceneData';
import { blockChecks, counterSources, counters } from '../check/checks/blockChecks';
import { monsterChecks } from '../check/checks/monsterChecks';
import { soundChecks } from '../check/checks/gameChecks';
import { guideLink } from './guideLink';
import { acceptedFindings, openFindings } from '../check/accepted';
import './checkBadges.css';

const BADGE_ICON: Record<Kind, string> = { error: '⛔', warning: '⚠', suggestion: '💡', info: 'ℹ' };

/** The file checks' findings for the scenes that use `file`. */
function fileFindings(project: Project, file: string): Finding[] {
  const name = normalize(file);
  let all;
  try {
    all = scenesOf(project.game(), project.files);
  } catch {
    return [];
  }
  const gives = counterSources(all);
  const out: Finding[] = [];
  for (const d of all) {
    if (!Object.values(d.names).some((n) => n && normalize(n) === name)) continue;
    out.push(...counters(d, gives));
    for (const c of [...blockChecks, ...monsterChecks]) out.push(...c(d));
    out.push(...soundChecks(d, project.files));
  }
  // the same finding from several scenes once (after leaving out the accepted ones, which are per scene)
  const seen = new Set<string>();
  return openFindings(out, acceptedFindings(project)).filter((f) => !seen.has(f.title) && seen.add(f.title));
}

export function checkBadges(project: Project, file: string, about: (f: Finding) => boolean): { el: HTMLElement; refresh(): void } {
  const el = h('aside', { class: 'check-badges', 'aria-label': 'Level check notes', hidden: true });
  const refresh = debounce(() => {
    const list = fileFindings(project, file).filter(about);
    el.hidden = !list.length;
    clear(
      el,
      ...list.map((f) =>
        h(
          'p',
          { class: `check-badge check-${kindOf(f)}` },
          h('strong', null, h('span', { 'aria-hidden': 'true' }, BADGE_ICON[kindOf(f)]), kindOf(f) === 'suggestion' ? ' Suggestion: ' : ' ', f.title, '. '),
          CHECKS[f.check].why,
          ' ',
          guideLink(CHECKS[f.check].guide),
        ),
      ),
    );
  }, 300);
  refresh();
  // the editor saves as it goes: look again after each save, until it is closed
  let shown = false;
  const off = project.onChange((n) => {
    if (el.isConnected) shown = true;
    else if (shown) return off();
    if (normalize(n) === normalize(file)) refresh();
  });
  return { el, refresh };
}
