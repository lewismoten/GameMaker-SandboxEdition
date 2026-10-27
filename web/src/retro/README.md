# `retro/`: the PC

Part of the [source map](../README.md).

The PC, shared by the desk and `dos.html`, importing nothing from `desk/`. The
page around it supplies `computer/setup.ts` `ComputerOptions`; `computer/monitor.css` styles its
picture; `host.ts` is what programs on it can use.

- `computer.ts`: power and programs, with `computer/` (`drives.ts`, game folders in
  `folders.ts`, its sound line `pcAudio.ts`, the Sound Blaster card `soundBlaster.ts`).
  `leaveProgram.ts` and `saveFirst.ts` get it back to the DOS prompt for a disk; `diskSwap.ts` says
  which utilities keep running while the disk in A: is swapped instead.
- `dos/`: COMMAND.COM (`shell.ts`), the file system (`vfs.ts`, `hardDisk.ts`, what C: gained in
  `cDriveStore.ts`), the floppies (`disks.ts`), the room's one clock (`deskClock.ts`), the
  designers' file handling (`workArea.ts`) and file picker (`picker.ts`).
- `text/`: 80×25 text mode (`textScreen.ts`, `textInput.ts`, `cp437.ts`) and Game-Maker's text UI
  (`textUi.ts`).
- `gm.ts`: GM.EXE's menus. `gmReg/`: Game-Maker's registration and copy check (`chk.ts`,
  `registration.ts`, `copyCheck.ts`); `regSide.ts` (loaded by `regSideLater.ts`, asked for by
  `regDesk.ts`) puts the Owner's Guide (`regGuidePanel.ts`) and registration card (`regCardPanel.ts`,
  `mailCard.ts`) beside the monitor;
  `replyMail.ts` remembers RSD's reply.
- `hexedit/`: HEXEDIT.EXE (`hexEdit.ts`, `hexFiles.ts`) and its map of each file format
  (`structure.ts` the map and its Builder; `structureGm.ts` Game-Maker's formats,
  `structureMedia.ts` the media files). `view/`: VPIC.EXE (`vpic.ts`) and the VGA/SVGA picture
  screen (`picture.ts`).
- `hacks/`: the BBS's utilities, SAVEHACK, BACKUP, GMCRACK, PLAYHACK, the GM30 installer and the
  rest (`saveHack.ts`, `backupExe.ts`, `playHack.ts`, which edits a game of yours' DOS player
  patches as the editor's panel does, picking a kind of game first in `playHackGroups.ts` or the game on the disk in A: in `playHackDisk.ts`, `gmcrack.ts` with its serials and RESERIAL in `gmcrackSerial.ts`,
  `cracktro.ts`, `gm30Install.ts`, their words in `*Text.ts`, their look in `dosUi.ts`, what they
  add to C: in `deskFiles.ts` and `pcExtras.ts`, which also keeps the serial in PLAYGAME.EXE):
  debugging tools for registration modes, saved games and backups, dressed as 1990s scene
  programs.

## `bbs/`: the terminal and the BBSes

The terminal (`term.ts`) and the BBSes; TERMINAL.EXE's dialing
directory and calls are `bbs.ts`.

- The boards: THE -= S A N D B O X =- BBS (`sandbox.ts`, its name in `bbsName.ts`, ANSI art in
  `ansiArt.ts`) and The Sofa (`sofa.ts`, its number in `sofaPhone.ts` for the printed pieces; its
  files, pictures and SPAM in `sofaFiles.ts`, `sofaPictures.ts` and `sofaSpam.ts`).
- Their file areas: listings a screen at a time (`pager.ts`) with FILE_ID.DIZ (`fileId.ts`), the
  GIF Gallery (`gallery.ts`, `gifArea.ts`), the Warez area (`warezArea.ts`), the upload/download
  ratio (`ratio.ts`) and PKUNZIP after a download (`pkunzip.ts`).
- The line: modem sound (`modem.ts`); `lineSpeed.ts` is the modem's speed, 300 baud to Unlimited,
  `pacedQueue.ts` sends the boards' text and `transfer.ts` their files at it, and
  `lineSpeedControls.ts` picks it on the desk's modem and in `dos.html`'s ⋯ menu; `pickup.ts` is
  someone picking up the kitchen extension.
- `tdd.ts` calls a TTY from TERMINAL, in Baudot (`baudot.ts`), to Mrs. Novak's script
  (`ttyTalk.ts`), with `ttyInfo.ts` on TTYs in 1994.
- The Sandbox BBS's door game, TIC-TAC-TOE BY MODEM, is `ticTacToe.ts` (rules, the other caller,
  the saved game) and `ticTacToeDoor.ts` (its screen); its R)egister menu, `rsdLine.ts`, is RSD's
  registration line: a name and serial number get TELLREG's registration number.
