// What every designer .EXE shares in text mode: Game-Maker's title bar and Design menu
// bar across the top, and the white-on-green program title color.
import type { TextScreen } from '../../retro/textScreen';
import type { RetroHost } from '../../retro/host';
import { BARATTR, TITLEATTR } from '../../retro/textUi';

/**
 * A designer .EXE ported to VGA graphics. Each module in src/vga that exports `program`
 * is run by Game-Maker's Design menu (retro/gm.ts) in place of today's web editor.
 */
export interface Program {
  /** The .EXE it replaces, e.g. 'PALCHOS.EXE'. */
  exe: string;
  /** Runs its text menu and graphic screens until the user quits to Game-Maker. */
  run(h: RetroHost): Promise<void>;
}

export const GMTOPBAR = '                           G A M E  -  M A K E R  SE 3.00                       ';
export const DESIGN_BAR = '  Palette  Block  Monster  Map  Character  Image  Sound  Integrator  Main  Help ';
export const PGMTITLECOL = 47;

/** writestr(0,0,79,GMTOPBAR); writestr(0,1,31,"  Palette  Block ..."); */
export function drawDesignBars(s: TextScreen): void {
  s.write(0, 0, TITLEATTR, GMTOPBAR);
  s.write(0, 1, BARATTR, DESIGN_BAR);
}
