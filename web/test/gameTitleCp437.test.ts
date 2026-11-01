// gameTitle: the start scene's description holds CP437 byte codes, shown outside DOS as the
// Unicode a PC drew, without the spaces and frame lines authors put around it.
import { describe, expect, it } from 'vitest';
import { gameTitle, newGame, parseGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';

describe('gameTitle', () => {
  it('reads code page 437, not Latin-1, and drops the frame around the name', () => {
    const g = newGame();
    g.scenes[0].desc = '\xb3 JET DRIVER \xb3'; // the archive's JETDRIVE.GAM: "│ JET DRIVER │" on its menu
    expect(gameTitle(g)).toBe('JET DRIVER');
    g.scenes[0].desc = 'Caf\x82 \x9b1'; // é and ¢ inside the name stay
    expect(gameTitle(g)).toBe('Café ¢1');
  });

  it('is empty with no description, and leaves the stored bytes alone', () => {
    const g = newGame();
    g.scenes[0].desc = '   ';
    expect(gameTitle(g)).toBe('');
    g.scenes[0].desc = '\xb3 JET DRIVER \xb3';
    expect(parseGame(serializeGame(g)).scenes[0].desc).toBe('\xb3 JET DRIVER \xb3');
  });
});
