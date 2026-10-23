// The 90s PC on the desk: boots to a DOS prompt, runs the DOS-look Game-Maker, the BBS
// terminal and games, with drive A: (floppy), C: (hard disk) and D: (the CD).
//
// This file is the power switch and running programs (DOS commands, Game-Maker's designers,
// games); the drives and game folders are in computer/drives.ts and computer/folders.ts.
import { attr } from "./text/textScreen";
import { type ProgramRef } from "./dos/vfs";
import { ProgramAborted } from "./text/textInput";
import type { OpenDesigner } from "./host";
import { errorBox, askText } from "./text/textUi";
import type { PlayerHandle } from "../player/player";
import { GameFiles } from "../project/files";
import { loadProject, loadSaveData, writeSaveFile } from "../project/storage";
import { Project } from "../editor/core/project";
import { editors, fileInfo } from "../editor/editors/registry";
import { kindOf } from "../editor/core/project";
import { Vga } from "../vga/shared/vga";
import { PictureScreen } from "./view/picture";
import { output } from "../audio/output";
import { audioContext, unlock } from "../audio/context";
import { h, clear } from "../editor/core/ui";
import { AUTOEXEC } from "./computer/setup";
import { soundBlaster } from "./computer/soundBlaster";
import { ComputerFolders } from "./computer/folders";

export class Computer extends ComputerFolders {
  async powerOn(): Promise<void> {
    if (this.powered) return;
    this.powered = true;
    this.unlockAudio();
    this.setMode("text");
    const s = this.screen;
    s.resetPalette();
    s.clear(attr(7, 0));
    s.cursorVisible = false;
    const turbo = !this.opts.speed.ticksPerSecond;
    s.print(
      `AwkWard Modular BIOS v4.20  (C) 1993 AwkWard Software\n${turbo ? "486DX2-66 Turbo" : "486DX2-66 (Turbo off)"}\n\n`,
    );
    for (let k = 0; k <= 4096; k += 256) {
      s.cursorX = 0;
      s.print(
        `Memory Test: ${String(k).padStart(5)}K${k === 4096 ? " OK" : ""}`,
      );
      await sleep(30);
    }
    this.postBeep(); // one short beep: the power-on self test passed
    s.print("\n\nStarting MS-DOS...\n\n");
    await sleep(500);
    // CONFIG.SYS
    s.print("HIMEM is testing extended memory...");
    await sleep(turbo ? 350 : 1100);
    s.print("done.\n");
    await sleep(150);
    s.print(
      "EMM386 successfully installed.\n  Available Upper Memory     :  91 KB\n\n",
    );
    await sleep(250);
    s.print(
      "  ATAPI CD-ROM Device Driver  Version 2.14\n  Drive 0: CD-ROM 2X (MSCD001)\n\n",
    );
    await sleep(turbo ? 400 : 900);
    // AUTOEXEC.BAT
    for (const l of AUTOEXEC.slice(1)) {
      if (l.includes("MSCDEX")) {
        s.print(
          "MSCDEX Version 2.23\n        Drive D: = Driver MSCD001 unit 0\n",
        );
        await sleep(300);
      } else if (l.includes("DOSKEY")) s.print("DOSKEY installed.\n");
      else if (l.includes("MOUSE")) s.print("Mouse driver installed\n");
    }
    s.print(
      "\nType HELP for commands, GM to start Game-Maker, TERMINAL to call the BBS.\n\n",
    );
    s.cursorVisible = true;
    void this.shell.loop();
  }

