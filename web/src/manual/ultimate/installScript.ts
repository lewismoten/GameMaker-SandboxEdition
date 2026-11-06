// Chapter 18's DOS 3.3 installer lesson. Short listing parts fit the measured booklet pages.
const parts = [
  String.raw`@ECHO OFF
IF NOT "%2"=="" GOTO usage
SET GMIDIR=C:\DEMO
IF NOT "%GMIDIR%"=="C:\DEMO" GOTO failed
IF "%1"=="" GOTO begin
IF "%1"=="GAMES" GOTO games
IF "%1"=="games" GOTO games
GOTO usage
:games
SET GMIDIR=C:\GAMES\DEMO
IF NOT "%GMIDIR%"=="C:\GAMES\DEMO" GOTO failed
:begin
ECHO Installing to %GMIDIR%
ECHO Same-name files will be overwritten. Back up saves first.
ECHO Ctrl+C, then Y cancels. Any other key continues.
PAUSE`,
  String.raw`IF NOT EXIST C:\NUL GOTO failed
IF "%1"=="" GOTO root
IF EXIST C:\GAMES\NUL GOTO root
MD C:\GAMES
IF NOT EXIST C:\GAMES\NUL GOTO failed
:root
IF EXIST %GMIDIR%\NUL GOTO disk1
MD %GMIDIR%
IF NOT EXIST %GMIDIR%\NUL GOTO failed`,
  String.raw`:disk1
ECHO Insert disk 1 of 2 in the CURRENT source drive A: or B:.
PAUSE
IF EXIST DISK1.ID GOTO copy1
ECHO Wrong disk. Need DISK1.ID. Try again or press Ctrl+C.
GOTO disk1
:copy1
COPY /B *.* %GMIDIR% /V
FOR %%F IN (*.*) DO IF NOT EXIST %GMIDIR%\%%F GOTO failed
ECHO Any COPY error? Ctrl+C, then Y. Otherwise press a key.
PAUSE`,
  String.raw`REM Disk 2 is ONLY an example of multi-disk installation.
:disk2
ECHO Insert disk 2 of 2 in the CURRENT source drive A: or B:.
PAUSE
IF EXIST DISK2.ID GOTO copy2
ECHO Wrong disk. Need DISK2.ID. Try again or press Ctrl+C.
GOTO disk2
:copy2
COPY /B *.* %GMIDIR% /V
FOR %%F IN (*.*) DO IF NOT EXIST %GMIDIR%\%%F GOTO failed
ECHO Any COPY error? Ctrl+C, then Y. Otherwise press a key.
PAUSE`,
  String.raw`ECHO Copy passes ended. Check that NEITHER pass had errors.
ECHO Only then type these commands:
ECHO C:
ECHO CD %GMIDIR%
ECHO CONFIG
ECHO DEMO.EXE
GOTO end
:failed
ECHO INSTALL STOPPED. Check environment, drive, space and disk errors.
ECHO Files already copied remain. The game may be incomplete.
GOTO end
:usage
ECHO Use INSTALL or INSTALL GAMES from the source disk root.
:end
SET GMIDIR=`,
];

/** The exact listing, also used by the compatibility checks. Save as ASCII with CRLF. */
export const INSTALL_BAT = `${parts.join('\n')}\n`;
const listing = (i: number) => `<pre><code>${parts[i]}</code></pre>`;

