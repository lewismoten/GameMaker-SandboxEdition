// The Privacy page must describe everything the inventory says the site keeps: backup/inventory.test.ts
// fails on a new gm-* key or database without a place in the inventory, and this fails when the
// page does not describe that place.
import { describe, expect, it } from 'vitest';
import { LOCAL_KEYS } from '../backup/inventory';
import { DATABASES, KEPT, KNOWN_DATABASES } from './privacyData';

describe('privacy page', () => {
  it('describes every kind of thing the inventory keeps', () => {
    for (const id of Object.keys(LOCAL_KEYS)) expect(KEPT).toHaveProperty(id);
  });

  it('names every IndexedDB database', () => {
    for (const db of KNOWN_DATABASES) expect(DATABASES).toHaveProperty(db);
  });
});
