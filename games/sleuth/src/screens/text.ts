// The words: what everyone says, what the evidence shows, and the pages PLAYGAME writes
// over the pictures. Display_File shows 16 lines a page, 31 columns wide; the answer
// screens keep to 20 columns so the speaker's portrait stays clear on the right.
import { withCreditPage } from '../../../kit/license';

/** Word-wraps paragraphs ("\n\n" between them, "\f" forces a new page) into 16-line pages. */
export function pages(text: string, width: number): string {
  const out: string[] = [];
  for (const pageText of text.split('\f')) {
    const lines: string[] = [];
    pageText
      .trim()
      .split('\n')
      .forEach((para) => {
        if (!para.trim()) {
          lines.push('');
          return;
        }
        let line = '';
        for (const word of para.trim().split(/\s+/)) {
          if (word.length > width) throw new Error(`Word too long: ${word}`);
          if (!line) line = word;
          else if (line.length + 1 + word.length <= width) line += ' ' + word;
          else {
            lines.push(line);
            line = word;
          }
        }
        if (line) lines.push(line);
      });
    // split into 16-line pages, padding each so the next starts at the top
    for (let i = 0; i < lines.length; i += 16) {
      const pg = lines.slice(i, i + 16);
      while (pg.length < 16) pg.push('');
      out.push(...pg);
    }
  }
  while (out.length && !out[out.length - 1]) out.pop();
  for (const l of out) if (l.length > 31) throw new Error(`Line over 31 columns: ${l}`);
  return out.join('\n') + '\n';
}

export const wide = (t: string) => pages(t, 30);
export const narrow = (t: string) => pages(t, 20);

// ---------------------------------------------------------------- the menu pages

export const STORY = `Port Ellery, Saturday,
October 31, 1936.

Opening night at the Paragon Theatre: THE RAVEN'S BRIDE, a new melodrama written by, directed by and starring the Paragon's owner, Victor Crane.

Six hundred people watched Act III. As the bride Rowena, Lila Fontaine stabbed the wicked Count Corvin with a trick dagger, the kind whose blade slides into the handle.

Victor Crane fell, as he did at every rehearsal.

This time he did not get up.
\f
The dagger in his heart was not the trick dagger. It was real: an antique blade with a raven's head on the pommel, as sharp as the day it was made.

The audience has gone home. The cast and crew are held in the green room. The rain has not stopped.

At half past ten, a police car pulls up under the marquee and Inspector Ada Penn of Homicide steps out.

She has until dawn.`;

export const HELP = `Search the Paragon for evidence, question the suspects, then name the killer.

ARROWS or W A S D: walk
Q and E: walk up and left / up and right
NUMBER PAD 7 9 1 3: the four diagonals
SPACE: pick up what you stand on
L: look through the lens (once you have it)

F1 help   F2 your evidence
F3 music  F4 sound
F5 save   F6 load   ESC quit
\f
SEARCHING

Evidence glints where it lies. Stand on it and press SPACE. F2 lists what you carry; your evidence count shows as "Money".

Some things only show to a sharp eye with the right tool. Some doors want a key. When an act asks for evidence, the green room door counts it: push the door, then push again.

Walls and notes can be read where they hang. Remember what they say!
\f
QUESTIONING

In the green room, walk up to a suspect to sit down with them. Step on a card to ask that question; you will find yourself back in your chair to ask another. The EXIT card ends the talk.

The evidence board holds your notes on everything you have found. Step up to a card to read it again.

At dawn you name the killer, then say HOW and WHY. You have three chances. The Commissioner will not wait for a fourth.`;

const CREDITS_TEXT = `FINAL CURTAIN
Version 1.0, 1995

Story, design, art, music and programming: Claude

Made with GAME-MAKER 3.0 by Recreational Software Designs. No programming needed!

For everyone who ever stayed in the theater after the lights went down, and heard the ghost light hum. And for archivists who fix old papers a letter at a time.
\f
THIS IS SHAREWARE

Copy it for your friends and upload it to your favorite BBS. If you enjoy it, please register for $15. You get the Final Curtain Hint Book and our next mystery.

Sandbox Software
Dept. CURTAIN
P.O. Box 000
Pittsburgh, PA 15213

(A made-up address. Please do not mail anything.)`;

// ---------------------------------------------------------------- briefings

export const GR1_INTRO = `Sergeant Dobbs holds the green room door for you.

"Five of them had reason to want Crane dead, Inspector, and all five are in here. Walk up to one and sit down to ask your questions.

"Your evidence is pinned up on the board. Step up to a card to read it again.

"When you've heard enough, the EXIT door takes you back into the theater. The power goes off at two.

"And the Historical Society ladies want you to read their plaque in the lobby. I said you were busy."`;

