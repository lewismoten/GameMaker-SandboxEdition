// Pi sound: Game-Maker OS's SND lines (gamemaker-os src/sound.h), the site game they name,
// and what PiSound plays for them.
import { describe, expect, it } from 'vitest';
import { parseSoundLine } from './soundLine';
import { findSiteGame, type SiteGame } from './soundGame';
import { PiSound, type SoundOut, type SoundState } from './piSound';
import { serializeSoundSet, newSoundSet } from '@lewismoten/gamemaker-sandbox-engine/formats/sound';

describe('SND lines', () => {
  it('reads each kind, after "LOG OS: " or bare', () => {
    expect(parseSoundLine('OS: SND game DICE DICE.GAM')).toEqual({ kind: 'game', dir: 'DICE', gam: 'DICE.GAM' });
    expect(parseSoundLine('SND game - KEYS.GAM')).toEqual({ kind: 'game', dir: '', gam: 'KEYS.GAM' });
    expect(parseSoundLine('OS: SND music start DICE/DICE.CMF')).toEqual({ kind: 'music', file: 'DICE.CMF' });
    expect(parseSoundLine('OS: SND music stop')).toEqual({ kind: 'musicStop' });
    expect(parseSoundLine('OS: SND voc KEYDOORS/JUMP.VOC')).toEqual({ kind: 'voc', file: 'JUMP.VOC' });
    expect(parseSoundLine('OS: SND beep -/DICE.SND 9')).toEqual({ kind: 'beep', file: 'DICE.SND', effect: 9 });
    expect(parseSoundLine('OS: SND stopall')).toEqual({ kind: 'stopAll' });
    expect(parseSoundLine('OS: SND end')).toEqual({ kind: 'end' });
  });

  it('leaves out other lines and broken ones', () => {
    for (const line of [
      'OS: GMOS level 1',
      'BOOT FB ok 640x480',
      'OS: SND',
      'OS: SNDX voc A/B.VOC',
      'OS: SND game DICE',
      'OS: SND music start DICE.CMF',
      'OS: SND music start DICE/../SECRET.CMF',
      'OS: SND music play DICE/DICE.CMF',
      'OS: SND voc DICE/jump.voc',
      'OS: SND voc DICE/WAYTOOLONGNAME.VOC',
      'OS: SND beep DICE/DICE.SND 30',
      'OS: SND beep DICE/DICE.SND -1',
      'OS: SND beep DICE/DICE.SND',
      'OS: SND stopall now',
      'OS: SND whistle',
    ])
      expect(parseSoundLine(line), line).toBeUndefined();
  });
});

const game = (id: string, gam: string | null, dosName?: string, path = `games/originals/${id}/`): SiteGame => ({ id, title: id, gam, path, dosName });

describe('the site game of a Pi folder', () => {
  const games = [
    game('dice', 'dice.gam', 'ROLLDICE'),
    game('keys-and-doors', 'keys.gam', 'KEYSDOOR'),
    game('grad-a', 'grad.gam', 'GRADA'),
    game('grad-b', 'grad.gam', 'GRADB'),
    game('room', 'room.gam', undefined, 'games/gameware/room/'),
    game('room2', 'room.gam', undefined, 'games/gameware/castle/'),
    game('nothing', null),
  ];
  it('goes by the .GAM when only one game has it, whatever the folder', () => {
    expect(findSiteGame(games, 'DICE', 'DICE.GAM')?.id).toBe('dice');
    expect(findSiteGame(games, 'KEYDOORS', 'KEYS.GAM')?.id).toBe('keys-and-doors');
    expect(findSiteGame(games, '', 'keys.gam')?.id).toBe('keys-and-doors');
  });
  it('picks between games with the same .GAM by the folder: DOS name, id or site folder', () => {
    expect(findSiteGame(games, 'GRADB', 'GRAD.GAM')?.id).toBe('grad-b');
    expect(findSiteGame(games, 'CASTLE', 'ROOM.GAM')?.id).toBe('room2');
    expect(findSiteGame(games, 'ROOM', 'ROOM.GAM')?.id).toBe('room');
  });
  it('is undefined for a game the site does not have, or cannot tell', () => {
    expect(findSiteGame(games, 'MYGAME', 'MYGAME.GAM')).toBeUndefined();
    expect(findSiteGame(games, 'GRADC', 'GRAD.GAM')).toBeUndefined();
    expect(findSiteGame(games, '', 'GRAD.GAM')).toBeUndefined();
  });
});

