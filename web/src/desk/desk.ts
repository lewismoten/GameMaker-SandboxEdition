// The mid-90s desk: a PC running a DOS look-alike, a box of floppy disks, the
// Game-Maker CD and a paper shareware catalog.
import "./desk.css";
import "./deskStage.css";
import "./pc/crtOff.css";
import { h, clear, toast } from "../editor/core/ui";
import { Computer } from "../retro/computer";
import type { MonitorMode } from "../retro/computer/setup";
import { loadDisks, type Disk } from "../retro/dos/disks";
import {
  openDiskBox,
  floppyElement,
  diskFacts,
  type DiskAction,
} from "./disks/diskBox";
import { installCrtWarp } from "./pc/crtWarp";
import { sevenSegment, floppyDrive, cdDrive, openTray } from "./pc/caseParts";
import { keyboard } from "./pc/keyboard";
import { keyboardTray } from "./pc/tray";
import { speakers } from "./pc/speakers";
import { mug, wallPhone, deskLamp } from "./room/deskProps";
import { deskModem } from "./pc/modem";
import type { Shelf } from "./boxes/shelf";
import { onCatalogChanged } from "../project/catalogWatch";
import { snowyWindow } from "./room/snowWindow";
// the box on the desk wears gmBox.css's ribbon; the box's insides load when it is opened
import "./boxes/gmBox.css";
import { SANDBOX_SHOTS, sandboxShots } from "./boxes/gmShots";
import { fitStage } from "./stage";
import { keyCardSpot } from "./pc/keyCard";
import { newsClipping } from "./room/newsClipping";
import { phoneNotes } from "./room/phoneNotes";
import { wallClock } from "./room/wallClock";
import { wasteBasket } from "./room/wasteBasket";
import { roomDoor } from "./room/roomDoor";
import { deskCapture } from "./pc/capture";
import { EDITION, FORK_NOTE } from "../edition";
import { loadCatalog, type CatalogEntry } from "../project/files";
import { Project } from "../editor/core/project";
import type { SpeedSetting } from "../engine/scene";
import { viewState } from "../urlState";
import { prefetchWhenIdle } from "../prefetch";

// What is opened, looked into or picked up on the desk loads when it first is (and is fetched
// ahead once the desk is idle, see the end of renderDesk): the manuals, the catalog, the boxes' insides.
const lazy = {
  catalog: () => import("./room/catalog"),
  dosManual: () => import("../manual/dosManual"),
  gameManual: () => import("../manual/gameManual"),
  boxViewer: () => import("./boxes/boxViewer"),
  gmBox: () => import("./boxes/gmBox"),
  shelf: () => import("./boxes/shelf"),
  saveFirst: () => import("./pc/saveFirst"),
};
export interface DeskNav {
  /** Leave for today's web interface, optionally opening a project file. */
  toModern(projectId?: string, file?: string): void;
}

const SLOW_TICKS = 8; // a 286-class PC

