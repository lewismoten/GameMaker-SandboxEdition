// TTYINFO: one screen on text telephones as they were in December 1994, for TERMINAL's
// help page and C:\COMM\TTYINFO.TXT. Sources (checked): Gallaudet University's Technology
// Access Program (TTY Basics, 1998; V.18 notes), ITU-T V.18 (approved 20 September 1994),
// the FCC on relay service (nationwide from 26 July 1993), and Ultratec on Turbo Code (in
// its TTYs since 1993; U.S. Patent 5,432,837). Turbo Code is Ultratec's name (NOTICE.md).

/** The page: 78 columns at most, 22 lines (with a title and a key prompt it fills the screen). */
export const TTY_INFO: readonly string[] = [
  'TTY / TDD: TEXT TELEPHONES',
  '',
  'A TTY (also TDD, telecommunications device for the deaf) is a keyboard and a',
  'small display, often with a printer, that types over an ordinary phone line.',
  'Deaf, hard-of-hearing and speech-disabled people use them every day, and so do',
  'their families, friends and the relay operators who connect their calls.',
  '',
  'The sound: 5-bit Baudot code at 45.45 baud, about 6 characters a second, sent',
  'as two tones, 1400 Hz and 1800 Hz. There is no answer tone and no carrier',
  'between characters. Capitals only: LTRS and FIGS codes switch letters/figures.',
  '',
  'Taking turns: one side types at a time. GA (go ahead) ends your turn, SK (stop',
  'keying) says goodbye, GA OR SK asks if you are done. Q is a question mark and',
  'XXX marks a typo. Short forms: U, UR, THX, PLS, OIC (oh, I see), HD (hold).',
  '',
  'Relay: under the ADA, relay service has run in every state since July 1993. An',
  "operator reads the TTY user's words aloud and types the hearing caller's back.",
  '',
  "Modems: a data modem can't speak Baudot; a TTY modem can (TERMINAL: TDD mode).",
  'ITU-T V.18, approved September 1994, shows how any modem could. Turbo Code is',
  "Ultratec's faster code (about 100 baud) that lets you interrupt each other; it",
  'checks what the other TTY speaks and falls back to Baudot.',
];
