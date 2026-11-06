// achievementArt.ts must never delete, overwrite or regenerate a badge it did not make (achievementArtKeep.ts).
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import blockArt from '../src/achievements/blockArt.json';
import {
  GENERATOR,
  HAND_DRAWN,
  formatBadgeFile,
  mergeBadges,
  parseArgs,
  updateBadgeFile,
  type Badge,
  type BadgeFile,
  type MadeBadge,
} from './achievementArtKeep';

const uri = (bytes: string) => `data:image/png;base64,${Buffer.from(bytes).toString('base64')}`;
const made = (id: string, bytes: string): MadeBadge => ({ image: uri(bytes), game: 'goat', set: 'goat', block: id });
const marked = (id: string, bytes: string): Badge => ({ ...made(id, bytes), generator: GENERATOR });
const hand: Badge = { image: uri('hand-drawn pixels'), game: 'drawn for the badge', set: 'badge art', block: 'show-and-tell' };
const unknown: Badge = { image: uri('pasted in from somewhere'), game: 'goat', set: 'goat', block: 'crate' };

describe('achievementArt keeps badges it did not make', () => {
  let dir: string;
  let file: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'achievement-art-'));
    file = join(dir, 'blockArt.json');
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const write = (badges: Record<string, Badge>) => writeFileSync(file, formatBadgeFile({ notice: 'n', badges }));
  const read = (): BadgeFile => JSON.parse(readFileSync(file, 'utf8')) as BadgeFile;
  /** The exact text of one entry in the file, as JSON.stringify(..., 2) writes it. */
  const entryText = (text: string, id: string): string => {
    const start = text.indexOf(`"${id}": {`);
    return text.slice(start, text.indexOf('}', start) + 1);
  };

  it('leaves an existing hand-drawn badge byte-identical, even when a pick names it', () => {
    write({ 'play-starters': hand, 'heart-first': marked('heart-first', 'old') });
    const before = readFileSync(file, 'utf8');
    const r = updateBadgeFile(
      file,
      'n',
      { 'play-starters': made('play-starters', 'a game block'), 'heart-first': made('heart-first', 'old') },
      { handDrawn: ['play-starters'] },
    );
    const after = readFileSync(file, 'utf8');
    expect(entryText(after, 'play-starters')).toBe(entryText(before, 'play-starters'));
    expect(after).toBe(before);
    expect(r.kept).toEqual(['play-starters']);
    expect(r.log.join('\n')).toMatch(/kept play-starters: hand-drawn/);
  });

  it('generates a missing badge, marked as generated', () => {
    write({ 'play-starters': hand });
    const r = updateBadgeFile(file, 'n', { 'heart-first': made('heart-first', 'new') }, { handDrawn: ['play-starters'] });
    expect(r.created).toEqual(['heart-first']);
    expect(read().badges['heart-first']).toEqual(marked('heart-first', 'new'));
    expect(read().badges['play-starters']).toEqual(hand);
  });

  it('starts an absent file from nothing', () => {
    const r = updateBadgeFile(file, 'n', { 'heart-first': made('heart-first', 'new') });
    expect(r.created).toEqual(['heart-first']);
    expect(Object.keys(read().badges)).toEqual(['heart-first']);
  });

  it('refreshes a badge it generated earlier, and drops one no longer picked', () => {
    write({ 'heart-first': marked('heart-first', 'old art'), 'egg-first': marked('egg-first', 'stale') });
    const r = updateBadgeFile(file, 'n', { 'heart-first': made('heart-first', 'new art') });
    expect(r.refreshed).toEqual(['heart-first']);
    expect(r.removed).toEqual(['egg-first']);
    expect(read().badges).toEqual({ 'heart-first': marked('heart-first', 'new art') });
  });

  it('leaves an unknown, unmarked entry alone, picked or not', () => {
    write({ 'export-files': unknown, 'desk-door': { ...unknown, image: uri('another unmarked one') } });
    const before = readFileSync(file, 'utf8');
    const r = updateBadgeFile(file, 'n', { 'export-files': made('export-files', 'the pick') }, { handDrawn: [] });
    expect(readFileSync(file, 'utf8')).toBe(before);
    expect(r.kept.sort()).toEqual(['desk-door', 'export-files']);
    expect(r.log.join('\n')).toMatch(/kept export-files: existing entry is not marked as generated; pass --adopt export-files/);
  });

  it('treats a wrong or missing mark as not generated', () => {
    const fake = { ...unknown, generator: 'some other script' };
    expect(mergeBadges({ 'export-files': fake }, { 'export-files': made('export-files', 'x') }, { handDrawn: [] }).badges['export-files']).toBe(fake);
  });

  it('adopts an unmarked entry only when asked, and never a hand-drawn one', () => {
    const existing = { 'export-files': unknown, 'play-starters': hand };
    const picks = { 'export-files': made('export-files', 'the pick'), 'play-starters': made('play-starters', 'pick') };
    const r = mergeBadges(existing, picks, { adopt: ['export-files'], handDrawn: ['play-starters'] });
    expect(r.adopted).toEqual(['export-files']);
    expect(r.badges['export-files']).toEqual(marked('export-files', 'the pick'));
    expect(r.badges['play-starters']).toBe(hand);
    expect(() => mergeBadges(existing, picks, { adopt: ['play-starters'], handDrawn: ['play-starters'] })).toThrow(/Refusing to adopt play-starters/);
    expect(() => mergeBadges(existing, picks, { adopt: ['nothing-picks-this'] })).toThrow(/no pick/);
  });

  it('keeps a hand-drawn badge on the list even if someone marked it as generated', () => {
    const tampered = { ...hand, generator: GENERATOR };
    const r = mergeBadges({ 'play-starters': tampered }, {}, { handDrawn: ['play-starters'] });
    expect(r.badges['play-starters']).toBe(tampered);
    expect(r.removed).toEqual([]);
  });

  it('rejects a generated badge that repeats any other picture, kept ones included', () => {
    expect(() =>
      mergeBadges({ 'play-starters': hand }, { 'heart-first': { ...made('heart-first', ''), image: hand.image } }, { handDrawn: ['play-starters'] }),
    ).toThrow(/Duplicate badge art/);
  });

  it('writes nothing when the file does not parse', () => {
    writeFileSync(file, '{ "badges": { broken');
    expect(() => updateBadgeFile(file, 'n', { 'heart-first': made('heart-first', 'x') })).toThrow();
    expect(readFileSync(file, 'utf8')).toBe('{ "badges": { broken');
  });

  it('reads --adopt and rejects anything else', () => {
    expect(parseArgs(['--adopt', 'a,b', '--adopt=c'])).toEqual({ adopt: ['a', 'b', 'c'] });
    expect(() => parseArgs(['--force'])).toThrow(/Unknown argument/);
    expect(() => parseArgs(['--adopt'])).toThrow(/needs an achievement id/);
  });
});

describe('blockArt.json as committed', () => {
  const badges = blockArt.badges as Record<string, Badge>;
  it('holds every hand-drawn badge, none of them marked as generated', () => {
    for (const id of HAND_DRAWN) {
      expect(badges[id], id).toBeDefined();
      expect(badges[id].generator, id).toBeUndefined();
    }
  });
});
