// The chicken's name and pronouns for site text, from chickenNow() (chickenState.ts).
import { chickenNow, type Chicken } from './chickenState';

export interface Words {
  /** "Sir Reginald Cluckington III" / "Lady Regina Cluckington III". */
  full: string;
  /** "Sir Reginald" / "Lady Regina". */
  title: string;
  /** What Doc Leo calls the bird: "Reggie" / "Regina". */
  nick: string;
  he: string;
  He: string;
  his: string;
  His: string;
  him: string;
  /** "himself" / "herself". */
  self: string;
  lady: boolean;
}

const SIR: Words = {
  full: 'Sir Reginald Cluckington III',
  title: 'Sir Reginald',
  nick: 'Reggie',
  he: 'he',
  He: 'He',
  his: 'his',
  His: 'His',
  him: 'him',
  self: 'himself',
  lady: false,
};
const LADY: Words = {
  full: 'Lady Regina Cluckington III',
  title: 'Lady Regina',
  nick: 'Regina',
  he: 'she',
  He: 'She',
  his: 'her',
  His: 'Her',
  him: 'her',
  self: 'herself',
  lady: true,
};

/** The words for a chicken (the current one by default). */
export const chickenWords = (c: Chicken = chickenNow()): Words => (c === 'lady' ? LADY : SIR);
