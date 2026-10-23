# Original DOS source

The C, C++ and assembly source of **RSD Game-Maker 3.0** (1991–1995), by G. Andrew Stone,
G. Oliver Stone, Oliver Stone Jr. and Joan Stone of Recreational Software Designs.

- **As published, less a few files.** Every file here is as Andy Stone published it in
  2014, except that this fork removed other companies' files (below), including from
  `GM/GM.ZIP`, and added this README. It doesn't otherwise maintain them; they're kept
  for reference, and the web port follows their behavior.
- **Copyright and license.** The copyright notices in the files are the Stones' and still
  apply. In 2014 Andy Stone released the source under the MIT License: see
  [LICENSE](../LICENSE).
- **Left out.** Borland's runtime library files and graphics driver, and Creative's Sound
  Blaster library, were in this folder in the original repository. They aren't covered by
  the MIT License, so this fork leaves them out (also from `GM/GM.ZIP`). See
  [NOTICE.md](../NOTICE.md).
- **Other people's work.** Peter (Pete) Savage wrote `GM/SOUNDC.C`, `GM/JSTICKC.C` and
  `GM/JSTICKA.ASM`, and the digitized speech in `GM/SNDEDIT.C` with Andy Stone. These
  files and folders come from other authors and keep their own terms:
  - Info-ZIP's Zip and UnZip and the draft PNG library pnglib 0.6 (`Image/PNG`)
  - Sverre H. Huseby's GIFSAVE (`Image/GIF`)
  - Mark Adler's ship.c (`Image/PNG/SHIP17.ZIP`)
  - BMP2BGI (`Image/BMP2BGI1.ZIP`)
  - PKWARE's ZIP format note `GM/APPNOTE.TXT`, which credits David Schwaderer's CRC-32
  - Jim Kent's FLI document `Image/FLI/FLIDOC.TXT`

  The Sound Blaster headers `GM/SBC*.H` and `GM/SBMIDI.H` carry no notice but appear to
  be from Creative's developer kit. [NOTICE.md](../NOTICE.md) has the details, and the
  other pieces it flags.

To build it you need the Borland C++ compiler and the left-out files from the
[original repository](https://github.com/gandrewstone/GameMaker); the root
[README](../README.md) has the steps.