export function renderDesk(root: HTMLElement, nav: DeskNav): () => void {
  // the PC starts in turbo every visit; the button slows it down until you leave
  let turbo = true;
  try {
    localStorage.removeItem("gm-turbo"); // the setting earlier versions kept
  } catch {
    /* private mode */
  }
  const speed: SpeedSetting = {
    ticksPerSecond: turbo ? undefined : SLOW_TICKS,
  };
  let disks: Disk[] = [];
  let lastDisk: string | undefined;
  // The address keeps what is going on at the desk, so a reload or a shared link comes back
  // to it: the disk in drive A:, what the PC is running, and what is open on the desk
  // (#/desk?disk=cd:nebula&run=play, #/desk?run=gm&open=gm-manual).
  const deskView = viewState(["desk"]);
  /** What the address says to do, read before anything here changes it. */
  const wanted = {
    disk: deskView.get("disk"),
    run: deskView.get("run"),
    open: deskView.get("open"),
  };
  /** Keeps something open on the desk in the address while it is open. */
  const opened = async (name: string, open: () => Promise<void>) => {
    deskView.set({ open: name });
    try {
      await open();
    } finally {
      if (deskView.get("open") === name) deskView.set({ open: undefined });
    }
  };

  const crt = h(
    "div",
    { class: "crt", role: "region", "aria-label": "Computer monitor" },
    h("div", { class: "power-hint" }, "Press the power button ⏻"),
  );
  const floppy = floppyDrive(() => eject());
  // What you can do with the disk in drive A: (shown only while there is one).
  const driveActions = h("div", { class: "drive-actions", hidden: true });
  const cd = cdDrive(() => void ejectCd());
  const powerLed = h("span", { class: "led green" });
  const turboLed = h("span", { class: "led amber" });
  const mhz = sevenSegment(2);
  const powerBtn = h(
    "button",
    {
      class: "case-btn power",
      "aria-label": "Power",
      "aria-pressed": "false",
      onclick: () => void power(),
    },
    "⏻",
  );
  const turboBtn = h("button", {
    class: "case-btn",
    "aria-label": "Turbo",
    onclick: () => setTurbo(!turbo),
  });
  const box = h("div", { class: "box" });
  // the playing game's key card, taped to the monitor
  const keyCard = keyCardSpot(() =>
    crt.querySelector<HTMLElement>(".crt-game canvas[tabindex]")?.focus(),
  );
  const spk = speakers({
    gamePlaying: () => computer.gamePlaying,
    restartGame: () => computer.restartGame(),
  });
  const lamp = deskLamp();
  const modem = deskModem(() => void command("C:\nTERMINAL"));
  // The same Sandbox games as the box's 3D front (boxes/gmShots.ts), each with what it shows off.
  const BOX_TILES = SANDBOX_SHOTS.slice(0, 6).map(
    ([id, feature]) => [id, feature] as [string, string],
  );
  const boxTiles = h(
    "div",
    { class: "tiles", "aria-hidden": "true" },
    ...BOX_TILES.map(([id, caption]) =>
      h(
        "div",
        { class: "tile", dataset: { game: id } },
        h("canvas"),
        h("span", null, caption),
      ),
    ),
  );

  const desk = h(
    "div",
    { class: "desk", dataset: { power: "off", zoom: "false" } },
    h(
      "header",
      { class: "desk-bar" },
      h("h1", null, "GAME-MAKER"),
      h("span", { title: FORK_NOTE }, `${EDITION} · the 1994 desk`),
      h("span", { class: "spacer" }),
      matchMedia("(pointer: coarse)").matches
        ? h(
            "span",
            { class: "touch-tip" },
            "No keyboard? The disk box, CD and catalog type for you.",
          )
        : null,
      h("button", { onclick: () => nav.toModern() }, "Switch to today’s web →"),
    ),
    h(
      "main",
      { class: "desk-scene", "aria-label": "The 1994 desk" },
      // Homage: the winter of 1992-93, shoveling snow to buy Game-Maker.
      h(
        "a",
        {
          class: "poster",
          href: "https://lewismoten.com/1992/12/11/moten-snow-to-software-operations-founder-operator/",
          target: "_blank",
          rel: "noopener",
          title:
            "Moten Snow-to-Software Operations: shoveling snow in the winter of 1992 to buy Game-Maker",
        },
        // AVIF or WebP at the size it hangs (256 or 512 px across), the JPEG for older browsers
        h(
          "picture",
          { style: "display:block;width:100%" },
          ...(["avif", "webp"] as const).map((type) =>
            h("source", {
              type: `image/${type}`,
              srcset: `./desk/moten-snow-to-software-256.${type} 256w, ./desk/moten-snow-to-software-512.${type} 512w`,
              sizes: "(min-width: 1350px) 230px, 17vw",
            }),
          ),
          h("img", {
            src: "./desk/moten-snow-to-software.jpg",
            alt: "Poster: MOTEN Snow-to-Software Operations, a pixel-art snowflake and shovel",
            loading: "lazy",
            decoding: "async",
            fetchpriority: "low",
          }),
        ),
      ),
      h("div", { class: "desk-top", "aria-hidden": "true" }),
      h("div", { class: "desk-legs", "aria-hidden": "true" }),
      snowyWindow(),
      newsClipping(),
      wallClock(),
      roomDoor(),
      wasteBasket(),
      spk.left,
      spk.right,
      phoneNotes(),
      wallPhone(),
      lamp.lamp,
      lamp.glow,
      h(
        "div",
        { class: "desk-left" },
        h(
          "button",
          {
            class: "prop catalog-prop",
            onclick: () => void catalog(),
            "aria-label": "Shareware catalog: games made with Game-Maker",
          },
          h(
            "div",
            { class: "paper", "aria-hidden": "true" },
            "SHAREWARE",
            h("br"),
            "CATALOG",
            h(
              "em",
              null,
              "Games made with Game-Maker · Fall 1994 · call our BBS!",
            ),
          ),
          h("span", { class: "caption" }, "Shareware catalog"),
        ),
        h(
          "button",
          {
            class: "prop disk-box",
            onclick: () => void flip(),
            "aria-label": "Disk box: pick a game to put in drive A",
          },
          box,
          h(
            "span",
            { class: "caption", "aria-hidden": "true" },
            "Disk box — pick a game",
          ),
        ),
        mug(),
      ),
      h(
        "div",
        { class: "desk-right" },
        h(
          "button",
          {
            class: "prop gm-box",
            onclick: () => void openGmBox(),
            "aria-label": "Game-Maker SE 3.0 box: look inside",
          },
          h(
            "div",
            { class: "retail" },
            h(
              "div",
              { class: "banner" },
              h("em", null, "COMPUTER-AIDED DESIGN TOOLS"),
              h("strong", null, "GAME-MAKER"),
            ),
            h("div", { class: "tagline" }, "CREATE YOUR OWN COMPUTER GAMES"),
            h("div", { class: "edition-ribbon" }, "SANDBOX EDITION"),
            boxTiles,
            h(
              "div",
              { class: "rsd-badge" },
              "CREATED BY RECREATIONAL SOFTWARE DESIGNS",
            ),
          ),
          h("span", { class: "caption" }, "Game-Maker SE 3.0 — open the box"),
        ),
      ),
      h(
        "div",
        { class: "pc" },
        h(
          "div",
          { class: "case" },
          // the modem sits on top of the case, beside the monitor stand
          modem.el,
          h(
            "div",
            { class: "case-buttons" },
            h("label", null, powerBtn, "POWER"),
            h("label", null, turboBtn, "TURBO"),
          ),
          h(
            "div",
            { class: "leds" },
            h("span", null, powerLed, "POWER"),
            h("span", null, turboLed, "TURBO"),
            h("span", { class: "mhz" }, mhz, h("small", null, "MHz")),
          ),
          h("span"),
          h("div", { class: "drives" }, cd.el, floppy.el),
          driveActions,
        ),
        keyboardTray(keyboard(() => void power(true))),
        // the screen takes every key (Tab too), so it comes last when tabbing: the case,
        // tray and monitor buttons come first and CSS puts them back in their places
        h(
          "div",
          { class: "monitor" },
          h(
            "button",
            { class: "sticky", onclick: () => nav.toModern() },
            "Too retro? Use today’s web →",
          ),
          h(
            "button",
            {
              class: "enlarge",
              title: "Fill the window with the screen",
              "aria-label": "Enlarge screen",
              onclick: () => setZoom("manual"),
            },
            "⤢",
          ),
          keyCard.el,
          h("div", { class: "screen-bezel" }, crt),
          h("span", { class: "brand" }, 'PIXELMAX 14" SVGA'),
          h("span", { class: "monitor-led" }),
        ),
        h("div", { class: "monitor-stand" }),
      ),
      h("div", { class: "desk-edge", "aria-hidden": "true" }),
    ),
    h(
      "button",
      { class: "zoom-exit primary", onclick: () => setZoom(false) },
      "Back to the desk",
    ),
  );
  clear(root, desk);
  const unfit = fitStage(desk);

  let pc: Computer | undefined;
  let enlarged = false; // the user pressed the enlarge button
  const computer = new Computer(crt, {
    speed,
    openModern: (projectId, file) => nav.toModern(projectId, file),
    // The designers take the whole window; afterwards, go back to how the user had it.
    // vga stays in the monitor like the real thing.
    onModeChange: (mode: MonitorMode) =>
      setZoom(mode === "gfx" ? "gfx" : enlarged ? "manual" : false),
    onDisksChanged: (insert) => void refreshDisks(insert),
    onGame: (game) => keyCard.show(game),
    // what the PC runs: a game (play), Game-Maker from a disk (design) or the hard disk / CD (gm), the BBS
    onProgram: (p) =>
      deskView.set({
        run: !p
          ? "dos"
          : p.kind === "game"
            ? "play"
            : p.kind === "gm"
              ? p.drive === "A"
                ? "design"
                : "gm"
              : p.kind === "terminal"
                ? "bbs"
                : "dos",
      }),
    // the drive lights of A: and D: (even an empty drive lights up while DOS tries it; C: has no light on this case)
    onDriveAccess: (drive) => {
      if (drive === "A") floppy.busy(700);
      else if (drive === "D") cd.busy(900);
    },
  });
  pc = computer;
  const capture = deskCapture(computer);
  desk.querySelector(".monitor .screen-bezel")?.before(capture.el); // before the screen, for Tab
  const removeWarp = installCrtWarp(
    crt.querySelector<HTMLElement>(".crt-picture")!,
  );
  crt.addEventListener("click", () => void power(true));

  /** 'gfx': the designers need the whole window; 'manual': the user enlarged the screen. */
  function setZoom(zoom: "gfx" | "manual" | false): void {
    if (zoom !== "gfx") enlarged = zoom === "manual";
    desk.dataset.zoom = zoom || "false";
    pc?.focus(); // undefined while the PC is still being built
  }
  const onKey = (e: KeyboardEvent) => {
    // Esc leaves a manual zoom only when nothing on the PC is running (games use Esc).
    if (e.key === "Escape" && desk.dataset.zoom === "manual" && !computer.busy)
      setZoom(false);
  };
  window.addEventListener("keydown", onKey);

  function setTurbo(on: boolean): void {
    turbo = on;
    speed.ticksPerSecond = on ? undefined : SLOW_TICKS;
    turboBtn.setAttribute("aria-pressed", String(on));
    turboLed.classList.toggle("on", on && computer.powered);
    mhz.show(computer.powered ? (on ? "66" : "8") : "");
  }

  async function power(onlyOn = false): Promise<void> {
    if (computer.powered) {
      if (!onlyOn) {
        // switching off: the tube collapses to a line, then a dot; then the simplest honest "reset"
        crt.classList.add("switching-off");
        powerLed.classList.remove("on");
        spk.power(false);
        // a cold start: the address forgets the disk and the program too
        deskView.set({ disk: undefined, run: undefined, open: undefined });
        setTimeout(() => location.reload(), 1700);
      } else computer.focus();
      return;
    }
    desk.dataset.power = "on";
    powerBtn.setAttribute("aria-pressed", "true");
    powerLed.classList.add("on");
    modem.power(true);
    spk.power(true);
    setTurbo(turbo);
    await computer.powerOn();
    setTurbo(turbo);
    if (!deskView.get("run")) deskView.set({ run: "dos" });
  }

  /** Types a command at the prompt (booting first if needed). */
  async function command(cmd: string): Promise<void> {
    await power(true);
    if (!computer.typeCommand(cmd))
      toast("Quit the program that is running first (Esc usually does it).");
  }

  async function refreshDisks(insertId?: string): Promise<void> {
    disks = await loadDisks();
    // two stacks standing in the box: the site's disks (Sandbox's games in front) on the
    // left, the user's own on the right (a blank one when there are none yet)
    const site = disks
      .filter(
        (d) =>
          d.kind === "original" || d.kind === "rsd" || d.kind === "gameware",
      )
      .slice(0, 6);
    const own = disks.filter((d) => d.kind === "project").slice(0, 5);
    const mine = [...own, ...disks.filter((d) => d.kind === "blank")];
    // a row seen from the front and a little above: each disk behind stands a little
    // higher, smaller and darker, so its top shows over the one in front
    const row = (i: number) => ({
      bottom: 8 + i * 10,
      scale: 1 - i * 0.035,
      dim: 1 - i * 0.07,
    });
    const stack = (list: Disk[], x0: number, tabAt = -1) =>
      [...list].reverse().flatMap((d, k) => {
        const i = list.length - 1 - k; // drawn back to front, so the first stands in front
        const { bottom, scale, dim } = row(i);
        const el = floppyElement(d, true);
        el.classList.add("peek");
        el.style.left = `${x0}px`;
        el.style.bottom = `${bottom}px`;
        el.style.transform = `scale(${scale})`;
        el.style.setProperty("--dim", String(dim));
        if (i !== tabAt) return [el];
        // an index card standing just behind this disk
        const tab = h("div", { class: "bx-tab" });
        const t = row(i + 0.5);
        tab.style.cssText = `left:${x0}px;bottom:${t.bottom}px;transform:scale(${t.scale});transform-origin:50% 100%;filter:brightness(${t.dim})`;
        return [tab, el];
      });
    // back to front: the lid and back wall, the rows of disks, the walls around them
    clear(
      box,
      h("div", { class: "lid" }),
      h("div", { class: "bx-back" }),
      h("div", { class: "bx-div" }),
      ...stack(site, 17, 2),
      ...stack(mine, 99),
      h("div", { class: "bx-side l" }),
      h("div", { class: "bx-side r" }),
      // embossed label-maker tape stuck on the front, one over each compartment
      h(
        "div",
        { class: "bx-front" },
        h("span", { class: "dymo l" }, "GAMES"),
        h("span", { class: "dymo r" }, "MY DISKS"),
      ),
    );
    if (insertId) {
      const d = disks.find((x) => x.id === insertId);
      if (d) showInDrive(d);
      lastDisk = insertId;
    }
  }

  let inDrive: Disk | undefined;

  function showInDrive(d: Disk | undefined): void {
    inDrive = d;
    driveActions.hidden = !d;
    if (!d) {
      floppy.setDisk(undefined);
      clear(driveActions);
      return;
    }
    floppy.setDisk(d.kind === "blank" ? "blank disk" : d.title, d.color);
    floppy.busy();
    const act = (a: DiskAction) => () => void onDisk(d, a);
    clear(
      driveActions,
      h(
        "span",
        { class: "drive-actions-title", title: diskFacts(d) },
        d.kind === "blank" ? "Blank disk in A:" : `${d.title} in A:`,
      ),
      d.gam
        ? h("button", { class: "primary", onclick: act("play") }, "▶ Play")
        : null,
      h(
        "button",
        { onclick: act("design") },
        d.kind === "blank" ? "✎ New game" : "✎ Design",
      ),
      d.kind !== "blank"
        ? h(
            "button",
            {
              onclick: act("modern"),
              title: "Open it in today’s web Game-Maker",
            },
            "Today’s web →",
          )
        : null,
      d.kind === "original" && d.catalog?.original?.manual
        ? h(
            "button",
            { onclick: () => void gameManual(d.catalog!) },
            "📖 Manual",
          )
        : null,
    );
  }

  async function insert(d: Disk): Promise<void> {
    const files = await d.load();
    computer.insertDisk(d, files);
    showInDrive(d);
    lastDisk = d.id;
    deskView.set({ disk: d.id });
  }

  function eject(): void {
    if (computer.busy) {
      toast("The drive light is on — quit the running program first.");
      return;
    }
    computer.eject();
    showInDrive(undefined);
    deskView.set({ disk: undefined });
  }

  async function flip(): Promise<void> {
    if (!disks.length) await refreshDisks();
    await openDiskBox(disks, lastDisk, (d) => void insertFromBox(d));
  }

  /** Putting a disk in drive A: the PC boots if it is off, and the disk's game starts
   * (typed at the DOS prompt, as you would); a disk without one leaves you at A:. */
  /**
   * Gets back to the DOS prompt for a disk: a game playing quits, and Game-Maker closes
   * after asking to save a designer's unsaved changes. False if you'd rather keep going
   * (or something else, like the BBS terminal, is running).
   */
  async function leaveProgram(): Promise<boolean> {
    if (!computer.busy) return true;
    if (await computer.stopGame()) return true;
    if (!computer.inGameMaker) {
      toast("Quit the program that is running first (Esc usually does it).");
      return false;
    }
    const open = computer.designer;
    let saveAs = "";
    if (open && !open.saved && open.contents().length) {
      // the disk in A: is write-protected, or the work is on the CD
      const at = open.work.folder.drive;
      const readOnly = at === "D" || (at === "A" && !!inDrive?.writeProtected);
      const { askSaveFirst } = await lazy.saveFirst();
      const answer = await askSaveFirst(open, readOnly);
      if (answer === null) return false;
      saveAs = answer;
    }
    if (!(await computer.stopProgram())) {
      toast("Game-Maker didn’t close. Quit it with Esc first.", "error");
      return false;
    }
    if (open && saveAs) {
      const names = open.contents().map((c) => `${saveAs}.${c.ext}`);
      // nobody's at Game-Maker now: a read-only game is copied to the hard disk unasked
      computer.quiet = true;
      computer.copiedTo = undefined;
      let ok = true;
      try {
        for (const c of open.contents())
          ok = (await open.work.write(`${saveAs}.${c.ext}`, c.bytes)) && ok;
      } finally {
        computer.quiet = false;
      }
      const list = names.map((n) => n.toUpperCase()).join(" and ");
      const where = computer.copiedTo
        ? `${computer.copiedTo}, a copy of the game on the hard disk (the original can’t be changed)`
        : (await lazy.saveFirst()).folderText(open);
      if (ok) toast(`Saved ${list} in ${where}.`);
      else toast(`Couldn’t save ${list}.`, "error");
    }
    return true;
  }

  async function insertFromBox(d: Disk): Promise<void> {
    if (!(await leaveProgram())) return;
    await insert(d);
    if (d.gam) await onDisk(d, "play");
    else await power(true);
  }

  async function onDisk(d: Disk, action: DiskAction): Promise<void> {
    if (action === "modern") {
      if (d.projectId) return nav.toModern(d.projectId);
      const files = await d.load();
      const p = Project.fromFiles(files, `${d.title} (my copy)`);
      if (d.gam) p.gam = d.gam;
      await p.saveNow();
      return nav.toModern(p.id);
    }
    if (!(await leaveProgram())) return;
    if (inDrive?.id !== d.id) await insert(d);
    if (action === "play" && d.gam)
      await command(`A:\n${d.gam.replace(/\.gam$/i, "").toUpperCase()}`);
    // Game-Maker starts in the current folder: the disk, or C:\GM for a new game.
    else if (action === "design")
      await command(d.kind === "blank" ? "C:\nCD \\GM\nGM" : "A:\nGM");
  }

  /** A game's manual, kept in the address while it is open (open=manual:<game>). */
  const gameManual = (g: CatalogEntry, front?: string) =>
    opened(`manual:${g.id}`, async () =>
      (await lazy.gameManual()).openGameManual(g, front),
    );
  /** Game-Maker's own Owner's Guide (open=gm-manual). */
  const dosManual = () =>
    opened("gm-manual", async () => (await lazy.dosManual()).openDosManual());

  /** The Game-Maker box: turn it over, read the Owner's Guide, or put the CD in and start it. */
  function openGmBox(): Promise<void> {
    return opened("gm-box", showGmBox);
  }
  async function showGmBox(): Promise<void> {
    const tiles = [...boxTiles.querySelectorAll<HTMLElement>(".tile")].map(
      (t) =>
        [
          t.querySelector("canvas")!,
          t.querySelector("span")!.textContent ?? "",
        ] as [HTMLCanvasElement, string],
    );
    const [{ openBoxViewer }, { drawGmBox, gmBoxContents }] = await Promise.all(
      [lazy.boxViewer(), lazy.gmBox()],
    );
    await openBoxViewer({ title: "Game-Maker SE 3.0" }, drawGmBox(tiles), {
      insert: () => void startGameMaker(),
      insertLabel: "Put the CD in and start Game-Maker",
      manual: () => void dosManual(),
      extras: gmBoxContents(
        () => {
          document
            .querySelector<HTMLButtonElement>(
              ".box-viewer-bar button:last-child",
            )
            ?.click();
          void dosManual();
        },
        () => {
          document
            .querySelector<HTMLButtonElement>(
              ".box-viewer-bar button:last-child",
            )
            ?.click();
          void startGameMaker();
        },
      ),
    });
  }

  async function startGameMaker(): Promise<void> {
    if (!computer.cdInserted) {
      await openTray(cd);
      computer.insertCd();
      cd.setDisc("Game-Maker SE 3.0");
      desk.querySelector(".gm-box")?.classList.add("cd-in");
    }
    cd.busy();
    await command("GM");
  }

  /** The CD-ROM's eject button: out comes the tray (and the Game-Maker CD, back to its box). */
  async function ejectCd(): Promise<void> {
    if (computer.busy && computer.cdInserted) {
      toast("The CD-ROM is in use — quit the running program first.");
      return;
    }
    computer.ejectCd();
    cd.setDisc(undefined);
    desk.querySelector(".gm-box")?.classList.remove("cd-in");
    await openTray(cd);
  }

  let shelf: Shelf | undefined;

  /** The shelf on the wall: a box for each original game (desk/boxes/shelf.ts). */
  // filled again when the list changes: the latest fill wins
  let shelfFill = 0;
  async function fillShelf(games: CatalogEntry[]): Promise<void> {
    const fill = ++shelfFill;
    const scene = desk.querySelector<HTMLElement>(".desk-scene");
    shelf?.dispose();
    shelf = undefined;
    scene?.querySelectorAll(".game-shelf").forEach((el) => el.remove());
    const { gameShelf } = await lazy.shelf();
    if (fill !== shelfFill) return;
    const made = scene
      ? await gameShelf(scene, games, {
          insert: (id) => void insertOriginal(id),
          manual: (g, front) => void gameManual(g, front),
        })
      : undefined;
    if (fill !== shelfFill) {
      made?.dispose();
      made?.element.remove();
      return;
    }
    shelf = made;
    // on the wall under the poster, so it comes next when you Tab along the wall
    const el = scene?.querySelector(".game-shelf");
    if (el) desk.querySelector(".news-clipping")?.after(el);
  }

  async function insertOriginal(id: string): Promise<void> {
    if (!disks.length) await refreshDisks();
    const d = disks.find((x) => x.id === `cd:${id}`);
    if (d) await insertFromBox(d);
  }

  async function catalog(): Promise<void> {
    const entries = await loadCatalog().catch(() => []);
    const { openCatalog } = await lazy.catalog();
    await opened("catalog", () =>
      openCatalog(entries, {
        callBbs: () => void command("C:\nTERMINAL"),
        downloaded: (id) => computer.downloads.has(id),
      }),
    );
  }

  /** Comes back to what the address describes: the disk in A:, the program running, what is open. */
  async function restore(): Promise<void> {
    const { disk, run, open } = wanted;
    if (!disk && !run && !open) return;
    if (!disks.length) await refreshDisks();
    const d = disk ? disks.find((x) => x.id === disk) : undefined;
    if (disk && !d) {
      deskView.set({ disk: undefined });
      toast(
        disk.startsWith("project:")
          ? "That disk holds a game made in another browser, so it isn’t in this disk box."
          : "That disk isn’t in the disk box.",
      );
    }
    if (d) await insert(d);
    if (run === "play" && d?.gam) await onDisk(d, "play");
    else if (run === "design" && d) await onDisk(d, "design");
    else if (run === "gm") await startGameMaker();
    else if (run === "bbs") await command("C:\nTERMINAL");
    else if (run) await power(true);
    if (open === "catalog") void catalog();
    else if (open === "gm-box") void openGmBox();
    else if (open === "gm-manual") void dosManual();
    else if (open?.startsWith("manual:")) {
      const g = (await loadCatalog().catch(() => [])).find(
        (x) => x.id === open.slice(7) && x.original?.manual,
      );
      if (g) void gameManual(g);
    }
  }

  setTurbo(turbo);
  void refreshDisks().then(restore);
  // what is likely next: Game-Maker and the BBS on the PC, then what opens on the desk
  prefetchWhenIdle([
    () => import("../player/player"),
    () => import("../retro/gm"),
    () => fetch("./gm/index.json"), // C:\GM's listing, so GM starts offline too
    lazy.gmBox,
    lazy.boxViewer,
    lazy.catalog,
    () => import("./room/phone/phone"),
    lazy.dosManual,
    lazy.gameManual,
    () => import("../retro/bbs/bbs"),
    lazy.saveFirst,
    // last, Game-Maker's eight designers (so a later visit can design offline too)
    () => import("../retro/gm").then((m) => m.loadDesigners()),
  ]);
  void loadCatalog().then((cat) =>
    fillShelf(cat.filter((g) => g.original?.box)),
  );
  // a secret game revealed or hidden again (all twelve eggs found, or EGG.EXE): the shelf
  // and the disk box follow, and the box of a game no longer listed is put back
  const unCatalog = onCatalogChanged(async () => {
    const cat = await loadCatalog().catch(() => [] as CatalogEntry[]);
    if (!desk.isConnected) return;
    const viewer = document.querySelector<HTMLElement>(".box-viewer");
    const showing = viewer?.getAttribute("aria-label");
    if (showing && !cat.some((g) => `${g.title} box` === showing))
      viewer!.querySelector<HTMLButtonElement>(".box-viewer-bar button:last-child")?.click();
    void fillShelf(cat.filter((g) => g.original?.box));
    void refreshDisks();
  });
  // the felt eggs found in the Sandbox games (nothing at all until the first one)
  let unEggs: (() => void) | undefined;
  void import("../eggs/eggDisplay").then(({ eggDisplay }) => {
    if (!desk.isConnected) return;
    unEggs = eggDisplay((el) => {
      // on the wall, after the poster and clipping when you Tab along it
      const clip = desk.querySelector(".news-clipping");
      if (clip) clip.after(el);
      else desk.querySelector(".desk-scene")?.append(el);
    });
  });
  void sandboxShots().then((shots) => {
    for (const t of boxTiles.querySelectorAll<HTMLElement>(".tile")) {
      const shot = shots.find((s) => s.id === t.dataset.game);
      const c = t.querySelector("canvas")!;
      if (!shot) continue;
      c.width = shot.canvas.width;
      c.height = shot.canvas.height;
      c.getContext("2d")!.drawImage(shot.canvas, 0, 0);
    }
  });
  return () => {
    window.removeEventListener("keydown", onKey);
    unfit();
    lamp.dispose();
    shelf?.dispose();
    unCatalog();
    unEggs?.();
    removeWarp();
    capture.dispose();
    computer.screen.destroy();
    computer.keys.detach();
  };
}
