// A link to a tab of the Overview page, for editors that point at game-wide settings.
import type { Project } from '../core/project';
import { h } from '../core/ui';
import { formatHash } from '../../urlState';

export type OverviewTab = 'files' | 'controls' | 'player' | 'tools';

export const TAB_TITLES: Record<OverviewTab, string> = { files: 'Files', controls: 'Controls', player: 'DOS player', tools: 'Tools' };

/** The tab an address names (?tab=controls); Files when it names none. */
export function overviewTabFrom(value: string | undefined): OverviewTab {
  return value === 'controls' || value === 'player' || value === 'tools' ? value : 'files';
}

/** The address of an Overview tab (Files is the page without a tab). */
export function overviewHash(project: Pick<Project, 'id'>, tab: OverviewTab): string {
  return formatHash(['p', project.id], tab === 'files' ? {} : { tab });
}

export function overviewLink(project: Pick<Project, 'id'>, tab: OverviewTab, label: string): HTMLElement {
  return h('p', { class: 'meta' }, h('a', { href: overviewHash(project, tab) }, label));
}
