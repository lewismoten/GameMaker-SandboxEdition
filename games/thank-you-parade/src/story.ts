// A page of story after each level card (30 columns, 16 lines), keyed by the level's file name: what the hour is and
// what has gone wrong with it. A key press moves on to the level.
import { wrap } from '../../kit/starter/text';

export const STORY_BEATS: Record<string, string> = {
  calltime: wrap(`
|6:40 AM

Penny has led the Hornets for eleven years and has never been late. She's early. The sun is still putting on its shoes.

Her pager says the band is on the way.

Her pager is an optimist.
`),
  gust: wrap(`
|7:05 AM

Six leaf blowers, all aimed down Main Street, all borrowed from the same cousin.

The class thank-you cards were supposed to be handed out.

They are now a weather event.
`),
  bakery: wrap(`
|7:20 AM

Mr. Okafor has the band's donut order, two hundred of them, and a shutter that comes down at 7:50.

Gigi told him the order was cancelled. She said it kindly. That's the worst part.

The front door is locked.

The roof is not.
`),
  rush: wrap(`
|7:50 AM

Mr. Boyle has crossed children at this corner since 1979.

He has five gates, five traffic lights and one whistle. The lights have never agreed about anything.

Nobody has ever been late because of Mr. Boyle. Today is a tight morning.
`),
  airstrip: wrap(`
|MEANWHILE

Across the county, Marge looks at a banner in eight pieces and a purple NO.

She has flown through fog, a flock of starlings and her cousin's wedding.

She has never flown through a NO.
`),
  creek: wrap(`
|8:05 AM

The bridge on Mill Creek is out. The sign says so. The sign is on the bridge.

Penny has a drum major's belief in shortcuts and a drum major's knees.

There are two ways over and she'll need both.
`),
  thaw: wrap(`
|8:15 AM

Behind the arena, Gigi flooded the lot overnight. A skating rink, she says, for morale.

It is fifty-one degrees.

The ice has a deadline and so does Penny, and the ice is more honest about it.
`),
  float: wrap(`
|8:30 AM

The fire hall holds the float and nothing to put on it.

Captain Ruiz offers coffee, advice and keys.

The coffee is free.
`),
  hall: wrap(`
|8:45 AM

Ridgemont's practice hall is unlocked, which is not how Gigi runs anything.

Three floors. Three locks. A goose in the basement named, according to the door, Gary.

Nobody has seen Gary and Gary has seen everybody.
`),
  drumoff: wrap(`
|9:00 AM

Elm Street, and Gigi with a clipboard and a rented row of confetti cannons.

A friendly drum-off, she says.

The cannons do not look friendly. They look rented.
`),
  route: wrap(`
|9:05 AM

Every veteran on the curb is holding up a scorecard. They have judged parades since before Penny could march.

Nobody has ever gotten a 10 out of Mr. Delgado.

Mr. Delgado has not met a 10.
`),
  stands: wrap(`
|9:10 AM

The grandstand has five rows, four judges and a scoreboard that has been wrong since 1987.

Penny has a few cards left. She counts them twice. She counts them a third time out of respect.
`),
  clock: wrap(`
|9:20 AM

The town clock has said 9:10 for as long as anyone can remember, and it has been right for eleven minutes of that.

The door to the face is at the top.

The cogs inside are on a schedule. It is not yours.
`),
  truck: wrap(`
|9:40 AM

Ridgemont's confetti truck is parked across Elm Street with the engine running and nobody driving.

A note on the windshield: ASK ME ABOUT THE FUSES.

Nobody asked. Gigi told you anyway.
`),
  stepoff: wrap(`
|9:58 AM

Two minutes. The front of the parade is right there.

So is the Ridgemont band.

So, somehow, is a llama.
`),
};
