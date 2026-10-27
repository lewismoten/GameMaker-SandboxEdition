# `tour/`: the guided tour

Part of the [source map](../README.md).

Characters from the games show a visitor around: one walks over to a real control and points
at it or presses it while another (or the same one) says what it does in a speech bubble, with a caption along the
bottom (read out to screen readers), a Sandbox game's music played quietly, and its sound
effects. The hosts and props are the regulars' own sprites (`public/cast/sprites.json`, made
from the games' files by `scripts/castSprites.ts`); the music and effects are a Sandbox game's
own `.CMF` and `.VOC` files. Never a secret game's characters or files, and never the Bard of
Bizarre's recordings (they are for non-commercial use, and the tour may be recorded for video).

## Starting it

- The header's **?** button (`tourButton.ts`): Show me around this page, Guides wait on this page
  (Teddy and Gwinn stand in the corner of that page, offering its tour; remembered per page in
  `localStorage` `gm-tour-on`, off by default), Watch the whole tour, Record the whole tour.
- ⚙ Settings › **Guided tour** (also in the ⋯ menu): the whole tour.
- The address: `#/?tour=all` (the whole tour), `#/?tour=home` (one chapter), with `&record` for
  recording mode. The request leaves the address once read, so a reload doesn't start it again.

## The chapters

The whole tour plays them in this order, each on its own page with hosts from a fitting Sandbox
game, that game's music and its sound effects:

| Chapter                                | Page                             | Hosts (voice)                                                                          | Music                     |
| -------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------- | ------------------------- |
| `home`: the game list (the Games page) | `#/`                             | Teddy (barks), Gwinn (Kokoro Sky +4)                                                   | Teddy's title             |
| `library`                              | `#/library`                      | Joe, KEEP IT BRIEF!'s night librarian (olden-mon); teenage Lewie, Snowbound (Lewis +5) | KEEP IT BRIEF!'s library  |
| `achievements`                         | `#/achievements`                 | Dex Dynamo, In The Year 2000! (Kokoro Puck +3)                                         | In The Year 2000!'s title |
| `cast`                                 | `#/cast`                         | Doc Leo (Lewis's own voice), Teddy, Gwinn                                              | Teddy's Clown Club        |
| `guide`                                | `#/help` (always its first part) | Inspector Ada Penn, Final Curtain (Kokoro Emma)                                        | Final Curtain's parlor    |
| `settings`: the ⚙ menu                 | `#/credits`                      | Courier Max, Maximus (scroobie)                                                        | Maximus's station         |
| `editor`                               | `#/p/look:logic/kitchen.map`     | Watt, Ohm Sweet Ohm (Lewis +7), the BLASTER ship flying by                             | Ohm Sweet Ohm's garage    |

The Settings chapter opens the menu to show each item and shuts it again, and starts nothing
(no download, no restore). The editor chapter looks inside Ohm Sweet Ohm as released: read-only
and in memory, so it makes no project and changes none of the visitor's; started from their own
game, it goes back there when it ends. Still to write: `dos` and `desk` (`chapters/index.ts`
`PLANNED`).

In a tour: Back, Pause, Next, Sound (the mute switch, remembered as `gm-tour-sound`; a browser
whose demo sound is None starts muted) and Close tour; Esc ends it from anywhere, and the keyboard
goes back where it was. Steps move on by themselves. With reduced motion the hosts appear where
they are going instead of walking, and nothing bobs or pulses.

**Recording mode** (`&record`, or Record the whole tour): a Start card first (its click lets the
music play), then no pointer and no buttons, a title card before each chapter, the caption larger,
and the same pace every time. The keys still work: Space pauses, ← and → step, M mutes, Esc ends.
A 1280×720 or 1920×1080 window records cleanly.

## Files

- `steps.ts`: the data's shape (no DOM): a chapter's page, address, hosts, music and steps; a
  step's id, action (enter, walk, point, press, say, exit), target, bubble, caption, sound,
  duration, whether a press really clicks (only where harmless) and whether it is optional; the
  hosts, props, sounds and music the tour may use, and the bubble and caption limits.
- `chapters/`: one file per chapter (above), `targets.ts` (the header's links and the Settings
  menu's items, which more than one chapter points at) and `index.ts`, the whole tour in order with
  the chapters still to write.
- `lines.ts`: every line as `{ id, chapter, where, speaker, text }` (`tourLines()`, no DOM) for the
  narration script, which records `public/tour/voice/<chapter>/<id>.ogg` per line. A step plays
  its clip when there is one and lasts at least as long; without one the bubble's timing is used.
- `tourPages.ts`: what the ? button needs up front: the page an address shows, the pages with a
  chapter, the per-page switch and a tour asked for in the address.
- `tourButton.ts` (`tourButton.css`): the ? button and its menu, and the Settings item. The rest
  of the folder is its own download, loaded only when a tour starts or the guides wait on a page
  (`firstLoad.test.ts`).
- `tourStart.ts`: starting a chapter or the whole tour, and the guides waiting in a page's corner.
- `tourEngine.ts` (`tour.css`): the player: the layer over the page (it never takes a click),
  the ring and arrow on the control, the bubble, the caption bar and its buttons, title cards
  (with the chapter's hosts), menus and panels opened to show an item in them and shut again,
  another address on the same page for a step (`go`: the editor's palette after its map; Back
  goes back to it), a chapter that always plays at its own address (`always`), and the keys.
- `findTarget.ts`: a step's control on the page: the first visible match of its selectors (so a
  narrow window's ⋯ menu stands in for a header link; one cut off by a box that hides its overflow,
  like a phone's folded tip, doesn't count), and the menu or panel to open to show it.
- `place.ts`: where a host stands by a control, where a bubble goes (on screen, off the control,
  above the caption bar) and how long a walk takes, as plain math.
- `actor.ts`: a host or prop on the layer: its sprite's walk and front frames on a canvas.
- `tourSound.ts`: the music, the effects, the mute switch and a step's voice clip.

## A new chapter

Write its steps in `chapters/<id>.ts` (ids `<chapter>-<what>`, lowercase), add it to
`chapters/index.ts` and its page to `tourPages.ts` `CHAPTER_PAGES`, and list the files that make
its page's controls in `tourData.test.ts` `SOURCES`. A new host is a sprite in
`scripts/castSprites.ts` (run it to rewrite `public/cast/sprites.json`) and an entry in `steps.ts`
`HOSTS` with its voice; then `npm run voice` records the new lines. `tourData.test.ts` checks every selector is really made there, the text fits a phone's bubble, the ids are unique and the sprites, sounds and music are
Sandbox games' own. Check what each control really does before describing it. A page outside
today's web (the desk, `dos.html`) will need the button or an entry of its own there, and a
`pageOf` for its address.