export const GR2_INTRO = `Two in the morning. The coffee is cold and the suspects are not talking to each other.

"You've got it all now," says Dobbs. "Show them what you found. Watch who sweats.

"When you're sure, take the EXIT. By dawn they'll all be up on that stage waiting for you to name the killer."`;

export const ACC_INTRO = `Dawn. Gray light through the loading door. The suspects stand on the stage of the Paragon in a row, under the work lights.

Step up to the one you accuse.

Then say HOW it was done, and WHY. You have three chances; the Commissioner will not wait for a fourth.

If you are not ready, the BACK OFF card takes you to the green room.`;

export const HOW_INTRO = `Oliver Pike looks at you over his glasses.

"Me? I never left my seat, Inspector. But do go on. Tell everyone HOW I did it."`;

export const WHY_INTRO = `Pike says nothing now. His hands have found the carnation in his lapel and are slowly taking it apart.

"And WHY," he says, "would I do a thing like that?"`;

// ---------------------------------------------------------------- the evidence board

export const EVIDENCE: Record<string, string> = {
  coroner: `DOC AVERY, CORONER

One stab wound to the heart, from a real and very sharp blade. Death in under a minute, at about 9:48.

No poison in the blood or the stomach.

The weapon: an antique dagger with a raven's head on the pommel. It looks like the trick prop. It is not.`,
  checklist: `PROP CHECKLIST

Felix Morrow's clipboard from the stage-right prop table.

"ACT III:
DAGGER (TRICK) - OK 9:00 F.M."

At nine, when the interval began, the trick dagger was on the table.`,
  stub: `TICKET STUB

ROW F, SEAT 9.

Found under the prop table in the stage-right wing, behind the scenes, where no one with a ticket should be.

Only the lens showed it, in the dust in the table's shadow.`,
  chart: `SEATING CHART

From the box office. Seat F-9, on the aisle:

"MR. O. PIKE,
THE COURIER.
COMP. (Asked for this seat.)"`,
  policy: `INSURANCE POLICY

From Victor Crane's desk. A life policy on Victor Crane for $50,000.

Beneficiary: Agatha Crane.

Dated October 15, 1936: two weeks ago.`,
  ledger: `CLOAKROOM LEDGER

"#13 - Mr. O. Pike: raincoat and umbrella.
Umbrella taken out by owner at 9:05."

It was never brought back. The raincoat is still on its hook.`,
  umbrella: `UMBRELLA, TAG #13

Found in the old prop vault beyond the dark under the stage, stood behind a trunk. Wet, black, a cloakroom tag on the handle: #13.

Furled inside it: the TRICK dagger. Its blunt blade slides into the handle when it is pushed.`,
  safe_ms: `MANUSCRIPT

From Victor Crane's safe.

"THE RAVEN'S BRIDE
A Play in Three Acts
by Oliver Pike
1931"

Victor's red pencil is all over it. The play Victor called his own was written by somebody else.
\f
In the Remington Noiseless on his desk: a fresh title page, typed and signed "V.C."`,
  cuesheet: `LIGHT CUE SHEET

From the booth, Act III.

"Cue 41: blackout before the death scene."

It is crossed out: "CUT at dress rehearsal - V.C."

The whole of Act III played in full light.`,
};

/** Between the green room's sofa cushions at 2 AM: who left it, and the note tucked inside. */
export const EGG = `THE VELVET CURTAIN EGG

Between the green room's sofa cushions: a felt egg, deep theater red, with gold checks, a comedy mask and a gold curtain-tie.

PERFORMED BY
Doc Leo, hobo clown (standing backward in line, as usual)
\f
A NOTE TUCKED INSIDE

Case 13, never closed: one recipe card lifted in 1776, one root beer the family will not discuss, one kitchen door with flour on the knob.

Last note, underlined twice:
"Count the eggs again. A baker always does."`;

// ---------------------------------------------------------------- the interviews

export interface Talk {
  hello: string;
  r1: [string, string, string];
  hello2: string;
  r2: [string, string, string];
}

