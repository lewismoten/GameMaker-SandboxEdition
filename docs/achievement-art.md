# Achievement block art

Badges reuse the original 20×20 indexed blocks below, at integer-friendly display sizes.
The selected public games are by Lewis Moten using Anthropic Claude Opus 5.5 (MIT).
OpenAI Codex extracted the images and wrote the badge integration under Lewis's direction.
No third-party emoji artwork is copied into the badge images.

Run `npx vite-node scripts/achievementArt.ts` from `web/` to regenerate
`src/achievements/blockArt.json` and this inventory. The generator contains the
explicit source imports and selections, and rejects duplicate image bytes.

## Selected blocks

| Achievement | Public game | Source set / block |
| --- | --- | --- |
| make-edit | remote | remote / pen |
| export-windows | goat | goat / window |
| export-mac | teddy | city / apples |
| export-files | goat | goat / crate |
| first-steps | goat | goat / sandal |
| make-cards | teddy | city / poster |
| play-first | remote | remote / handheld |
| play-sandbox | teddy | park / bucket |
| play-teddy | teddy | teddy / stand |
| heart-first | goat | goat / tinHeart |
| egg-first | goat | goat / easterEgg |
| watch-one | remote | remote / vcrPlaying |
| desk-bbs | remote | remote / phone |
| desk-copycheck | remote | remote / guide |
| desk-clock | remote | remote / clock |
| desk-wastebasket | remote | remote / trash |
| desk-door | goat | goat / door |
| desk-window | remote | remote / window |
| desk-chicken | teddy | city / chicken |
| desk-mail | teddy | street / mailbox |
| desk-zine | remote | remote / mags |
| desk-light | remote | remote / lamp |

## Art still needed

These entries use a neutral question block until suitable, distinct art is selected.
Proposals are drawing briefs, not promises of another game. Each should remain readable
at 20×20 pixels; the friendly giant ideas could share a character while varying the action.
Hidden achievements keep their question block until unlocked, even when art is available.

