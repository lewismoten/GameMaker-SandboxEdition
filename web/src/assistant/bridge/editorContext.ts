// The open project as a GameContext, for the shared tools run in the editor's tab: changes go
// into the project's files (so the editors and autosave see them as they see any edit), each
// as one step the Assistant can take back, and the file whose editor is open is opened again
// to show it. The Level check and the walkthrough bot run in their Web Workers, as the
// editor's own buttons run them.
import { normalize } from '../../project/files';
import { companionPatches, PLAYER_SECTION, playerRecord } from '../../dosPlayer/playerRecord';
import type { PlayerPatches } from '../../dosPlayer/patchRules';
import type { Change, GameContext } from '../tools/types';
import type { AssistantHost } from '../hostSlot';
import { ToolError } from '../tools/types';

interface Step {
  summary: string;
  project: string;
  files: Map<string, Uint8Array | undefined>;
  patches?: PlayerPatches;
}

export class EditorContext implements GameContext {
  private steps: Step[] = [];

  constructor(
    private readonly host: () => AssistantHost | undefined,
    private readonly opts: {
      /** The Assistant's read-only switch. */
      readOnly: () => boolean;
      /** Told of each change, with a way to take it back (the toast). */
      changed: (summary: string, undo: () => void) => void;
    },
  ) {}

  private get open(): AssistantHost {
    const h = this.host();
    if (!h) throw new ToolError('No game is open in the editor tab: open one there first.');
    return h;
  }

  get files() {
    return this.open.project.files;
  }

  get gam(): string {
    return this.open.project.gam;
  }

  get readOnly(): boolean {
    const h = this.host();
    return this.opts.readOnly() || !h || !!h.project.readOnly;
  }

  playerPatches(): PlayerPatches {
    const p = this.open.project;
    return companionPatches(p.companion, p.gam);
  }

  async apply(change: Change): Promise<void> {
    const host = this.open;
    const p = host.project;
    const names = Object.keys(change.files ?? {}).map(normalize);
    const step: Step = { summary: change.summary, project: p.id, files: new Map(names.map((n) => [n, p.files.get(n)])) };
    if (change.player) step.patches = this.playerPatches();
    for (const [n, b] of Object.entries(change.files ?? {})) {
      if (b) p.files.set(n, b);
      else p.files.delete(n);
    }
    if (change.player) p.setExtras(p.gam, PLAYER_SECTION, playerRecord(change.player));
    this.steps.push(step);
    if (this.steps.length > 50) this.steps.shift();
    this.refresh(host, names);
    this.opts.changed(change.summary, () => this.undo(step));
  }

  /** Takes back the last change (or a given one, and those after it); false when there is none. */
  undo(step = this.steps[this.steps.length - 1]): boolean {
    const host = this.host();
    const at = step ? this.steps.indexOf(step) : -1;
    if (!host || at < 0) return false;
    for (const s of this.steps.splice(at).reverse()) {
      if (s.project !== host.project.id) continue;
      for (const [n, b] of s.files) {
        if (b) host.project.files.set(n, b);
        else if (host.project.files.has(n)) host.project.files.delete(n);
      }
      if (s.patches) host.project.setExtras(host.project.gam, PLAYER_SECTION, playerRecord(s.patches));
      this.refresh(host, [...s.files.keys()]);
    }
    return true;
  }

  get lastChange(): string | undefined {
    return this.steps[this.steps.length - 1]?.summary;
  }

  /** Opens the shown file again when it changed, so its editor shows the change. */
  private refresh(host: AssistantHost, names: string[]): void {
    const shown = host.currentFile;
    if (shown && !host.playing && names.includes(shown)) host.open(host.project.files.has(shown) ? shown : host.project.gam);
  }

  async runCheck(files: GameContext['files'], opt: Parameters<NonNullable<GameContext['runCheck']>>[1]) {
    const { startCheck } = await import('../../editor/check/client');
    return startCheck(files, opt).done;
  }

  async runWalk(files: GameContext['files'], opt: { budgetMs: number; only?: number }) {
    const { startWalk } = await import('../../editor/check/walk/walkClient');
    return startWalk(files, { gam: this.gam, id: this.gam.replace(/\.gam$/, ''), budgetMs: opt.budgetMs, only: opt.only }).done;
  }
}
