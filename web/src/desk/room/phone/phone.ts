// The wall phone's line: lift the handset for a dial tone and the keypad, dial, and
// whoever answers (calls.ts) talks to you. Lifting it while the computer is on a BBS
// screeches in your ear and drops the call. A page to Dad gets a call back: the phone
// rings, and shakes on the wall, until you pick it up.
import { lineInterrupted, phoneLine } from '../../../retro/bbs/term';
import { callFor, dialComplete, HungUp, type Call, type CallLine } from './calls';
import { openDialPad, type DialPad } from './dialPad';
import { PhoneSounds } from './sounds';
import { speak } from '../../../audio/voices';

type State = 'hung-up' | 'dialing' | 'call' | 'ended';

export interface WallPhoneLine {
  /** Lifts the handset or hangs it up. */
  toggle(): void;
}

export function phoneLineFor(el: HTMLElement): WallPhoneLine {
  let state: State = 'hung-up';
  let pad: DialPad | undefined;
  let sounds: PhoneSounds | undefined;
  let call: AbortController | undefined;
  let digits = '';
  let idle = 0;
  /** Waiting for a key on the line (a pager wants a number). */
  let onKey: ((k: string) => void) | undefined;
  /** Someone calling: rings until answered or given up on. */
  let incoming: Call | undefined;
  let ringingUntil = 0;

  const status = (text: string) => pad?.status(text);

  /** Too long without dialing: the recording, then the howler. */
  const offHookTooLong = () => {
    clearTimeout(idle);
    idle = window.setTimeout(() => {
      if (state !== 'dialing' || !sounds || !call) return;
      state = 'ended';
      sounds.stop();
      const text = 'If you’d like to make a call, please hang up and try again.';
      pad?.caption('Recording', text);
      void speak(text, { who: 'Recording', pitch: 1.1, rate: 0.95, prefer: [] }, call.signal).then(() => {
        if (state !== 'ended' || !sounds) return;
        sounds.howler();
        status('Off the hook! Hang up the phone.');
      });
    }, 15000);
  };

  const dialTone = () => {
    state = 'dialing';
    digits = '';
    pad?.number('');
    pad?.caption('', '');
    status('Dial tone');
    sounds?.stop();
    sounds?.dialTone();
    offHookTooLong();
  };

  const line = (signal: AbortSignal): CallLine => {
    const live = () => {
      if (signal.aborted) throw new HungUp();
    };
    return {
      sounds: sounds!,
      status,
      async say(v, text) {
        live();
        status('Connected');
        pad?.caption(v.who, text);
        await speak(text, v, signal);
        live();
      },
      wait: (seconds) =>
        new Promise((resolve, reject) => {
          if (signal.aborted) return reject(new HungUp());
          const t = setTimeout(() => {
            signal.removeEventListener('abort', stop);
            resolve();
          }, seconds * 1000);
          const stop = () => {
            clearTimeout(t);
            reject(new HungUp());
          };
          signal.addEventListener('abort', stop, { once: true });
        }),
      keysUntilPound: (seconds) =>
        new Promise((resolve, reject) => {
          let typed = '';
          let t = 0;
          const finish = () => {
            clearTimeout(t);
            onKey = undefined;
            signal.removeEventListener('abort', stop);
            resolve(typed);
          };
          const stop = () => {
            clearTimeout(t);
            onKey = undefined;
            reject(new HungUp());
          };
          const later = () => {
            clearTimeout(t);
            t = window.setTimeout(finish, seconds * 1000);
          };
          onKey = (k) => {
            if (k === '#') return finish();
            typed += k;
            later();
          };
          signal.addEventListener('abort', stop, { once: true });
          later();
        }),
      nextKey: (seconds) =>
        new Promise((resolve, reject) => {
          const done = (k: string) => {
            clearTimeout(t);
            onKey = undefined;
            signal.removeEventListener('abort', stop);
            resolve(k);
          };
          const stop = () => {
            clearTimeout(t);
            onKey = undefined;
            reject(new HungUp());
          };
          const t = setTimeout(() => done(''), seconds * 1000);
          onKey = done;
          signal.addEventListener('abort', stop, { once: true });
        }),
      caption: (who, text) => pad?.caption(who, text),
      hush() {
        if ('speechSynthesis' in window) speechSynthesis.cancel();
      },
      ended(why) {
        if (signal.aborted) return;
        state = 'ended';
        sounds?.stop();
        status(why);
        // the line clears, and a dial tone comes back so you can call again
        setTimeout(() => !signal.aborted && state === 'ended' && dialTone(), 5000);
      },
      callBack(afterMs, who) {
        setTimeout(() => ring(who, 3), afterMs);
      },
      houseFire() {
        window.dispatchEvent(new Event('gm-house-fire'));
      },
    };
  };

  const run = (who: Call) => {
    state = 'call';
    clearTimeout(idle);
    const c = call!;
    who(line(c.signal)).catch((e) => {
      if (!(e instanceof HungUp)) throw e;
    });
  };

  /** The phone rings in the room; if it's off the hook, the caller tries again later. */
  const ring = (who: Call, tries: number) => {
    if (state !== 'hung-up') {
      if (tries > 1) setTimeout(() => ring(who, tries - 1), 12000);
      return;
    }
    sounds ??= PhoneSounds.open();
    incoming = who;
    ringingUntil = Date.now() + 36000;
    sounds?.bell(6);
    el.classList.add('ringing');
    el.setAttribute('aria-label', 'Wall telephone: it’s ringing! Pick it up');
    setTimeout(() => {
      if (incoming === who && Date.now() >= ringingUntil) stopRinging();
    }, 36500);
  };

  const stopRinging = () => {
    incoming = undefined;
    sounds?.quiet();
    el.classList.remove('ringing');
    el.setAttribute('aria-label', 'Wall telephone: lift the handset');
  };

  const press = (k: string) => {
    sounds?.key(k);
    if (state === 'call') return onKey?.(k);
    if (state !== 'dialing' || !/[0-9]/.test(k)) return;
    if (!digits) sounds?.stop(); // the dial tone stops at the first digit
    digits += k;
    pad?.number(digits);
    status('');
    offHookTooLong();
    if (dialComplete(digits)) run(callFor(digits));
  };

  const pickUp = () => {
    sounds ??= PhoneSounds.open();
    call = new AbortController();
    phoneLine.offHook = true;
    el.classList.add('off-hook');
    el.setAttribute('aria-pressed', 'true');
    pad = openDialPad(press, hangUp);
    const caller = incoming;
    if (caller) {
      stopRinging();
      pad.number('');
      status('Incoming call');
      run(caller);
      return;
    }
    if (lineInterrupted() && sounds) {
      // the computer was on the line with a BBS: two modems scream in your ear
      state = 'ended';
      status('SKREEEE-KSSSHHH! The modem was using the line…');
      const c = call;
      setTimeout(() => !c.signal.aborted && dialTone(), sounds.modemNoise() * 1000);
      return;
    }
    dialTone();
  };

  function hangUp(): void {
    call?.abort();
    call = undefined;
    clearTimeout(idle);
    onKey = undefined;
    sounds?.stop();
    pad?.close();
    pad = undefined;
    state = 'hung-up';
    phoneLine.offHook = false;
    el.classList.remove('off-hook');
    el.setAttribute('aria-pressed', 'false');
  }

  return {
    toggle: () => (state === 'hung-up' ? pickUp() : hangUp()),
  };
}
