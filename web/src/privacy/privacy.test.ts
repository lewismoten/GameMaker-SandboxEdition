// The Privacy page must describe everything the inventory says the site keeps: backup/inventory.test.ts
// fails on a new gm-* key or database without a place in the inventory, and this fails when the
// page does not describe that place.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FakeDoc, type FakeEl } from '../../test/fakeDom';
import { renderPrivacy } from './privacyPage';
import { LOCAL_KEYS } from '../backup/inventory';
import { DATABASES, KEPT, KNOWN_DATABASES } from './privacyData';

afterEach(() => vi.unstubAllGlobals());

function textOf(el: FakeEl): string {
  return el.textContent + el.children.map(textOf).join(' ');
}

describe('privacy page', () => {
  it('describes every kind of thing the inventory keeps', () => {
    for (const id of Object.keys(LOCAL_KEYS)) expect(KEPT).toHaveProperty(id);
  });

  it('explains how to keep excluded data before clearing the site', () => {
    const doc = new FakeDoc();
    vi.stubGlobal('document', doc);
    renderPrivacy(doc.body as unknown as HTMLElement);
    const section = doc.body.children[0].children.find((el) => el.attrs['aria-labelledby'] === 'privacy-clear')!;
    const [beforeClearing] = textOf(section).split('choose Clear or Delete');
    expect(beforeClearing).toMatch(/backup leaves out imported games and player page saves/i);
    expect(beforeClearing).toMatch(/keep the original files for imported games/i);
    expect(beforeClearing).toMatch(/export your saves separately from the player page/i);
  });

  it('names every IndexedDB database', () => {
    for (const db of KNOWN_DATABASES) expect(DATABASES).toHaveProperty(db);
  });
});