export const TALK: Record<'lila' | 'edgar' | 'agatha' | 'felix' | 'pike', Talk> = {
  lila: {
    hello: `Lila Fontaine, the Raven's Bride. Still in her Act III gown.

"Ask me anything, Inspector. Everyone else has."`,
    r1: [
      `"In my dressing room the whole interval, with Mrs. Hobbs, my dresser. She was letting out the seams on this gown. She never left me and I never left her."`,
      `"Victor made me a star. He never let me forget it."

She will not look at the vanity mirror in her dressing room.`,
      `"At a quarter to ten I took the dagger off the prop table for my entrance, the way I always do.

"It was heavier. Colder. I thought Felix had found a better prop."`,
    ],
    hello2: `"You've been all over the building, Inspector. Did you find what you were looking for?"`,
    r2: [
      `You ask about the letter on her mirror: "Sign, or I tell all. V."

"Yes. He was blackmailing me into another five years. My contract would have run out in June and I'd have been free of him anyway. I didn't need him dead. I only needed June."`,
      `She stares at the trick dagger in the umbrella.

"That's mine. The one I rehearsed with. So the one I used tonight... oh, God. Somebody made me do it."`,
      `"Oliver's name! He told me once that a play of his was stolen, years ago. I thought he meant some other play.

"We were sweethearts, a long time ago. He's married now: Margaret, and twin girls in Sutton. He's devoted to them."`,
    ],
  },
  edgar: {
    hello: `Edgar Bliss, Victor's understudy. He played the Herald in Act I, and then he had the night off.

"Make it quick, Inspector. I've a performance tomorrow."`,
    r1: [
      `"At the lobby bar. Ask Sam; he'll have my tab chalked up on his board. Two gin fizzes, and I'm not ashamed of either."`,
      `"A great actor and a very small man. I'm his understudy, so now I'll play Corvin. Write that down; I know how it looks."`,
      `"Around five past nine, a fellow in evening dress came past the bar carrying a wet umbrella, heading back into the house.

"Who carries an umbrella indoors? He stopped to squint at the Historical Society's clippings on the lobby wall, too. Nobody reads those."`,
    ],
    hello2: `Edgar is pacing.

"Still here, Inspector? So am I. So are we all."`,
    r2: [
      `"That's it! That's the umbrella I saw. Black, dripping, with a cloakroom tag on the handle."`,
      `"Number thirteen, Pike? Yes, I saw the coat girl hand it over. I thought he was leaving early. Critics do."`,
      `"Will I play Corvin tomorrow? Yes. God help me, I wanted that part.

"But I wanted to take it off him on a stage, in front of everybody. Not like this."`,
    ],
  },
  agatha: {
    hello: `Agatha Crane: Victor's wife, now his widow, and co-owner of the Paragon. Her pearls are perfectly straight.

"Well, Inspector?"`,
    r1: [
      `"Counting the house in the box office with Nell, our cashier. We signed the count at ten past nine. It's pinned on the wall in there, if you don't believe me."`,
      `"Our marriage was a business arrangement. And the business, Inspector, was losing money."`,
      `"Mr. Pike of the Courier asked for seat F-9 particularly. On the aisle. Critics usually sit where we put them."`,
    ],
    hello2: `"You have my keys and my theater, Inspector. What else could you want?"`,
    r2: [
      `"The policy? Victor took it out himself, for the bank, to cover our loan. Fifty thousand will just about pay what we owe. I won't see a dime of it."`,
      `"F-9, yes. It's on the aisle, near the pit gate. Pike came to the window himself to ask for it."`,
      `She reads the title page twice.

"So that's what Victor kept in the safe. He used to laugh about 'Pike's little play.'

"He typed at night on that Remington Noiseless. He bought a Noiseless so nobody would hear him rewrite their lines.
\f
"For the record: our books show not one dollar between the Paragon and Mr. Pike, either way. Ever."`,
    ],
  },
  felix: {
    hello: `Felix Morrow, stage manager, thirty years at the Paragon. A pencil behind his ear and a cold pipe in his hand.

"Ask away, miss. Inspector."`,
    r1: [
      `"At nine sharp I checked the prop table, stage right. The trick dagger was in its place. I ticked it.

"Then I was on stage with my crew, six of us, resetting for Act III behind the main curtain until the bell."`,
      `"Thirty years I've run his stage. He meant to sack me after this run. I'd have gone quietly. I'm too old to do anything else."`,
      `"After the interval I found the pit door unlatched. I latch it myself every night at half past seven, before the house opens. Every night."`,
    ],
    hello2: `"Find anything in my theater, Inspector? Mind the trap room; it's black as pitch down there."`,
    r2: [
      `"That's my hand. Nine o'clock: trick dagger, OK. It was there. I'd swear to it in any court you like."`,
      `"Cue 41? We cut that blackout at the dress rehearsal. Victor wanted the whole house to see his death. Act III ran in full light, start to finish."`,
      `"The goblet? Cold tea, Inspector. Every night. I pour it myself, and I drank what was left of it after. I'm still here."`,
    ],
  },
  pike: {
    hello: `Oliver Pike, drama critic for the Port Ellery Courier. Round glasses, a red carnation, a notebook.

"I have a review to file, Inspector."`,
    r1: [
      `"In my seat, F-9, writing notes for my review. I never left it. I never do."`,
      `"A ham. But he knew how to fill a house.

"And the play was rather good. Surprisingly good, for Victor.

"The Courier misprinted its title once, you know. I've spent my life correcting other people's mistakes."`,
      `"Nothing at all, Inspector. I was writing."`,
    ],
    hello2: `Pike is writing in his notebook. He does not look up.

"Yes?"`,
    r2: [
      `"F-9. Anyone could drop a ticket stub, Inspector. Theaters are full of them."`,
      `He is quiet for a long moment.

"I wanted... my notes. They were in my coat. Is that a crime now?"`,
      `His face goes white, then red.

"Five years. I gave him that play in his own office in '31 and he laughed at me. Then he put his name on it and sold out the house.

"I have nothing more to say."`,
    ],
  },
};

