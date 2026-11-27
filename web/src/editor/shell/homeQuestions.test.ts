// A mounted Home can retry a failed Starter index without duplicating pending or loaded questions.
import { expect, it, vi } from 'vitest';
import { showQuestions } from './homeQuestions';

vi.mock('../core/ui', () => ({ h: (_tag: string, attrs: object) => attrs }));

it.each(['button', 'tab'])('retries from the %s and shares pending and completed loads across tab selections', async (via) => {
  const pane = {
    dataset: {},
    firstChild: null as unknown,
    replaceChildren(child?: unknown) {
      this.firstChild = child ?? null;
    },
  };
  const host = pane as unknown as HTMLElement;
  const index = {} as HTMLElement;
  const load = vi.fn<() => Promise<HTMLElement>>().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(index);
  const first = showQuestions(host, load);
  await showQuestions(host, load);
  await first;
  expect(load).toHaveBeenCalledTimes(1);
  const retry = pane.firstChild as { onclick: () => Promise<void> };
  if (via === 'button') await retry.onclick();
  else await showQuestions(host, load);
  await showQuestions(host, load);
  expect(load).toHaveBeenCalledTimes(2);
  expect(pane.firstChild).toBe(index);
});
