# Achievement block art

Badges reuse the original 20×20 indexed blocks below, at integer-friendly display sizes.
The selected public games are by Lewis Moten using Anthropic Claude (MIT).
The nine every-life, every-loss and every-win tier badges are composed from Teddy's poses
(hop, hurt, bark) with a bronze, silver or gold plate and a 1, 3 or 10 mark, by Claude Sonnet 5.5,
which also extracted the later picks and drew the thirteen new Certified Rat Tickler blocks (a toolbox, clipboard,
mixing panel, UV bulb, blacklight, CRT, sound card, hex keypad, screwdriver and disk, pirate hat, surfer, fax and
waving hand) as scenery in that game, and the eighteen new Final Curtain blocks (a rotary dial, number card, two masks,
ribbon book, leaflet, registration form, badge clipboard, blank sheet, film strip, clapperboard, magnifier, peeking face,
phone, busy line, heat map, speaker, medal and tin-heart wreath) as scenery in the green room, the stage and the curtain.
It also drew the six new A Fly Named Carl blocks (a backpack with a game controller, a DOS disk in its sleeve, a wide and a
tall phone, a winged parcel and a mail jeep) as scenery in the living room and the yard.
OpenAI Codex extracted the first images and wrote the
badge integration under Lewis's direction. No third-party emoji artwork is copied into the badge images.

Run `npx vite-node scripts/achievementArt.ts` from `web/` to regenerate
`src/achievements/blockArt.json` and this inventory. The sources and selections are in
`scripts/achievementSets.ts` and the tier badges in `scripts/achievementTiers.ts`; the generator rejects
duplicate image bytes.

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
| watch-all | remote | remote / vcr |
| offline-copy | remote | remote / vcrOff |
| mag-features | remote | remote / magsSpread |
| desk-backup | remote | remote / drawerOpen |
| make-take | remote | remote / tapes |
| desk-gm | remote | remote / keyboard |
| bbs-every-speed | remote | remote / modem |
| desk-power | remote | remote / plug |
| desk-gamepad | remote | remote / gamepad |
| desk-mousepad | remote | remote / mousepad |
| record-video | remote | remote / camcorder |
| desk-bbs-file | remote | remote / diskDrive |
| mag-disc | remote | remote / discSleeve |
| play-save | remote | remote / saveTape |
| blaster-big-name | carl | carl / speaker |
| desk-curtains | sleuth | sleuthParlor / curtain0 |
| cast-parade | sleuth | sleuthParlor / footlights |
| desk-time-reset | carl | carl / alarm |
| bbs-time-travel | reckoning | reckoning / clock0 |
| library-kinds | reckoning | reckoning / books |
| desk-moon | needle | needle / moon |
| make-save | sandcast | sandcast / floppy |
| sofa-chat | sandcast | sandcast / terminal |
| trophy-top | sandcast | sandcast / crown |
| export-web | brief | brief / library/globe |
| finish-sandbox | brief | brief / yard/medal |
| export-dos | sweats | sweatsWork / monitor |
| check-fix | sweats | sweatsOutside / wrench |
| finish-bizarre | sweats | sweatsHive / openMic |
| make-walk | year2000 | y2kMoon / robotproj |
| link-in | year2000 | y2kSuburb / mailbox |
| desk-egg | year2000 | y2kSuburb / egg |
| play-finish | snowbound | snowbound / finish |
| egg-all | teddy2 | teddy2House / basket |
| make-every-kind | tickle | tickle / toolbox |
| check-upload | tickle | tickle / clipboardOk |
| sfx-maker | tickle | tickle / mixer |
| desk-uv | tickle | tickle / uvBulb |
| desk-blacklight | tickle | tickle / blacklight |
| desk-degauss | tickle | tickle / crtRings |
| desk-soundcard | tickle | tickle / soundCard |
| desk-hexedit | tickle | tickle / hexPad |
| desk-savehack | tickle | tickle / screwdriverDisk |
| desk-gmcrack | tickle | tickle / pirateDos |
| finish-web | tickle | tickle / surfer |
| tty-call | tickle | tickle / fax |
| tty-sk | tickle | tickle / helloTerm |
| bbs-door | sleuth | sleuthParlor / rotaryDial |
| bbs-door-win | sleuth | sleuthParlor / numberCard |
| cast-visit | sleuth | sleuthParlor / maskPair |
| brief-chapters | sleuth | sleuthParlor / ribbonBook |
| help-all | sleuth | sleuthParlor / leaflet |
| desk-register | sleuth | sleuthParlor / regForm |
| desk-achieve | sleuth | sleuthParlor / badgeClip |
| make-new | sleuth | sleuthParlor / blankSheet |
| watch-seek | sleuth | sleuthParlor / filmJump |
| make-opening | sleuth | sleuthParlor / clapper |
| check-run | sleuth | sleuthParlor / loupeGrid |
| desk-glance | sleuth | sleuthParlor / peekCurtain |
| tty-wallphone | sleuth | sleuthParlor / deskPhone |
| sofa-busy | sleuth | sleuthParlor / busyLine |
| make-heat | sleuth | sleuthParlor / heatMap |
| desk-speaker | sleuth | sleuthParlor / deskSpeaker |
| trophy-first | sleuth | sleuthParlor / meritMedal |
| heart-all | sleuth | sleuthParlor / heartWreath |
| export-all | carl | carlYard / parcelWings |
| desk-mailjeep | carl | carlYard / mailJeep |
| finish-desk | carl | carl / packPad |
| finish-dos | carl | carl / dosDisk |
| finish-phone-wide | carl | carl / phoneWide |
| finish-phone-tall | carl | carl / phoneTall |
| every-life-1 | teddy | tiers / every-life-1 |
| every-life-3 | teddy | tiers / every-life-3 |
| every-life-10 | teddy | tiers / every-life-10 |
| every-loss-1 | teddy | tiers / every-loss-1 |
| every-loss-3 | teddy | tiers / every-loss-3 |
| every-loss-10 | teddy | tiers / every-loss-10 |
| every-win-1 | teddy | tiers / every-win-1 |
| every-win-3 | teddy | tiers / every-win-3 |
| every-win-10 | teddy | tiers / every-win-10 |

