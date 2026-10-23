// The window (room/snowWindow.ts): breathe on the cold glass and draw in the fog, and at
// night, press the moon (tonight's real phase) for a shooting star, Carl the fly buzzing
// past, or a wink.
import { h } from "../../editor/core/ui";
import { addSkyExtra, MOON, VIEW, type SkyExtra } from "../room/snowWindow";
import { daylight } from "../room/daylight";
import { moonPhase } from "./moonPhase";
import { hitArea, pressable, say, stillMotion, turns } from "./propKit";
import { roomSound } from "./propSound";

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`;

/** For `ms`, draws `f` at its progress 0 to 1 (held halfway without motion). */
const timed = (ms: number, f: (ctx: CanvasRenderingContext2D, p: number) => void): SkyExtra => {
  const still = stillMotion();
  return (ctx, t) => {
    if (t > (still ? 1800 : ms)) return false;
    f(ctx, still ? 0.5 : t / ms);
    return true;
  };
};

const shootingStar = timed(900, (ctx, p) => {
  const x = 30 + p * 190;
  const y = 40 + p * 80;
  const g = ctx.createLinearGradient(x - 60, y - 25, x, y);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(1, "rgba(255,255,255,0.95)");
  ctx.strokeStyle = g;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 60, y - 25);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
});

// Carl: big red eyes, a striped body and smug little wings, on the glass and going by
const carl = timed(1700, (ctx, p) => {
  const x = -20 + p * (VIEW.w + 40);
  const y = 220 + Math.sin(p * 18) * 14 - p * 60;
  const flap = Math.sin(p * 120) > 0 ? 1 : 0.6;
  ctx.fillStyle = "rgba(220,235,255,0.7)";
  ctx.beginPath();
  ctx.ellipse(x - 2, y - 6, 5, 3 * flap, -0.5, 0, Math.PI * 2);
  ctx.ellipse(x + 3, y - 6, 5, 3 * flap, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.ellipse(x, y, 5, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c8a000";
  ctx.fillRect(x - 1, y - 3, 1.5, 6);
  ctx.fillStyle = "#e0242c";
  ctx.beginPath();
  ctx.arc(x + 5, y - 2, 2.2, 0, Math.PI * 2);
  ctx.arc(x + 5, y + 2, 2.2, 0, Math.PI * 2);
  ctx.fill();
});

const wink = timed(1800, (ctx, p) => {
  const { x, y, r } = MOON;
  ctx.strokeStyle = "rgba(60,55,40,0.85)";
  ctx.fillStyle = "rgba(60,55,40,0.85)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.2, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  // the right eye shut in a wink for the middle of it
  if (p > 0.25 && p < 0.75) ctx.arc(x + r * 0.35, y - r * 0.25, 2.4, 0.2, Math.PI - 0.2);
  else ctx.arc(x + r * 0.35, y - r * 0.2, 1.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y + r * 0.1, r * 0.45, 0.3, Math.PI - 0.3);
  ctx.stroke();
});

const MOON_TRICKS: { extra: SkyExtra; sound: "twinkle" | "buzz"; line: string }[] = [
  { extra: shootingStar, sound: "twinkle", line: "A shooting star! Make a wish (a bug-free build?)." },
  { extra: carl, sound: "buzz", line: "Bzzzz. Carl the fly goes by on the glass. He says he broke time." },
  { extra: wink, sound: "twinkle", line: "The moon winks at you. It’s seen you up this late before." },
];

// drawn about (110, 210), moved right of the middle (the monitor hides the window's left side)
const DOODLES: [string, string][] = [
  ["a smiley face", '<circle cx="110" cy="200" r="34"/><circle cx="98" cy="190" r="2"/><circle cx="122" cy="190" r="2"/><path d="M92 210 q18 16 36 0"/>'],
  ["a heart", '<path d="M110 236 l-34 -34 a18 18 0 0 1 34 -22 a18 18 0 0 1 34 22 z"/>'],
  ["GM, with a little star", '<path d="M90 186 h-22 v34 h22 v-14 h-10 M100 220 v-34 l14 18 l14 -18 v34"/><path d="M146 172 l3 8 8 0 -6 5 2 8 -7 -5 -7 5 2 -8 -6 -5 8 0 z"/>'],
  ["a game of tic-tac-toe (X wins)", '<path d="M88 170 v80 M116 170 v80 M64 196 h80 M64 224 h80 M68 176 l14 14 m0 -14 l-14 14 M96 204 l14 14 m0 -14 l-14 14 M124 232 l14 14 m0 -14 l-14 14"/><circle cx="131" cy="183" r="7"/>'],
  ["a paw print, for Teddy", '<ellipse cx="110" cy="214" rx="16" ry="13"/><circle cx="90" cy="192" r="6"/><circle cx="104" cy="182" r="6"/><circle cx="118" cy="182" r="6"/><circle cx="131" cy="192" r="6"/>'],
];

function fog(doodle: string): string {
  return `<svg viewBox="0 0 ${VIEW.w} ${VIEW.h}" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <radialGradient id="sw-fog-g" cx="0.64" cy="0.56" r="0.36"><stop offset="0" stop-color="#eef2f8" stop-opacity="0.6"/><stop offset="0.7" stop-color="#eef2f8" stop-opacity="0.35"/><stop offset="1" stop-color="#eef2f8" stop-opacity="0"/></radialGradient>
      <mask id="sw-fog-m"><rect width="${VIEW.w}" height="${VIEW.h}" fill="#fff"/><g transform="translate(95 40)" fill="none" stroke="#000" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${doodle}</g></mask>
    </defs>
    <rect width="${VIEW.w}" height="${VIEW.h}" fill="url(#sw-fog-g)" mask="url(#sw-fog-m)"/>
  </svg>`;
}

export function windowProps(win: HTMLElement): () => void {
  const frame = win.querySelector<HTMLElement>(".sw-frame");
  if (!frame) return () => {};
  // a picture with things to press in it: a group named for what it shows
  win.setAttribute("role", "group");
  const layer = h("div", { class: "sw-hits" });
  const fogged = h("div", { class: "sw-fog", "aria-hidden": "true" });
  const glass = hitArea("sw-glass");
  const moon = hitArea("sw-moon");
  Object.assign(moon.style, {
    left: pct(MOON.x - 22, VIEW.w),
    top: pct(MOON.y - 22, VIEW.h),
    width: pct(44, VIEW.w),
    height: pct(44, VIEW.h),
  });
  layer.append(fogged, glass, moon);
  frame.append(layer);

  const doodle = turns(DOODLES);
  let fogTimer = 0;
  const offGlass = pressable(
    glass,
    "Window glass: breathe on it and draw in the fog",
    () => {
      const [what, d] = doodle();
      fogged.innerHTML = fog(d);
      fogged.classList.remove("fade");
      void fogged.offsetWidth;
      fogged.classList.add("fade");
      clearTimeout(fogTimer);
      fogTimer = window.setTimeout(() => fogged.replaceChildren(), 4200);
      say(glass, `Hhhh… you breathe on the cold glass and draw ${what} in the fog.`);
    },
    { id: "desk-window" },
  );

  const trick = turns(MOON_TRICKS);
  const offMoon = pressable(
    moon,
    "The moon",
    () => {
      const t = trick();
      const m = moonPhase();
      addSkyExtra(win, t.extra);
      roomSound[t.sound]();
      say(moon, `Tonight it’s ${m.name}, ${Math.round(m.lit * 100)}% lit. ${t.line}`);
    },
    { id: "desk-moon" },
  );
  // the moon is only there after dark: its button too
  const show = () => {
    const night = daylight() < 0.5;
    moon.hidden = !night;
    const m = moonPhase();
    moon.setAttribute("aria-label", `The moon: ${m.name}, ${Math.round(m.lit * 100)}% lit`);
  };
  show();
  const timer = setInterval(show, 60_000);
  return () => {
    offGlass();
    offMoon();
    clearInterval(timer);
    clearTimeout(fogTimer);
  };
}
