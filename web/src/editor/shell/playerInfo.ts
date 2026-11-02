// The "Player" entry of a project's files (Overview > Files and the file list), for a game imported
// with its own player .EXE: which Game-Maker build it is (size, hash, version line, how sure and
// why), stock or patched, the settings read into the DOS player panel, the bytes kept as they were
// (their text shown where printable) and the About text. Read-only: the .EXE isn't among the
// project's files, and its About text is RSD's or the original author's attribution.
import './playerInfo.css';
import { h, modal } from '../core/ui';
import type { Project } from '../core/project';
import { companionOrigin, originText } from '../../dosPlayer/playerOrigin';
import { playerChanges, renamedFiles } from '../../dosPlayer/describePatches';
import { regionText } from '@lewismoten/gamemaker-sandbox-archives/project/importPlayer';

const hex = (n: number) => `0x${n.toString(16).toUpperCase()}`;

function row(label: string, value: string): HTMLElement[] {
  return [h('dt', null, label), h('dd', null, value)];
}

/** The entry's dialog body. */
function playerDetails(project: Project): HTMLElement {
  const o = companionOrigin(project.companion, project.gam)!;
  const settings = [...playerChanges(o.importPatches), ...renamedFiles(o.importPatches)];
  const bytes = o.regions.reduce((n, r) => n + atob(r.data).length, 0);
  return h(
    'div',
    { class: 'player-info' },
    h(
      'dl',
      null,
      ...row('File', o.exe),
      ...row('Build', `${originText(o)} (${o.confidence} confidence)`),
      ...row('Size', `${o.size.toLocaleString('en-US')} bytes`),
      ...row('MD5', o.md5),
      ...row('Version line', o.versionLine || 'none'),
      ...row('Stock or patched', o.stock ? 'Stock: every byte as that build’s own copy has it' : 'Patched by its author'),
    ),
    h('h3', null, 'Why that build'),
    h('ul', null, ...o.reasons.map((r) => h('li', null, `${r[0].toUpperCase()}${r.slice(1)}.`))),
    h('h3', null, 'Settings read at import (now in the DOS player panel)'),
    settings.length ? h('ul', null, ...settings.map((s) => h('li', null, s))) : h('p', null, 'None.'),
    h('h3', null, 'Kept as they were'),
    o.regions.length
      ? h(
          'div',
          null,
          h(
            'p',
            null,
            `${o.regions.length} part${o.regions.length === 1 ? '' : 's'} (${bytes.toLocaleString('en-US')} bytes) no setting explains, ${
              o.build === '3.00'
                ? 'which the DOS download writes back.'
                : 'which a 3.00 DOS download can’t hold (its offsets differ), so they are kept here only.'
            }`,
          ),
          ...o.regions.map((r) =>
            h(
              'details',
              null,
              h('summary', null, `At ${hex(r.offset)}, ${atob(r.data).length} bytes`),
              h(
                'pre',
                { class: 'player-info-text', tabindex: '0' },
                regionText(r)
                  .map(([at, t]) => `${hex(at)}  ${t}`)
                  .join('\n') || '(no printable text)',
              ),
            ),
          ),
        )
      : h('p', null, 'Nothing else changed.'),
    h('h3', null, 'About (F10) text'),
    o.about?.length
      ? h('pre', { class: 'player-info-text', tabindex: '0', 'aria-label': 'Its About text (read-only)' }, o.about.join('\n'))
      : h('p', null, 'RSD’s, as the build came.'),
    h(
      'p',
      { class: 'meta' },
      o.about?.length
        ? 'Read-only: it is the original author’s attribution. The game’s own credits page stays editable (DOS player > Main menu).'
        : 'Read-only: it is Recreational Software Designs’ attribution.',
    ),
  );
}

/** Shows the Player entry's details. */
export function showPlayerInfo(project: Project): Promise<void> {
  return modal<void>('Player', () => playerDetails(project)).then(() => undefined);
}
