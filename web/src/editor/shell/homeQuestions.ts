// Lazy loading for the Starter tab's compact question index.
import { h } from '../core/ui';

export async function showQuestions(host: HTMLElement, load: () => Promise<HTMLElement>): Promise<void> {
  if (host.dataset.loaded || host.dataset.loading) return;
  host.dataset.loading = '1';
  try {
    host.replaceChildren(await load());
    host.dataset.loaded = '1';
  } catch {
    host.replaceChildren(h('button', { type: 'button', onclick: () => showQuestions(host, load) }, 'Retry loading Starter questions'));
  } finally {
    delete host.dataset.loading;
  }
}
