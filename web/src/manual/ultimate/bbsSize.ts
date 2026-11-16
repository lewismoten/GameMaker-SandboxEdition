// Chapter 17's BBS distribution advice, from Lewis's November 15, 2026 size reports.
// DOS layouts: packages/engine/src/formats/{blocks,gif,fli,voc}.ts and code/GM.
// Period command sources: PKWARE's PKZIP 2.04g help (February 1993), reproduced at
// https://bcgcanada.com/pages/pkzip.htm; Robert K Jung's April 1993 ARJ 2.41 manual:
// https://files.mpoli.fi/unpacked/drivers_1/dos/622/6_22.exe/arj.doc
// SARJ is documented in ARJ's October 1995 manual; no 1994 availability established,
// so the period prose explains solid compression without recommending that utility.
export const BBS_SIZE = `<h2>A smaller upload, a shorter phone call</h2>
  <p>A caller at 2400 baud may spend longer fetching your game than playing it. Work on a
  distribution copy, keep your originals, and compare the finished archives after each change.
  The bytes in the ZIP are the ones the caller waits for.</p>
  <ul>
    <li><b>GIF screens:</b> plain skies, broad colors and small repeating patterns usually
    pack better than busy, dithered art. GIF’s LZW compression remembers repeated strings of
    pixels. Try fewer colors in your paint program without speckled dithering to imitate the
    missing shades. Compare sizes; fewer colors alone promise no particular saving. Keep
    lettering readable. ZIP has little left to squeeze from a well-compressed GIF.</li>
    <li><b>FLI cartoons:</b> shorten the opening, use fewer cartoons and leave out unnecessary
    frames in your animation program. Try fewer frames with a longer delay, then watch for
    jerky motion. Keep proper FLI files rather than cutting bytes off by hand. A still GIF can
    do a title card’s job; a palette fade gives it a little ceremony.</li>
    <li><b>VOC sound:</b> recordings store samples throughout. Trim unwanted silence in the
    sound editor, keep important words whole, and try PC speaker chirps for hops and pickups.
    Clear an unwanted VOC’s name from the sound set before omitting its file; fill in the
    speaker tune. Keep the voice when the voice is the joke.</li>
    <li><b>BBL blocks:</b> a background set takes 63,000 bytes for 150 blocks, however few you
    draw. Blank space packs well; erasing blocks won’t shorten that DOS file. Instead, let
    several levels name the same block set and character files in the Integrator. New maps and
    palettes give familiar pieces variety. Ship each shared file once. A block absent from the
    map may still be needed by animation or touch changes.</li>
  </ul>
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
