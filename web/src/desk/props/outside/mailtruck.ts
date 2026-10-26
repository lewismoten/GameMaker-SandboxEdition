// The mail truck pulling away from the corner, off to the post office: a boxy white truck
// with a plain gray band and MAIL lettering on its side, no service's markings. It comes when something
// asks for it (gm-window-event, kind "mailtruck"): your registration card is on its way.
import { ambient, roomSound } from '../propSound';
import { VIEW } from '../../room/snowWindow';
import { outsidePlaying, STREET, type OutsideEvent } from './outside';

const PARKED = 160;

export const mailtruck: OutsideEvent = {
  kind: 'mailtruck',
  id: 'desk-mailtruck',
  label: 'The mail truck pulling away',
  when: 'any',
  ms: 8_000,
  start: () => setTimeout(() => outsidePlaying() && ambient(() => roomSound.rumble(5)), 2_000),
  draw(c, p, t) {
    // parked for a moment, then off to the left, picking up speed
    const go = Math.max(0, (p - 0.3) / 0.7);
    const x = PARKED - go * go * (PARKED + 80);
    const g = STREET;
    // the boxy body and the cab up front (it faces left)
    c.fillStyle = '#f4f4f0';
    c.fillRect(x + 16, g - 42, 46, 34);
    c.fillRect(x, g - 30, 18, 22);
    c.fillStyle = '#a8d4ee';
    c.fillRect(x + 2, g - 27, 10, 9);
    // a plain gray band along it, and MAIL
    c.fillStyle = '#9aa3ad';
    c.fillRect(x, g - 14, 62, 2.5);
    c.fillStyle = '#1e2a4a';
    c.font = 'bold 10px Arial, sans-serif';
    c.fillText('MAIL', x + 26, g - 22);
    c.fillStyle = '#2a2a2a';
    c.fillRect(x - 1, g - 9, 64, 2);
    for (const wx of [x + 10, x + 50]) {
      c.fillStyle = '#151515';
      c.beginPath();
      c.arc(wx, g - 5, 5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#bbb';
      c.beginPath();
      c.arc(wx, g - 5, 2, 0, Math.PI * 2);
      c.fill();
    }
    // its exhaust puffing in the cold as it pulls out
    if (go > 0 && go < 0.6) {
      c.fillStyle = 'rgba(230,235,245,0.6)';
      c.beginPath();
      c.arc(x + 66 + (t % 400) / 40, g - 6 - (t % 400) / 60, 3, 0, Math.PI * 2);
      c.fill();
    }
    return x > -70 && x < VIEW.w ? [x - 2, g - 44, 66, 44] : undefined;
  },
  press() {
    return 'The mail truck pulls away, your registration card on board. Allow 4–6 weeks.';
  },
};
