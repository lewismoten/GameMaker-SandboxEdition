// TERMINAL.EXE: a dialing directory of (recreated) Pittsburgh BBSes. THE -= S A N D B O X =-
// BBS, a Renegade board, has the CD's shareware games to read about and "download" into
// C:\DOWNLOAD; The Sofa is a multi-line Major BBS for hanging out (retro/bbs/sofa.ts).
import type { RetroHost } from "../host";
import { attr, COLS, ROWS } from "../text/textScreen";
import { readLine } from "../text/textInput";
import { toCp437 } from "../text/cp437";
import { commas } from "../dos/vfs";
import type { CatalogEntry } from "../../project/files";
import { sandboxLogin, sandBanner, SANDBOX_ANSI } from "./ansiArt";
import {
  NoCarrier,
  Term,
  boxBottom,
  boxRow,
  boxRule,
  boxTop,
  dial,
  modemSignal,
  sleep,
  statusLine,
} from "./term";
import { runSofa, SOFA_PHONE, sofaBusy } from "./sofa";
import { output } from "../../audio/output";

const BBS_NAME = "THE -= S A N D B O X =- BBS";
const PHONE = "1-412-555-SAND";
const CPS = 1650; // 14,400 bps with V.42bis, in characters per second
const TIME_COMPRESSION = 25; // nobody wants to wait ten minutes

// ---- the dialing directory -----------------------------------------------------------

const DIRECTORY = [
  {
    name: BBS_NAME,
    number: PHONE,
    software: "Renegade",
    run: runSandbox,
    busy: () => false,
  },
  {
    name: "The Sofa",
    number: SOFA_PHONE,
    software: "Major BBS, 8 lines",
    run: runSofa,
    busy: sofaBusy,
  },
];

export async function runTerminal(h: RetroHost): Promise<void> {
  const t = new Term(h);
  const s = h.screen;
  for (;;) {
    s.resetPalette();
    s.clear(attr(7, 0));
    s.cursorVisible = true;
    t.status(statusLine("Offline"));
    t.line(boxTop("TERMINAL 2.1 Dialing Directory", "03", "15"));
    t.line(
      boxRow(
        "|11 #  Name                         Number          Baud   Software",
        "03",
      ),
    );
    t.line(boxRule("03"));
    DIRECTORY.forEach((d, i) =>
      t.line(
        boxRow(
          `|14 ${i + 1}  |15${d.name.padEnd(28)} |07${d.number.padEnd(15)} |1014400  |07${d.software}`,
          "03",
        ),
      ),
    );
    t.line(boxBottom("03"));
    t.line();
    t.print(
      "|11Dial which entry? |07(|151|07-|15" +
        DIRECTORY.length +
        "|07, |15Esc|07 to quit) |15",
    );
    const k = await t.key();
    t.line(k.length === 1 ? k : "");
    const entry = DIRECTORY[Number(k) - 1];
    if (k === "Escape" || k === "Q") {
      modemSignal("off");
      s.clear();
      return;
    }
    if (!entry) continue;
    s.clear(attr(7, 0));
    const result = await dial(t, h, entry.number, entry.busy());
    if (result !== "connect") {
      t.line(
        result === "busy"
          ? "|07All lines are busy. Try again in a little while."
          : "|07Someone is on the phone. Hang it up and try again.",
      );
      t.status(statusLine("Offline"));
      t.print("|07Press a key… ");
      await t.key();
      continue;
    }
    t.status(statusLine("Online"));
    await sleep(700);
    t.connected = true;
    try {
      await entry.run(t, h);
    } catch (e) {
      // someone picked up the phone: the board stopped mid-call
      if (!(e instanceof NoCarrier)) throw e;
      await t.dropped();
    }
    t.connected = false;
    t.line();
    t.line("|12NO CARRIER");
    modemSignal("hangup");
    t.status(statusLine("Offline"));
    await sleep(1200);
  }
}

