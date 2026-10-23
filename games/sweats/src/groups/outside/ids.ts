// The INTO THE WILD set's own monster slots (after the common ones in ids.ts MON). Each
// monologue is a scene with its own .MON, so the four monologues reuse the same slots.
import { FIRST_GROUP_MON } from '../../ids';

const F = FIRST_GROUP_MON;

export const OUT_MON = {
  // ---- This Is Why I Don't Go Outside
  /** The five-foot receipt, twirling high on the wind, mocking him (out of reach, harmless). */
  receipt: F,
  /** A confused pedestrian wandering the sidewalk: a word ("IT'S MY RECEIPT!") scares them off. */
  ped: F + 1,
  /** A pedestrian, afraid, running off. */
  pedRun: F + 2,
  /** The elderly woman clutching her purse tighter: she stands her ground (hop over her). */
  granny: F + 3,
  /** A runaway shopping cart rolling about the parking lot (words can't stop it). */
  cart: F + 4,
  /** The jogger: a hello is a tip, and off he jogs. */
  jogger: F + 5,
  jogOff: F + 6,
} as const;

export const ANTS_MON = {
  // ---- The Ants Have Spoken
  /** A dust bunny from 1978, hopping out of the old vent. */
  dust: F,
  /** An ant on patrol in its tiny helmet. */
  ant: F + 1,
  /** A striking ant with its picket sign: you can't beat a union (hop over). */
  picket: F + 2,
  /** A disco cockroach, dancing. */
  roach: F + 3,
  /** The disco king of the roaches, in his white suit; one word knocks his hat off... */
  king: F + 4,
  /** ...and the next sends him scuttling. */
  king2: F + 5,
  /** A puff where a word scattered something. */
  poof: F + 6,
} as const;

export const CARD_MON = {
  // ---- The Day I Fought Cardboard
  /** Lily, eight, in her unicorn hoodie with her caramel apple, walking ahead: she pats him (composure back). */
  lily: F,
  /** Lily walking on ahead after a pat. */
  lilyOn: F + 1,
  /** A puff of the fog machine, drifting. */
  fog: F + 2,
  /** The animatronic zombie with its plastic axe, popping up. */
  zombie: F + 3,
  /** The papier-mache witch on her broomstick ("GET DOWN!")... */
  witch: F + 4,
  /** ...her broomstick broken, hopping mad... */
  witch2: F + 5,
  /** The guy in the werewolf mask, growling. */
  wolf: F + 6,
  /** The guy with his mask off, waving: just a guy. */
  wolfGuy: F + 7,
  /** The eleven-year-old in the clown wig with his horn (harmless): a word and he runs off giggling. */
  clown: F + 8,
  clownOff: F + 9,
  poof: F + 10,
  /** A rubber bat on its string, flapping (harmless, out of reach). */
  bat: F + 11,
} as const;

export const UMBR_MON = {
  // ---- Shelter Me Gently, You Wounded Beast
  /** A raindrop, falling as if the heavens wished him to fail. */
  drop: F,
  /** A price tag that mocks his budget. */
  tag: F + 1,
  /** "Paper...?" A paper bag flapping off the checkout. */
  paper: F + 2,
  /** "...or plastic?" A plastic bag billowing off the checkout. */
  plastic: F + 3,
  /** A splash where a drop lands, a puff where a word scatters a tag or a bag. */
  splash: F + 4,
  poof: F + 5,
} as const;
