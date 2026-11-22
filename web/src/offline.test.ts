// A waiting update can take control of an initially uncontrolled tab for the first time.
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc } from '../test/fakeDom';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function offerWaitingUpdate() {
  vi.resetModules();
  const { registerServiceWorker } = await import('./offline');
  const worker = Object.assign(new EventTarget(), { state: 'installing', postMessage: vi.fn() });
  const reg = Object.assign(new EventTarget(), { active: { postMessage: vi.fn() }, installing: worker, waiting: null as typeof worker | null });
  const sw = Object.assign(new EventTarget(), { controller: null as typeof worker | null, register: async () => reg, ready: Promise.resolve(reg) });
  const reload = vi.fn();
  const doc = new FakeDoc();
  const create = doc.createElement.bind(doc);
  doc.createElement = (tag) => Object.assign(create(tag), { style: {} });
  Object.assign(doc.body, { prepend: doc.body.append.bind(doc.body) });

  vi.stubGlobal('navigator', { serviceWorker: sw });
  vi.stubGlobal('window', Object.assign(new EventTarget(), { setTimeout: vi.fn(), clearTimeout: vi.fn(), setInterval: vi.fn() }));
  vi.stubGlobal('location', { pathname: '/', reload });
  vi.stubGlobal('document', doc);

  vi.stubEnv('PROD', true);
  registerServiceWorker();
  await Promise.resolve();
  reg.dispatchEvent(new Event('updatefound'));
  reg.waiting = worker;
  worker.state = 'installed';
  worker.dispatchEvent(new Event('statechange'));
  const button = doc.body.children[0]?.children.find((el) => el.textContent === 'Reload');
  expect(button).toBeDefined();
  const takeOver = () => {
    reg.waiting = null;
    reg.active = worker;
    sw.controller = worker;
    sw.dispatchEvent(new Event('controllerchange'));
  };
  return { clickReload: () => button!.fire('click'), takeOver, worker, reload, sw };
}

it('reloads once when the requested update first takes control', async () => {
  const { clickReload, takeOver, worker, reload, sw } = await offerWaitingUpdate();
  clickReload();
  expect(worker.postMessage).toHaveBeenCalledWith({ type: 'skip-waiting' });
  expect(reload).not.toHaveBeenCalled();

  takeOver();
  expect(reload).toHaveBeenCalledOnce();
  sw.dispatchEvent(new Event('controllerchange'));
  expect(reload).toHaveBeenCalledOnce();
});

it('reloads on click when another tab has already activated the offered worker', async () => {
  const { clickReload, takeOver, worker, reload } = await offerWaitingUpdate();
  takeOver();
  expect(reload).not.toHaveBeenCalled();

  clickReload();
  expect(reload).toHaveBeenCalledOnce();
  expect(worker.postMessage).not.toHaveBeenCalledWith({ type: 'skip-waiting' });
});