// ---- THE -= S A N D B O X =- BBS ----------------------------------------------------------

async function runSandbox(t: Term, h: RetroHost): Promise<void> {
  const s = h.screen;
  const online = performance.now();
  const minutesLeft = () =>
    Math.max(1, 60 - Math.floor((performance.now() - online) / 60000));

  // The logon screen.
  s.cursorX = 0;
  s.cursorY = sandboxLogin(s);
  t.print("|14Enter your handle, or |15GUEST|14: |15");
  const name =
    ((await readLine(s, h.keys, [], 24, attr(15, 0))) ?? "")
      .trim()
      .toUpperCase() || "GUEST";
  t.line();
  if (name !== "GUEST") {
    t.print("|14Password: |15");
    await readLine(s, h.keys, [], 16, attr(0, 0)); // typed in black: nobody sees it
    t.line();
  }
  await lastCallers(t, name);

  const catalog = (await h.catalog()).filter(
    (g) => g.kind === "shareware" && g.gam,
  );
  let show = true;
  for (;;) {
    if (show) mainMenu(t, s);
    show = false;
    t.print(
      `|06[|14Sandbox|06] |07Time left: |14${minutesLeft()}|07 min |06: |15`,
    );
    const k = await t.key();
    t.line(k.length === 1 ? k : "");
    if (k === "F" || k === "N") {
      // N: a new files scan, just the newest uploads (the Sandbox Software games)
      await files(
        t,
        h,
        k === "N" ? catalog.filter((g) => g.original) : catalog,
        k === "N" ? "New Files Scan" : "The Sand Pile: Game-Maker Shareware",
      );
      show = true;
    } else if (k === "B") {
      await bulletins(t, catalog);
      show = true;
    } else if (k === "S") await systemInfo(t, catalog.length);
    else if (k === "Y") yourStats(t, name, h, minutesLeft());
    else if (k === "C") await pageSysop(t, h);
    else if (k === "?" || k === "Enter") show = true;
    else if (k === "G" || k === "Escape") {
      t.print("|14Leave the sandbox? |15[Y/n] ");
      const yes = (await t.key()) !== "N";
      t.line();
      if (!yes) continue;
      t.line();
      t.line(`|07Thanks for playing in THE ${SANDBOX_ANSI} |07BBS!`);
      t.line(
        "|07Shake the sand out of your shoes, and register the shareware you enjoy.",
      );
      await sleep(1200);
      return;
    } else t.line("|12Unknown command. |07Press |15?|07 for the menu.");
  }
}

function zipName(g: CatalogEntry): string {
  return `${(g.exe ?? g.id)
    .replace(/\.EXE$/i, "")
    .slice(0, 8)
    .toUpperCase()}.ZIP`;
}

function zipSize(g: CatalogEntry): number {
  return Math.round((g.bytes ?? 0) * 0.58);
}

function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if ((line + " " + word).trim().length > width) {
      out.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) out.push(line);
  return out;
}

/** Renegade-style: the last few callers after logon. */
async function lastCallers(t: Term, name: string): Promise<void> {
  const s = t.screenRef;
  s.fill(0, 0, COLS - 1, ROWS - 2, attr(7, 0));
  s.cursorX = 0;
  s.cursorY = 0;
  t.line(
    `|07Logon #|141,994|07 · Welcome${name === "GUEST" ? "" : " back"}, |15${name}|07!`,
  );
  t.line();
  t.line(boxTop("Last Few Callers"));
  t.line(
    boxRow(
      " |11Caller  Handle               Location              Baud   Time  Did",
    ),
  );
  t.line(boxRule());
  const callers: [string, string, string, string, string][] = [
    ["1,989", "PIXEL WIZARD", "Monroeville, PA", "9600", "D"],
    ["1,990", "MONSTER MASH", "Bethel Park, PA", "14400", "U"],
    ["1,991", "SCROLLMASTER", "Penn Hills, PA", "2400", "-"],
    ["1,992", "THE BLOCKSMITH", "Mt. Lebanon, PA", "14400", "D"],
    ["1,993", "SAND CASTLE", "Squirrel Hill, PA", "9600", "DU"],
  ];
  callers.forEach(([n, who, where, baud, did], i) =>
    t.line(
      boxRow(
        ` |14${n.padStart(6)}  |15${who.padEnd(20)} |07${where.padEnd(20)} |10${baud.padStart(5)}  |07${String(19 + i).padStart(2)}:${String((i * 17) % 60).padStart(2, "0")}  |13${did}`,
      ),
    ),
  );
  t.line(boxBottom());
  t.line("|08   D = downloaded   U = uploaded");
  t.line();
  t.print("|07Press |15[Enter]|07 to continue");
  await t.key();
}