| Achievement | Title | Proposed art |
| --- | --- | --- |
| make-new | Blank slate | 20×20 block: a blank sheet of paper with one folded corner, with a dark outline and one clear focal shape. |
| make-every-kind | Jack of all tools | 20×20 block: an open toolbox with a pencil and wrench, with a dark outline and one clear focal shape. |
| make-save | Saved to disk | 20×20 block: a floppy disk with a bright paper label, with a dark outline and one clear focal shape. |
| export-web | On the web | 20×20 block: a globe with a tiny network cable, with a dark outline and one clear focal shape. |
| export-dos | Back to DOS | 20×20 block: a beige CRT monitor showing a DOS prompt, with a dark outline and one clear focal shape. |
| export-linux | Penguin power | 20×20 block: a cheerful penguin with a disk tucked under one wing, with a dark outline and one clear focal shape. |
| export-all | Ships everywhere | 20×20 block: a taped shipping box with little wings, with a dark outline and one clear focal shape. |
| check-run | Check-up | 20×20 block: a magnifying glass over a tidy map grid, with a dark outline and one clear focal shape. |
| check-fix | Quick fix | 20×20 block: a sparkling wrench, with a dark outline and one clear focal shape. |
| check-upload | Ready to upload | 20×20 block: a clipboard with a large green check, with a dark outline and one clear focal shape. |
| make-walk | Let the bot play | 20×20 block: a friendly wind-up robot, with a dark outline and one clear focal shape. |
| sfx-maker | Bleeps and bloops | 20×20 block: a mixing panel with three chunky knobs, with a dark outline and one clear focal shape. |
| make-opening | Presenting… | 20×20 block: a clapperboard with a bright opening star, with a dark outline and one clear focal shape. |
| make-heat | Feeling the heat | 20×20 block: a tiny glowing map with warm footprints, with a dark outline and one clear focal shape. |
| make-take | Take one | 20×20 block: a tape recorder with a bright red record button, with a dark outline and one clear focal shape. |
| palette-vision | Seen by everyone | 20×20 block: a pair of glasses over three clearly distinct color swatches, with a dark outline and one clear focal shape. |
| every-life-1 | Gravity inspector | A friendly giant lands on a squashy cushion, wearing a helmet marked 1. |
| every-loss-1 | Professional retryer | A friendly giant gathers fallen game pieces beside a retry arrow marked 1. |
| every-win-1 | Shelf champion | A friendly giant balances a trophy stack beside a pennant marked 1. |
| every-life-3 | Gravity inspector 3 | A friendly giant lands on a squashy cushion, wearing a helmet marked 3. |
| every-loss-3 | Professional retryer 3 | A friendly giant gathers fallen game pieces beside a retry arrow marked 3. |
| every-win-3 | Shelf champion 3 | A friendly giant balances a trophy stack beside a pennant marked 3. |
| every-life-10 | Gravity inspector 10 | A friendly giant lands on a squashy cushion, wearing a helmet marked 10. |
| every-loss-10 | Professional retryer 10 | A friendly giant gathers fallen game pieces beside a retry arrow marked 10. |
| every-win-10 | Shelf champion 10 | A friendly giant balances a trophy stack beside a pennant marked 10. |
| play-finish | The end | 20×20 block: a checkered finish flag, with a dark outline and one clear focal shape. |
| finish-desk | After school special | 20×20 block: a school backpack with a game controller sticking out, with a dark outline and one clear focal shape. |
| finish-dos | Real mode | 20×20 block: a labeled DOS disk in a sleeve, with a dark outline and one clear focal shape. |
| finish-web | Surfin’ the Web | 20×20 block: a tiny surfer riding a curling cable, with a dark outline and one clear focal shape. |
| finish-phone-wide | Sideways scroller | 20×20 block: a landscape phone with left and right arrows, with a dark outline and one clear focal shape. |
| finish-phone-tall | Tall order | 20×20 block: a portrait phone with up and down arrows, with a dark outline and one clear focal shape. |
| play-save | Save point | 20×20 block: a cassette marked SAVE, with a dark outline and one clear focal shape. |
| play-bizarre | Bizarre fan | 20×20 block: a violin with one jaunty musical note, with a dark outline and one clear focal shape. |
| finish-sandbox | Sandbox champion | 20×20 block: a gold medal on a striped ribbon, with a dark outline and one clear focal shape. |
| finish-bizarre | Encore! | 20×20 block: a microphone taking a bow, with a dark outline and one clear focal shape. |
| blaster-big-name | Name in lights | 20×20 block: a speaker with three bright sound rays, with a dark outline and one clear focal shape. |
| brief-chapters | Chapter and verse | 20×20 block: a ribbon bookmark in an open book, with a dark outline and one clear focal shape. |
| trophy-first | Participation trophy | 20×20 block: a star-shaped merit medal, with a dark outline and one clear focal shape. |
| trophy-top | Over the top | 20×20 block: a wonky gold crown with three colored gems, with a dark outline and one clear focal shape. |
| saves-panel | Keeping score | 20×20 block: a small trophy inspired by “Keeping score”, with a dark outline and one clear focal shape. |
| heart-all | Heart collector | 20×20 block: a wreath of tiny shining tin hearts, with a dark outline and one clear focal shape. |
| egg-teddy | Lay an egg! | 20×20 block: a mischievous corgi beside a suspiciously lumpy felt egg, with a dark outline and one clear focal shape. |
| egg-all | A full basket | 20×20 block: a wicker basket full of different felt eggs, with a dark outline and one clear focal shape. |
| watch-all | Binge watcher | 20×20 block: a CRT showing a replay arrow, with a dark outline and one clear focal shape. |
| watch-seek | Skip ahead | 20×20 block: a film strip jumping over a small gap, with a dark outline and one clear focal shape. |
| watch-bot | Robot rerun | 20×20 block: a little robot turning a film projector crank, with a dark outline and one clear focal shape. |
| record-video | Rolling | 20×20 block: a movie camera with two round reels, with a dark outline and one clear focal shape. |
| download-mp4 | Director’s cut | 20×20 block: a curled strip of film with three distinct frames, with a dark outline and one clear focal shape. |
| desk-power | Power on | 20×20 block: a chunky power plug with a bright indicator, with a dark outline and one clear focal shape. |
| desk-gm | C:\GM> | 20×20 block: a beige keyboard with an oversized Enter key, with a dark outline and one clear focal shape. |
| desk-bbs-file | Downloading… | 20×20 block: an arrow landing in a floppy disk tray, with a dark outline and one clear focal shape. |
| bbs-every-speed | Every speed on the dial | 20×20 block: a modem with three rising signal bars, with a dark outline and one clear focal shape. |
| bbs-download-every-speed | The long way round | 20×20 block: a determined turtle carrying a modem, with a dark outline and one clear focal shape. |
| bbs-time-travel | Time traveler | 20×20 block: a clock with two fast-forward arrows, with a dark outline and one clear focal shape. |
| bbs-cant-wait | I can’t wait | 20×20 block: a tiny rocket trailing a telephone cable, with a dark outline and one clear focal shape. |
| bbs-got-time | I’ve got time | 20×20 block: a snail carrying a half-finished progress bar, with a dark outline and one clear focal shape. |
| bbs-door | Play by modem | 20×20 block: a rotary dial with its last hole highlighted, with a dark outline and one clear focal shape. |
| bbs-door-win | Three in a row | 20×20 block: a telephone number card crossed out in red, with a dark outline and one clear focal shape. |
| bbs-door-three | Best of three | 20×20 block: a small trophy inspired by “Best of three”, with a dark outline and one clear focal shape. |
| sofa-busy | All lines are busy | 20×20 block: a disconnected handset beside a sleeping modem, with a dark outline and one clear focal shape. |
| sofa-chat | Couch talk | 20×20 block: a welcoming sofa with a blinking terminal, with a dark outline and one clear focal shape. |
| tty-call | Typed hello | 20×20 block: a fax machine unrolling a tiny welcome banner, with a dark outline and one clear focal shape. |
| tty-sk | SK SK | 20×20 block: a waving hand beside a terminal, with a dark outline and one clear focal shape. |
| tty-wallphone | Wrong kind of phone | 20×20 block: a ringing rotary telephone, with a dark outline and one clear focal shape. |
| desk-time-reset | Back to now | 20×20 block: an alarm clock with a little callback arrow, with a dark outline and one clear focal shape. |
| desk-hexedit | Byte by byte | 20×20 block: a hex keypad with A and F keys, with a dark outline and one clear focal shape. |
| desk-savehack | Save scummer | 20×20 block: a screwdriver beside a saved-game disk, with a dark outline and one clear focal shape. |
| desk-backup | Safe and sound | 20×20 block: a backup drawer holding three labeled disks, with a dark outline and one clear focal shape. |
| desk-gmcrack | Party like it’s 1994 | 20×20 block: a playful pirate hat above a DOS prompt, with a dark outline and one clear focal shape. |
| desk-register | Registered user | 20×20 block: a registration form and a sharpened pencil, with a dark outline and one clear focal shape. |
| desk-egg | Not in any folder | 20×20 block: a felt chick peeking out of an egg, with a dark outline and one clear focal shape. |
| desk-egg-pages | Turn the page | 20×20 block: an open card file with colorful page tabs, with a dark outline and one clear focal shape. |
| desk-gamepad | Press start | 20×20 block: a chunky directional game pad, with a dark outline and one clear focal shape. |
| desk-mousepad | Square deal | 20×20 block: a square patterned mouse pad and a beige mouse, with a dark outline and one clear focal shape. |
| desk-soundcard | Beep mode | 20×20 block: a PC speaker beside a silent sound card, with a dark outline and one clear focal shape. |
| desk-achieve | Taking stock | 20×20 block: a clipboard full of tiny earned badges, with a dark outline and one clear focal shape. |
| cast-visit | Meet the cast | 20×20 block: two friendly theater masks, with a dark outline and one clear focal shape. |
| cast-parade | Curtain call | 20×20 block: two applauding hands under a stage light, with a dark outline and one clear focal shape. |
| help-all | Read the fine print | 20×20 block: a folded instruction leaflet, with a dark outline and one clear focal shape. |
| print-level-maps | Map reader | 20×20 block: a compass over a winding route, with a dark outline and one clear focal shape. |
| print-world-map | Fold-out | 20×20 block: a folded map with a clearly marked route, with a dark outline and one clear focal shape. |
| print-world-styles | Cartographer | 20×20 block: a ruler and a triangular map outline, with a dark outline and one clear focal shape. |
| library-visit | Quiet, please | 20×20 block: a miniature library facade, with a dark outline and one clear focal shape. |
| library-kinds | Well read | 20×20 block: three books with brightly different spines, with a dark outline and one clear focal shape. |
| mag-back | Cover to cover | 20×20 block: a rolled magazine tied with a ribbon, with a dark outline and one clear focal shape. |
| mag-features | Dog-eared | 20×20 block: a fanned stack of magazine feature pages, with a dark outline and one clear focal shape. |
| mag-disc | Free CD-ROM inside! | 20×20 block: a shiny disc in a paper magazine sleeve, with a dark outline and one clear focal shape. |
| offline-copy | Off the grid | 20×20 block: a powered-down screen with a tiny moon, with a dark outline and one clear focal shape. |
| link-in | Special delivery | 20×20 block: an open mailbox holding a letter, with a dark outline and one clear focal shape. |
| desk-moon | Moonstruck | 20×20 block: a smiling crescent moon with one star, with a dark outline and one clear focal shape. |
| desk-curtains | Behind the curtain | 20×20 block: a small trophy inspired by “Behind the curtain”, with a dark outline and one clear focal shape. |
| desk-speaker | Bass boost | 20×20 block: a small vibrating desk speaker, with a dark outline and one clear focal shape. |
| desk-degauss | Degaussed | 20×20 block: a CRT with expanding degauss color rings, with a dark outline and one clear focal shape. |
| desk-chez | Honk honk | 20×20 block: THE CHEZ seen from the front, with Teddy in the passenger seat, with a dark outline and one clear focal shape. |
| desk-blacklight | Glow up | 20×20 block: a purple blacklight tube above a glowing star, with a dark outline and one clear focal shape. |
| desk-uv | Lights out, lights on | 20×20 block: a glowing ultraviolet bulb, with a dark outline and one clear focal shape. |
| desk-plow | Plowed in | 20×20 block: a friendly snowplow pushing a little white drift, with a dark outline and one clear focal shape. |
| desk-sleds | Snow day | 20×20 block: a wooden sled leaving two tracks, with a dark outline and one clear focal shape. |
| desk-dogs | Loose again | 20×20 block: Teddy and Gwinn in a playful chase, with a dark outline and one clear focal shape. |
| desk-goat | Third goat from the left | 20×20 block: a surprised goat with a tiny musical note, with a dark outline and one clear focal shape. |
| desk-star | Make a wish | 20×20 block: a shooting star with a short stepped trail, with a dark outline and one clear focal shape. |
| desk-aurora | Northern lights | 20×20 block: a curtain of green and violet northern lights, with a dark outline and one clear focal shape. |
| desk-mailtruck | In the mail | 20×20 block: a small mail truck with a raised envelope emblem, with a dark outline and one clear focal shape. |
| desk-mailjeep | Mail call | 20×20 block: a boxy mail jeep with a letter in its window, with a dark outline and one clear focal shape. |
| desk-glance | Caught looking | 20×20 block: a friendly face peeking around a curtain, with a dark outline and one clear focal shape. |
| desk-lume | Glow in the dark | 20×20 block: a clock dial with glowing green hands, with a dark outline and one clear focal shape. |
| desk-egg-uv | Secret ink | 20×20 block: a flashlight revealing a felt egg, with a dark outline and one clear focal shape. |
| zine-read | Read all about it | 20×20 block: a little notebook with a ribbon marker, with a dark outline and one clear focal shape. |
