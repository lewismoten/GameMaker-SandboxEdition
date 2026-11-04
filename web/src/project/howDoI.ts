// The "How do I…?" questions a Starter answers (games/<id>/manual.json "howDoI"): each names
// the level (a scene of the .gam) that answers it, a map spot to show, and which "How this
// level is made" page explains it (`level`, counting from 1). A new Starter adds its questions
// just by having the list. No DOM here; the index is editor/shell/howDoIIndex.ts.
import { isStarterGame } from './starter';
import { loadGameList, withDetails, type CatalogEntry } from './files';

/** One question as written in manual.json. */
export interface HowDoIEntry {
  /** A short name, unique in its game (the Guide's Try it boxes use it). */
  id: string;
  /** "How do I make a door that needs a key?" */
  q: string;
  /** The scene (index in the .gam) that answers it. */
  scene: number;
  /** The map spot (block column and row) to show. */
  x: number;
  y: number;
  /** Which "How this level is made" page goes with it: 1 for the first such page. */
  level: number;
}

/** A question with the game it belongs to. */
export interface Question extends HowDoIEntry {
  game: string;
  gameTitle: string;
}

interface ManualPage {
  head: string;
  html: string;
}
interface ManualWithQuestions {
  pages?: ManualPage[];
  howDoI?: HowDoIEntry[];
}

const manualOf = (e: Pick<CatalogEntry, 'original'>): ManualWithQuestions | undefined => e.original?.manual as ManualWithQuestions | undefined;

/** The page heading every level has beside its description. */
export const LESSON_HEAD = 'How this level is made';

/** The questions a game lists (none for a game with no list). */
export function questionsOf(e: Pick<CatalogEntry, 'id' | 'title' | 'original'>): Question[] {
  return (manualOf(e)?.howDoI ?? []).map((q) => ({ ...q, game: e.id, gameTitle: e.title }));
}

/** The "How this level is made" page `level` (from 1) of a game's manual, or undefined. */
export function lessonPage(e: Pick<CatalogEntry, 'original'>, level: number): ManualPage | undefined {
  return (manualOf(e)?.pages ?? []).filter((p) => p.head === LESSON_HEAD)[level - 1];
}

/** The title of level `level`, from the "Level N: Title" page before its lesson ("Walk, Jump, Fall"). */
export function levelTitle(e: Pick<CatalogEntry, 'original'>, level: number): string | undefined {
  const head = (manualOf(e)?.pages ?? []).find((p) => p.head.startsWith(`Level ${level}:`))?.head;
  return head?.slice(head.indexOf(':') + 1).trim();
}

/** The questions that contain every word typed (any case), in the game's title or the question. */
export function filterQuestions(all: readonly Question[], text: string): Question[] {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  return all.filter((q) => {
    const hay = `${q.q} ${q.gameTitle}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

let loading: Promise<{ entries: Map<string, CatalogEntry>; questions: Question[] }> | undefined;

/** Every Starter's questions, in the catalog's order, with the entries (and their manuals) they came from. */
export function loadQuestions(): Promise<{ entries: Map<string, CatalogEntry>; questions: Question[] }> {
  loading ??= (async () => {
    const list = (await loadGameList()).filter(isStarterGame);
    const full = await Promise.all(list.map((e) => withDetails(e)));
    return { entries: new Map(full.map((e) => [e.id, e])), questions: full.flatMap(questionsOf) };
  })().catch((err) => {
    loading = undefined;
    throw err;
  });
  return loading;
}
