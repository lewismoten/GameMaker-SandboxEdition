// Chapter 17's BBS distribution advice, from Lewis's November 15, 2026 size reports.
// Verified against GIFC.C intro/extension/initable/DrawGif; PLAYGAME.C ShowGraphic;
// Image/FLI/FLI.CPP DoRunLength/DoLineCompress/View and FLIDOC.TXT section 8.1;
// GM/BLOCC.C saveblks, BLOC.H blkstruct, MAPC.C savemap, MAP.H mapstruct;
// GM/SOUNDC.C PlaySbVocFile (delegates sample parsing to the driver), SNDEDIT.C
// PlaySound and SBMUSIC.C load_file/PlayIt (CMF is not handled by SOUNDC.C).
// DEFLATE: original Image/PNG/ZIP/{ZIP.H,ZIPUP.C,DEFLATE.C,TREES.C}; existing
// Info-ZIP/FLI documentation credits are in NOTICE.md. See compressionFigures.ts
// for generated examples; ZIP sizes use the project's writer, not DOS PKZIP.
// Period command sources: PKWARE's PKZIP 2.04g help (February 1993) and Robert K Jung's
// April 1993 ARJ 2.41 manual (web links omitted on purpose: the mock-domain
// check scans source text).
// SARJ is documented in ARJ's October 1995 manual; no 1994 availability established,
// so the period prose explains solid compression without recommending that utility.
export const BBS_SIZE = `<h2>A smaller upload, a shorter phone call</h2>
  <p>A caller at 2400 baud may spend longer fetching your game than playing it. Work on a
  distribution copy, keep your originals, and compare the finished archives after each change.
  The bytes in the ZIP are the ones the caller waits for.</p>
  <h3>GIF screens: give the dictionary something to remember</h3>
  <p>Draw broad areas of color and horizontal runs of the same color instead of noisy
  dithering. GIF’s LZW compressor builds a dictionary of pixel strings; repeated strings
  can be written as codes. It is not simply a count of each run, but runs give it useful
  repetition. ZIP also rewards runs in uncompressed pixels; inside a GIF, LZW has already
  taken much of that saving.</p>
  <figure data-fig="compression-runs"></figure>
  <figure data-fig="compression-lzw"></figure>
  <p>Try fewer colors without speckled dithering. Save with a smaller color table and
  matching LZW minimum code size, rather than leaving a 256-color file with most entries
  unused. That can save palette bytes and start with shorter codes. Game-Maker’s GIF reader
  uses the declared color count to initialize its dictionary and clear/end codes, so keep
  those settings consistent; do not just patch the header. For two-color art, keep at least
  four table entries with a minimum code size of 2. Compare sizes and keep lettering
  readable. Fewer colors alone promise no particular saving.</p>
  <p>Leave out comments, application extensions and other optional information that does
  nothing for the picture. Game-Maker tries to skip extensions before the first image, draws that
  image and closes the file. Strip optional extensions rather than rely on every one being
  accepted. A GIF89a label does not make it play an animated GIF: delays,
  looping and transparency instructions in extensions are ignored. Export a plain, opaque
  still GIF for a screen; use FLI for a cartoon.</p>
  <h3>What ZIP can find</h3>
  <p>PKZIP’s DEFLATE method replaces repeated byte strings with back-references: a distance
  back and a length to copy, looking within the last 32 KB. It also codes common symbols
  compactly. Long runs of zeros (null bytes) and repeating patterns are especially good
  material. Random-looking noise and already-compressed GIF data usually shrink little.</p>
  <figure data-fig="compression-deflate"></figure>
  <p>Each file is compressed on its own. Two identical files under different names are
  still two entries; PKZIP does not keep one copy and point both names at it. Reuse files
  in the game and ship them once, rather than hoping ZIP will remove the duplicates.</p>
  <h3>Blocks and maps: repeat useful pieces</h3>
  <p>BBL, CBL and MBL store each 20×20 picture row by row, without compression inside the
  file. Vertical stripes make every row identical, so ZIP can match row after row. Horizontal
  bands give it long runs within rows. Noisy dirt and scattered dither offer fewer matches.</p>
  <figure data-fig="compression-blocks"></figure>
  <p>Leave unused slots blank: repeated zero bytes and other plain fills pack cheaply.
  A BBL still takes 63,000 bytes for 150 blocks, a CBL 21,000 for 50, and an MBL 42,000 for
  100, including their properties. Erasing slots does not shorten those DOS files. Similar
  blocks stored near one another can help ZIP a little when their strings fall within its
  window. Better still, use one block number repeatedly on the map instead of drawing copies:
  the map stores numbers, not another copy of the art. This leaves more slots blank and makes
  the map’s numbers repeat. Do not erase a block needed by animation or touch changes.</p>
  <p>Let several levels name the same block set and character files in the Integrator;
  new maps and palettes give familiar pieces variety. Ship each shared file once.</p>
  <h3>FLI cartoons: leave most of the picture alone</h3>
  <p>The first frame normally supplies a whole picture in bytewise runs (FLI_BRUN);
  an uncompressed FLI_COPY is another possibility. Later FLI_LC frames describe changed
  lines and pixel spans. Skipped pixels keep the prior frame’s pixels: this is a change
  record, not a transparent-color overlay. Unchanged lines between changed ones still need
  a small line count. Keep the background still and move small things. Camera pans and
  full-screen motion give the compressor much more to write.</p>
  <figure data-fig="compression-fli"></figure>
  <p>Use one palette throughout unless a change earns its place. A palette change needs
  another color chunk even when no pixels move. Fewer colors may make runs and patterns
  easier to draw, but FLI still uses 8-bit pixels; it does not become a 4-bit cartoon.</p>
  <p>Keep the cartoon short. To try half as many frames over roughly the same time, remove
  alternate frames and increase the delay in your animation program, then watch the result.
  FLI delays are whole 1/70-second ticks, or jiffies: 3 ticks gives about 23.3 frames per second,
  6 gives about 11.7. Neither setting is exactly 24 or 12 fps, and PLAYGAME waits those ticks
  after drawing, so a slow machine takes longer. Increasing the delay alone saves no frames
  or bytes. Keep FLI files, not FLC files renamed to FLI.</p>
  <p>A looping FLI may end with an extra “ring” frame that changes the last picture back to
  the first. PLAYGAME stops at the header’s frame count and never displays that extra frame.
  If your FLI tool can omit it and write a correct file size, leave it out of the distribution
  copy. Do not remove the first full picture or a counted frame. Keep your looping original.</p>
  <h3>Sound, music and words</h3>
  <p>Keep VOC recordings short: trim unwanted silence, keep important words whole, and try
  a lower recording sample rate where it still sounds right. Compare the saved files and
  test with the DOS sound driver; a lower rate is no excuse for muffled speech. Try PC speaker
  chirps for hops and pickups. Clear an unwanted VOC’s name from the sound set before omitting
  its file, and fill in the speaker tune. Keep the voice when the voice is the joke.</p>
  <p>CMF music stores instruments and timed note commands, not a recording of every sound;
  it is usually tiny beside a voice recording. Check the actual size before cutting the song.
  Plain text packs very well, especially repeated phrases. Keep the instructions and credits;
  they are often a cheap way to help the caller.</p>
  <h3>Pack a clean copy and test it</h3>
  <p>Transfer into a clean directory with the required player, drivers, instructions and
  credits. Leave out working copies and unused art. There, make a fresh archive with
  <code>PKZIP -ex GAME.ZIP *.*</code>; <code>-ex</code> requests extra compression.
  Extract into another empty directory and play through before uploading.</p>
  <p>Separate ZIPs don’t improve compression: PKZIP starts afresh for each file, even inside
  one archive. One ZIP saves extra archive wrappers and several transfers; changing file order
  won’t share patterns between files. If the board accepts ARJ, compare
  <code>ARJ a GAME.ARJ *.* -m1</code>. Ordinary ARJ also packs files separately. A <i>solid</i>
  archive packs files together, letting similar files help one another, but needs suitable tools.
  Ask what the sysop and callers can unpack. PLAYGAME needs the extracted DOS files.</p>
  <p>For a cautious phone-time budget, allow 10 bits per byte: eight data bits, a start and a
  stop. Use the connection’s bits per second, not the serial port setting:
  <b>minutes = ZIP bytes × 10 ÷ bits per second ÷ 60</b>. For 100 KB (102,400 bytes),
  102,400 × 10 ÷ 2400 ÷ 60 = <b>7.1 minutes</b>; at 14,400, <b>1.2 minutes</b>.</p>
  <table>
    <tr><th>Archive (1 KB = 1024 bytes)</th><th>2400 bps</th><th>14,400 bps</th></tr>
    <tr><td>100 KB</td><td>7.1 min</td><td>1.2 min</td></tr>
    <tr><td>500 KB</td><td>35.6 min</td><td>5.9 min</td></tr>
    <tr><td>1024 KB</td><td>72.8 min</td><td>12.1 min</td></tr>
  </table>
  <p>These are estimates: error-correcting modems change framing overhead; transfer packets,
  line trouble and retries change the result. Allow extra time. Don’t count on modem compression
  to shrink a ZIP again.</p>
  <p>A showcase game may earn its long download with a splendid cartoon, song and voice.
  A tutorial should get to its lesson quickly: plain backgrounds and a short opening often
  serve it better. Keep a sound lesson’s sounds and an animation lesson’s motion. Cut what
  delays the point; keep what makes the game worth the call.</p>`;