/** An audio engine that writes down what it is asked. */
function fakeOut(): SoundOut & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    playSong: (b) => (calls.push(`song ${b?.length}`), Promise.resolve(true)),
    stopSong: () => void calls.push('stopSong'),
    playVoc: (b) => (calls.push(`voc ${b?.length}`), true),
    playSpeaker: (f) => void calls.push(`speaker ${Array.from(f).slice(0, 2).join(',')}`),
    stopAll: () => void calls.push('stopAll'),
  };
}

describe('PiSound', () => {
  const set = newSoundSet();
  set.freqs[9][0] = 440;
  set.freqs[9][1] = 880;
  const files: Record<string, Uint8Array> = { 'dice.cmf': new Uint8Array(5), 'jump.voc': new Uint8Array(7), 'dice.snd': serializeSoundSet(set) };
  const games = [game('dice', 'dice.gam', 'ROLLDICE')];
  const asked: string[] = [];
  const source = {
    games: () => Promise.resolve(games),
    file: (_g: SiteGame, name: string) => (asked.push(name), Promise.resolve(files[name.toLowerCase()])),
  };
  const run = async (lines: string[]) => {
    const out = fakeOut();
    const states: SoundState[] = [];
    const played: string[] = [];
    const p = new PiSound(
      out,
      source,
      (s) => states.push(s),
      (w) => played.push(w),
    );
    for (const l of lines) await p.handle(parseSoundLine(l)!);
    return { out, states, played };
  };

  it('plays the game’s song, clip and PC speaker tune from the site’s files', async () => {
    const { out, states, played } = await run([
      'SND game DICE DICE.GAM',
      'SND music start DICE/DICE.CMF',
      'SND voc DICE/JUMP.VOC',
      'SND beep DICE/DICE.SND 9',
      'SND music stop',
      'SND stopall',
      'SND end',
    ]);
    expect(states).toEqual([{ kind: 'playing', title: 'dice' }, { kind: 'waiting' }]);
    expect(played).toEqual(['stop', 'music DICE.CMF', 'voc JUMP.VOC', 'beep DICE.SND 9', 'music stop', 'stop', 'stop']);
    expect(out.calls).toEqual(['stopAll', 'song 5', 'voc 7', 'speaker 440,880', 'stopSong', 'stopAll', 'stopAll']);
  });

  it('says so and plays nothing for a game the site does not have', async () => {
    const { out, states } = await run(['SND game MINE MINE.GAM', 'SND music start MINE/MINE.CMF', 'SND beep MINE/MINE.SND 1']);
    expect(states).toEqual([{ kind: 'unknown' }]);
    expect(out.calls).toEqual(['stopAll']);
  });

  it('plays nothing before a game line, nor for a missing file, and reads each file once', async () => {
    asked.length = 0;
    const { out } = await run([
      'SND music start DICE/DICE.CMF',
      'SND game DICE DICE.GAM',
      'SND voc DICE/NONE.VOC',
      'SND beep DICE/DICE.SND 9',
      'SND beep DICE/DICE.SND 9',
    ]);
    expect(out.calls).toEqual(['stopAll', 'speaker 440,880', 'speaker 440,880']);
    expect(asked).toEqual(['NONE.VOC', 'DICE.SND']);
  });

  it('drops a song that is still loading when a stop comes', async () => {
    const out = fakeOut();
    const p = new PiSound(out, source);
    await p.handle({ kind: 'game', dir: 'DICE', gam: 'DICE.GAM' });
    const song = p.handle({ kind: 'music', file: 'DICE.CMF' });
    await p.handle({ kind: 'stopAll' });
    await song;
    expect(out.calls).toEqual(['stopAll', 'stopAll']);
  });
});
