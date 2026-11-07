// The Pi remote (#/pi-remote, linked from nowhere): a keyboard for the Raspberry Pi Zero W
// running sandbox-kernel and Game-Maker OS, over its USB serial port with Web Serial. Click a
// key and it goes down on the Pi; let go (or slide off) and it comes up. The physical keyboard
// is forwarded only while its switch is on. The Pi's log lines show below.
import './piRemote.css';
import { h } from '../editor/core/ui';
import { classify, INFO_LINE, keyLine, runLine, type Reply } from './protocol';
import { ARROW_ROWS, EDIT_ROWS, LINUX_KEYS, MAIN_ROWS, NUMPAD_ROWS, type ScreenKey } from './keymap';
import { HeldKeys, type KeyChange } from './heldKeys';
import { SerialLink, webSerial } from './serialLink';

/** Lines kept in the log pane. */
const LOG_LIMIT = 400;
/** How long a keyboard-activated on-screen key stays down. */
const TAP_MS = 120;
/** The Game-Maker OS program on the Pi's card. */
const GMOS = 'GMOS.ELF';

/** The page into `el`; the returned function puts it away (keys up, port closed). */
export function renderPiRemote(el: HTMLElement): () => void {
  const serial = webSerial();
  const held = new HeldKeys();
  let forwarding = false;
  let infoWaiter: ((reply: Reply) => void) | undefined;
  /** A RUN is waiting for its OK or ERR. */
  let runAsked = false;

  const status = h('p', { class: 'pi-status', role: 'status' }, 'Not connected.');
  const logList = h('ol', { class: 'pi-log-lines' });
  const logBox = h('div', { class: 'pi-log', role: 'log', 'aria-live': 'off', 'aria-label': 'Pi log', tabindex: '0' }, logList);
  const connectBtn = h('button', { type: 'button', class: 'pi-primary' }, 'Connect');
  const infoBtn = h('button', { type: 'button', disabled: true }, 'Info');
  const runBtn = h('button', { type: 'button', disabled: true }, 'Run Game-Maker OS');
  const forwardSwitch = h(
    'button',
    { type: 'button', role: 'switch', 'aria-checked': 'false', class: 'pi-switch', disabled: true },
    h('span', { class: 'pi-switch-knob', 'aria-hidden': 'true' }),
    'Send my keyboard to the Pi',
  );
  const banner = h(
    'p',
    { class: 'pi-banner', hidden: true },
    h('strong', null, 'Your keyboard goes to the Pi.'),
    ' To stop, turn the switch off or press Ctrl+Alt+K.',
  );

  const link = new SerialLink(onLine, (error) => {
    for (const b of [infoBtn, runBtn, forwardSwitch]) b.disabled = true;
    setForwarding(false);
    held.releaseAll();
    paintKeys();
    connectBtn.textContent = 'Connect';
    connectBtn.disabled = !serial;
    say(error ? `Disconnected: ${error}` : 'Disconnected.');
    log('note', error ? `Port closed: ${error}` : 'Port closed.');
  });

  function say(text: string): void {
    status.textContent = text;
  }

  function log(kind: string, text: string): void {
    const atEnd = logBox.scrollTop + logBox.clientHeight >= logBox.scrollHeight - 8;
    logList.append(h('li', { class: `pi-line-${kind}` }, text));
    while (logList.childElementCount > LOG_LIMIT) logList.firstElementChild?.remove();
    if (atEnd) logBox.scrollTop = logBox.scrollHeight;
  }

  function onLine(line: string): void {
    if (!line) return;
    const reply = classify(line);
    if (reply.kind === 'info') {
      const f = reply.fields;
      say(`Connected to the Pi: ABI ${f.ABI ?? '?'}, kernel generation ${f.active_generation ?? f.confirmed ?? '?'}.`);
      infoWaiter?.(reply);
    }
    if (reply.kind === 'error' && reply.text.includes('no-device')) say('The Pi has no input device right now (ERR input no-device).');
    if (runAsked && (reply.text.startsWith('OK run') || reply.text.startsWith('ERR '))) {
      runAsked = false;
      // RUN is refused while a program runs (sandbox-kernel core/protocol.c)
      if (reply.text === 'ERR not-ready') say('Not started: a program is already running on the Pi.');
      else say(reply.kind === 'ok' ? 'Game-Maker OS is starting.' : `Not started: ${reply.text}`);
    } else if (reply.text === 'ERR not-ready') say('The Pi wants INFO first. Press Info, then try again.');
    log(reply.kind, reply.text);
  }

  /** INFO until the Pi answers, as usb_kernel.py's handshake does: up to 5 tries, 3 s each. */
  async function handshake(): Promise<boolean> {
    for (let attempt = 0; attempt < 5 && link.open; attempt++) {
      const answered = new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => resolve(false), 3000);
        infoWaiter = () => {
          clearTimeout(timer);
          resolve(true);
        };
      });
      await link.send(INFO_LINE);
      const ok = await answered;
      infoWaiter = undefined;
      if (ok) return true;
      log('note', `No answer to INFO; trying again (${attempt + 1}).`);
    }
    return false;
  }

  function send(changes: (KeyChange | undefined)[]): void {
    for (const c of changes) if (c && link.open) void link.send(keyLine(c.code, c.state));
    paintKeys();
  }

  // ---- the on-screen keyboard -------------------------------------------------------

  const keyButtons: HTMLButtonElement[] = [];

  function paintKeys(): void {
    for (const b of keyButtons) {
      const code = LINUX_KEYS[b.dataset.code ?? ''];
      const down = code !== undefined && held.isHeld(code);
      b.classList.toggle('down', down);
      if (b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', String(down));
    }
  }

  /** A non-latching key came up: latched Shift, Ctrl and Alt come up after it. */
  function releaseLatches(): void {
    send(held.releaseAll('latch'));
  }

  function keyButton(key: ScreenKey): HTMLButtonElement {
    const code = LINUX_KEYS[key.code];
    const b = h(
      'button',
      {
        type: 'button',
        class: key.label.length > 3 && !key.width ? 'pi-key pi-long' : 'pi-key',
        dataset: { code: key.code },
        style: key.width ? `--w:${key.width}` : undefined,
        'aria-label': key.name,
        'aria-pressed': key.latch ? 'false' : undefined,
      },
      key.label,
    );
    const pointers = new Set<number>();
    const up = (e: PointerEvent) => {
      if (!pointers.delete(e.pointerId) || pointers.size) return;
      send([held.release(code, 'screen')]);
      releaseLatches();
    };
    b.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault(); // keeps focus where it is and stops text selection
      if (key.latch) {
        send([held.isHeld(code, 'latch') ? held.release(code, 'latch') : held.press(code, 'latch')]);
        return;
      }
      // a touch would capture the pointer; leaving the key must let it go
      if (b.hasPointerCapture(e.pointerId)) b.releasePointerCapture(e.pointerId);
      pointers.add(e.pointerId);
      send([held.press(code, 'screen')]);
    });
    b.addEventListener('pointerup', up);
    b.addEventListener('pointerleave', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
    // Enter or Space on a focused key (a click with no pointer): a short tap
    b.addEventListener('click', (e) => {
      if (e.detail !== 0) return;
      if (key.latch) {
        send([held.isHeld(code, 'latch') ? held.release(code, 'latch') : held.press(code, 'latch')]);
        return;
      }
      send([held.press(code, 'screen')]);
      setTimeout(() => {
        send([held.release(code, 'screen')]);
        releaseLatches();
      }, TAP_MS);
    });
    keyButtons.push(b);
    return b;
  }

  const block = (label: string, cls: string, rows: (ScreenKey | null)[][]) =>
    h(
      'div',
      { class: `pi-block ${cls}`, role: 'group', 'aria-label': label },
      ...rows.map((row) => h('div', { class: 'pi-row' }, ...row.map((key) => (key ? keyButton(key) : h('span', { class: 'pi-gap', 'aria-hidden': 'true' }))))),
    );

  const keyboard = h(
    'section',
    { class: 'pi-keyboard', 'aria-label': 'Pi keyboard' },
    h('div', { class: 'pi-main-scroll' }, block('Main keys', 'pi-main', MAIN_ROWS)),
    h('div', { class: 'pi-side' }, block('Editing keys', 'pi-edit', EDIT_ROWS), block('Arrows', 'pi-arrows', ARROW_ROWS)),
    block('Number pad', 'pi-numpad', NUMPAD_ROWS),
  );

  // ---- the physical keyboard, only while its switch is on -----------------------------

  function setForwarding(on: boolean): void {
    if (forwarding && !on) send(held.releaseAll('physical'));
    forwarding = on;
    forwardSwitch.setAttribute('aria-checked', String(on));
    banner.hidden = !on;
    document.body.classList.toggle('pi-forwarding', on);
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (!forwarding || e.metaKey) return;
    if (e.ctrlKey && e.altKey && e.code === 'KeyK') {
      e.preventDefault();
      setForwarding(false);
      say('Your keyboard is yours again.');
      return;
    }
    const code = LINUX_KEYS[e.code];
    if (code === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    if (!e.repeat) send([held.press(code, 'physical')]);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (!forwarding) return;
    const code = LINUX_KEYS[e.code];
    if (code === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    send([held.release(code, 'physical')]);
  };
  const onBlur = () => send(held.releaseAll('physical'));
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
  window.addEventListener('blur', onBlur);

  // ---- buttons ----------------------------------------------------------------------

  connectBtn.addEventListener('click', () => {
    if (!serial) return;
    if (link.open) {
      send(held.releaseAll());
      void link.disconnect();
      return;
    }
    connectBtn.disabled = true;
    say('Choose the Pi (“Zero W M0 recovery”) in the browser’s list…');
    link
      .connect(serial)
      .then(async () => {
        connectBtn.textContent = 'Disconnect';
        connectBtn.disabled = false;
        for (const b of [infoBtn, runBtn, forwardSwitch]) b.disabled = false;
        say('Port open; asking the Pi who it is…');
        log('note', 'Port open.');
        if (!(await handshake())) say('The port is open but the Pi did not answer INFO. Is the kernel running?');
      })
      .catch((e: unknown) => {
        connectBtn.disabled = false;
        const message = e instanceof Error ? e.message : String(e);
        say(/No port selected|cancel/i.test(message) ? 'Not connected: no port was chosen.' : `Could not connect: ${message}`);
      });
  });
  infoBtn.addEventListener('click', () => void link.send(INFO_LINE));
  runBtn.addEventListener('click', () => {
    log('note', `RUN ${GMOS}`);
    runAsked = true;
    void link.send(runLine(GMOS));
  });
  forwardSwitch.addEventListener('click', () => setForwarding(!forwarding));
  const clearBtn = h('button', { type: 'button', onclick: () => logList.replaceChildren() }, 'Clear log');

  const support = !serial
    ? h(
        'p',
        { class: 'pi-unsupported' },
        window.isSecureContext
          ? 'This browser has no Web Serial, so it cannot reach the Pi. Open this page in Chrome or Edge on a computer.'
          : 'Web Serial needs a secure page. Open this page over https or from localhost, in Chrome or Edge on a computer.',
      )
    : null;
  if (!serial) connectBtn.disabled = true;

  el.replaceChildren(
    h(
      'main',
      { class: 'pi-remote' },
      h('h1', null, 'Pi remote'),
      h(
        'p',
        { class: 'pi-lead' },
        'A keyboard for the Raspberry Pi Zero W running Game-Maker OS, over its USB cable. Press a key with the mouse and it stays down on the Pi until you let go. Shift, Ctrl and Alt stay down for the next key.',
      ),
      support,
      h('div', { class: 'pi-bar' }, connectBtn, infoBtn, runBtn, forwardSwitch),
      status,
      banner,
      keyboard,
      h(
        'section',
        { class: 'pi-log-section', 'aria-labelledby': 'pi-log-title' },
        h('div', { class: 'pi-log-head' }, h('h2', { id: 'pi-log-title' }, 'Pi log'), clearBtn),
        logBox,
      ),
    ),
  );

  return () => {
    setForwarding(false);
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('keyup', onKeyUp, true);
    window.removeEventListener('blur', onBlur);
    if (link.open) {
      send(held.releaseAll());
      void link.disconnect();
    }
  };
}