function mainMenu(t: Term, s: RetroHost["screen"]): void {
  s.fill(0, 0, COLS - 1, ROWS - 2, attr(7, 0));
  s.cursorX = 0;
  s.cursorY = 0;
  sandBanner(s, BBS_NAME);
  s.cursorY = 1;
  t.line(boxTop("Main Menu"));
  const item = (key: string, label: string) =>
    `|06[|14${key}|06] |07${label.padEnd(30)}`;
  const rows: [string, string, string, string][] = [
    ["F", "File Areas (the sand pile)", "B", "Bulletins"],
    ["N", "New Files Scan", "S", "System Information"],
    ["Y", "Your Statistics", "C", "Page the SysOp"],
    ["?", "Redisplay this menu", "G", "Goodbye (log off)"],
  ];
  t.line(boxRow(""));
  for (const [a, la, b, lb] of rows)
    t.line(boxRow(`    ${item(a, la)}${item(b, lb)}`));
  t.line(boxRow(""));
  t.line(boxBottom());
  t.line();
}

async function systemInfo(t: Term, files: number): Promise<void> {
  t.line();
  for (const l of [
    `|15THE ${SANDBOX_ANSI} |15BBS |08─ |07Pittsburgh, PA |08─ |07Renegade`,
    `|07Nodes: |142|07   Modem: |1414,400 bps V.32bis|07   Files online: |14${files}`,
    "|07Callers: |141,994|07   SysOp: |14Lewis",
    "|07Specialty: shareware made with |15Game-Maker|07 and tips for designers.",
  ])
    t.line(l);
  t.line();
}

function yourStats(t: Term, name: string, h: RetroHost, left: number): void {
  t.line();
  t.line(
    `|07Handle: |15${name}|07   Security level: |14${name === "GUEST" ? 10 : 20}|07   Time left today: |14${left}|07 min`,
  );
  t.line(
    `|07Files downloaded: |14${h.downloads.list().length}|07   Uploads: |140|07   Ratio: |14no limit`,
  );
  t.line();
}

async function pageSysop(t: Term, h: RetroHost): Promise<void> {
  t.print("|07Paging the SysOp");
  const ctx = h.audio();
  for (let i = 0; i < 5; i++) {
    if (ctx) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = 0.05;
      o.type = "square";
      o.frequency.value = i % 2 ? 1200 : 900;
      o.connect(g).connect(output(ctx));
      o.start();
      o.stop(ctx.currentTime + 0.15);
    }
    t.print(".");
    await sleep(500);
  }
  t.line();
  t.line(
    "|12The SysOp is not available. |07Leave a message in the Bulletins next time!",
  );
  t.line();
}

