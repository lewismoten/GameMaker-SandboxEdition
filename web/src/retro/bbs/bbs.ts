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
import { gifGallery } from "./gifArea";
import { gameDiz, isSofaFile } from "./fileId";
import { WAREZ, warezArea, zipsOf } from "./warezArea";
import { Pager, pageLabel } from "./pager";
import { GALLERY } from "./gallery";
import {
  account,
  filePoints,
  kb,
  mayDownload,
  newAccount,
  NEW_USER_FILES,
  POINTS_PER_CALL,
  RATIO,
  ratioText,
  recordDownload,
  updateAccount,
  type BbsAccount,
} from "./ratio";
import { pickUpExtension, type Overheard } from "./pickup";
import { resolvePath, type DosNode } from "../dos/vfs";
import { pcExtras } from "../hacks/pcExtras";
import { output } from "../../audio/output";

const BBS_NAME = "THE -= S A N D B O X =- BBS";
const PHONE = "1-412-555-SAND";
const CPS = 1650; // 14,400 bps with V.42bis, in characters per second
const TIME_COMPRESSION = 25; // nobody wants to wait ten minutes

// ---- the dialing directory -----------------------------------------------------------

const DIRECTORY = [
  {
    // the board's name in its colors, without the BBS (every entry here is one)
    name: `|07THE ${SANDBOX_ANSI}`,
    number: PHONE,
    software: "Renegade",
    run: runSandbox,
    busy: () => false,
  },
  {
    name: "|15The Sofa",
    number: SOFA_PHONE,
    software: "Major BBS, 8 lines",
    run: runSofa,
    busy: sofaBusy,
  },
];

/** Text without its |NN color codes. */
const visible = (s: string) => s.replace(/\|\d\d/g, "");

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
          `|14 ${i + 1}  ${d.name}${" ".repeat(Math.max(0, 28 - visible(d.name).length))} |07${d.number.padEnd(15)} |1014400  |07${d.software}`,
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
    const heard = overheard;
    overheard = undefined;
    if (heard) {
      // the upload died with the call; say who did it
      t.line();
      for (const l of wrap(`(${heard.who}, on the kitchen extension: "${heard.words}")`, 78))
        t.line(`|07${l}`);
      t.line();
      t.line("|07The upload never finished, so the board never got it.");
      t.print("|07Press a key… ");
      await t.key();
    }
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
  const catalog = (await h.catalog()).filter(
    (g) => g.kind === "shareware" && g.gam && !isSofaFile(g), // The Sofa's own uploads are only there
  );
  // the board's user file: started from what this PC already downloaded
  account(() => seedAccount(h, catalog));
  updateAccount((a) => ({ ...a, calls: a.calls + 1 }));
  await lastCallers(t, name);

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
    } else if (k === "P") {
      await gifGallery(t, h);
      show = true;
    } else if (k === "W") {
      // the Warez area: not on the menu, elite users only (bulletin 7)
      await warezArea(t, h);
      show = true;
    } else if (k === "U")
      t.line(
        "|08Utilities? Never heard of them. |07(Word is, elite callers press a different letter.)",
      ); else if (k === "B") {
      await bulletins(t, catalog);
      show = true;
    } else if (k === "S") await systemInfo(t, catalog.length);
    else if (k === "Y") yourStats(t, name, minutesLeft());
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

/** What happened on a call that dropped mid-upload, for after NO CARRIER. */
let overheard: Overheard | undefined;

/** The SysOp's own uploads (his Sandbox Software games) are FREE: the ratio skips them. */
const isFree = (g: CatalogEntry) => !!g.original;

/** A record for a caller this board hasn't seen, counting what is on C: already. */
function seedAccount(h: RetroHost, catalog: CatalogEntry[]): BbsAccount {
  let a = newAccount();
  for (const id of h.downloads.list()) {
    const g = catalog.find((c) => c.id === id);
    const u = WAREZ.find((x) => x.id === id);
    const p = GALLERY.find((x) => x.name === id);
    if (g) a = recordDownload(a, zipSize(g), isFree(g));
    else if (u)
      for (const _zip of zipsOf(u)) a = recordDownload(a, u.bytes / zipsOf(u).length, true);
    else if (p) a = recordDownload(a, p.bytes, true);
  }
  return a;
}

