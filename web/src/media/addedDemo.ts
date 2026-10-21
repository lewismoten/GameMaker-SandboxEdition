// Putting a demo added for this edition into a copy of a CD game, only when asked: the
// copy's title scene then names it as its demo (slot 11, as any game's would), and a short
// text file beside it says it was not part of the original game, so the notice travels
// with the game wherever it is exported.
import { h, modal } from '../editor/core/ui';
import { parseGame, serializeGame } from '../formats/game';
import { GameFiles, type CatalogEntry } from '../project/files';
import { titleDemo } from './demo';
import { ADDED_DEMO_FILE, extraDemoForGam, fetchExtraDemo, loadExtraDemos, type ExtraDemo } from './extraDemos';

/** The text file that goes with an added demo in a copy. */
export const ADDED_DEMO_NOTE = 'sedemo.txt';

/** A copy of `files` whose title scene plays `rec` (an added demo), with a note saying so. */
export function includeAddedDemo(files: GameFiles, gam: string, rec: Uint8Array, d: Pick<ExtraDemo, 'file' | 'inGame' | 'made' | 'date'>): GameFiles {
  const copy = new GameFiles(files.entries());
  const game = parseGame(copy.get(gam)!);
  // a recording the game had all along keeps its own name
  const name = d.inGame ? d.file : ADDED_DEMO_FILE;
  copy.set(name, rec);
  game.scenes[0].files[11] = name.toUpperCase();
  copy.set(gam, serializeGame(game));
  const note = [
    `${name.toUpperCase()}: the title screen's demo recording.`,
    '',
    d.inGame
      ? 'This recording came with the game, but the original game never named it as its demo; Game-Maker: Sandbox Edition set it as the title demo in this copy.'
      : 'It was NOT part of the original game. It was added by Game-Maker: Sandbox Edition so people can see how the game is played.',
    d.made,
    `Added: ${d.date}`,
    '',
  ].join('\r\n');
  copy.set(ADDED_DEMO_NOTE, new TextEncoder().encode(note));
  return copy;
}

/**
 * Before copying a CD game that has a demo added for this edition: asks whether to put it
 * in the copy (off unless ticked). Returns the files to copy: `files` itself, or a copy
 * with the demo; undefined when the dialog was closed (no copy wanted).
 */
export async function offerAddedDemo(entry: CatalogEntry | undefined, files: GameFiles, gam: string | null | undefined): Promise<GameFiles | undefined> {
  if (!entry || !gam || titleDemo(files, gam)) return files;
  const d = extraDemoForGam(await loadExtraDemos(), files.get(gam));
  if (!d) return files;
  const rec = d.inGame ? files.get(d.file) : await fetchExtraDemo(d);
  if (!rec) return files;
  const include = await modal<boolean>(`Copy ${entry.title}`, (close) => {
    const box = h('input', { type: 'checkbox', id: 'added-demo-include' }) as HTMLInputElement;
    return h(
      'form',
      {
        class: 'stack',
        method: 'dialog',
        onsubmit: (e: Event) => {
          e.preventDefault();
          close(box.checked);
        },
      },
      h('label', { class: 'check', for: 'added-demo-include' }, box, ' Include the added demo recording (not part of the original game)'),
      h(
        'p',
        { class: 'hint' },
        d.inGame
          ? `${entry.title} came with a recording its title screen never played. Tick this to make it the copy’s title demo.`
          : `${entry.title} shipped without a demo. Game-Maker: Sandbox Edition recorded one so people can see how it is played. Tick this to put it in your copy, as ${ADDED_DEMO_FILE.toUpperCase()} with a note (${ADDED_DEMO_NOTE.toUpperCase()}) saying it was added.`,
      ),
      h('div', { class: 'buttons' }, h('button', { class: 'primary', type: 'submit', autofocus: true }, 'Make the copy')),
    );
  });
  if (include === undefined) return undefined;
  return include ? includeAddedDemo(files, gam, rec, d) : files;
}