/** The bulletins: news from the SysOp, picked by number. */
async function bulletins(t: Term, catalog: CatalogEntry[]): Promise<void> {
  const newest = catalog.filter((g) => g.original);
  const items: [string, string[]][] = [
    [
      "New in the sand pile",
      [
        "|07Fresh uploads from |15Sandbox Software|07, made with Game-Maker:",
        ...newest.map(
          (g) =>
            `|14  ${g.title.padEnd(34)}|07${g.price ? `Reg. ${g.price}` : "Shareware"}`,
        ),
        "|07Press |15N|07 at the main menu to scan just the new files.",
      ],
    ],
    [
      "About shareware",
      [
        "|07Shareware is try-before-you-buy. Play these games for free; if you",
        "|07enjoy one, send the author the registration fee listed in its",
        "|07readme. Many authors send a full version with more levels.",
      ],
    ],
    [
      "Game-Maker is open source",
      [
        "|07A note the SysOp found tucked in the future: Game-Maker's source",
        "|07code was released under the |15MIT License|07, so anyone may use, copy,",
        "|07change and share it. This board runs on a fork of it that works in",
        "|07a web browser and still saves games DOS Game-Maker can load.",
        "|07Source: |11https://github.com/lewismoten/GameMaker-SandboxEdition",
      ],
    ],
    [
      "Made with Game-Maker",
      [
        "|07Every game in the sand pile was built with Game-Maker by",
        "|07Recreational Software Designs. No programming needed!",
      ],
    ],
    [
      "Other boards in the 412",
      [
        "|07Feel like kicking back? Call |13The Sofa|07, a multi-line Major BBS",
        "|07with teleconference. It is in TERMINAL's dialing directory.",
        "|07Its lines are often busy; keep trying!",
      ],
    ],
  ];
  for (;;) {
    t.line();
    t.line(boxTop("Bulletins"));
    items.forEach(([title], i) =>
      t.line(boxRow(`  |14${i + 1}|06) |07${title}`)),
    );
    t.line(boxBottom());
    t.print(
      `|14Read which bulletin? |07(|151|07-|15${items.length}|07, |15Q|07 to quit) |15`,
    );
    const k = await t.key();
    t.line(k.length === 1 ? k : "");
    const item = items[Number(k) - 1];
    if (!item) return;
    t.line();
    t.line(`|14Bulletin #${k}: |15${item[0]}`);
    for (const l of item[1]) t.line(l);
  }
}

async function files(
  t: Term,
  h: RetroHost,
  catalog: CatalogEntry[],
  title: string,
): Promise<void> {
  const s = h.screen;
  s.fill(0, 0, COLS - 1, ROWS - 2, attr(7, 0));
  s.cursorX = 0;
  s.cursorY = 0;
  t.line(boxTop(title));
  t.line(boxRow("|11  #  File name        Size  Description"));
  t.line(boxBottom());
  let lines = 4;
  for (const [i, g] of catalog.entries()) {
    const got = h.downloads.has(g.id) ? "|10*" : " ";
    const by = g.author ?? g.company;
    const desc = wrap(
      `${g.title}${by ? ` by ${by}` : ""}${g.year ? ` (${g.year})` : ""}. ${g.price ? `${g.price === "Freeware" ? "Freeware" : `Reg. ${g.price}`}. ` : ""}${g.blurb ?? ""}`,
      52,
    );
    t.line(
      `|11${String(i + 1).padStart(2)} ${got}|15${zipName(g).padEnd(12)}|14${commas(zipSize(g)).padStart(8)} |07${desc[0] ?? ""}`,
    );
    if (desc[1]) t.line(`${" ".repeat(25)}|07${desc[1]}`);
    lines += desc[1] ? 2 : 1;
    if (lines > 18 && i < catalog.length - 1) {
      if (!(await t.more())) break;
      lines = 0;
    }
  }
  t.line("|10*|07 = already downloaded to C:\\DOWNLOAD");
  for (;;) {
    t.print("|11File # to read about, D# to download, Q to quit: |15");
    const answer = (
      (await readLine(h.screen, h.keys, [], 6, attr(15, 0))) ?? "Q"
    )
      .trim()
      .toUpperCase();
    t.line();
    if (!answer || answer === "Q") return;
    const dl = answer.startsWith("D");
    const n = Number(answer.replace(/^D/, ""));
    const g = catalog[n - 1];
    if (!g) {
      t.line("|12No such file.");
      continue;
    }
    if (dl) await download(t, h, g);
    else await readAbout(t, g);
  }
}