// ---------------------------------------------------------------- the accusation

/** Why each wrong answer is wrong (shown before the Commissioner's strike). */
export const WRONG: Record<string, string> = {
  lila: `"Lila Fontaine? She struck the blow, yes. But Mrs. Hobbs swears she never left her dressing room in the interval, and the trick dagger was swapped then. Lila only did what the play told her to do."

The Commissioner shakes his head.`,
  edgar: `"Edgar Bliss? Sam's chalkboard has him at the bar at 9:05 and again at 9:15, the whole interval. He wanted the part, Inspector, not the gallows."

The Commissioner shakes his head.`,
  agatha: `"Mrs. Crane? She and Nell signed the box office count at ten past nine, and the policy only pays the bank. She was counting money while somebody swapped that dagger."

The Commissioner shakes his head.`,
  felix: `"Felix Morrow? He ticked the trick dagger OK at nine in his own hand, and then six stagehands watched him reset the stage until the bell. He'd hardly write down his own alibi and then break it."

The Commissioner shakes his head.`,
  poison: `"Poison? Doc Avery found none. Crane died of one stab wound from a real blade, and that goblet held cold tea; Felix drank the rest of it."

The Commissioner shakes his head.`,
  dark: `"A knife in the dark? There was no dark. Cue 41 was cut at the dress rehearsal; six hundred people watched Act III in full light."

The Commissioner shakes his head.`,
  love: `"For love of Lila? Pike has a wife and twin girls in Sutton, and Lila says he's devoted to them. Whatever they had ended long ago."

The Commissioner shakes his head.`,
  money: `"Money? Mrs. Crane's books show not one dollar between Crane and Pike, ever. Crane didn't owe him money, Inspector."

The Commissioner shakes his head.`,
};

export const WON = `"Yes," says Oliver Pike at last. "It was my play."

He wrote THE RAVEN'S BRIDE in 1931 and took it to Victor Crane, who laughed him out of the office, then put his own name on it five years later.

On opening night Pike took his umbrella from the cloakroom at 9:05. Inside it was an antique dagger, the twin of the trick prop.
\f
He went down the aisle from F-9, through the pit gate and the pit door, under the stage and up the trap stairs into the empty stage-right wing.

He put the real dagger on the prop table and slid the trick one into his umbrella. His ticket stub fell under the table.

Then, hearing the crew, he stood the umbrella in the old prop vault beyond the trap room and was back in his seat for the bell.

At 9:48 Lila Fontaine did the rest without knowing it.
\f
The Paragon opens again on Tuesday with Edgar Bliss as Count Corvin. The program, and a Courier correction, say the play is by Oliver Pike.

Lila Fontaine's contract is torn up. Felix Morrow keeps his job. Agatha pays the bank.

And Inspector Ada Penn goes home, as the sun comes up over Port Ellery, to sleep until the evening papers.

CASE CLOSED.`;

export const LOST = `The Commissioner holds out his hand for your badge.

"Three wrong answers, Penn. The papers will have a field day."

Somewhere in the house, the ghost light hums. The real killer goes home and writes a review.

Go back over the evidence and try again: everything you need is in the Paragon.`;

// ---------------------------------------------------------------- the act cards

