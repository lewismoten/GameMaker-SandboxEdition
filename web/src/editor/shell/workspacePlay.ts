// Play-test picks, copied game files and the lifetime of the mounted player.
import { h, clear } from '../core/ui';
import type { Project } from '../core/project';
import { kindOf } from '../core/project';
import type { PlayerHandle } from '../../player/player';
import type { RunOptions } from '@lewismoten/gamemaker-sandbox-engine/engine/game';
import { parseGame, serializeGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { GameFiles } from '../../project/files';
import { levelForMap } from '../editors/integrator/startAt';
import { sceneName, sourceName } from '../editors/integrator/linkSpots';
import { playButtons } from './playButtons';
import { currentPick, gameFor, playChoices, type PlayPick } from './playLevel';
import { keepPick, lastPick } from './playPickStore';

interface PlayHost {
  current(): string | undefined;
  play(how: 'title' | PlayPick, back?: string): void;
  stopPlay(): void;
}

export class WorkspacePlay {
  player?: PlayerHandle;
  /** The file a play test goes back to; set while one runs. */
  back?: string;
  private disposed = false;
  constructor(
    private project: Project,
    private host: PlayHost,
  ) {}
  stop(): void {
    this.player?.stop();
  }
  clear(): void {
    this.player = undefined;
  }
  dispose(): void {
    this.disposed = true;
    this.stop();
  }

  /** The level whose map is open (play testing starts there), if any. */
  private levelHere(file = this.host.current()): { game: Game; scene: number } | undefined {
    if (!file || kindOf(file) !== 'map') return undefined;
    try {
      const game = parseGame(this.project.files.get(this.project.gam)!);
      const scene = levelForMap(game, file);
      return scene >= 0 ? { game, scene } : undefined;
    } catch {
      return undefined;
    }
  }

  /** Play Game and the Play Level split button (playButtons.ts). */
  button(): HTMLElement {
    return playButtons({
      game: () => {
        try {
          return parseGame(this.project.files.get(this.project.gam)!);
        } catch {
          return undefined;
        }
      },
      here: () => this.levelHere()?.scene,
      last: () => lastPick(this.project.id),
      playGame: () => this.host.play('title'),
      playLevel: (pick) => (keepPick(this.project.id, pick), this.host.play(pick)),
    });
  }

  mount(
    main: HTMLElement,
    bar: HTMLElement | null,
    level: PlayPick | undefined,
    back: string | undefined,
    overviewReturn: boolean,
    watch?: Pick<RunOptions, 'onSession' | 'onPlayEnd'>,
  ): void {
    const host = h('div', { class: 'player-host' });
    const game = parseGame(this.project.files.get(this.project.gam)!);
    const where = level ? `${sceneName(game, level.to)} at ${level.at.x},${level.at.y}` : '';
    bar?.classList.remove('released-inline');
    clear(
      main,
      bar,
      h(
        'div',
        { class: 'row file-head', style: 'justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px' },
        h('h1', { class: 'file-title' }, level ? `Playing ${where}` : `Playing ${this.project.name}`),
        h(
          'div',
          { class: 'toolbar' },
          level && h('button', { onclick: () => this.host.play('title', back), title: 'Play the whole game from its title screen' }, 'From the title screen'),
          h(
            'button',
            { onclick: () => this.host.stopPlay(), title: overviewReturn ? 'Stop and return to the overview' : back ? `Stop and go back to ${back}` : 'Stop' },
            'Stop',
          ),
        ),
      ),
      host,
      h(
        'p',
        { class: 'hint' },
        level ? `It starts in ${where}, where ${sourceName(game, level)} leads, without the title and menu; they come after play ends. ` : '',
        'Play testing uses a copy of the files: high scores and saved games are not added to your project.',
      ),
    );
    const copy = new GameFiles(this.project.files.entries());
    if (level) {
      const start = gameFor(game, level);
      if (start !== game) copy.set(this.project.gam, serializeGame(start));
    }
    // the player loads with the first play test; not if another file was opened meanwhile
    void Promise.all([
      import('../../player/player'),
      import('../../dosPlayer/playerRecord'),
      import('../../project/composeFiles'),
      import('../../dosPlayer/playerOrigin'),
    ]).then(([{ mountPlayer }, { companionPatches }, { composeFiles }, { companionOrigin, playerAbout }]) => {
      const player = companionPatches(this.project.companion, this.project.gam);
      if (!this.disposed && host.isConnected)
        this.player = mountPlayer(host, composeFiles(copy, this.project.companion), this.project.gam, {
          title: this.project.name,
          hardwareId: `project:${this.project.id}`,
          player,
          playerAbout: playerAbout(companionOrigin(this.project.companion, this.project.gam)),
          skipTitle: !!level,
          ...watch,
        });
    });
  }

  /** Play Level's pick when none is given: the last one, else a way into the open map's level, else the first. */
  defaultPick(file = this.host.current()): PlayPick | undefined {
    try {
      const game = parseGame(this.project.files.get(this.project.gam)!);
      return currentPick(playChoices(game), lastPick(this.project.id), this.levelHere(file)?.scene);
    } catch {
      return undefined;
    }
  }
}