## Art still needed

These entries use a neutral question block until suitable, distinct art is selected.
Proposals are drawing briefs, not promises of another game. Each should remain readable
at 20×20 pixels; the friendly giant ideas could share a character while varying the action.
Hidden achievements keep their question block until unlocked, even when art is available.

| Achievement | Title | Proposed art |
| --- | --- | --- |
| export-linux | Penguin power | 20×20 block: a cheerful penguin with a disk tucked under one wing, with a dark outline and one clear focal shape. |
| palette-vision | Seen by everyone | 20×20 block: a pair of glasses over three clearly distinct color swatches, with a dark outline and one clear focal shape. |
| play-bizarre | Bizarre fan | 20×20 block: a violin with one jaunty musical note, with a dark outline and one clear focal shape. |
| saves-panel | Keeping score | 20×20 block: a small trophy inspired by “Keeping score”, with a dark outline and one clear focal shape. |
| egg-teddy | Lay an egg! | 20×20 block: a mischievous corgi beside a suspiciously lumpy felt egg, with a dark outline and one clear focal shape. |
| watch-bot | Robot rerun | 20×20 block: a little robot turning a film projector crank, with a dark outline and one clear focal shape. |
| download-mp4 | Director’s cut | 20×20 block: a curled strip of film with three distinct frames, with a dark outline and one clear focal shape. |
| bbs-download-every-speed | The long way round | 20×20 block: a determined turtle carrying a modem, with a dark outline and one clear focal shape. |
| bbs-cant-wait | I can’t wait | 20×20 block: a tiny rocket trailing a telephone cable, with a dark outline and one clear focal shape. |
| bbs-got-time | I’ve got time | 20×20 block: a snail carrying a half-finished progress bar, with a dark outline and one clear focal shape. |
| bbs-door-three | Best of three | 20×20 block: a small trophy inspired by “Best of three”, with a dark outline and one clear focal shape. |
| hint-phone-bill | An itemized bark | 20×20 block: a ringing rotary telephone, with a dark outline and one clear focal shape. |
| desk-egg-pages | Turn the page | 20×20 block: an open card file with colorful page tabs, with a dark outline and one clear focal shape. |
| print-level-maps | Map reader | 20×20 block: a compass over a winding route, with a dark outline and one clear focal shape. |
| print-world-map | Fold-out | 20×20 block: a folded map with a clearly marked route, with a dark outline and one clear focal shape. |
| print-world-styles | Cartographer | 20×20 block: a ruler and a triangular map outline, with a dark outline and one clear focal shape. |
| library-visit | Quiet, please | 20×20 block: a miniature library facade, with a dark outline and one clear focal shape. |
| mag-back | Cover to cover | 20×20 block: a rolled magazine tied with a ribbon, with a dark outline and one clear focal shape. |
| desk-chez | Honk honk | 20×20 block: THE CHEZ seen from the front, with Teddy in the passenger seat, with a dark outline and one clear focal shape. |
| desk-plow | Plowed in | 20×20 block: a friendly snowplow pushing a little white drift, with a dark outline and one clear focal shape. |
| desk-sleds | Snow day | 20×20 block: a wooden sled leaving two tracks, with a dark outline and one clear focal shape. |
| desk-dogs | Loose again | 20×20 block: Teddy and Gwinn in a playful chase, with a dark outline and one clear focal shape. |
| desk-goat | Third goat from the left | 20×20 block: a surprised goat with a tiny musical note, with a dark outline and one clear focal shape. |
| desk-star | Make a wish | 20×20 block: a shooting star with a short stepped trail, with a dark outline and one clear focal shape. |
| desk-aurora | Northern lights | 20×20 block: a curtain of green and violet northern lights, with a dark outline and one clear focal shape. |
| desk-mailtruck | In the mail | 20×20 block: a small mail truck with a raised envelope emblem, with a dark outline and one clear focal shape. |
| desk-lume | Glow in the dark | 20×20 block: a clock dial with glowing green hands, with a dark outline and one clear focal shape. |
| desk-egg-uv | Secret ink | 20×20 block: a flashlight revealing a felt egg, with a dark outline and one clear focal shape. |
| zine-read | Read all about it | 20×20 block: a little notebook with a ribbon marker, with a dark outline and one clear focal shape. |