/** The board's warning to leeches, with where the caller stands. */
function leechWarning(t: Term): void {
  const a = account();
  t.line(
    `|12  ** LEECHES WILL BE DELETED! **  |07This board keeps a |141:${RATIO}|07 upload/download ratio.`,
  );
  t.line(
    `|07  New callers get |14${NEW_USER_FILES}|07 files on the house; each call earns |14${POINTS_PER_CALL}|07 more, each upload |14${RATIO}|07.`,
  );
  t.line(
    `|07  The SysOp's own files are |10FREE|07.   Your file points: |14${filePoints(a)}|07   U/D: |14${ratioText(a)}`,
  );
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
  leechWarning(t);
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
    ["P", "Picture Gallery (GIF files)", "?", "Redisplay this menu"],
    ["", "", "G", "Goodbye (log off)"],
  ];
  t.line(boxRow(""));
  for (const [a, la, b, lb] of rows)
    t.line(boxRow(`    ${a ? item(a, la) : " ".repeat(34)}${item(b, lb)}`));
  t.line(boxRow("|08    There is no W)arez area on this board. Move along."));
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

function yourStats(t: Term, name: string, left: number): void {
  const a = account();
  const points = filePoints(a);
  const row = (l: string) => t.line(boxRow(`  ${l}`));
  t.line();
  t.line(boxTop("Your Statistics"));
  row(
    `|07Handle: |15${name.padEnd(24)}|07Security level: |14${name === "GUEST" ? 10 : 20}|07   Calls: |14${a.calls}`,
  );
  row(`|07Time left today: |14${left}|07 min`);
  t.line(boxRule());
  row(
    `|07Uploads:   |14${String(a.ulFiles).padStart(4)}|07 files |14${kb(a.ulBytes).padStart(9)}${a.ulTries ? `   |08(${a.ulTries} cut off by the phone)` : ""}`,
  );
  row(
    `|07Downloads: |14${String(a.dlFiles).padStart(4)}|07 files |14${kb(a.dlBytes).padStart(9)}   |08(${Math.max(0, a.dlFiles - a.counted)} of them |10FREE|08)`,
  );
  row(
    `|07U/D ratio: |14${ratioText(a).padEnd(10)}|07Board ratio: |141:${RATIO}|07   File points: |${points ? "14" : "12"}${points}`,
  );
  t.line(boxBottom());
  if (points <= 2) {
    t.line(
      `|12${points ? "Running low on file points!" : "Your U/D ratio is too low!"} |07Upload something, or call again tomorrow.`,
    );
    t.line("|10FREE|07 files (the SysOp's own) always download.");
  }
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
      "Upload/download ratio (read this, leeches!)",
      [
        `|07This board runs a |141:${RATIO}|07 ratio: upload one file, download ${RATIO}.`,
        `|07New callers get |14${NEW_USER_FILES}|07 files on the house, and every call earns |14${POINTS_PER_CALL}|07 more.`,
        "|07Files the SysOp uploaded (Sandbox Software, the GIF Gallery) are",
        "|10FREE|07 and never count. Check |15Y|07 at the main menu for your stats.",
        "|12Callers who only take and never give will be DELETED.",
        "|08Please tell your family before you upload. The SysOp's mom picks up too.",
      ],
    ],
    [
      "About shareware",
      [
        "|07Shareware is try-before-you-buy. Play these games for free; if you",
        "|07enjoy one, send the author the registration fee listed in its",
        "|07readme. Many authors send a full version with more levels.",
        "|07Game-Maker's license lets you give a game you made to ten people.",
        "|07To spread it wider as shareware, ask at least |14$5|07 to register and",
        "|07send Recreational Software Designs 10% of the fees every quarter.",
        "|07Selling games outright needs a royalty license from RSD.",
      ],
    ],
    [
      "Game-Maker is open source",
      [
        "|07A note the SysOp found tucked in the future: Game-Maker's source",
        "|07code was released under the |15MIT License|07 (2014), so anyone may use,",
        "|07copy, change, share and even sell it. No more ten-person limit, no",
        "|07$5 minimum, no 10% to RSD, no royalties: keep the license notice",
        "|07with the program and your games are yours. This board runs on a fork",
        "|07of it that works in a web browser and still saves games DOS",
        "|07Game-Maker can load. The Sandbox games' registration fees are part",
        "|07of the story: they are free.",
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
    [
      "Elite users (lamers keep out)",
      [
        "|07Some areas of this board are not on the menu. You know the one.",
        "|07Elite users press |15W|07 at the main menu. Access code: |15DUNE|07",
        "|07(after the group that couriers for us, DiGiTAL DUNE).",
        "|07Warez are |12not FREE|07: a file point a ZIP. Out of points? The SysOp",
        "|07might look the other way. Once. Maybe. Upload something, leech!",
        "|08If you are reading this, congratulations: you are now elite.",
        "|08Tell no one. Especially not the SysOp's mom.",
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
  const entries = () => catalog.map((g, i) => {
    const got = h.downloads.has(g.id) ? "|10*" : " ";
    // Renegade showed each archive's FILE_ID.DIZ (without its ruled lines, to save the scrolling)
    const desc = gameDiz(g).filter((l) => !/^-+$/.test(l));
    return desc.map((l, j) =>
      j === 0
        ? `|11${String(i + 1).padStart(2)} ${got}|15${zipName(g).padEnd(12)}|14${commas(zipSize(g)).padStart(8)} |07${l.padEnd(46)}${isFree(g) ? "|10FREE" : ""}`
        : `${" ".repeat(25)}|${j === desc.length - 1 ? "08" : "07"}${l}`,
    );
  });
  const pager = new Pager(t, {
    header: (p, n) => [
      boxTop(n > 1 ? `${title} (${pageLabel(p, n)})` : title),
      boxRow("|11  #  File name        Size  Description"),
      boxBottom(),
    ],
    entries,
    footer: () => [
      `|10*|07 = already downloaded to C:\\DOWNLOAD   |10FREE|07 = doesn't count against your ratio`,
      `|12LEECHES WILL BE DELETED! |07Ratio |141:${RATIO}|07. File points left: |14${filePoints(account())}|07   |15U|07 to upload.`,
    ],
  });
  pager.show();
  for (;;) {
    t.print(`|11File # to read about, D# to download, ${pager.keys()}|15U|07)pload, |15Q|07)uit: |15`);
    const answer = (
      (await readLine(h.screen, h.keys, [], 6, attr(15, 0))) ?? "Q"
    )
      .trim()
      .toUpperCase();
    t.line();
    if (pager.turn(answer)) continue;
    if (!answer || answer === "Q") return;
    if (answer === "U") {
      await upload(t, h);
      continue;
    }
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
  t.line("|11FILE_ID.DIZ:");
  for (const l of gameDiz(g)) t.line(`|07  ${l}`);
  t.line();
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
  if (!mayDownload(account(), isFree(g))) {
    t.line("|12Your U/D ratio is too low! Please upload something.");
    t.line(
      `|07Ratio |141:${RATIO}|07, U/D |14${ratioText(account())}|07. Each call earns |14${POINTS_PER_CALL}|07 file point; |10FREE|07 files always download.`,
    );
    t.line();
    return;
  }
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
  updateAccount((a) => recordDownload(a, size, isFree(g)));
  await unzip(t, h, g);
  h.downloads.add(g.id);
  if (pcExtras().cracked(g.id) !== undefined) pcExtras().setCracked(g.id, false); // a fresh copy, as its author made it
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
    ["FILE_ID.DIZ", 450],
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

// ---- uploads ----------------------------------------------------------------------------

/** Protocols for an upload: key, name, characters per second at 14,400 bps. */
const PROTOCOLS: [string, string, number][] = [
  ["Z", "Zmodem", 1650],
  ["Y", "Ymodem", 1580],
  ["X", "Xmodem", 1190],
];

/** The file to send, picked on C: in the terminal (a folder lists itself). */
async function pickFile(t: Term, h: RetroHost): Promise<{ name: string; size: number; path: string } | undefined> {
  let cwd: string[] = [];
  const listing = async (parts: string[]) => {
    const items = ((await h.fs.listDir("C", parts)) ?? []).filter((n) => n.name !== "." && n.name !== "..");
    const path = `C:\\${parts.join("\\")}`;
    t.line(`|11 Directory of ${path}`);
    const shown = items.slice(0, 15);
    for (let i = 0; i < shown.length; i += 2)
      t.line(
        shown
          .slice(i, i + 2)
          .map((n: DosNode) => `|${n.dir ? "14" : "15"}  ${(n.dir ? `[${n.name}]` : n.name).padEnd(15)}|07${(n.dir ? "<DIR>" : commas(n.size)).padStart(10)}`)
          .join("     "),
      );
    if (items.length > shown.length) t.line(`|08  …and ${items.length - shown.length} more`);
  };
  await listing(cwd);
  for (;;) {
    t.print(`|15TERMINAL|07 Send which file on C:? (a folder lists it; Enter cancels) |15`);
    const typed = ((await readLine(h.screen, h.keys, [], 40, attr(15, 0))) ?? "").trim().toUpperCase();
    t.line();
    if (!typed) return undefined;
    const at = resolvePath(typed, "C", () => cwd);
    const node = at.drive === "C" ? await h.fs.find("C", at.parts) : undefined;
    if (!node) {
      t.line("|12File not found.");
    } else if (node.dir) {
      cwd = at.parts;
      await listing(cwd);
    } else return { name: node.name, size: node.size, path: `C:\\${at.parts.join("\\")}` };
  }
}

/**
 * An upload: protocol, the file from C:, a line for the listing, and the transfer, which
 * never finishes. Partway through somebody picks up the kitchen extension, yells about
 * the noise, and the call drops (NO CARRIER).
 */
async function upload(t: Term, h: RetroHost): Promise<void> {
  const s = h.screen;
  t.line();
  t.line(boxTop("Upload to the Sand Pile"));
  t.line(boxRow(`  |07Every upload earns |14${RATIO}|07 file points. Thanks for giving back!`));
  t.line(boxRule());
  for (const [k, name, cps] of PROTOCOLS)
    t.line(boxRow(`  |06[|14${k}|06] |07${name.padEnd(8)} |08${cps} cps`));
  t.line(boxRow("  |06[|14Q|06] |07Quit"));
  t.line(boxBottom());
  t.print("|11Protocol: |15");
  const k = await t.key();
  t.line(k.length === 1 ? k : "");
  const protocol = PROTOCOLS.find(([key]) => key === k);
  if (!protocol) return;
  const [, proto, cps] = protocol;
  const file = await pickFile(t, h);
  if (!file) {
    t.line("|07Upload cancelled.");
    return;
  }
  t.print("|11Describe it in one line: |15");
  await readLine(s, h.keys, [], 45, attr(15, 0));
  t.line();
  t.line(
    `|07Begin your |15${proto}|07 upload of |15${file.name}|07 now (|14${commas(file.size)}|07 bytes). |08Ctrl-X aborts.`,
  );
  t.status(` TERMINAL 2.1 │ Sending ${file.path} by ${proto}`);
  modemSignal("send");
  const row = s.cursorY;
  const start = performance.now();
  // long enough to see it going, whatever the size
  const total = Math.max(9000, ((file.size / cps) * 1000) / TIME_COMPRESSION);
  const cutAt = 0.35 + Math.random() * 0.3;
  for (;;) {
    const key = h.keys.poll();
    if (key?.key === "Escape" || (key?.ctrl && key.key.toUpperCase() === "X")) {
      t.line();
      t.line("|12Upload aborted.");
      t.status(statusLine("Online"));
      return;
    }
    const f = Math.min(cutAt, (performance.now() - start) / total);
    const bar = "█".repeat(Math.round(f * 30)).padEnd(30, "░");
    s.cursorY = row;
    s.cursorX = 0;
    t.print(
      `|15${file.name.padEnd(12)} |10${toCp437(bar)} |14${commas(Math.round(file.size * f)).padStart(9)} |07bytes  ${cps} cps`,
    );
    modemSignal("send");
    if (f >= cutAt) break;
    await sleep(120);
  }
  // somebody in the house wants the phone
  updateAccount((a) => ({ ...a, ulTries: a.ulTries + 1 }));
  overheard = await pickUpExtension(h.audio());
  t.interrupt();
  t.line(); // the line is gone: NO CARRIER from here
}
