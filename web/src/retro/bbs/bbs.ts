// TERMINAL.EXE: a dialing directory of (recreated) Pittsburgh BBSes, and the call itself (dial,
// connect, hang up, NO CARRIER). THE -= S A N D B O X =- BBS, a Renegade board, has the CD's
// shareware games to read about and "download" into C:\DOWNLOAD (sandbox.ts); The Sofa is a
// multi-line Major BBS for hanging out (sofa.ts); and Mrs. Novak next door has a TTY, which
// takes the modem's TDD mode (tdd.ts).
import type { RetroHost } from '../host';
import { attr } from '../text/textScreen';
import { SANDBOX_ANSI } from './ansiArt';
import { NoCarrier, Term, boxBottom, boxRow, boxRule, boxTop, dial, modemSignal, sleep, statusLine } from './term';
import { runSofa, sofaBusy } from './sofa';
import { SOFA_PHONE } from './sofaPhone';
import { unlockAchievement } from '../../achievements';
import { statusBps } from './lineSpeed';
import { bbsInTdd, tddMode, toggleTddMode, ttyCall, ttyInfoPage } from './tdd';
import { TTY_PHONE } from './ttyTalk';
import { sandboxCall } from './ticTacToeDoor';
import { PHONE, runSandbox, takeOverheard, wrap } from './sandbox';

// ---- the dialing directory -----------------------------------------------------------

const DIRECTORY = [
  {
    // the board's name in its colors, without the BBS (every entry here is one)
    id: 'SANDBOX',
    name: `|07THE ${SANDBOX_ANSI}`,
    number: PHONE,
    software: 'Renegade',
    run: runSandbox,
    busy: () => false,
  },
  {
    id: 'SOFA',
    name: '|15The Sofa',
    number: SOFA_PHONE,
    software: 'Major BBS, 8 lines',
    run: runSofa,
    busy: sofaBusy,
  },
  {
    // a TTY, not a BBS: Baudot needs TDD mode (tdd.ts)
    id: 'NOVAK',
    name: '|15Mrs. Novak next door',
    number: TTY_PHONE,
    software: 'TTY (Baudot)',
    tty: true,
  },
];

/** Text without its |NN color codes. */
const visible = (s: string) => s.replace(/\|\d\d/g, '');

/** TERMINAL, or TERMINAL SANDBOX / TERMINAL SOFA (or an entry's number) to dial that board at once. */
export async function runTerminal(h: RetroHost, args: string[] = []): Promise<void> {
  const t = new Term(h);
  const want = (args[0] ?? '').toUpperCase();
  const at = DIRECTORY.findIndex((d, i) => d.id === want || String(i + 1) === want);
  try {
    await terminal(t, h, at >= 0 ? String(at + 1) : undefined);
  } finally {
    t.close(); // stopped mid-call: nothing more arrives
  }
}

async function terminal(t: Term, h: RetroHost, dialFirst?: string): Promise<void> {
  const s = h.screen;
  let preset = dialFirst;
  for (;;) {
    s.resetPalette();
    s.clear(attr(7, 0));
    s.cursorVisible = true;
    t.status(statusLine('Offline'));
    t.line(boxTop('TERMINAL 2.1 Dialing Directory', '03', '15'));
    t.line(boxRow('|11 #  Name                         Number          Baud   Software', '03'));
    t.line(boxRule('03'));
    DIRECTORY.forEach((d, i) =>
      t.line(
        boxRow(
          `|14 ${i + 1}  ${d.name}${' '.repeat(Math.max(0, 28 - visible(d.name).length))} |07${d.number.padEnd(15)} |10${('tty' in d ? '45.45' : statusBps()).padEnd(6)} |07${d.software}`,
          '03',
        ),
      ),
    );
    t.line(boxBottom('03'));
    t.line();
    t.line(`|11Modem mode: |15${tddMode() ? 'TDD |07(TTY calls: Baudot, 45.45 baud)' : 'DATA |07(BBS calls)'}`);
    t.print('|11Dial which entry? |07(|151|07-|15' + DIRECTORY.length + '|07, |15M|07 mode, |15I|07 TTY info, |15Esc|07 to quit) |15');
    const k = preset ?? (await t.key());
    preset = undefined;
    t.line(k.length === 1 ? k : '');
    const entry = DIRECTORY[Number(k) - 1];
    if (k === 'Escape' || k === 'Q') {
      modemSignal('off');
      s.clear();
      return;
    }
    if (k === 'M') toggleTddMode();
    if (k === 'I') await ttyInfoPage(t, h);
    if (!entry) continue;
    if ('tty' in entry || tddMode()) {
      // a TTY on the line (or TDD mode calling a BBS, which answers in a modem's tones)
      if ('tty' in entry) await ttyCall(t, h, entry.number);
      else await bbsInTdd(t, h, entry.number);
      continue;
    }
    s.clear(attr(7, 0));
    const result = await dial(t, h, entry.number, entry.busy());
    if (result !== 'connect') {
      if (result === 'busy' && entry.run === runSofa) unlockAchievement('sofa-busy');
      t.line(result === 'busy' ? '|07All lines are busy. Try again in a little while.' : '|07Someone is on the phone. Hang it up and try again.');
      t.status(statusLine('Offline'));
      t.print('|07Press a key… ');
      await t.key();
      continue;
    }
    t.status(statusLine('Online'));
    await sleep(700);
    t.connected = true;
    if (entry.run === runSofa) unlockAchievement('desk-bbs');
    // the Sandbox's one line: its door game's other player calls in only while you're off it
    const leave = entry.run === runSandbox ? sandboxCall() : undefined;
    try {
      await entry.run(t, h);
    } catch (e) {
      // someone picked up the phone: the board stopped mid-call
      if (!(e instanceof NoCarrier)) throw e;
      await t.dropped();
    } finally {
      leave?.();
    }
    await t.hangUp();
    t.line();
    t.line('|12NO CARRIER');
    modemSignal('hangup');
    t.status(statusLine('Offline'));
    const heard = takeOverheard();
    if (heard) {
      // the upload died with the call; say who did it
      t.line();
      for (const l of wrap(`(${heard.who}, on the kitchen extension: "${heard.words}")`, 78)) t.line(`|07${l}`);
      t.line();
      t.line('|07The upload never finished, so the board never got it.');
      t.print('|07Press a key… ');
      await t.key();
    }
    await sleep(1200);
  }
}