  /** The BIOS's single beep through the PC speaker: a short square wave. */
  protected postBeep(): void {
    const ctx = this.audioCtx;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = 1046;
    const t = ctx.currentTime + 0.02;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.005);
    g.gain.setValueAtTime(0.06, t + 0.2);
    g.gain.linearRampToValueAtTime(0, t + 0.21);
    o.connect(g).connect(output(ctx));
    o.start(t);
    o.stop(t + 0.22);
  }

  unlockAudio(): void {
    try {
      this.audioCtx ??= audioContext();
      unlock();
    } catch {
      /* no audio */
    }
  }

  audio(): AudioContext | undefined {
    return this.audioCtx;
  }

  turbo(): boolean {
    return !this.opts.speed.ticksPerSecond;
  }

  /** Types a command at the prompt, as if on the keyboard. */
  typeCommand(cmd: string): boolean {
    if (!this.powered || this.busy) return false;
    this.focus();
    this.keys.type(`${cmd}\n`);
    return true;
  }

  // ---- drives -------------------------------------------------------------------------

  async run(ref: ProgramRef, _args: string[]): Promise<void> {
    this.busy = true;
    this.program = ref.kind;
    this.opts.onProgram?.({ kind: ref.kind, drive: this.shell.drive });
    try {
      switch (ref.kind) {
        case "gm":
          this.opts.onDriveAccess?.(this.shell.drive);
          // Game-Maker and its designers, the BBS: each loads when first run (see gm.ts)
          await (await import("./gm")).runGameMaker(this, "main", _args);
          break;
        case "playgame":
          this.screen.gameMakerColors();
          await (await import("./gm")).playgame(this);
          this.screen.resetPalette();
          this.screen.clear();
          break;
        case "terminal":
          await (await import("./bbs/bbs")).runTerminal(this);
          break;
        case "vpic":
          await (await import("./view/vpic")).runVpic(this, _args);
          break;
        case "install":
          // GM30\INSTALL.EXE from the BBS's Warez area has an installer of its own
          if (ref.from === "warez") {
            await (await import("./hacks/gm30Install")).runWarezInstall(this);
            break;
          }
          this.screen.print(
            "Game-Maker SE 3.00 is already installed in C:\\GM.\nType GM to start it.\n",
          );
          break;
        case "game": {
          this.opts.onDriveAccess?.(ref.diskId ? "A" : this.shell.drive);
          const files = new GameFiles(await ref.files());
          // a catalog game keeps its saves and high scores where the play page does
          if (ref.saveId) for (const [name, bytes] of Object.entries(await loadSaveData(ref.saveId))) files.set(name, bytes);
          // GMCRACK's intro first; whatever goes wrong with it, the game still plays
          if (ref.cracked) await import("./hacks/cracktro").then((m) => m.cracktro(this, ref.title, ref.cracked!)).catch((e) => { if (e instanceof ProgramAborted) throw e; console.warn("cracktro", e); });
          await this.playGame(files, ref.gam, ref.title, ref.notice, ref.saveId);
          break;
        }
        case "gmcrack":
          await (await import("./hacks/gmcrack")).runGmCrack(this, _args);
          break;
        case "savehack":
          await (await import("./hacks/saveHack")).runSaveHack(this);
          break;
        case "backup":
          await (await import("./hacks/backupExe")).runBackup(this, _args);
          break;
        case "hexedit":
          await (await import("./hexedit/hexEdit")).runHexEdit(this, _args);
          break;
        case "egg":
          await (await import("../eggs/eggExe")).runEggExe(this);
          break;
        case "batch":
          for (const l of ref.lines) await this.shell.execute(l);
          break;
      }
    } catch (e) {
      // stopped from outside (stopProgram): back to the prompt
      if (!(e instanceof ProgramAborted)) throw e;
      this.vgaScreen?.destroy();
      this.vgaScreen = undefined;
      clear(this.layer);
      this.keys.enabled = true;
      this.screen.clear();
    } finally {
      if (this.picture) this.leavePictureMode();
      this.busy = false;
      this.program = undefined;
      this.designer = undefined;
      this.opts.onProgram?.(undefined);
      this.keys.resume();
      this.screen.resetPalette();
      this.setMode("text");
    }
  }

  /** The game playing on the monitor, if any. */
  private player?: PlayerHandle;
  /** The program running (Computer.run), if any. */
  private program?: ProgramRef["kind"];
  /** Closes the web-style designer on the monitor, if one is open. */
  private closeEditor?: () => void;
  designer?: OpenDesigner;

  /** Game-Maker (or one of its designers) is running. */
  get inGameMaker(): boolean {
    return this.program === "gm";
  }

  /**
   * Stops Game-Maker wherever it is, as if you'd quit every menu: no questions asked, so
   * save first (see designer). False if something else is running.
   */
  async stopProgram(): Promise<boolean> {
    if (!this.busy) return true;
    if (await this.stopGame()) return true;
    if (!this.inGameMaker) return false;
    this.keys.abort();
    this.vgaScreen?.abort();
    this.closeEditor?.();
    for (let i = 0; this.busy && i < 150; i++) await sleep(20);
    return !this.busy;
  }

  /**
   * Stops the game that is playing, as if you'd quit it, and waits for the DOS prompt.
   * False if no game was playing (Game-Maker, the terminal or an editor may be).
   */
  async stopGame(): Promise<boolean> {
    const p = this.player;
    if (!p) return false;
    p.stop();
    await p.done;
    for (let i = 0; this.busy && i < 100; i++) await sleep(20);
    return !this.busy;
  }

  /** A game is playing on the monitor. */
  get gamePlaying(): boolean {
    return !!this.player;
  }

  /** Set while restartGame stops the game, so it starts again instead of going back to DOS. */
  private restarting = false;

  /**
   * Starts the game playing over from the beginning, as if you'd quit it and run it again:
   * it looks for the Sound Blaster card again as it starts. False if no game is playing.
   */
  restartGame(): boolean {
    const p = this.player;
    if (!p || this.restarting) return false;
    this.restarting = true;
    p.stop();
    return true;
  }

  playGame(
    files: GameFiles,
    gam: string,
    title: string,
    notice?: string,
    saveId?: string,
  ): Promise<void> {
    this.unlockAudio();
    this.keys.enabled = false;
    this.setMode("game");
    const host = h("div", { class: "crt-game" });
    clear(this.layer, host);
    this.opts.onGame?.({ files, gam, title });
    // the game player (the engine) loads with the first game played (the desk fetches it ahead)
    return new Promise<void>((resolve) => {
      const mount = () => void import("../player/player").then(({ mountPlayer }) => (this.player = mountPlayer(host, files, gam, {
        title,
        notice,
        autoStart: true,
        noKeysButton: true,
        exactPixels: true, // the monitor's size is never a whole multiple of 320x200
        speed: this.opts.speed,
        // the card is looked for as the game starts, as PLAYGAME did (switching it mid-game waits for the next)
        noSoundCard: !soundBlaster(),
        onQuit: () => false, // back to DOS
        onFileWrite: saveId ? (name, bytes) => void writeSaveFile(saveId, name, bytes) : undefined,
        saveId,
        onExit: () => {
          this.player = undefined;
          if (this.restarting) {
            // restartGame: the same game, from the start
            this.restarting = false;
            clear(host);
            mount();
            return;
          }
          this.opts.onGame?.(undefined);
          clear(this.layer);
          this.keys.enabled = true;
          this.keys.clear();
          resolve();
        },
      })));
      mount();
    });
  }

  openEditor(
    project: Project,
    fileName: string,
    program: string,
  ): Promise<void> {
    this.setMode("gfx");
    this.keys.enabled = false;
    return new Promise<void>((resolve) => {
      let cleanup: void | (() => void);
      const close = () => {
        this.closeEditor = undefined;
        if (typeof cleanup === "function") cleanup();
        window.removeEventListener("keydown", onKey, true);
        clear(this.layer);
        this.keys.enabled = true;
        this.keys.clear();
        this.setMode("text");
        resolve();
      };
      const onKey = (e: KeyboardEvent) => {
        if (
          e.key === "Escape" &&
          !(
            e.target instanceof HTMLInputElement ||
            e.target instanceof HTMLSelectElement ||
            e.target instanceof HTMLTextAreaElement
          )
        ) {
          e.preventDefault();
          close();
        }
      };
      window.addEventListener("keydown", onKey, true);
      this.closeEditor = close;
      const body = h("div", { class: "vga-body" });
      clear(
        this.layer,
        h(
          "div",
          { class: "vga-editor" },
          h(
            "div",
            { class: "vga-titlebar" },
            h("span", null, `${program}  ·  ${fileName.toUpperCase()}`),
            h("span", { class: "spacer" }),
            h(
              "button",
              {
                onclick: () => this.openModern(project.id, fileName),
                title: "Open this file in today’s web editor",
              },
              "⤢ Today’s web",
            ),
            h("button", { onclick: close }, "Quit (Esc)"),
          ),
          body,
        ),
      );
      // The editors are their own download, fetched the first time the PC opens one.
      void import("../editor/editors/all").then(() => {
        if (!body.isConnected) return;
        const editor = editors[kindOf(fileName)] ?? fileInfo;
        cleanup = editor(body, project, fileName);
      });
    });
  }

  /** Switches the monitor to VGA mode 13h (clearing video memory, as setting the mode did). */
  graphMode(): Vga {
    this.keys.enabled = false;
    if (this.vgaScreen) this.vgaScreen.mem.fill(0);
    else {
      const holder = h("div", { class: "crt-vga" });
      clear(this.layer, holder);
      this.vgaScreen = new Vga(holder);
    }
    this.setMode("vga");
    this.vgaScreen.canvas.focus();
    return this.vgaScreen;
  }

  /** Back to 80x25 text mode: a blank screen in Game-Maker's text colors. */
  textMode(): void {
    this.vgaScreen?.destroy();
    this.vgaScreen = undefined;
    clear(this.layer);
    this.screen.gameMakerColors();
    this.screen.clear(attr(7, 0));
    this.keys.enabled = true;
    this.keys.clear();
    this.setMode("text");
  }

  private picture?: PictureScreen;

  /** A 256-color graphics mode for a picture (the BBS's GIF viewer, VPIC). */
  pictureMode(width: number, height: number): PictureScreen {
    this.picture?.destroy();
    this.keys.enabled = false;
    const holder = h("div", { class: "crt-vga" });
    clear(this.layer, holder);
    this.picture = new PictureScreen(holder, width, height);
    this.setMode("vga");
    this.picture.canvas.focus();
    return this.picture;
  }

  /** Back to text mode from a picture, the text screen as it was left. */
  leavePictureMode(): void {
    this.picture?.destroy();
    this.picture = undefined;
    clear(this.layer);
    this.keys.enabled = true;
    this.keys.clear();
    this.setMode("text");
  }

  openModern(projectId: string, fileName?: string): void {
    this.opts.openModern(projectId, fileName);
  }

  /** Makes the disk in A: editable, formatting blank disks and copying originals. */
  async writableProject(): Promise<Project | undefined> {
    const d = this.inserted;
    if (!d) {
      if (this.quiet) return undefined;
      await errorBox(
        this,
        "Drive A: is empty.",
        "Choose a disk from the disk box.  (C)ontinue",
      );
      return undefined;
    }
    if (d.disk.kind === "blank") {
      if (this.quiet) return undefined;
      const r = await errorBox(
        this,
        "The disk in drive A: is not formatted.",
        "(F)ormat it for a new game   (E)xit",
      );
      if (r !== "F" && r !== "Enter") return undefined;
      const name = (
        await askText(this, "Name of your new game:", 19, "My Game")
      )?.trim();
      if (!name) return undefined;
      const project = Project.create(name);
      await project.saveNow();
      await this.swapInProject(project);
      return project;
    }
    if (d.disk.writeProtected)
      return this.copyToHardDisk(
        d.disk.title,
        d.files,
        d.disk.gam,
        d.disk.catalog?.id,
        `${d.disk.title}: the disk is write-protected.`,
      );
    const stored = d.disk.projectId
      ? await loadProject(d.disk.projectId)
      : undefined;
    if (!stored) return undefined;
    const project = Project.fromFiles(
      stored.files,
      stored.record.name,
      d.disk.projectId,
    );
    project.gam = stored.record.gam;
    d.files = project.files;
    return project;
  }

  // ---- game folders -----------------------------------------------------------------
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
