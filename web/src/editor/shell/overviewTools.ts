// Overview › Tools: the game-wide tools in one place, each a card with a real picture or live
// status (read from what is already saved, never a check run to draw the tab), one plain line and
// a button that opens it. Every tool keeps its own entry point; this is an additional home.
import './overviewTools.css';
import { companionPatches } from '../../dosPlayer/playerRecord';
import { h } from '../core/ui';
import type { Project } from '../core/project';
import { checkGame, worstSeverity } from '../../project/health';
import { fileThumb } from '../widgets/thumbs';
import { uploadSummary } from '../widgets/uploadChecklist';
import { howFar, WALK_SECTION, type SavedWalk } from '../check/walk/keptWalk';
import { firstStepsState, stepsDone, STEPS } from './firstSteps';
import { projectTarget, showHealthReport } from './gameHealth';
import { visionPalette } from './visionPalette';
import { versionCard } from './overviewVersion';
import { diskStatus, floppyFor } from '../disk/diskCard';

interface ToolsHost {
  open: (file: string) => void;
  play: () => void;
  download: () => void;
  firstSteps: () => (() => void) | undefined;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** One tool: a picture (or none), its name, a live status line, what it does, and its button. */
function card(id: string, title: string, picture: HTMLElement | null, status: string, what: string, label: string, run: () => void): HTMLElement {
  const name = `tool-${id}`;
  return h(
    'li',
    { class: 'tool-card' },
    picture ? h('div', { class: 'tool-pic', 'aria-hidden': 'true' }, picture) : null,
    h(
      'div',
      { class: 'tool-body' },
      h('h3', { id: name }, title),
      h('p', { class: 'tool-status', role: 'status' }, status),
      h('p', { class: 'hint' }, what),
      h('button', { type: 'button', 'aria-describedby': name, onclick: run }, label),
    ),
  );
}

export function overviewTools(project: Project, host: ToolsHost): { el: HTMLElement; dispose(): void } {
  const files = project.files;
  const cards: HTMLElement[] = [];
  const maps = files.byExtension('map');

  // Level check: the last result each map kept in the companion file
  if (maps.length) {
    let checked = 0;
    let findings = 0;
    let firstUnchecked: string | undefined;
    let busiest = { file: maps[0], n: -1 };
    for (const m of maps) {
      const s = project.extras<{ findings?: { severity: string }[] } | undefined>(m, 'levelCheck', undefined);
      if (!s) {
        firstUnchecked ??= m;
        continue;
      }
      checked++;
      const n = (s.findings ?? []).filter((f) => f.severity !== 'info').length;
      findings += n;
      if (n > busiest.n) busiest = { file: m, n };
    }
    const target = firstUnchecked ?? busiest.file;
    const status = checked
      ? `${checked} of ${plural(maps.length, 'level')} checked · ${findings ? plural(findings, 'finding') : 'nothing found'}`
      : 'Not run yet';
    cards.push(
      card(
        'check',
        'Level check',
        fileThumb(maps[0], files.get(maps[0]), {
          files,
          palette: project.paletteFor(maps[0]).palette,
          patches: companionPatches(project.companion, project.gam),
        }),
        status,
        'A bot looks for places a player gets stuck or can’t reach, and draws a heat map of where it went. It runs inside each level’s map editor.',
        firstUnchecked ? `Check ${firstUnchecked}…` : `Open ${target}…`,
        () => host.open(target),
      ),
    );
  }

  // Before You Upload
  const up = uploadSummary(project);
  cards.push(
    card(
      'upload',
      'Before You Upload',
      null,
      `${up.ticked} of ${up.total} lines ticked${up.problems ? ` · ${plural(up.problems, 'line')} with problems` : ''}${up.maps ? ` · Level check on ${up.checked} of ${plural(up.maps, 'map')}` : ''}`,
      'The guide’s Appendix B, ticked where the Level check can tell, with a report of every finding.',
      'Open the checklist…',
      () => void import('../widgets/uploadChecklist').then((m) => m.uploadChecklist(project)),
    ),
  );

  // Make a walkthrough
  const walk = project.extras<SavedWalk | undefined>(project.gam, WALK_SECTION, undefined);
  const through = walk ? howFar(walk).through : 0;
  const walkCard = card(
    'walk',
    'Make a walkthrough',
    null,
    walk
      ? `${walk.won ? 'Won the whole game' : `Got through ${plural(through, 'scene')}`} · made ${new Date(walk.when).toLocaleDateString()}`
      : 'None made yet',
    'A bot plays the whole game scene by scene and keeps it, to watch or save as a video.',
    walk ? 'Open the walkthrough…' : 'Make one…',
    () => void import('../widgets/walkDialog').then((m) => m.walkDialog(project)),
  );
  cards.push(walkCard);
  // dev server only: a walkthrough file kept outside the game (widgets/devLocalWalk.ts) counts as one
  if (import.meta.env.DEV && !walk) {
    void import('../widgets/devLocalWalk')
      .then((m) => m.localSummary(project.gam, project.name))
      .then((s) => {
        if (!s) return;
        walkCard.querySelector('.tool-status')!.textContent =
          `${s.complete ? 'Won the whole game' : `Got through ${plural(s.won, 'scene')}`} · a local file (not saved with the game)`;
        walkCard.querySelector('.tool-body button')!.textContent = 'Open the walkthrough…';
      });
  }

  // Game health: the quick check reads files already in memory
  let health = 'Every file the game names is there';
  try {
    const issues = checkGame(files, project.gam, { deep: false });
    const worst = worstSeverity(issues);
    health = worst ? plural(issues.length, worst === 'error' ? 'problem' : 'warning') + ' in its files' : health;
  } catch {
    health = 'Not checked';
  }
  cards.push(
    card(
      'health',
      'Health check',
      null,
      health,
      'Reads every file with its format’s reader and lists the ones that are missing, empty, misnamed or broken.',
      'Check every file…',
      () => void showHealthReport(projectTarget(project.id, project.name, Date.now())),
    ),
  );

  // Disk space: the floppy, drawn from the game's own title picture and palette
  cards.push(
    card(
      'disk',
      'Disk space',
      floppyFor(project, 84),
      diskStatus(project),
      'What the game takes to run as a DOS game, how many 3.5″ disks that is, and files (monster files, block sets, palettes) that could share one.',
      'Open the disk tool…',
      () => void import('../disk/diskTool').then((m) => m.diskTool(project)),
    ),
  );

  // First steps: only in games started from the starter
  const steps = firstStepsState(project);
  const toggle = host.firstSteps();
  if (steps && toggle) {
    const done = stepsDone(project, steps).filter(Boolean).length;
    cards.push(
      card(
        'steps',
        'First steps',
        null,
        `${done} of ${STEPS.length} steps done`,
        'The beginner’s checklist that ticks itself as you change the starter.',
        'Show the checklist',
        toggle,
      ),
    );
  }

  // Color vision: the game's palette, drawn
  const pal = visionPalette(files.byExtension('pal'), (name) => files.get(name));
  if (pal) {
    cards.push(
      card(
        'vision',
        'Color vision check',
        fileThumb(pal, files.get(pal), { files, patches: companionPatches(project.companion, project.gam) }),
        pal,
        'Shows the palette in grayscale and with color-vision differences, and which colors become hard to tell apart. It is the Vision tab of the palette editor.',
        `Open ${pal}…`,
        () => host.open(pal),
      ),
    );
  }

  if (!project.readOnly) cards.push(versionCard(project));

  cards.push(
    card('play', 'Play the game', null, 'From the title screen', 'Plays the whole game as a player would; Esc or Stop comes back.', 'Play Game', host.play),
    card(
      'download',
      'Download',
      null,
      'Windows, Mac, Linux, DOS, or one web page',
      'Packs the game to share or play elsewhere. The DOS files are exactly what the game saves.',
      'Choose a download…',
      host.download,
    ),
  );

  const el = h(
    'div',
    { class: 'overview-tools' },
    h('h2', { class: 'overview-title' }, 'Tools'),
    h('p', { class: 'hint' }, 'Tools for the whole game. Each also opens from where it lives in the editor.'),
    h('ul', { class: 'tool-grid' }, ...cards),
  );
  return { el, dispose: () => undefined };
}
