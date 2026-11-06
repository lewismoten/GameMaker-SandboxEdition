// Challenge codec rejection tests and a pin against the actual reviewed public disk.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { BACKYARD, BACKYARD_START } from './profile';
import { challengeFragment, challengeText, parseChallengeFragment, parseChallengeText } from './descriptor';

const descriptor = { v: 1 as const, ...BACKYARD };
const text = challengeText(descriptor);
const games = new URL('../../../games/', import.meta.url);
afterEach(() => vi.unstubAllGlobals());

describe('reviewed challenge descriptor', () => {
  it('round-trips canonical text and a URL fragment without browser services', () => {
    for (const name of ['fetch', 'indexedDB', 'localStorage', 'sessionStorage']) {
      vi.stubGlobal(
        name,
        new Proxy(
          {},
          {
            get: () => {
              throw new Error('Browser service used');
            },
          },
        ),
      );
    }
    expect(parseChallengeText(text)).toEqual(descriptor);
    expect(parseChallengeFragment(challengeFragment(descriptor))).toEqual(descriptor);
    expect(text.length).toBeLessThan(256);
    expect(challengeFragment(descriptor)).not.toContain('?');
  });

  it('rejects every unsupported field and reports no imported content in errors', () => {
    for (let i = 0; i < 8; i++) {
      const fields = text.split('|');
      fields[i] += 'x';
      expect(() => parseChallengeText(fields.join('|'))).toThrow('Challenge unavailable or invalid.');
    }
    expect(() => challengeText({ ...descriptor, game: 'unknown' })).toThrow();
    expect(() => challengeText({ ...descriptor, scene: 3 })).toThrow();
  });

  it('refuses all secret games from metadata, regardless of local unlocks', () => {
    const ids = readdirSync(games).filter((id) => {
      const path = new URL(`${id}/about.json`, games);
      return existsSync(path) && (JSON.parse(readFileSync(path, 'utf8')) as { secret?: boolean }).secret;
    });
    expect(ids.length).toBeGreaterThan(0);
    for (const game of ids) {
      expect(() => challengeText({ ...descriptor, game })).toThrow('Challenge unavailable or invalid.');
      expect(() => parseChallengeText(text.replace('|teddy|', `|${game}|`))).toThrow('Challenge unavailable or invalid.');
    }
  });

  it('rejects malformed, noncanonical, oversized and nested inputs promptly', () => {
    for (const bad of [
      null,
      undefined,
      1,
      {},
      [],
      '',
      text + '|extra',
      text + '\n',
      text.replace('|2|', '|02|'),
      text.replace('|2|', '|2.0|'),
      text.replace('|2|', '|Infinity|'),
      text.toUpperCase(),
      'x'.repeat(1_000_000),
      '{"v":1}',
      '['.repeat(256),
    ]) {
      expect(() => parseChallengeText(bad)).toThrow();
    }
    for (const bad of [
      '#challenge=%',
      '#challenge=%FF',
      '#challenge=%252F',
      '#challenge=' + '%41'.repeat(1_000),
      '#challenge=' + encodeURIComponent(text) + '&extra=1',
      'https://example.invalid/' + challengeFragment(descriptor),
    ]) {
      expect(() => parseChallengeFragment(bad)).toThrow();
    }
  });

  it('pins the public game version, full disk bytes and scene arrival', () => {
    const about = JSON.parse(readFileSync(new URL('teddy/about.json', games), 'utf8')) as { version: string; secret?: boolean; series?: string };
    expect(about.secret).not.toBe(true);
    expect(about.series).not.toBe('starter');
    expect(about.version).toBe(BACKYARD.version);
    const disk = new URL('teddy/disk/', games);
    const hash = createHash('sha256');
    for (const name of readdirSync(disk).sort()) {
      const bytes = readFileSync(new URL(name, disk));
      hash.update(`${name.toLowerCase()}\0${bytes.length}\0`);
      hash.update(bytes);
    }
    expect(hash.digest('hex')).toBe(BACKYARD.hash);
    const game = parseGame(readFileSync(new URL(BACKYARD_START.gam, disk)));
    expect(game.scenes[BACKYARD.scene].files[1]).toBe('backyard.map');
    expect(game.scenes[0].links[0]).toMatchObject({ toScene: BACKYARD_START.scene, to: { x: BACKYARD_START.x, y: BACKYARD_START.y } });
  });
});