export const INSTALL_LESSON = String.raw`
  <h2>Give the player an INSTALL command</h2>
  <p>Don’t make the player copy a game by hand. Put an <code>INSTALL.BAT</code> beside the
  game’s files and offer a short directory such as <code>C:\DEMO</code>, or
  <code>C:\GAMES\DEMO</code> for someone who keeps games together. Replace <code>DEMO</code>
  with your game’s DOS name, one to eight plain letters or digits. Keep the player and all its
  resources together in that directory; the game itself does not swap installation disks.</p>
  <p><b>Disk two below is only an example of multi-disk installation.</b> A game that fits on
  one disk needs only one. The two-disk lesson uses the same conventions as a DOS export’s
  numbered disk set: flat files, <code>DISKn.ID</code> markers, a prompt for each disk, and
  the same installer on every disk. This hand-written version adds the <code>GAMES</code>
  choice; it is not an extra argument for an exported installer’s <code>INSTALL [drive]</code>.</p>
  <h3>Pack the disks</h3>
  <table>
    <tr><th>Disk</th><th>Files in its root directory</th></tr>
    <tr><td>1</td><td><code>INSTALL.BAT</code>, <code>INSTALL.TXT</code>, <code>DISK1.ID</code>,
    <code>DEMO.EXE</code> (the transferred player), <code>SNDBLAST.DRV</code>,
    <code>CONFIG.BAT</code>, <code>CONFIG.HLP</code> when supplied, <code>DEMO.GAM</code>,
    and the first group of game resources.</td></tr>
    <tr><td>2 (example only)</td><td>An identical <code>INSTALL.BAT</code>, <code>DISK2.ID</code>,
    and the remaining resources.</td></tr>
  </table>
  <p>The marker files must contain a short line, such as <code>DEMO disk 1</code> or
  <code>DEMO disk 2</code>: old DOS COPY skips empty files. Make them in a text editor and check their exact names.
  Put only <code>DISK1.ID</code> on disk 1 and only <code>DISK2.ID</code> on disk 2. They identify
  a disk number, not a game or release, so label the disks and never mix sets. Divide complete
  files, not pieces of a file. Every resource named by the game must appear on one disk; only
  the identical installer is repeated. Allow room for it when filling each disk. A ZIP must
  first be unpacked; copying the ZIP alone does not install a game.</p>
  <h3>Start from disk 1</h3>
  <p>Tell the player to put disk 1 in A:, type <code>A:</code>, then <code>CD \</code>, then
  <code>INSTALL</code> for <code>C:\DEMO</code> or <code>INSTALL GAMES</code> for
  <code>C:\GAMES\DEMO</code>. For B:, type <code>B:</code> instead. Keep that source drive
  current and swap disks in that same drive. Do not start with <code>A:\INSTALL</code> while
  C: is current: the relative source names would read C: instead of the floppy.</p>
  <p>Save the following five parts, in order, as <b>one</b> plain ASCII file named
  <code>INSTALL.BAT</code>, with DOS CRLF line endings. Copy the finished file byte for byte
  onto both disks: COMMAND.COM may reopen it after a swap and must find the same listing at
  the same place. Do not put the explanations or listing headings in the batch file.</p>
  <h3>1. Choose the destination</h3>
  <p>No argument means the short directory; <code>GAMES</code> adds the parent directory.
  Other arguments print usage without copying. The first pause warns about overwriting.
  Use a new directory for a different game or release, and back up saves and sound settings
  before reinstalling. The script uses and clears the environment variable <code>GMIDIR</code>;
  if DOS cannot make room for it in the environment, the value check stops the installation.</p>
  ${listing(0)}
  <h3>2. Make the directories</h3>
  <p>Check the hard disk, make <code>GAMES</code> first if needed, then make the game’s
  directory. Existing directories are kept. The <code>\NUL</code> checks are the old DOS
  directory test; a missing directory after <code>MD</code> goes to the failure message.</p>
  ${listing(1)}
  <h3>3. Ask for disk 1 and copy it</h3>
  <p>A missing marker repeats the prompt without copying. <code>COPY /B</code> copies binary
  files intact and <code>/V</code> asks DOS to verify writes. The destination must already be
  a directory; leave off its trailing backslash, which DOS 3.3 COPY rejects. <code>*.*</code> copies all files in the current root, including the
  installer and marker, but not subdirectories. Nothing from an earlier disk is erased.</p>
  ${listing(2)}
  <h3>4. Show how another disk follows</h3>
  <p>Disk 2 repeats the same steps with its own marker. For a one-disk game, omit this entire
  fourth part, including its comment, and change <code>1 of 2</code> in
  the third part to <code>1 of 1</code>. Keep a <code>DISK1.ID</code> on that one disk.</p>
  ${listing(3)}
  <h3>5. Explain what to do next</h3>
  <p>The script only prints the launch commands; it does not run the game after an unchecked
  copy. After both passes have copied without errors, change to C: and the chosen directory,
  run <code>CONFIG</code> once for sound and video, then <code>DEMO.EXE</code>. Remove the
  installation disk and test that the whole game plays from the hard disk.</p>
  ${listing(4)}
  <h3>Do not hide a copy error</h3>
  <p>The <code>FOR</code> line catches a missing destination file, not a truncated file or a
  failed overwrite of a file already there. Old DOS <code>COPY</code> does not give this
  script a dependable automatic success test. Read <b>every</b> COPY message. If it reports
  disk full, access denied, a read or write error, or any other failure, press
  <kbd>Ctrl+C</kbd> at the next pause and answer <kbd>Y</kbd> to end the batch job. If DOS
  offers Abort, Retry, Ignore for a media error, do not choose Ignore. Correct the problem and
  start again with disk 1. Copied files are left in place; there is no rollback.</p>
  <p>Put those warnings, the two destination choices, the disk order and the launch commands
  in <code>INSTALL.TXT</code> too. Include a manual fallback: make the chosen directory
  (and <code>C:\GAMES</code> first if needed), then type
  <code>COPY /B A:\*.* C:\DEMO /V</code> for each disk, substituting the chosen directory
  and B: when needed. Check each copy before going on. Do not copy from the destination onto
  itself. Try the script on a clean DOS 3.3 machine: both choices, a wrong disk, an existing
  directory and a full hard disk. This listing uses COMMAND.COM commands, not later
  <code>CHOICE</code>, <code>SET /P</code>, <code>COPY /Y</code> or Windows CMD extensions.</p>`;
