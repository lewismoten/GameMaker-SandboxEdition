// Exercise both report item builders, including the map panel behind its report.
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc, FakeEl } from '../../../test/fakeDom';
import type { Project } from '../core/project';
import { acceptedFindings, findingKey, reasonFor } from '../check/accepted';
import type { Finding } from '../check/findings';
import { checkFindings } from '../editors/map/check/checkFindings';
import { openReport } from './checkReport';

vi.mock('../core/ui', async (original) => ({ ...(await original<typeof import('../core/ui')>()), toast: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());

class ReportDoc extends FakeDoc {
  override createElement(tag: string) {
    return Object.assign(super.createElement(tag), {
      value: '',
      prepend(this: FakeEl, child: FakeEl) {
        this.children.unshift(child);
      },
    });
  }
}

function controls(root: FakeEl, className: string): (FakeEl & { value: string })[] {
  return root.children.flatMap((child) =>
    child.className.split(' ').includes(className) ? [child as FakeEl & { value: string }] : controls(child, className),
  );
}

it.each(['map', 'game'])('%s report removes an Enter-accepted row, keeps other drafts and saves accepted edits', async (scope) => {
  const doc = new ReportDoc();
  vi.stubGlobal('document', doc);
  const findings: Finding[] = ['First', 'Second'].map((title) => ({ check: 'hurt-lock', severity: 'warning', title, where: {} }));
  let list: unknown = [];
  const project = {
    extras: () => list,
    setExtras: (_file: string, _section: string, value: unknown) => {
      list = value ?? [];
    },
  } as unknown as Project;
  const panel = checkFindings(
    { project, reload: vi.fn(), goTo: vi.fn() },
    { saved: { findings, when: '', budget: 0, heat: '', soon: '', stuck: [], deaths: [], places: 0, complete: true, ms: 0 } },
    {
      said: document.createElement('p'),
      render: () => panel.render(),
      save: vi.fn(),
      paint: vi.fn(),
      focus: vi.fn(),
      describe: () => [],
    },
  );
  const dialog = openReport({ project, findings: () => findings, item: scope === 'map' ? panel.item : undefined });
  const fields = () => controls(doc.body, 'lc-why-input');
  const [first, second] = fields();
  first.value = 'boss';
  second.value = 'still typing';
  second.fire('input');
  first.fire('keydown', { key: 'Enter' });
  expect(fields().map((f) => f.value)).toEqual(['still typing']);
  if (scope === 'map') expect(controls(panel.list as unknown as FakeEl, 'lc-why-input')[0].value).toBe('still typing');
  const box = controls(doc.body, 'check')[0].children[0];
  Object.assign(box, { checked: true });
  box.fire('change');
  const acceptedField = () => controls(controls(doc.body, 'lc-is-accepted')[0], 'lc-why-input')[0];
  expect(acceptedField().value).toBe('boss');
  for (const event of ['blur', 'keydown']) {
    const field = acceptedField();
    field.value = event;
    field.fire('input');
    field.fire(event, { key: 'Enter' });
    expect(reasonFor(acceptedFindings(project), findingKey(findings[0]))).toBe(event);
  }
  const acceptedRow = controls(doc.body, 'lc-is-accepted')[0];
  controls(acceptedRow, 'lc-accept')[0].fire('click');
  expect(fields().map((f) => f.value)).toEqual(['keydown', 'still typing']);
  doc.body.children.find((c) => c.tag === 'dialog')!.fire('cancel');
  await dialog;
});