async function readAbout(t: Term, g: CatalogEntry): Promise<void> {
  t.line(`|14${zipName(g)} |15${g.title}`);
  for (const l of wrap(g.blurb ?? "", 76)) t.line(`|07${l}`);
  t.line();
  t.line("|11Author’s notice (from the archive’s readme):");
  let n = 0;
  for (const l of (g.notice ?? "This game is shareware.").split("\n")) {
    t.line(`|07${l.slice(0, 79)}`);
    if (++n % 18 === 0 && !(await t.more())) break;
  }
  t.line();
}

async function download(t: Term, h: RetroHost, g: CatalogEntry): Promise<void> {
  const size = zipSize(g);
  const seconds = size / CPS;
  t.line(
    `|07Protocol: |15Zmodem|07.  ${zipName(g)} is |14${commas(size)}|07 bytes, about |14${Math.ceil(seconds / 60)}|07 minute(s) at 14,400 bps.`,
  );
  t.line("|07Starting transfer... (Esc to abort)");
  const s = h.screen;
  const row = s.cursorY;
  const start = performance.now();
  const total = (seconds * 1000) / TIME_COMPRESSION;
  for (;;) {
    const k = h.keys.poll();
    if (k?.key === "Escape") {
      t.line();
      t.line("|12Transfer aborted.");
      return;
    }
    const f = Math.min(1, (performance.now() - start) / total);
    const bar = "█".repeat(Math.round(f * 30)).padEnd(30, "░");
    s.cursorY = row;
    s.cursorX = 0;
    t.print(
      `|15${zipName(g).padEnd(12)} |10${toCp437(bar)} |14${commas(Math.round(size * f)).padStart(9)} |07bytes  ${CPS} cps`,
    );
    if (f >= 1) break;
    await sleep(120);
  }
  t.line();
  t.line("|10Transfer complete.");
  await unzip(t, h, g);
  h.downloads.add(g.id);
  t.line(
    `|07Type |15CD \\DOWNLOAD\\${g.id.toUpperCase()}|07 then |15${(g.exe ?? "").replace(/\.EXE$/i, "")}|07 after you log off to play.`,
  );
  t.line();
}

/** Bytes per second PKUNZIP inflates and writes to the hard disk. */
const UNZIP_RATE = { turbo: 420_000, slow: 32_000 };

/** PKUNZIP into C:\DOWNLOAD: each file takes as long as its size needs on this PC. */
async function unzip(t: Term, h: RetroHost, g: CatalogEntry): Promise<void> {
  const s = h.screen;
  const rate = h.turbo() ? UNZIP_RATE.turbo : UNZIP_RATE.slow;
  t.line(
    `|07C:\\>PKUNZIP -d ${zipName(g)} C:\\DOWNLOAD\\${g.id.toUpperCase()}`,
  );
  t.line(`|07Searching ZIP: ${zipName(g)}`);
  const files: [string, number][] = [
    ...(g.exe ? [[g.exe, 60_000] as [string, number]] : []),
    ...g.files.map((f, i): [string, number] => [
      f.toUpperCase(),
      g.sizes?.[i] ?? Math.round((g.bytes ?? 0) / g.files.length),
    ]),
  ];
  for (const [name, size] of files) {
    t.print(`|07  Inflating: ${name.padEnd(13)}`);
    const x = s.cursorX;
    const ms = (size / rate) * 1000;
    const start = performance.now();
    for (let f = 0; f < 1;) {
      f = ms ? Math.min(1, (performance.now() - start) / ms) : 1;
      s.write(x, s.cursorY, attr(7, 0), `${Math.round(f * 100)}%`.padStart(4));
      if (f < 1) await sleep(Math.min(100, ms / 4));
    }
    s.write(x, s.cursorY, attr(7, 0), "    ");
    t.line();
  }
}