export const ACT_CARDS = {
  act1: {
    title: 'ACT ONE',
    time: '10:30 P.M.',
    lines: [
      'The house is empty. Victor Crane',
      'died on this stage at 9:48. The',
      'dagger in his heart was real.',
      '',
      'Find 4 pieces of EVIDENCE, then',
      'knock at the GREEN ROOM door',
      'backstage. (F2 counts them.)',
    ],
  },
  act2: {
    title: 'ACT TWO',
    time: '2:00 A.M.',
    lines: [
      'Mrs. Crane has given you her keys.',
      'The power is off. Only the ghost',
      'light burns.',
      '',
      'Find 4 more: in the cloakroom,',
      "the booth, Victor's safe and the",
      'prop vault past the dark under',
      'the stage. Then the green room.',
    ],
  },
};

/** Plain paragraphs wrapped at 31 columns (no page padding), for README.TXT. */
export function wrap31(text: string): string {
  const out: string[] = [];
  for (const para of text.trim().split('\n')) {
    if (!para.trim()) {
      out.push('');
      continue;
    }
    const indent = /^ */.exec(para)![0];
    let line = '';
    for (const word of para.trim().split(/\s+/)) {
      if (!line) line = indent + word;
      else if (line.length + 1 + word.length <= 31) line += ' ' + word;
      else {
        out.push(line);
        line = indent + word;
      }
    }
    if (line) out.push(line);
  }
  for (const l of out) if (l.length > 31) throw new Error(`README line over 31: ${l}`);
  return out.join('\n') + '\n';
}

export function readme(price: string): string {
  return wrap31(`FINAL CURTAIN
An Inspector Ada Penn Mystery
Version 1.0 - 1995
(c) 1995 Sandbox Software

Port Ellery, Halloween night, 1936. Opening night of THE RAVEN'S BRIDE at the Paragon Theatre. In Act III the heroine stabs the villain with a trick dagger, and the villain - Victor Crane, the Paragon's owner and star - falls down dead. The dagger was real.

You are Inspector Ada Penn of Homicide, and you have until dawn. Search the empty theater with the house lights up, then again at 2 AM with only the ghost light burning. Question the leading lady, the understudy, the widow, the stage manager and the critic. Then gather them on the stage and name the killer - and say how, and why.

STARTING THE GAME
  Type FINAL and press Enter. A VGA display is required. A Sound Blaster (or compatible) is recommended for the music and the digitized sound effects; the PC speaker works too.

KEYS
  Arrows or W A S D: walk
  Q / E: walk up-left / up-right
  Number pad 7 9 1 3: diagonals
  Space: pick up evidence
  L: look through the lens
  F1 help, F2 evidence, F3 music, F4 sound, F5 save, F6 load, Esc quit

FILES ON THIS DISK
  FINAL.GAM - the game
  ACT1.MAP, ACT2.MAP - the theater
  GREEN.MAP - green room, stage
  *.BBL, *.MBL - blocks
  *.MON - people (and rats)
  ADA.CHR - the Inspector
  FINAL.SND - sound effects
  *.CMF, *.VOC - music, sounds
  *.GIF, *.FLI - pictures
  *.TXT, *.LST - words, shows
  README.TXT - this file

THIS IS SHAREWARE
  This is shareware. You may copy FINAL CURTAIN and give it to your friends, upload it to your favorite BBS, or put it on a shareware disk, as long as all of the files are included and unchanged.

  If you enjoy it, please register for ${price} with Sandbox Software. Registered players receive the Final Curtain Hint Book (with its red decoder film), a printed case file, and our next mystery. Send a check or money order (US funds) to:

    Sandbox Software
    Dept. CURTAIN
    P.O. Box 000
    Pittsburgh, PA 15213

  (This is a fictional address for this game - there is no real Sandbox Software to mail. Please do not send money anywhere.)

A WORD ABOUT FAIR PLAY
  Every clue you need is in the game. Read the notes on the walls, read the evidence board, listen to everyone, and believe the evidence over the witnesses. Stuck? Save (F5) before you accuse.

Built with GAME-MAKER 3.0 by Recreational Software Designs.`);
}

/** Act Two's exit: Ada's three theories, each a cartoon with a caption. */
export const THEORIES = {
  think: `Two in the morning. Ada sits alone in row A with the ghost light humming on the stage.

There are three ways it could have been done.`,
  swap: `ONE: somebody swapped the trick dagger for a real one in the interval, while the prop table stood alone in the dark wing.`,
  poison: `TWO: somebody poisoned the tea in Count Corvin's goblet, and the dagger only finished the job.`,
  dark: `THREE: somebody slipped on stage in a blackout before the death scene, and struck in the dark.`,
  end: `Only one of these is true. The evidence will say which.

Take what you have found to the green room.`,
};

/** The credits, ending with the FREE TO SHARE page (kit/license.ts). */
export const CREDITS = withCreditPage(CREDITS_TEXT);
