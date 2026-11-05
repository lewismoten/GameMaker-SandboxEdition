// The map editor's Generate dialog: choose a kind (dungeon, castle, forest, home, shop, town, overworld or a platform side view) and where (the whole map or the
// selection), see four real renders from a seed, pick one. The layouts only ever write ordinary cells,
// as one undo step. The dialog fits a 375 by 812 phone without scrolling: two rows of previews,
// and the Missing roles panel folds away when everything needed is set.
import { h, modal, toast } from '../../../core/ui';
import type { Project } from '../../../core/project';
import { BLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { parseCharacter, type Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { KINDS, MIN_SIDE, checkNeeds, kindInfo, type GenKind, type GenResult, type Rect } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import { readRoles } from '../../blocks/blockRoles';
import { loadBrushes } from '../tools/brushStore';
import type { Terrain } from '../tools/autotile';
import type { MapSelection } from '../tools/selection';
import { missingRoles } from './missingRoles';
import { makeScenes, planScenes } from './makeScenes';
import { WHOLE, offers, usableMonsters, type Offer } from './place';
import { NOT_CHECKED, NOT_CHECKED_SIDE } from './verifyOffer';
import type { BotRun } from './platformBot';
import type { RunningBot } from './platformBotClient';
import './generate.css';

export interface GenerateHost {
  project: Project;
  /** The block set's file name. */
  bbl: string;
  blockCount: number;
  /** The map's blocks now. */
  blocks: () => Uint8Array;
  /** The pictures of the blocks, by number. */
  images: () => HTMLCanvasElement[];
  selection: () => MapSelection | undefined;
  /** The block set's blocks (for the reach check) and the scene's monsters (for placing some). */
  blockSet: () => Block[];
  monsters: () => Monster[];
  /** The map wraps over its edges (an overworld's land then lines up across the seam). */
  wrap?: () => boolean;
  /** The hero's character file and its blocks, and the monster blocks, as the scene names them (a side view is sized to his jump). */
  hero?: { chr: string; cbl?: string; mbl?: string };
  /** The scene that plays this map (the first one), which the new scenes link to and from; without it nothing can be made. */
  scene?: number;
  /** Puts the chosen layout into the map as one undo step; `withMonsters` is the result whose monsters to place too. */
  apply: (blocks: Uint8Array, what: string, withMonsters?: GenResult) => void;
}

/** A selection's bounding rectangle kept inside the map. */
function selectionRect(s: MapSelection | undefined): Rect | undefined {
  if (!s || s.wrap) return undefined;
  const x = Math.max(0, s.x),
    y = Math.max(0, s.y);
  return { x, y, w: Math.min(s.x + s.w, MLEN) - x, h: Math.min(s.y + s.h, MLEN) - y };
}

function drawOffer(canvas: HTMLCanvasElement, blocks: Uint8Array, rect: Rect, imgs: HTMLCanvasElement[]): void {
  const s = Math.max(1, Math.min(10, Math.floor(240 / Math.max(rect.w, rect.h))));
  canvas.width = rect.w * s;
  canvas.height = rect.h * s;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < rect.h; y++)
    for (let x = 0; x < rect.w; x++) {
      const img = imgs[blocks[(rect.y + y) * MLEN + rect.x + x]];
      if (img) ctx.drawImage(img, 0, 0, BLEN, BLEN, x * s, y * s, s, s);
    }
}

const NO_MONSTERS = new Set<GenKind>(['home', 'shop', 'town', 'overworld']);

/** What a bot's play of a side view came to, by the layout (kind, seed, difficulty, area): not run yet, playing, or its result. */
type BotState = 'playing' | BotRun;
const botKey = (o: Offer, difficulty: number) => `${o.seed}:${difficulty}:${o.outcome.ok ? o.outcome.result.rect.x + ',' + o.outcome.result.rect.y : ''}`;

const LINK_TARGET: Record<string, string> = {
  home: 'a home interior',
  shop: 'a shop interior',
  town: 'a town',
  dungeon: 'a dungeon',
  castle: 'a castle',
  overworld: 'the overworld',
};

const cellText = (rect: Rect, i: number) => `(${rect.x + (i % rect.w)}, ${rect.y + Math.floor(i / rect.w)})`;

export async function generateDialog(host: GenerateHost): Promise<void> {
  const roles = readRoles(host.project, host.bbl, host.blockCount);
  const terrains = loadBrushes<Terrain>(host.project, host.bbl, 'terrains');
  const sel = selectionRect(host.selection());
  const canUseSel = !!sel && sel.w >= MIN_SIDE && sel.h >= MIN_SIDE;
  let kind: GenKind = KINDS.find((k) => checkNeeds(k.id, roles).ok)?.id ?? 'dungeon';
  let inSelection = canUseSel;
  let seed = Math.floor(Math.random() * 1e6);
  let chosen = 0;
  /** The Make these scenes step is showing its question (not undoable, so it asks first). */
  let asking = false;
  const monsterIds = usableMonsters(host.monsters());
  let addMonsters = monsterIds.length > 0;
  let current: Offer[] = [];
  let difficulty = 80;
  const bots = new Map<string, BotState>();
  let botRun = 0;
  /** The bot playing now, in its worker; stopped when the offers change or the dialog closes. */
  let running: RunningBot | undefined;
  let hero: Character | undefined;
  try {
    const bytes = host.hero && host.project.files.get(host.hero.chr);
    hero = bytes ? parseCharacter(bytes) : undefined;
  } catch {
    hero = undefined;
  }

  await modal<void>('Generate a layout', (close) => {
    const rect = () => (inSelection && sel ? sel : WHOLE);
    const usesHref = `#/p/${host.project.id}/${encodeURIComponent(host.bbl)}?tab=uses`;
    const kindSel = h('select', { 'aria-label': 'Kind of layout' }, ...KINDS.map((k) => h('option', { value: k.id, selected: k.id === kind }, k.label)));
    const areaSel = h(
      'select',
      { 'aria-label': 'Where to draw' },
      h('option', { value: 'whole', selected: !inSelection }, 'The whole map'),
      canUseSel && sel ? h('option', { value: 'sel', selected: inSelection }, `Selection (${sel.w} by ${sel.h})`) : null,
    );
    const seedIn = h('input', { type: 'number', min: 0, max: 4294967295, value: String(seed), 'aria-label': 'Seed number' });
    const blurb = h('p', { class: 'meta' });
    const diffIn = h('input', {
      type: 'range',
      min: '10',
      max: '100',
      step: '10',
      value: String(difficulty),
      'aria-label': 'Difficulty, in percent of the most the hero can jump',
    });
    const diffText = h('span', null, '');
    const diffRow = h('label', { class: 'field gen-diff', hidden: true }, diffText, diffIn);
    const needs = h('div');
    const grid = h('div', { class: 'gen-offers', role: 'group', 'aria-label': 'Four layouts to pick from' });
    const note = h('p', { class: 'meta gen-note', role: 'status' });
    const linksBox = h('details', { class: 'gen-links', hidden: true });
    const use = h('button', { class: 'primary', type: 'button' }, 'Use this layout');
    const buttons: HTMLButtonElement[] = [];

    /** The chip of an offer: for a side view, whether a bot has played it, else the proof the generator holds; `more` follows the chip's words in the button's name. */
    function chipOf(o: Offer): { text: string; ok: boolean; more: string } {
      if (kind === 'platform') {
        const b = bots.get(botKey(o, difficulty));
        if (b && b !== 'playing' && b.won) return { text: 'Bot won', ok: true, more: 'verified on the real engine' };
        if (b && b !== 'playing') return { text: 'Not proven', ok: false, more: 'the bot could not follow the route' };
        if (o.check?.verified) return { text: 'Jump math', ok: true, more: 'verified reachable by jump math' };
      }
      return o.check?.verified ? { text: 'Verified', ok: true, more: '' } : { text: 'Not proven', ok: false, more: '' };
    }
    /** The first offer with the strongest proof (Bot won, then Jump math or Verified, then Not proven); a failed offer ranks last. */
    function strongest(list: Offer[]): number {
      const rank = (o: Offer) => {
        if (!o.outcome.ok) return 4;
        const c = chipOf(o);
        return c.text === 'Bot won' ? 0 : c.ok ? 1 : 2;
      };
      let best = 0;
      list.forEach((o, i) => {
        if (rank(o) < rank(list[best])) best = i;
      });
      return best;
    }
    /** An offer button's name: its visible caption first ("Layout 2 Bot won"), then what the chip means and the seed. */
    const offerName = (i: number, c: { text: string; more: string }, o: Offer) => `Layout ${i + 1} ${c.text}${c.more ? `, ${c.more}` : ''}, seed ${o.seed}`;
    const chips: HTMLElement[] = [];
    /** A bot plays each side view in turn, one at a time; the chips change as each finishes. */
    async function playBots(token: number): Promise<void> {
      if (kind !== 'platform' || !host.hero) return;
      const { startPlatformBot } = await import('./platformBotClient');
      for (let i = 0; i < current.length; i++) {
        const o = current[i];
        if (token !== botRun) return;
        const key = botKey(o, difficulty);
        if (!o.outcome.ok || !o.blocks || bots.has(key)) continue;
        bots.set(key, 'playing');
        pick();
        await new Promise((res) => setTimeout(res, 0));
        let run: BotRun;
        let mine: RunningBot | undefined;
        try {
          mine = running = startPlatformBot({
            files: host.project.files,
            names: { bbl: host.bbl, mbl: host.hero.mbl, chr: host.hero.chr, cbl: host.hero.cbl },
            blocks: o.blocks,
            result: o.outcome.result,
          });
          run = await mine.done;
        } catch (e) {
          if ((e as Error).name === 'AbortError') {
            bots.delete(key);
            return;
          }
          run = { won: false, why: `The bot could not play it (${(e as Error).message}).`, ticks: 0 };
        } finally {
          if (running === mine) running = undefined;
        }
        bots.set(key, run);
        if (token !== botRun) return;
        const c = chipOf(o);
        const chip = chips[i];
        if (chip) {
          chip.textContent = c.text;
          chip.className = `gen-chip ${c.ok ? 'ok' : 'warn'}`;
          chip.closest('button')?.setAttribute('aria-label', offerName(i, c, o));
        }
        pick();
        await new Promise((res) => setTimeout(res, 0));
      }
    }
    function refresh(): void {
      const r = rect();
      blurb.textContent = kindInfo(kind).blurb;
      needs.replaceChildren(missingRoles({ kind, roles, usesHref }));
      const n = checkNeeds(kind, roles);
      if (monRow) monRow.hidden = !n.ok || NO_MONSTERS.has(kind);
      diffRow.hidden = kind !== 'platform';
      diffText.textContent = `Difficulty: ${difficulty}%`;
      botRun++;
      asking = false;
      running?.cancel();
      current = n.ok
        ? offers(host.blocks(), roles, terrains, kind, seed, r, {
            monsters: addMonsters ? monsterIds : undefined,
            bg: host.blockSet(),
            wrap: host.wrap?.(),
            hero,
            difficulty,
          })
        : [];
      chosen = strongest(current);
      grid.replaceChildren();
      buttons.length = 0;
      chips.length = 0;
      if (!n.ok) {
        grid.append(h('p', { class: 'meta' }, n.message));
      } else if (!current[0].outcome.ok) {
        grid.append(h('p', { class: 'meta' }, current[0].outcome.message));
      } else {
        current.forEach((o, i) => {
          const c = h('canvas', { class: 'pixel', 'aria-hidden': 'true' });
          drawOffer(c, o.blocks!, o.outcome.ok ? o.outcome.result.rect : r, host.images());
          const chipInfo = chipOf(o);
          const chip = h('span', { class: `gen-chip ${chipInfo.ok ? 'ok' : 'warn'}` }, chipInfo.text);
          chips.push(chip);
          const b = h(
            'button',
            {
              type: 'button',
              class: 'gen-offer',
              'aria-pressed': String(i === chosen),
              'aria-label': offerName(i, chipInfo, o),
              onclick: () => {
                chosen = i;
                asking = false;
                pick();
              },
            },
            c,
            h('small', { class: 'gen-cap' }, `Layout ${i + 1} `, chip),
          );
          buttons.push(b);
          grid.append(b);
        });
      }
      pick();
      void playBots(botRun);
    }
    /** The sentences about a side view: what it asks of the hero, and the proof it holds (jump math, and a bot's play). */
    function sideNote(o: Offer, res: GenResult): string {
      const p = res.platform;
      const b = bots.get(botKey(o, difficulty));
      const asks = p
        ? `Drawn at ${Math.round(p.difficulty * 100)}% of his most: pits up to ${p.asked.gap} blocks wide and steps up to ${p.asked.rise} high (he clears ${p.can.gap} across and ${p.can.rise} up).`
        : '';
      if (!o.check?.verified) return `${asks} Not proven: ${o.check?.problems.join(' ')} ${NOT_CHECKED_SIDE}`;
      if (b && b !== 'playing' && b.won)
        return `${asks} Verified: a bot played it on the real engine from the entry to the exit${res.locks.length ? ' (through the key and the door)' : ''}. ${NOT_CHECKED_SIDE}`;
      if (b && b !== 'playing')
        return `${asks} Not proven: the reach model says it can be done, but the bot could not follow the route: ${b.why} ${NOT_CHECKED_SIDE}`;
      return `${asks} Verified: reachable by jump math (the hero's own walk and jump read from his character file), and every coin, the key and the heart can be touched.${host.hero ? (b === 'playing' ? ' A bot is playing it now.' : '') : ''} ${NOT_CHECKED_SIDE}`;
    }
    /** The links box: the proposed doors and sites, and the Make these scenes step (a question first, since scenes are not one Undo). */
    function linkParts(o: Offer, res: GenResult): HTMLElement[] {
      const list = h(
        'ul',
        { class: 'gen-link-list', tabindex: '0', 'aria-label': 'Doors and sites' },
        ...res.links.map((l) => h('li', null, `${l.label} at ${cellText(res.rect, l.cell)}: ${LINK_TARGET[l.kind]}`)),
      );
      if (host.scene === undefined || host.project.readOnly)
        return [h('p', { class: 'meta' }, 'Suggestions only: make a scene for each and link the door or site yourself.'), list];
      const plan = planScenes(host.project.game(), host.scene, res, roles);
      const skipped = plan.skipped.length ? ` Left out: ${plan.skipped.map((s) => `${s.label} (${s.why})`).join('; ')}.` : '';
      if (!asking) {
        const ask = h('button', { type: 'button', disabled: !plan.make.length, onclick: () => ((asking = true), pick()) }, 'Make these scenes…');
        return [
          h(
            'p',
            { class: 'meta' },
            `Suggestions: make a scene for each and link the door or site yourself, or have them made for you.${plan.make.length ? '' : skipped}`,
          ),
          list,
          ask,
        ];
      }
      const go = h(
        'button',
        { type: 'button', class: 'primary', onclick: () => make(o, res) },
        `Draw this layout and make ${plan.make.length} scene${plan.make.length === 1 ? '' : 's'}`,
      );
      return [
        h(
          'p',
          { class: 'meta', role: 'status' },
          `This draws the layout (Undo takes it back), then adds ${plan.make.length} scene${plan.make.length === 1 ? '' : 's'} for ${plan.make.map((m) => m.link.label).join(', ')}. Each gets its own map drawn in the same block set, and a link each way: the door leads in, and the way back arrives beside the door. New scenes are not part of Undo; remove them in the Integrator.${skipped}`,
        ),
        h('div', { class: 'toolbar' }, go, h('button', { type: 'button', onclick: () => ((asking = false), pick()) }, 'Back')),
      ];
    }
    /** Draws the layout, then makes the scenes and saves the game. */
    function make(o: Offer, res: GenResult): void {
      if (!o.blocks || host.scene === undefined) return;
      host.apply(o.blocks, `${kindInfo(kind).label} layout`, addMonsters && !NO_MONSTERS.has(kind) ? res : undefined);
      const game = host.project.game();
      const out = makeScenes({
        game,
        hostScene: host.scene,
        result: res,
        roles,
        terrains,
        bg: host.blockSet(),
        seed: o.seed,
        has: (n) => host.project.files.has(n),
        put: (n, b) => host.project.files.set(n, b),
      });
      host.project.saveGame(game);
      const n = out.made.length;
      const shown = out.skipped.slice(0, 3).map((s) => `${s.label} (${s.why})`);
      const left = out.skipped.length
        ? ` Left out ${out.skipped.length}: ${shown.join('; ')}${out.skipped.length > shown.length ? `, and ${out.skipped.length - shown.length} more` : ''}.`
        : '';
      toast(
        n
          ? `Layout drawn and ${n} scene${n === 1 ? '' : 's'} made (${out.made.map((m) => m.label).join(', ')}). Undo takes back the layout, not the scenes.${left}`
          : `Layout drawn, but no scene was made.${left}`,
      );
      close(undefined);
    }
    function pick(): void {
      buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === chosen)));
      const o = current[chosen];
      const ok = !!o?.outcome.ok;
      use.disabled = !ok;
      linksBox.hidden = true;
      if (!ok || !o.outcome.ok) return void (note.textContent = '');
      const res = o.outcome.result;
      if (res.links.length) {
        linksBox.hidden = false;
        linksBox.replaceChildren(h('summary', null, `Links to make (${res.links.length})`), ...linkParts(o, res));
        if (asking) linksBox.open = true;
      }
      const furnished = res.furniture.length > 0 || kind === 'home' || kind === 'shop';
      const has = [
        res.furniture.filter((f) => !f.open).length ? `${res.furniture.filter((f) => !f.open).length} pieces of furniture` : '',
        res.shopkeeper !== undefined ? `shopkeeper could stand at ${cellText(res.rect, res.shopkeeper)}` : '',
        res.locks.length ? `${res.locks.length} locked door${res.locks.length > 1 ? 's' : ''}` : '',
        res.monsters.length ? `${res.monsters.length} monsters` : '',
      ].filter(Boolean);
      note.textContent = [
        `Seed ${o.seed}: hero could start at ${cellText(res.rect, res.entry)}, ${furnished ? 'door' : res.links.length ? 'far end' : 'exit'} at ${cellText(res.rect, res.exit)}; nothing is linked.${has.length ? ` ${has.join(', ')}.` : ''}${res.links.length ? ` ${res.links.length} doors and sites could link to other scenes.` : ''}`,
        ...res.notes,
        kind === 'platform'
          ? sideNote(o, res)
          : o.check?.verified
            ? `Verified: ${furnished ? 'every open cell and piece of furniture can be reached from the door' : res.links.length ? 'every open cell, door and site can be reached from the start' : 'keys, treasure and exit can be reached in order'}. ${NOT_CHECKED}`
            : `Not proven: ${o.check?.problems.join(' ')} ${NOT_CHECKED}`,
      ].join(' ');
    }
    kindSel.addEventListener('change', () => ((kind = kindSel.value as GenKind), refresh()));
    diffIn.addEventListener('change', () => {
      difficulty = Math.max(10, Math.min(100, Number(diffIn.value) || 80));
      refresh();
    });
    areaSel.addEventListener('change', () => ((inSelection = areaSel.value === 'sel'), refresh()));
    seedIn.addEventListener('change', () => {
      const v = Math.floor(Number(seedIn.value));
      seed = Number.isFinite(v) && v >= 0 ? v >>> 0 : seed;
      seedIn.value = String(seed);
      refresh();
    });
    use.addEventListener('click', () => {
      const o = current[chosen];
      if (!o?.blocks) return;
      host.apply(o.blocks, `${kindInfo(kind).label} layout`, addMonsters && !NO_MONSTERS.has(kind) && o.outcome.ok ? o.outcome.result : undefined);
      close(undefined);
    });
    const monBox = h('input', { type: 'checkbox', checked: addMonsters, 'aria-label': 'Add monsters' });
    monBox.addEventListener('change', () => ((addMonsters = monBox.checked), refresh()));
    const monRow = monsterIds.length ? h('label', { class: 'gen-check' }, monBox, h('span', null, 'Add monsters (replaces those in the area)')) : null;
    const another = h(
      'button',
      {
        type: 'button',
        onclick: () => {
          seed = (seed + 4) >>> 0;
          seedIn.value = String(seed);
          refresh();
        },
      },
      'Four more',
    );
    refresh();
    return h(
      'div',
      { class: 'stack gen-dialog' },
      h(
        'div',
        { class: 'gen-row' },
        h('label', { class: 'field' }, h('span', null, 'Kind'), kindSel),
        h('label', { class: 'field' }, h('span', null, 'Where'), areaSel),
      ),
      blurb,
      h('div', { class: 'gen-row' }, h('label', { class: 'field' }, h('span', null, 'Seed'), seedIn), another),
      diffRow,
      needs,
      monRow,
      grid,
      note,
      linksBox,
      h('div', { class: 'toolbar' }, use, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel')),
    );
  });
  running?.cancel();
}
