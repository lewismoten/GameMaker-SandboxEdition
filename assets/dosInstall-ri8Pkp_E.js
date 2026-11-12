import{t as c}from"./shared-desk-web-play-dos-DOS3LiN4.js";import"./watch-Ci1HG5Rl.js";const l=e=>c(e.replace(/\n/g,`\r
`));function u(e,t,s){if(!/^INSTALL\.(BAT|TXT)$/i.test(e))return!1;const r=new TextDecoder().decode(t),n=Number(/(?:This is a |Insert disk 1 of )(\d+)(?:-disk set| in the CURRENT)/.exec(r)?.[1]??1);if(n<1||n>99)return!1;const a=h(s,n).find(o=>o.name===e.toUpperCase()).data;return t.length===a.length&&t.every((o,d)=>o===a[d])}function h(e,t=1){if(!/^[A-Z0-9_'\-~!@#$%^&()]{1,8}$/.test(e)||!Number.isInteger(t)||t<1||t>99)throw new Error("Invalid DOS installation name or disk count.");const s=e.replace(/%/g,"%%"),r=`%GMIDRV%\\${s}`,n=["@ECHO OFF","REM Run from the source disk directory, not by a path from another drive.",'IF NOT "%2"=="" GOTO usage','IF "%1"=="" GOTO default',...Array.from("CDEFGHIJKLMNOPQRSTUVWXYZ").flatMap(o=>[`IF "%1"=="${o}:" GOTO drive`,`IF "%1"=="${o.toLowerCase()}:" GOTO drive`]),"GOTO usage",":drive","SET GMIDRV=%1",'IF NOT "%GMIDRV%"=="%1" GOTO failed',"GOTO begin",":default","SET GMIDRV=C:",'IF NOT "%GMIDRV%"=="C:" GOTO failed',":begin",`ECHO Copy the game to ${r}.`,"ECHO Existing files with the same names will be overwritten. Back up saves first.","ECHO Press Ctrl+C and answer Y to cancel, or press any other key to continue.","PAUSE","IF NOT EXIST %GMIDRV%\\NUL GOTO failed",`IF EXIST ${r}\\NUL GOTO ready`,`MD ${r}`,":ready",`IF NOT EXIST ${r}\\NUL GOTO failed`,...Array.from({length:t},(o,d)=>{const i=d+1;return[`:disk${i}`,...t>1?[`ECHO Insert disk ${i} of ${t} in the CURRENT source drive A: or B:.`,"ECHO Keep this drive current. Press Ctrl+C to cancel, or any other key.","PAUSE",`IF EXIST DISK${i}.ID GOTO copy${i}`,`ECHO Wrong disk: DISK${i}.ID is missing. Try again or press Ctrl+C.`,`GOTO disk${i}`]:[],`:copy${i}`,`COPY /B *.* ${r} /V`,`FOR %%F IN (*.*) DO IF NOT EXIST ${r}\\%%F GOTO failed`,"ECHO Check the COPY messages above. If ANY error appeared, STOP here.","ECHO Press Ctrl+C and answer Y; fix the problem before trying again.","ECHO Only if there were NO errors, press any other key to continue.","PAUSE"]}).flat(),"ECHO Copy passes ended. This is not an automatic check of file contents.","ECHO If every disk copied without errors, run these commands:","ECHO   %GMIDRV%",`ECHO   CD \\${s}`,"ECHO   CONFIG",`ECHO   ${s}.EXE`,"ECHO Run CONFIG once for sound and video, then run the game.","ECHO Read INSTALL.TXT for manual copying and sound setup.","GOTO end",":failed","ECHO INSTALL STOPPED: environment, drive, directory or copied file problem.","ECHO Check free space, write protection and the source disk. Read INSTALL.TXT.","ECHO Files already copied have NOT been removed. Installation may be incomplete.","GOTO end",":usage","ECHO Usage: INSTALL [drive]   Example: INSTALL D:   Default: C:","ECHO Use a hard disk drive letter C: through Z:, not a directory or path.",":end","SET GMIDRV=",""].join(`
`),a=`INSTALLING ${e}

This game needs DOS 3.3 or later, VGA and room on your hard disk.
The ZIP is an archive, NOT a boot disk or a floppy image. Unzip it first.
Keep the files together; do not copy the ZIP itself and expect DOS to run it.

HARD DISK INSTALLATION
  Put the source disk in A:. At the DOS prompt type:
    A:
    CD \\
    INSTALL
  This copies to C:\\${e}. For another hard disk, type INSTALL D:.
  Only drive letters C: through Z: are accepted; no directory argument.
  The directory is made if needed. Existing files of the same name are
  overwritten. Back up saved games, scores and CONFIG.DAT before reinstalling.
  Use an empty directory for a different game or release.

  For drive B:, type B: instead of A:. Always change to the source drive
  and directory FIRST, then type INSTALL there. Do not type A:\\INSTALL
  from C:. You may also install from an unzipped hard-disk folder, but never
  run INSTALL from the destination directory itself.

DISK SETS
  ${t>1?`This is a ${t}-disk set. Start with disk 1; leave the source drive current.
  Follow the numbered prompts, replacing the disk in that SAME drive.
  Each disk must have its DISKn.ID marker and the identical INSTALL.BAT.
  A missing marker repeats the prompt without copying the wrong disk.
  Markers identify a disk number, not its contents or release: do not mix sets.`:`The normal ZIP is one folder, not an automatically split disk set.
  If the files fit on one floppy, copy them all there and run INSTALL once.
  If you divide files by hand, put this same INSTALL.BAT on EVERY disk.
  Run INSTALL C: from each disk in turn, using the same destination drive.
  It copies the current disk only; it cannot guess how many disks you made.
  Never split a file. Use the manual method below if needed.`}
  Files from earlier disks are kept; nothing is deleted between copies.
  Do not launch the game until ALL disks have been copied.

CANCELLATION AND ERRORS
  At a pause, press Ctrl+C, then answer Y to end the batch job.
  If DOS asks Abort, Retry, Ignore for a disk error, do not Ignore it.
  COPY /V asks DOS to verify writes, but this batch file cannot compare
  file contents or reliably read COPY error codes on every old DOS version.
  WATCH EACH COPY: if it reports disk full, access denied, read/write error,
  self-copy, or any other error, cancel at the next pause. Do NOT continue
  to launch. A missing destination file stops the batch, but a partial file
  or a failed overwrite may still exist. No automatic success is promised.
  Fix the space, media or write-protection problem, then start again at disk 1.
  Leave the files already copied in place. No rollback or deletion is done.
  The installer reserves GMIDRV in the DOS environment; leave room for it.
  It clears GMIDRV on normal exit. After Ctrl+C, type SET GMIDRV= to clear it.

MANUAL INSTALLATION (NO INSTALLER NEEDED)
  At the DOS prompt, for a new directory, type:
    C:
    MD \\${e}
    COPY /B A:\\*.* C:\\${e} /V
  If the directory already exists, skip MD. Check COPY for errors.
  Swap disks and repeat the COPY command for EVERY disk. Use B: for drive B:.
  Substitute D: throughout if that is your hard disk. Do not erase earlier
  files between disks. Copy ALL files, including the player, SNDBLAST.DRV,
  CONFIG.BAT, CONFIG.HLP (when supplied) and every game resource.
  The files must be in the disk's root for the example above. For a source
  folder, use its full path instead. This copies files, not subdirectories.

STARTING THE GAME
  After every disk has copied without errors:
    C:
    CD \\${e}
    CONFIG
    ${e}.EXE
  Use the destination drive you chose instead of C: if necessary.
  Run CONFIG once for sound and video, or again to change them later.
  Common Sound Blaster settings are port 220, IRQ 7, DMA 1; check YOUR card.
  CONFIG asks for the port and interrupt, not DMA. Leave VGA on Auto-Detect
  unless your card needs another choice. Music but no sound effects? Check
  mismatched IRQ/DMA settings and SNDBLAST.DRV; music alone does not prove
  the voice settings are right. On some cards the correct IRQ is 5, not 7.
  The installed game should not need the installation disks.

QUITTING ON A SLOW COMPUTER
  Hold Escape until the screen goes black to quit on a slow computer.
  Give DOS time to return to the prompt before switching off.

RUNNING FROM A FLOPPY
  Only a complete game that fits on one writable disk can run this way.
  Change to A: (or B:), run CONFIG, then ${e}.EXE from the game directory.
  Leave the disk inserted; saves and scores need free space. For a multi-disk
  set, install to the hard disk first: the player does not swap resource disks.
`;return[{name:"INSTALL.BAT",data:l(n)},{name:"INSTALL.TXT",data:l(a)}]}export{h as dosInstallFiles,u as isGeneratedDosInstall};
