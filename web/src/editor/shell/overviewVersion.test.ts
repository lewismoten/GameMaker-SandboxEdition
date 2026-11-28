// Version validation and saving are immediate, while typing produces one settled status.
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc, type FakeEl } from '../../../test/fakeDom';
import { GameFiles } from '../../project/files';
import { Project } from '../core/project';
import { versionCard } from './overviewVersion';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('waits for a typing pause, reports invalid edits locally, and gives a toggle immediate feedback', () => {
  vi.useFakeTimers();
  const doc = new FakeDoc();
  const create = doc.createElement.bind(doc);
  doc.createElement = (tag) => Object.assign(create(tag), tag === 'input' ? { value: '' } : {});
  vi.stubGlobal('document', doc);
  const project = Project.fromFiles(new GameFiles(), 'Version', 'version');
  const save = vi.spyOn(project, 'setMenuVersion').mockImplementation(() => {});
  const card = versionCard(project) as unknown as FakeEl;
  const [, line, status, field, toggle, hint] = card.children[1].children;
  expect(status.attrs.role).toBe('status');
  const input = field.children[1];
  const show = toggle.children[0];
  const type = (value: string) => {
    Object.assign(input, { value });
    input.fire('input');
  };
  for (const value of ['1', '1.', '1.2']) {
    type(value);
    expect(save).toHaveBeenLastCalledWith(value, false);
    expect(line.textContent).toContain(`Version ${value},`);
    vi.advanceTimersByTime(500);
    expect(status.textContent).toBe('No version set');
  }
  vi.advanceTimersByTime(1000);
  expect(status.textContent).toBe('Version 1.2, not shown on the menu');
  type('1.2!');
  expect(input.attrs['aria-invalid']).toBe('true');
  expect(input.attrs['aria-describedby']).toBe(hint.attrs.id);
  expect(hint.textContent).toContain('letters, digits');
  expect(save).toHaveBeenCalledTimes(3);
  vi.advanceTimersByTime(1500);
  expect(status.textContent).toContain('Invalid version');
  type('2.0');
  Object.assign(show, { checked: true });
  show.fire('change');
  expect(status.textContent).toBe('The menu shows v2.0');
  vi.advanceTimersByTime(1500);
  expect(status.textContent).toBe('The menu shows v2.0');
});
