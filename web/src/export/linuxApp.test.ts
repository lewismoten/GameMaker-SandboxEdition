import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createTar, readTar } from './tar';
import { folderName, linuxAppFiles, linuxId, linuxTarGz, playScript, shQuote } from './linuxApp';

const players = {
  x86_64: new Uint8Array(readFileSync(resolve(__dirname, '../../public/linux/GameMakerPlayer-x86_64'))),
  aarch64: new Uint8Array(readFileSync(resolve(__dirname, '../../public/linux/GameMakerPlayer-aarch64'))),
};
const enc = new TextEncoder();
const dec = new TextDecoder();
const html = '<!doctype html><title>Test</title><p>game</p>';
const options = { title: `Teddy's "$HOME" \`Test\``, id: 'Teddy Test', html, players, author: 'Lewis Moten', year: 2026 };

describe('the Linux player', () => {
  it('is a 64-bit ELF program for x86_64 and aarch64 that needs only the C library', () => {
    for (const [arch, elf] of Object.entries(players)) {
      expect([...elf.subarray(0, 4)]).toEqual([0x7f, 0x45, 0x4c, 0x46]);
      expect(elf[4]).toBe(2); // 64-bit
      expect(new DataView(elf.buffer).getUint16(18, true)).toBe(arch === 'x86_64' ? 62 : 183);
      const text = dec.decode(elf);
      expect(text).toContain('libwebkit2gtk-4.1.so.0');
      expect(text).not.toContain('libgtk-3.so'); // loaded through WebKitGTK at run time, not linked
    }
  });
});

describe('tar', () => {
  it('reads back what it writes, modes and long names too', async () => {
    const long = `${'folder/'.repeat(20)}file.txt`;
    const tar = createTar(
      [
        { path: 'a/', mode: 0o755 },
        { path: 'a/run', data: enc.encode('#!/bin/sh\n'), mode: 0o755 },
        { path: long, data: new Uint8Array(1000) },
      ],
      new Date(0),
    );
    expect(tar.length % 512).toBe(0);
    const entries = await readTar(tar);
    expect(entries.map((e) => [e.path, e.mode, e.data.length])).toEqual([
      ['a/', 0o755, 0],
      ['a/run', 0o755, 10],
      [long, 0o644, 1000],
    ]);
  });
});

describe('linuxApp', () => {
  it('names and quotes', () => {
    expect(folderName('A/B: C')).toBe('A-B: C');
    expect(folderName(' .hidden')).toBe('hidden');
    expect(linuxId('Teddy Test')).toBe('teddy-test');
    expect(execFileSync('sh', ['-c', `printf %s ${shQuote(options.title)}`]).toString()).toBe(options.title);
  });

  it('makes a .tar.gz of the game folder, programs and scripts executable', async () => {
    const entries = await readTar(await linuxTarGz(options, new Date(Date.UTC(2026, 0, 1))));
    const byName = Object.fromEntries(entries.map((e) => [e.path.replace(/^[^/]+\//, ''), e]));
    expect(entries[0].path).toBe(`${folderName(options.title)}/`);
    for (const f of ['play.sh', 'install.sh', 'uninstall.sh', 'GameMakerPlayer-x86_64', 'GameMakerPlayer-aarch64']) expect(byName[f].mode).toBe(0o755);
    expect(dec.decode(byName['game.html'].data)).toBe(html);
    expect([...byName['icon.png'].data.subarray(1, 4)]).toEqual([0x50, 0x4e, 0x47]);
    expect(byName['GameMakerPlayer-x86_64'].data).toEqual(players.x86_64);
    expect(dec.decode(byName['README.txt'].data)).toContain('libwebkit2gtk-4.1-0');
  });

  it('writes scripts the shell accepts, which install, fall back to the browser, and uninstall', async () => {
    const root = mkdtempSync(join(tmpdir(), 'gm-linux-'));
    try {
      const { files } = await linuxAppFiles(options);
      for (const f of files) {
        const p = join(root, 'dl', f.path);
        if (f.path.endsWith('/')) mkdirSync(p, { recursive: true });
        else {
          mkdirSync(dirname(p), { recursive: true });
          writeFileSync(p, f.data!, { mode: f.mode });
        }
      }
      const folder = join(root, 'dl', folderName(options.title));
      for (const s of ['play.sh', 'install.sh', 'uninstall.sh']) execFileSync('sh', ['-n', join(folder, s)]);
      const env = { ...process.env, HOME: join(root, 'home'), XDG_DATA_HOME: join(root, 'share'), XDG_CACHE_HOME: join(root, 'cache') };
      execFileSync(join(folder, 'install.sh'), { env });
      const desktop = readFileSync(join(root, 'share/applications/gamemaker-teddy-test.desktop'), 'utf8');
      expect(desktop).toContain(`Name=${options.title}\n`);
      expect(desktop).toContain(`Exec="${join(root, 'share/GameMaker/teddy-test/app/play.sh')}"`);
      // a computer the player cannot run on (or without WebKitGTK) opens the page in the browser
      const stub = join(root, 'bin');
      mkdirSync(stub);
      writeFileSync(join(stub, 'xdg-open'), '#!/bin/sh\necho "opened $1"\n', { mode: 0o755 });
      writeFileSync(join(stub, 'uname'), '#!/bin/sh\necho riscv64\n', { mode: 0o755 });
      const out = execFileSync(join(root, 'share/GameMaker/teddy-test/app/play.sh'), {
        env: { ...env, PATH: `${stub}:/usr/bin:/bin` },
        stdio: 'pipe',
      }).toString();
      expect(out).toBe(`opened ${join(root, 'share/GameMaker/teddy-test/app/game.html')}\n`);
      execFileSync(join(root, 'share/GameMaker/teddy-test/app/uninstall.sh'), ['--all'], { env });
      expect(existsSync(join(root, 'share/applications/gamemaker-teddy-test.desktop'))).toBe(false);
      expect(existsSync(join(root, 'share/GameMaker/teddy-test'))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('play.sh runs the player with the title and id', () => {
    expect(playScript({ title: 'My Game', id: 'my-game' })).toContain(`"$player" --title "$title" --id "$id" --icon "$here/icon.png" "$here/game.html"`);
  });
});
