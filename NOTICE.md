# Notice and credits

## A derivative work of RSD Game-Maker

This repository is a **modified fork** of the source code of _Game-Maker_, the game
construction kit produced from 1991 to 1995 by Recreational Software Designs (RSD) of
Amherst, New Hampshire. It was sold by direct mail in the US by KD Software (RSD also made a
distribution deal with GameLynk), in the UK as _Captain GameMaker_ by Screen Entertainment,
and worldwide on CD-ROM by Microforum, as [Wikipedia](https://en.wikipedia.org/wiki/Game-Maker)
records. Game-Maker was created by
G. Andrew (Andy) Stone with G. Oliver Stone, Oliver Stone Jr. and Joan Stone. Today it is
usually called **RSD Game-Maker**, to tell it apart from later, unrelated products with
similar names; this repository does the same.

On 12 July 2014 Andy Stone, Game-Maker's original programmer, published the source code,
the CD image and an installed copy on GitHub under the **MIT License**
([gandrewstone/GameMaker](https://github.com/gandrewstone/GameMaker)). This fork keeps
that history and that license. Everything added here (the browser version in `web/`, the
"1994 desk", the Sandbox Software and Bard of Bizarre games in `games/`, and the Mac,
Windows and Linux players in `mac/`, `win/` and `linux/`) is released under the same MIT
License; see [LICENSE](LICENSE), whose original copyright notice is kept unchanged as the
license requires.

## The name: Game-Maker: Sandbox Edition

To keep this fork from being mistaken for RSD's own release, it goes by **Game-Maker:
Sandbox Edition** (short: _Game-Maker SE_), after the Sandbox BBS Lewis ran in Pittsburgh in
the 1990s. It is based on RSD Game-Maker 3.0 and keeps its file formats, but it is not the same
program, and the pieces it draws are its own:

- the **Owner's Guide** on the desk is a new guide written for this edition, not the manual
  RSD shipped;
- the **Game-Maker box** and **CD** on the desk are this edition's own designs, marked
  "Sandbox Edition", not photographs or copies of the original box and disc;
- the DOS **Game-Maker** you run on the desk is a recreation drawn to look like the original,
  rebuilt in TypeScript from its source on a simulated PC; no DOS or x86 code runs.

Refer to this project as _Game-Maker: Sandbox Edition_ (https://github.com/lewismoten/GameMaker-SandboxEdition)
and to the original as _RSD Game-Maker 3.0_ (Game-Maker 3.0 by Recreational Software Designs)
(https://github.com/gandrewstone/GameMaker).

## Why a web version

When he released the code, Andy Stone said that people were free to use it as they liked,
but that "if there is interest in preserving the old games you guys made then porting
Game-Maker to modern OSes is the first step"
([Wikipedia: Game-Maker](https://en.wikipedia.org/wiki/Game-Maker)). Running it in a web
browser seemed the simplest way to reach every modern operating system at once: Windows,
macOS, Linux, Chromebooks, tablets and phones, with nothing to install.

The port's focus is **the original file formats**. Game-Maker: Sandbox Edition reads and writes
`.GAM`, `.MAP`, `.BBL`/`.MBL`/`.CBL`, `.MON`, `.CHR`, `.PAL`, `.SND`, `.REC` and the rest
byte for byte, so a game made in the browser today still loads in the original DOS
RSD Game-Maker and plays on original hardware or in a DOS emulator such as DOSBox, and an old
game folder opens in the browser unchanged.

## Credits

- **RSD Game-Maker 1.0–3.0** (1991–1995): Recreational Software Designs: G. Andrew Stone,
  G. Oliver Stone, Oliver Stone Jr. and Joan Stone. Source released under the MIT License
  by Andy Stone in 2014.
- **Peter (Pete) Savage** wrote Game-Maker's Sound Blaster voice-file routines
  (`code/GM/SOUNDC.C`) and joystick routines (`code/GM/JSTICKC.C`, `code/GM/JSTICKA.ASM`),
  and the Sound Designer's digitized speech with Andy Stone (`code/GM/SNDEDIT.C`).
- **This fork**: Lewis Moten.
- **The web port**: written with **Claude Opus 5.5** (Anthropic), covering both the
  _1994 desk_ (the recreated PC, DOS prompt, Game-Maker's VGA designers, the BBS) and the
  _modern web_ editor and player. AI assistance did most of the porting and code
  generation: reading the original C source, writing the TypeScript, building the Sandbox
  Software games in code, and testing them, directed and reviewed by Lewis.
- **Added to the site in October 2026**, also written by **Claude Opus 5.5** as Lewis
  directed, from no one else's code, art, data or recordings: the desk modem's line speeds
  and the handshake sounds you hear for each (see "Modem sounds" below); TERMINAL's TTY calls
  with Mrs. Novak (see "TTYs" below); the Sandbox BBS's door game, TIC-TAC-TOE BY MODEM, and
  its make-believe opponent SCROLLMASTER; the printable World Map and Level Maps, drawn from
  each game's own files; the editor's level check, its generators (the maze, the one-click
  fixes, the block-art helpers) and its walkthrough bot (see "The level check" below); opening
  games that other sites link to or send (`web/src/linkIn`, `docs/embed.md`); the new
  opening of Teddy's Theme (`games/kit/teddyTheme.ts`), an original tune for the Teddy games;
  and the "Made with Game-Maker: Sandbox Edition" opening sting the editor offers new games
  (`games/kit/madewith.ts`, shipped as `web/public/opening/madewith.fli` and `.gif`, ray
  traced like the Sandbox Software sting), the "PRESENTS" card the editor draws for a
  game's maker (`web/src/editor/tools/opening`), and _TURBO BUTTON_, the site's 1990s-style
  game magazine (`web/src/manual/magazine`): its words, layout and drawings, with screenshots
  drawn from the games themselves and its interview with Lewis drawn from his own account in
  `docs/history.md`. Like everything else added here they are under
  the MIT License, so the games they open can carry them anywhere.
- **Sandbox Software games** (`games/`): new games made for this fork, built in code into
  real Game-Maker files. "Sandbox Software", its address and its BBS number are fictional.
  The games were written and built by **Claude Opus 5.5**: the code, art, music, sounds and
  text. Many are drawn from Lewis "Lewie" Moten III: his blog writing, photos he provided,
  and conversations about his interests, experiences and hobbies. Lewis directed each game
  and played it as it came together, and his feedback shaped every one. Teddy, Gwinn,
  Doc Leo and THE CHEZ (Lewis's CitiCar) appear as themselves.
- **KEEP IT BRIEF!'s stories** are Lewis's 100 Word Stories, written for **Laurence Simon**'s
  weekly 100 Word Stories challenge on the
  [100 Word Stories Podcast](https://oneadayuntilthedayidie.com/). Each week's topic, shown on
  the game's story cards, was set by Laurence or chosen by the week before's winner, voted for
  by the podcast's writers and listeners; thanks to all of them.
- **The Bard of Bizarre games** (`games/`: Third Goat from the Left, Mustard Seed Hustle,
  Thread the Needle, Brother Camel, Loaf #13, Certified Rat Tickler, Where's the Remote?!,
  A Fly Named Carl, The Great Dairy Reckoning of 3:17 A.M., Cleanse Me, O Loofah, But Leave
  My Soul, I Screamed, She Smirked, Shakespeare in Sweatpants, and Veni, Vidi, Risi! by
  Lewis's group of that name): games made from Lewis's songs and monologues, presented as
  1995 shareware from The Sofa BBS; their shareware fee and address are part of the story,
  and they are free under the MIT License, except the voice clips cut from their recordings
  (see "The Bard of Bizarre recordings" below). The songs' lyrics and monologues were shaped with
  ChatGPT from Lewis's prompts, and their music and vocals were made with Riffusion (one
  service under three names: Riffusion renamed itself Producer.ai, and Google bought it and
  made it Google Flow Music); the games' FM scores are arranged from those recordings, and their
  voice clips are cut from them. The exceptions: Certified Rat Tickler came with no
  recording, so its music was composed for the game by Claude Opus 5.5, as was the music
  under The Great Dairy Reckoning's spoken recording and Shakespeare in Sweatpants' FM score
  (composed from the tempo, key and chords of its recordings' music beds); Mustard Seed
  Hustle's animated cover was made with Producer.ai (Riffusion's later name); the covers of Third Goat from the Left
  and Thread the Needle, Brother Camel were made with Riffusion; the other games' title and
  cover art was drawn for them by Claude Opus 5.5. The Bard's logo (the rooster in
  spectacles) was made with DeepAI, and the Doc Leo photos are Lewis's own. Claude Opus 5.5
  wrote and built the games themselves (code, levels, art and arrangements), directed by
  Lewis.
- **The BBS pictures** (`web/public/bbs`, downloadable from the Sandbox BBS's GIF Gallery and
  The Sofa's GIF area): the photos are Lewis's own (Teddy, Gwinn, the gazebo, the hobo clown
  and Doc Leo, colonial dress, the Dog House library and THE CHEZ), except **CHEZTED.GIF** and
  **THECHEZ2.GIF**, one shot of Lewis holding Teddy in front of THE CHEZ, which was taken by
  **Nicky Foster** of the Front Royal-Warren County Chamber of Commerce as a promotional photo
  of Lewis as one of the sponsors of its upcoming Revitalize or Die Civic Pride Workshop. The Bard logo (BARDLOGO.GIF) was made with
  DeepAI.
- **The desk's posters** (`web/public/desk`): the "Moten Snow-to-Software Operations" poster
  (`moten-snow-to-software.*`) was made with **DeepAI**, on Lewis's paid commercial plan. The
  Doc Leo black-light poster (`docleo-blacklight-*.webp`) was made by **Claude Opus 5.5** from
  two of Lewis's photos of himself, over many rounds of his corrections, with
  `games/kit/scans/blacklight.py` (Python with Pillow and NumPy). Its glance frames, in which
  Doc Leo now and then looks to one side and smiles, were drawn the same way from the same
  photo. The poster's DOC LEO lettering is set in **Phosphate** (Steve Jackaman and Ashley
  Muir; © International TypeFounders, Inc.), a typeface that comes with macOS: only the
  lettering's pixels are in the poster pictures, and no font file is in the repository.
- **Public-domain melodies.** The games' and the site's music is arranged and synthesized for
  this project (there is no recording to credit), but a few pieces quote older tunes whose
  compositions are in the public domain in the US:
  - _Teddy's Little Bigger Adventure_: `games/teddy2/disk/main.cmf` (Main Street) quotes
    **Yankee Doodle**, a traditional American tune (18th century), public domain; arrangement
    by the game.
  - _I Screamed, She Smirked_: `games/smirked/disk/title.cmf`, `story.cmf` and `foyer.cmf`
    open with the mordent of the **Toccata and Fugue in D minor**, BWV 565, credited to
    J. S. Bach (about 1704), public domain; arrangement by the game.
  - _The desk's wall phone_: its hold music (`web/src/desk/room/phone/sounds.ts`) is the
    opening of **Für Elise** by Ludwig van Beethoven (about 1810, published 1867), public
    domain.
  - _Teddy's Little Biggest Adventure_: its ending song (`games/teddy3/src/sound/music.ts`)
    plays **Happy Birthday to You**, the tune of "Good Morning to All" by Mildred J. Hill
    (1893), public domain in the US; arrangement by the game, which credits it on its
    credits screen.
  - _A hidden bonus on the site_: a music box (`web/src/eggs/musicBox.ts`) plays **Yankee
    Doodle**, the same traditional tune, public domain.
  - _RSD's sample music on the CD_ quotes public-domain works: `GMMOONLT.CMF` is the first
    movement of Beethoven's Piano Sonata No. 14, the **Moonlight** (1801); `GMRANGE.CMF` is
    **Home on the Range** (Daniel E. Kelley, music, and Brewster M. Higley, words, 1872).
  - _The shareware games A-J's Quest (`cd/sharware/ajquest`) and Ralph's game
    (`cd/sharware/fluffyr`)_ use `GMFAIRY.CMF`, the **Dance of the Sugar Plum Fairy** from
    Tchaikovsky's _The Nutcracker_ (1892), public domain.
- **Third-party music under copyright.** Three shareware games on the CD by A-J Games,
  _Bounerim_ (`cd/sharware/bounerm`), Ralph's game (`cd/sharware/fluffyr`) and _Sign of the
  Hedgehog_ (`cd/sharware/signhdg`), include `SND7.CMF`, an arrangement of John Williams's
  **The Imperial March** (1980), which is under copyright and not licensed by this project.
  It is kept as those games were distributed in the 1990s, unaltered, as part of their
  authors' original files.
- **Pictures in the CD's games.** Most of the CD games' pictures are drawn or rendered, but
  some are scanned photographs, paintings or frames of film. None of them name a source, so
  these were traced in October 2026 by looking at them and searching by text; where a source
  is not certain it says "likely" or "appears to be". They are kept unaltered, as their
  authors distributed them, and are not licensed by this project:
  - _Nebula_ (`cd/gameware/nebula`, RSD): `BLUE.GIF` is the **Blue Marble**, the photograph
    of the Earth taken by the crew of Apollo 17 in 1972
    ([NASA](https://en.wikipedia.org/wiki/The_Blue_Marble)), also small in `MENU.GIF` and
    `NOVA.FLI`. `SATRING.GIF` is a **Voyager 1** picture of Saturn's crescent and rings
    (1980, frame C3501159, the same picture as `cd/picture/space/planets/C3501159.GIF`),
    tinted blue. `YELOSUN.GIF`, `YELOLOW.GIF`, `YELOBYE.FLI`, `NOVA.FLI` and `MENU.GIF` appear
    to be a **Voyager 1** color picture of Jupiter's moon **Io** (1979) with a volcanic plume
    on its edge ([NASA/JPL](https://photojournal.jpl.nasa.gov/target/io)). These NASA pictures
    are in the **public domain** in the US. The green planet in `GREENHI.FLI`, `GREENBYE.FLI`
    and `HISCORE.GIF` is a planet photograph tinted green, likely also from NASA (possibly
    Mars); its source was not identified.
  - _Woman Warrior and the Outer Limits_ (`cd/gameware/outerlim`) and _Woman Warrior and the
    Attack From Below_ (`cd/gameware/warrior`), by Sheldon Chase for KD Software: their title
    pictures (`OLSTART.GIF`, `WARRIOR.GIF`, and the same collage in their `MENU.FLI`,
    `MENUBOX.FLI` and `TEXTBOX.FLI`) and the ending picture `OLENDING.GIF` are frames
    captured from the television series
    [**The Outer Limits**](<https://en.wikipedia.org/wiki/The_Outer_Limits_(1963_TV_series)>)
    (1963–1965). The game's own story screen says it "uses parts from two episodes",
    ["The Cry of Silence"](https://en.wikipedia.org/wiki/Cry_of_Silence) (1964), whose star
    June Havoc the woman appears to be, and
    ["The Zanti Misfits"](https://en.wikipedia.org/wiki/The_Zanti_Misfits) (1963). The series
    is **under copyright** (today MGM's), not licensed by this project.
  - _Paper Airplane_ (`cd/sharware/paperair`), by Matt Bell: its title picture `GMTITLE.GIF`
    is **The Nazgûl** by **Ted Nasmith** (gouache, first published in the 1990 Tolkien
    Calendar; [tednasmith.com](https://www.tednasmith.com/?p=214)), scanned with the title
    lettered over it. `OPENPAP.GIF`, a falcon turning into an F-16, may be **Jody Sjogren**'s
    _Metamorphosis II: Falconfyre_ (1986;
    [Wright State University](https://wright.libraryhost.com/repositories/2/top_containers/6194)),
    which was not confirmed. The figure of cloud over a runway in `ENDPAP.GIF` is a painting or
    photo collage whose source was not identified. All are **under copyright**, not licensed by
    this project.
  - _Sample_ (`cd/gameware/sample`, RSD): `SAMPLE.GIF`, also in `MENUBKG.FLI` and
    `TEXTBKG.FLI`, is a **painting** of tropical birds (a long-billed orange bird, a
    blue-and-yellow macaw, a hummingbird and egrets) whose artist was not identified;
    presumably under copyright.
  - _Houses_ (`cd/gameware/houses`, RSD): `HOUSES.GIF` and `BKG.GIF` are a **photograph** of a
    boathouse with a canoe on a pond; its source was not identified.
  - _Glubada Pond_ (`cd/gameware/glub`): `OCEAN.GIF` (also in `END.FLI`) is the CD's own
    picture library's `cd/picture/nature/OCEAN1.GIF`, a beach photograph; `POND.GIF` is its
    `cd/picture/nature/AMER01_I.GIF`, a mountain lake; and `WATER.GIF` is another photograph.
    Their sources were not identified.
  - _RSD's title picture_ (`GMTITLE.GIF`, "Recreational Software Designs' Game-Maker
    Presents:", in many of the CD's games) is lettered over a **photograph of clouds** whose
    source was not identified.
- **The CD's picture and animation libraries** (`cd/picture`, `cd/animate`) are a collection
  of 1990s GIF pictures and FLI animations of mixed and mostly unrecorded origin: NASA
  pictures (Voyager, Magellan, Viking, the Space Shuttle) alongside photographs of cars,
  places and animals whose photographers are not named and which are likely under copyright.
  They are kept as Andy Stone released them and are not on the website.
- **The sample and shareware games on the CD** (`cd/`) remain the work and copyright of
  their authors (RSD, A-J Games, KD Software, GameLynk, Sheldon Chase, Mark Hadley, Matt
  Bell and others). Shareware games are shown play-only, with their authors' original
  notices; they have no download, can't be edited, and the desk's make-believe GMCRACK
  leaves them alone. The CD's tools are kept as it held them, each its author's: LHarc 1.13
  (`cd/backup/LHARC.EXE`, "(c)Yoshi, 1988-89") and LHA 2.13 with its
  documentation (`cd/sharware/tools`, Haruyasu Yoshizaki), and Alchemy Mindworks' Graphic
  Workshop shareware for DOS and Windows (`cd/sharware/tools/GWSDOS.ZIP`, `GWSWIN.ZIP`).
  None of them are on the website.

## The Bard of Bizarre recordings: personal, non-commercial only

The Bard of Bizarre's song and monologue recordings were made with Riffusion (one service,
later called Producer.ai and now Google Flow Music) during Lewis's **free plan**. Lewis pays
for the service now, and the animated covers (Mustard Seed Hustle's and Thread the Needle,
Brother Camel's) were made on the paid plan, but every recording was made on the free plan. The service's terms for free-plan output allow
"personal, non-commercial uses only". So the recordings, and every voice clip cut from them,
are **not covered by the MIT License**: don't sell them or use them commercially. The
recordings themselves aren't in this repository.

These files are cut from those recordings (each game's `tools/cutClips.py` cuts them):

- `games/<id>/src/sound/clips/*.pcm` in goat, mustard, needle, loaf, remote, carl,
  reckoning, loofah, smirked, sweats and risi: the raw clips.
- The voice clips on each game's disk (`games/<id>/disk/*.voc`), and so in every download
  and on The Sofa BBS:
  - **Third Goat from the Left** (goat): HEY, HOOK, NIGHTLNG, SEESYOU, YAY.
  - **Mustard Seed Hustle** (mustard): ALIVE, FEET, HALLELU, HUSTLE, KEEPON, MOUNTAIN.
  - **Thread the Needle, Brother Camel** (needle): DREAM, GOLD, HUMPDOWN, SQUEEZE, THREAD.
  - **Loaf #13 (Left in the Basket)** (loaf): BREAD, COUNTME, MAMA, STILL, TWELVE, WASTED.
  - **Where's the Remote?!** (remote): DOGCAT, FRIDGE, HAND, MOM, RACCOON, REMOTE, SNEAKY.
  - **A Fly Named Carl** (carl): AUX, HOOK, LAMP, MISS, NAMED, SEEN, SMILE, TIME, WINDOW.
  - **The Great Dairy Reckoning of 3:17 A.M.** (reckoning): ALMOND, BEGONE, BETRAY, BETTER,
    CANT, COLON, COWARD, DEMON, ENEMY, INTOL, LACTAID, OHNO, SHINS, SUFFER, and FLUSHLAC and
    SLAMWRTH (a made sound followed by a clip).
  - **Cleanse Me, O Loofah, But Leave My Soul** (loofah): BRINE, LINE, LUCIFER, MANGO, NEVER,
    PINK, ROUGH, SCRUBBUS, WORSE, WRONG, and DRAINNEV and TOWEL (a made sound followed by a
    clip).
  - **I Screamed, She Smirked** (smirked): AFRAID, ASHAMED, CARDBRD, DONTRUN, EXIT, FOG,
    GETDOWN, JUICE, MILD, NOTREAL, OKAY, PATS, SNEEZING, SWORD, TARGET, WEREWOLF.
  - **Shakespeare in Sweatpants** (sweats): the 68 monologue clips, `<line>_L`, `_O`, `_P` and
    `_W` for each of ANTS, BIRD, BLNKT, CART, CHAIR, FICUS, GOAT, ITCH, KALE, LIKE, LILY, OUT,
    PEN, PIZZA, PLATE, SOCKS and UMBR.
  - **Veni, Vidi, Risi!** (risi): CANIS, CANTEMUS, CHEDDAR, CORONA, CURRIMUS, DII, FELIS,
    FLATUS, NEMO, PISCIS, QUIS, RIDETIS, SUMMA, TECTA, TER, TITUS, VICTORIA.

Each of those games' LICENSE.TXT names its clips under "VOICE CLIPS: NOT MIT", its readme and
credits say so, and the Windows, Mac, Linux, DOS and web-app downloads' notices repeat it, as
does the one-page download's text (`web/src/export/recordedAudio.ts`). **Everything else in each game is MIT licensed**: the
code, levels, art, text, the other sound effects (made in code) and the FM (CMF) music
arranged or composed by Claude. Certified Rat Tickler has no recording, so none of it is
affected.

## About this fork

Lewis bought Game-Maker in 1992 with money earned shoveling snow that winter
([Moten Snow-to-Software Operations](https://lewismoten.com/1992/12/11/moten-snow-to-software-operations-founder-operator/)).
He made a few games with it, among them a Christmas game full of candy canes and Santa
Claus, but never sold or gave them out, and none survive: they were lost with much else in
an apartment fire during college. He never received a newsletter, never knew there were
BBSes trading Game-Maker games, and never heard there was a later version; he left for
college in 1994, and his parents may well have taken any mail for junk. The original
license and payment terms confused him and felt restrictive, which was the main reason he
never shared his games. He was a kid without a bank account who bought things with money
orders paid for out of his allowance. The Sandbox BBS, the Owner's Guide's plain wording
and the free, open license here are the version of Game-Maker he wishes he'd had.

## Third-party formats, trademarks and code

Game-Maker: Sandbox Edition contains no third-party code except as listed. It reimplements file
formats from their published descriptions and from Game-Maker's own source.

- **GIF**: "The Graphics Interchange Format© is the Copyright property of CompuServe
  Incorporated. GIF℠ is a Service Mark property of CompuServe Incorporated." GIF images
  are encoded and decoded with LZW compression, which was patented by Unisys; those
  patents expired in 2003–2004.
- **FLI** animations: the Autodesk Animator format of Autodesk, Inc., implemented from its
  public documentation.
- **Sound Blaster**, **CMF** (Creative Music File), **VOC** and **SBI**: trademarks and
  formats of Creative Technology Ltd. The CMF player is a port of Game-Maker's own
  `SBMUSIC.C` and of the behavior of Creative's SBFMDRV driver; no Creative code is used.
- **OPL2 / YM3812** FM synthesis: a chip by Yamaha Corporation. The emulation in
  `web/src/audio/opl.ts` was written for this project.
- **The music editor and its FM instruments** were made for this project. The editor is an
  original design, not based on AdLib's Visual Composer, and no AdLib or Creative instrument
  bank is included. The classic piano and brass, and one kick drum used in two games, matched
  AdLib's `STANDARD.BNK` settings (PIANO1, BRASS1, BDRUM1). They were replaced with original
  patches in October 2026. Some of the original RSD songs in `cd/` and `runtime/` use
  AdLib's BRASS1 settings; they are kept as RSD released them.
- **8×8 text font**: Daniel Hepper's `font8x8_basic`, in the public domain, derived from
  the IBM PC BIOS font.
- **Caveat** (the handwriting in the Owner's Guide's registration record,
  `web/src/manual/regRecord.ts`), a font by Impallari Type ("Copyright 2014 The Caveat
  Project Authors"), under the SIL Open Font License 1.1. Its 600 weight, cut to Latin-1
  with fontTools (its name and license kept inside it), is kept with the site as
  `web/src/manual/fonts/caveat-600.woff2`, with the license beside it (`Caveat-OFL.txt`), so
  the page asks no font server for it. It isn't in exported games.
- **ChatGPT**, **Riffusion** (later **Producer.ai**, now Google's **Google Flow Music**:
  one service under its successive names) and **DeepAI** are their owners' names for the
  tools used to make the Bard of Bizarre songs and art (see Credits); none of their code is
  used.
- **MS-DOS** is a trademark of Microsoft Corporation; **IBM PC** of IBM; **DOSBox** is a
  separate GPL program and is not included.
- **Modem sounds** on the desk (`web/src/retro/bbs/modem.ts`, `lineSpeed.ts`): the dial tone,
  touch-tones (the standard DTMF pairs), rings and each line speed's handshake are
  synthesized in code from the published standards: **Bell 103** (300 baud) and **Bell 212A**
  (1200), the Bell System's, and the ITU-T's **V.22bis** (2400), **V.32** and **V.32bis**
  (4800 to 14,400), **V.8** and **V.34** (28,800 and 33,600) and **V.90** (56K). No recording of
  a modem is used. The names are their owners'; nothing else of theirs is used.
- **TTYs (text telephones)** on the desk (`web/src/retro/bbs/baudot.ts`, `tdd.ts`,
  `ttyInfo.ts`): the 5-bit Baudot code at 45.45 baud, its 1400/1800 Hz tones and its US
  figures table follow ITU-T Recommendation V.18 (1994) and ANSI/TIA-825. The code table was
  cross-checked against Asterisk's `main/tdd.c` (GPL v2, Digium); none of its code is used.
  The period facts are from Gallaudet University's Technology Access Program (TTY Basics,
  V.18 notes), the FCC (relay service nationwide from July 26, 1993), and Ultratec.
  **Ultratec** and **Turbo Code** are Ultratec, Inc.'s names; Turbo Code (U.S. Patent
  5,432,837) is named only as the historical protocol, and nothing of it is implemented.
  Mrs. Novak and her number (555-0156) are made up.
- **Real names in the games.** The games name some real hardware, software and products of
  their time as part of the setting: AdLib, VGA, the RCA 1802, MOS 6502 and Atari 400, Yamaha's
  OPL3, AMI BIOS, PKZIP and PKUNZIP, Xmodem, Ymodem and ZMODEM, Renegade BBS, QEMM, the 286 to Pentium, Windows 3.1 and NT, OS/2, the ATI, Trident, Tseng and
  Paradise Super VGA cards (from RSD's own system requirements), the Remington Noiseless
  typewriter, Autodesk Animator and the CitiCar, an electric car Sebring-Vanguard built in the 1970s (Lewis's own car, THE CHEZ). Brand names also appear where Lewis's
  song lyrics and his 100 Word Stories (in _KEEP IT BRIEF!_) are quoted word for word. These
  are trademarks of their respective owners; no endorsement is implied. Every other store,
  arcade, brand, product and publication in the games is made up.
- **Borland C++** was included in the original 2014 repository (in `tools/`) to build the
  DOS source; it is Borland's (now Embarcadero's) software and is not covered by the MIT
  License, so this fork leaves it out. The README says where to get it.
- **The git history** still holds them: the early commits contain Borland C++ (`tools/BORLANDC`)
  and the Borland and Creative library files listed below, which later commits removed. Those
  files in the history are their owners' and aren't covered by the MIT License.
- **Borland's runtime library** files that Game-Maker's source was built with (`CL.LIB`,
  `EMU.LIB`, `MATHL.LIB`, the startup code `STARTUP.ASM`, `SETARGV.ASM`, `SETENVP.ASM`,
  `FULLPATH.C`, `RULES.ASI`, and the `EGAVGA.BGI` graphics driver) and **Creative's Sound
  Blaster library** `SBCL.LIB` were in `code/` in the original repository. They belong to
  Borland and Creative Technology, not the MIT License, so this fork leaves them out (also
  from `code/GM/GM.ZIP`). The web port uses none of them: its sound and graphics are
  written from the formats and from how the DOS programs behaved.
- **`SNDBLAST.DRV`**, the Sound Blaster voice driver in `cd/gm` and `runtime/run/GM`, is
  Creative Technology's software ("Copyright (c) Creative Technology Pte Ltd., 1989-1990.
  All rights reserved") and is not covered by the MIT License. It is included as it came
  on the original Game-Maker CD, and "Export for DOS" adds it to exported games the way
  Game-Maker's own Transfer utility did. It will be removed if Creative asks.
- **`XFERPLAY.EXE`** and Game-Maker's other DOS programs (`cd/gm`, `runtime/run/GM`) were
  built by RSD with Borland C++ and Creative's library, so they hold Borland's run-time
  code ("Borland C++ - Copyright 1991 Borland Intl.") and Creative's FM music functions
  ("Copyright (c) Creative Technology Pte Ltd, 1990"), as every program built with them did.
  "Export for DOS" ships `XFERPLAY.EXE` (renamed after the game) and `SNDBLAST.DRV` with
  a README that gives Game-Maker's MIT License and names these parts.
- The desk's hardware brands (BOOMTONE, PIXELMAX, SQUEAK, AwkWard BIOS) and its phone
  numbers are made up, as are the magazines and awards on the game boxes and the magazine
  _TURBO BUTTON_, its prices and its coupons. Its two BBSes
  are named after real Pittsburgh boards, The Sofa and the Sandbox (Lewis's own); how they
  look, what's on them and their numbers are made up.
- **TURBO BUTTON's Game-Maker ad** (its inside front cover, `web/src/manual/magazine/sections/ads.ts`)
  takes its look from the full-page Game-Maker ad by RSD and KD Software in _Computer Gaming
  World_ #99 (October 1992), page 55
  ([Internet Archive](https://archive.org/details/Computer_Gaming_World_Issue_99/page/n53/mode/2up)):
  a hot pink page, big condensed serif headlines, a grid of screenshots and an order coupon.
  Its words, pictures and coupon are new; nothing of the original ad is reproduced, and the
  page links to the original.
- **The level check** (`web/src/editor/check`): its heat map's six colors are taken from
  **viridis**, the color map by Stéfan van der Walt and Nathaniel Smith (CC0, public domain
  dedication), chosen because it reads with every kind of color vision; its monster contrast is
  the **relative luminance and contrast ratio** of the W3C's Web Content Accessibility
  Guidelines (WCAG) 2. Both are used as published; no code of theirs is included.
- **The palette editor's Color vision check** (`web/src/editor/editors/palette/colorVision.ts`)
  simulates protanopia, deuteranopia and tritanopia with the severity-1.0 matrices published
  by **Gustavo M. Machado, Manuel M. Oliveira and Leandro A. F. Fernandes**, "A
  Physiologically-based Model for Simulation of Color Vision Deficiency" (IEEE Transactions
  on Visualization and Computer Graphics 15(6), 2009), applied in linear RGB. Its grayscale is
  the WCAG 2 relative luminance above, and it measures how alike two colors look with the
  CIE's **CIELAB** color space and 1976 color difference (ΔE), using the sRGB standard's
  (IEC 61966-2-1) transfer curve. All are published formulas and numbers; no code of theirs
  is included.
- **The sound effect makers** (`web/src/audio/sfxSynth.ts`, `sfxPresets.ts` and
  `web/src/editor/tools/speakerFx.ts`) follow the idea of **sfxr**, Tomas Pettersson's
  ("DrPetter") 2007 sound effect generator: a few sliders for pitch, slide, vibrato and an
  envelope, with presets (jump, coin, hurt, explosion…) that give a new take each time. The
  synthesizers were written fresh for this project; no sfxr code is included.
- **The sound set editor's "Preview as PC speaker"** (`web/src/audio/vocToSpeaker.ts`) finds
  each step's pitch with the normalized square difference function and its "first peak near the
  highest" rule from **Philip McLeod and Geoff Wyvill**, "A Smarter Way to Find Pitch"
  (Proceedings of the International Computer Music Conference, 2005), with parabolic
  interpolation of the peaks, and falls back on the zero-crossing rate for noise. Written fresh
  from the paper; no code of theirs is included.
- **The music editor's accompaniment generator** (`web/src/editor/editors/music/arrange/`)
  finds a tune's key with the **Krumhansl-Schmuckler** method, using the major and minor key
  profiles published by **Carol L. Krumhansl and Edward J. Kessler** (Psychological Review 89,
  1982), and picks its chords with a Viterbi pass; its takes are seeded with **Mulberry32**, the
  public-domain generator by Tommy Ettinger. Its band's patterns follow the project's own
  `games/kit/song.ts`. The profile numbers are published data; no one else's code is included.
- **Mr. Yuck** is a trademark of UPMC Children's Hospital of Pittsburgh. The green
  poison-warning sticker on the desk's phone is a simple drawing in tribute to it, not the
  original artwork.

## The Mac, Windows and Linux players

Download → Mac, Windows and Linux wrap a game's one web page in a small player program
written for this project (`mac/`, `win/`, `linux/`; the prebuilt players are in
`web/public/mac`, `web/public/win` and `web/public/linux`). Every such download carries the
notices below that apply to it as `THIRD-PARTY-NOTICES.txt` (and the Windows `.exe` inside
itself, under its window menu's "Third-party notices…"); the text is in
`web/src/export/notices.ts`. What the players contain or use from others:

- **Windows: the WebView2 interface header.** `win/Player/webview2.h` lists the vtable slots
  and interface IDs the player calls, generated from `WebView2.h` of Microsoft's WebView2 SDK
  (NuGet `Microsoft.Web.WebView2` 1.0.3485.44), which is under a BSD-style license:
  "Copyright (C) Microsoft Corporation. All rights reserved." The license's full text is
  kept at the top of that file. No other SDK file is included, nor Microsoft's
  `WebView2Loader.dll`.
- **Windows: finding the WebView2 runtime.** The player loads the runtime's own
  `EmbeddedBrowserWebView.dll` from the folder Edge's updater records in the registry, the
  approach of the open source [webview](https://github.com/webview/webview) library (MIT
  License, Copyright (c) 2017 Serge Zaitsev, Copyright (c) 2022 Steffen André Langnes). The
  approach is credited in `win/Player/main.c`; the player's code is written in C for this
  project.
- **Windows: the Microsoft Edge WebView2 Runtime** is Microsoft's software, part of Windows
  10 and 11; it is not included. Microsoft Edge and WebView2 are trademarks of Microsoft.
- **Windows: the C runtime startup code.** The `.exe` players are built by `win/build.sh`
  with [Zig](https://ziglang.org/) (MIT License), whose MinGW-w64 libraries link a little of
  the MinGW-w64 runtime's startup code into each program; the program otherwise calls only
  Windows' own DLLs. In the runtime's words, such a program "was built using MinGW-w64 and
  statically linked against the MinGW-w64 runtime. Some parts of the runtime are under
  licenses which require that the copyright and license notices are included when
  distributing the code in binary form." Those permissive notices (the mingw-w64 project's
  own, copyright 2009–2013, and its contributors') are listed in
  [COPYING.MinGW-w64-runtime.txt](https://github.com/mingw-w64/mingw-w64/blob/master/COPYING.MinGW-w64-runtime/COPYING.MinGW-w64-runtime.txt).
- **Linux: GTK 3 and WebKitGTK** (`libwebkit2gtk-4.1` or `-4.0`, with GLib and GTK; GNU
  LGPL 2.1 or later) are loaded with `dlopen` when the player starts, from the computer's own
  packages. None of their code or headers is included: the few functions the player uses are
  declared by hand in `linux/Player/main.c`. The program is built by `linux/build.sh` with
  Zig against glibc 2.28, so it carries only glibc's small start files (GNU LGPL 2.1 or
  later, with the exception that lets them be linked into any program).
- **Mac: AppKit and WebKit**, Apple's frameworks that are part of macOS. The player
  (`mac/Player/main.swift`) links only to the system's own libraries.
- Zig itself is a build tool; beyond the runtime pieces above, the Windows and Linux
  players may contain a few of its compiler support routines (compiler_rt, MIT License,
  Copyright (c) Zig contributors). The `.dmg`, `.tar.gz` and `.zip` containers, the Mac code signature and the Windows
  resources are written by this project's own code in `web/src/export/`.

## Third-party code and acknowledgments in the original source

The original source in `code/` is the Stones' work, but it also holds other people's code
and documents, kept as Andy Stone published them. Each keeps its own terms, not the MIT
License, and its notices stay in the files. Most of it is reference material that
Game-Maker's makefiles don't build.

**Documents and citations**

- **CRC-32**: PKWARE's ZIP format description `code/GM/APPNOTE.TXT` (described in
  `code/Image/PNG/INDEX` as from PKZIP 1.93a) says "The CRC-32 algorithm was generously
  contributed by David Schwaderer and can be found in his excellent book 'C Programmers
  Guide to NetBIOS' published by Howard W. Sams & Co. Inc." The same file credits Roger
  Schlafly for PKZIP's encryption and Robert Mahoney for the `.ZIP` name, and cites
  Storer, _Data Compression, Methods and Theory_ (Computer Science Press, 1988) and Held,
  _Data Compression, Techniques and Applications_ (John Wiley & Sons, 1987). Game-Maker's
  own C and assembly code computes no CRC.
- **FLI format**: `code/Image/FLI/FLIDOC.TXT`, the _Turbo C FLI Library_ document for
  Autodesk Animator files, "Copyright 1989-1990 Dancing Flame, San Francisco. Program Code
  and Library by Jim Kent. Documentation by Jim Kent and Heidi Brumbaugh." Andy Stone's
  `FLI.CPP` quotes it in a comment.
- **PNG specification**, tenth draft (`code/Image/PNG/PNG10.TXT`, `PNG.TXT`): copyright
  1995 Thomas Boutell, which may be reproduced only "in complete and unaltered form".
- **References in comments**: `code/GM/SVGAA.ASM` marks a commented-out ATI bank switch
  "From svgakt30.zip", and `code/DRV/STLTH64.ASM` cites "vgadoc3" for an S3 register.
- Also kept as found: the Association of Shareware Professionals' ombudsman statement
  (`code/GM/OMBUDSMN.ASP`); a captured SunOS 5.4 `make` manual page
  (`code/Image/PNG/MAKEINFO.TXT`); and the installer's credit line for Haruyasu
  Yoshizaki's LHarc (`code/GM/FLOPINST.CPP`), the archiver it ran (`LHARC.EXE` itself
  is on the CD, in `cd/backup`; see above).

**Bundled code by other authors** (all under `code/Image/`)

- **Info-ZIP Zip 2.0.1 and UnZip 5.12** (`PNG/ZIP`, `PNG/UNZIP`, `PNG/ZIP201.ZIP`,
  `PNG/UNZIP512.ZIP`). Zip: "Copyright (C) 1990-1993 Mark Adler, Richard B. Wales,
  Jean-loup Gailly, Kai Uwe Rommel, Igor Mandrichenko and John Bush. Permission is granted
  to any individual or institution to use, copy, or redistribute this software so long as
  all of the original files are included, that it is not sold for profit, and that this
  copyright notice is retained." UnZip's terms are in `PNG/UNZIP/COPYING`. They include
  Samuel H. Smith's 1989 copyright on the code in `UNREDUCE.C` and the old unshrink, which
  says "Do not use any of this in a commercial product"; Igor Mandrichenko's VMS code (not
  for profit); and Greg Roelofs's `UNSHRINK.C`, which requires his name to stay with it.
  Mark Adler put `inflate`, `explode`, `funzip` and `ship` 1.7 (`PNG/SHIP17.ZIP`) in the
  public domain or left them uncopyrighted. `PNG/ZIP/MKTIME.C` is copyright 1988, 1989
  David MacKenzie. Info-ZIP's comments also thank Haruhiko Okumura (`ar`/`ar002`).
  `PNG/UNZIP/CONTRIBS` lists the other contributors.
- **pnglib 0.6** (`PNG/T`, `PNG/PNGLIB06.ZIP`, 1 May 1995), the draft PNG reference
  library: "Copyright (c) 1995 Guy Eric Schalnat, Group 42, Inc." It may be used, copied,
  modified and distributed provided its origin isn't misrepresented, altered versions are
  marked, and the notice in `png.h` stays. The zlib library it needs isn't included.
- **GIFSAVE** 1.0 (`GIF`), by Sverre H. Huseby (1992): "dedicated to the Public Domain".
  It isn't part of Game-Maker's build.
- **BMP2BGI** 1.0 (`BMP2BGI1.ZIP`, 1991) by Richard G. Rasulis, Jr. ("(c) R.G.Rasulis
  Consulting Services"). Its `BMP.H` is "(c) Ziff-Davis Publishing", from Charles
  Petzold's article in _PC Magazine_ (vol. 10, no. 10, pp. 365–370). No license is
  given.

**Unattributed, so flagged rather than credited**

- `code/GM/SBC.H`, `SBCVOICE.H`, `SBCMUSIC.H`, `SBCTS.H` and `SBMIDI.H` declare the
  functions of Creative's Sound Blaster library (`SBCL.LIB`, left out, above). They
  carry no notice but appear to come from Creative's developer kit.
- `code/Image/LZTIMER.H` declares `ZTimerOn`/`ZTimerOff`/`ZGetTime`, the names used by
  Michael Abrash's "Zen timer". The timer itself isn't included, and its use in
  `IMAGE1.CPP` is commented out.
- `code/DRV/S3_BIOS.ASM` (not built) looks like code taken from a disassembled S3 video
  BIOS.
- `code/GM/APTE.TXT` appears to be a Borland technical note.
- The sample pictures in `code/Image/PNG/PICS` are of unknown origin. One of them says so
  itself ("Peppers").

**What the web port uses**: none of this code. `web/src/project/zip.ts` writes its own
table-driven CRC-32 (the standard ZIP polynomial that APPNOTE credits to Schwaderer) and
follows APPNOTE's layout. The FLI reader `web/src/formats/fli.ts` follows Andy Stone's
`FLI.CPP` and the format in Kent's `FLIDOC.TXT`. The GIF LZW coder in
`web/src/formats/gif.ts` is new, not GIFSAVE. `web/src/formats/voc.ts` reproduces Peter
Savage's `SOUNDC.C`, and `web/src/vga/sndedit.ts` ports `SNDEDIT.C`.

## Tools used to build and test

Built with [TypeScript](https://www.typescriptlang.org/) (Apache-2.0),
[Vite](https://vitejs.dev/), [Vitest](https://vitest.dev/) and its vite-node (MIT), and
`@types/node` (MIT), and checked with [Prettier](https://prettier.io/) and
[ESLint](https://eslint.org/) with `@eslint/js`, `typescript-eslint`, `eslint-config-prettier`
and `globals` (MIT). These are the only packages in `web/package.json`, all used only to build
and test; none of their code ships in the app except Vite's small module runtime and preload
helper (MIT). The site's Credits page (`#/credits`) lists every one of them and the packages
they use, with versions and licenses, from `web/package-lock.json`. The native players are built with Zig (MIT) and, on a Mac, Apple's Swift compiler;
see above for what ends up in them.

The desk's black-light poster (`games/kit/scans/blacklight.py`) is drawn on the developer's
computer with Pillow (MIT-CMU License) and NumPy (BSD); the Caveat font was cut down with
fontTools (MIT). Only their output is committed.

The Bard of Bizarre games' song tools (`games/kit/song/*.py` and each game's
`tools/analyze.py` and `tools/cutClips.py`) run on the developer's computer with ffmpeg,
NumPy and SciPy (BSD), and OpenAI's Whisper (MIT) for word timings when it is installed.
They read recordings that are not in the repository, and nothing of theirs is
committed except the note data and clips they produce. Browser checks during development
(Playwright, Apache-2.0, and any accessibility checker run with it) are run from outside the
repository and are not dependencies of it.
