// The mail jeep with RSD's reply: a little white right-hand-drive mail jeep pulls up at the
// curb, waits while the carrier drops off the mail, and drives away left. Plain MAIL lettering
// and a gray band, no service's name or markings. After dark its headlights and tail light are
// on. It comes only when something asks (gm-window-event, kind "mailjeep"): the registration
// card's reply arriving (../mailDrop.ts, which slides the envelope under the bedroom door once
// it has gone).
import { ambient, roomSound } from '../propSound';
import { VIEW } from '../../room/snowWindow';
import { daylight } from '../../room/daylight';
import { outsidePlaying, STREET, type OutsideEvent } from './outside';

const PARKED = 150;
const W = 52;

/** Where the jeep is `p` of the way through: in from the right, stopped, then off to the left. */
function at(p: number): number {
  if (p < 0.3) {
    const k = 1 - p / 0.3; // slowing to a stop
    return PARKED + k * k * (VIEW.w + 20 - PARKED);
  }
  if (p < 0.55) return PARKED;
  const go = (p - 0.55) / 0.45;
  return PARKED - go * go * (PARKED + W + 30);
}

export const mailjeep: OutsideEvent = {
  kind: 'mailjeep',
  id: 'desk-mailjeep',
  label: 'The mail jeep driving away',
  when: 'any',
  ms: 9_000,
  start: () => {
    roomSound.rumble(2.5);
    // a toot as it pulls away from the curb
    setTimeout(() => outsidePlaying() && ambient(() => roomSound.toot()), 5_000);
  },
  draw(c, p, t) {
    const x = at(p);
    const g = STREET;
    const night = daylight() < 0.5;
    if (night) {
      // headlights on the snow ahead of it (it faces left)
      const beam = c.createLinearGradient(x, 0, x - 70, 0);
      beam.addColorStop(0, 'rgba(255,244,190,0.55)');
      beam.addColorStop(1, 'rgba(255,244,190,0)');
      c.fillStyle = beam;
      c.beginPath();
      c.moveTo(x + 1, g - 17);
      c.lineTo(x - 70, g - 26);
      c.lineTo(x - 70, g + 2);
      c.lineTo(x + 1, g - 12);
      c.fill();
    }
    // the tall boxy body behind, the short hood in front
    c.fillStyle = '#f6f6f2';
    c.fillRect(x + 14, g - 40, W - 14, 32);
    c.fillRect(x, g - 22, 16, 14);
    // the roof's lip and the windshield, sloping back from the hood
    c.fillStyle = '#d9dcde';
    c.fillRect(x + 13, g - 42, W - 12, 3);
    c.fillStyle = night ? '#3a4658' : '#a8d4ee';
    c.beginPath();
    c.moveTo(x + 9, g - 22);
    c.lineTo(x + 15, g - 38);
    c.lineTo(x + 24, g - 38);
    c.lineTo(x + 24, g - 22);
    c.fill();
    // the open sliding door, and the carrier waving while stopped
    c.fillStyle = '#2b2b2b';
    c.fillRect(x + 25, g - 37, 1.5, 28);
    if (p >= 0.3 && p < 0.55) {
      c.fillStyle = '#5b6b86';
      c.fillRect(x + 17, g - 31, 5, 7);
      c.fillStyle = '#e9c3a0';
      c.beginPath();
      c.arc(x + 19.5, g - 33.5, 2.5, 0, Math.PI * 2);
      c.fill();
      const wave = Math.sin(t / 120) * 3;
      c.strokeStyle = '#e9c3a0';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(x + 21, g - 29);
      c.lineTo(x + 25 + wave, g - 36);
      c.stroke();
    }
    // a plain gray band and MAIL on its side
    c.fillStyle = '#9aa3ad';
    c.fillRect(x, g - 13, W, 2);
    c.fillStyle = '#1e2a4a';
    c.font = 'bold 9px Arial, sans-serif';
    c.fillText('MAIL', x + 28, g - 20);
    // the bumper and the lights
    c.fillStyle = '#2a2a2a';
    c.fillRect(x - 1, g - 10, W + 2, 2);
    c.fillStyle = night ? '#fff6c0' : '#e8e2c8';
    c.fillRect(x, g - 18, 2.5, 3);
    c.fillStyle = night ? '#ff3a2a' : '#a83228';
    c.fillRect(x + W - 2, g - 22, 2, 4);
    if (night) {
      c.fillStyle = 'rgba(255,60,40,0.35)';
      c.beginPath();
      c.arc(x + W, g - 20, 4, 0, Math.PI * 2);
      c.fill();
    }
    for (const wx of [x + 9, x + W - 9]) {
      c.fillStyle = '#151515';
      c.beginPath();
      c.arc(wx, g - 5, 5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#bbb';
      c.beginPath();
      c.arc(wx, g - 5, 2, 0, Math.PI * 2);
      c.fill();
    }
    // a puff of exhaust in the cold as it pulls away
    if (p > 0.55 && p < 0.8) {
      c.fillStyle = 'rgba(230,235,245,0.6)';
      c.beginPath();
      c.arc(x + W + 4 + (t % 400) / 40, g - 6 - (t % 400) / 60, 3, 0, Math.PI * 2);
      c.fill();
    }
    return x > -W - 10 && x < VIEW.w ? [x - 2, g - 44, W + 4, 44] : undefined;
  },
  press() {
    return 'The mail jeep pulls away. It left something for you: listen for the dogs at the bedroom door.';
  },
};
