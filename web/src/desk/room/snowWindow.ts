// A window on the wall where it is snowing outside, as it was in the winter of 1992:
// a sky as light or dark as it is outside the visitor's own window right now (the moon and
// stars come out after dark), hills and pines, the neighbors' roofs, and flakes drifting
// down past the panes. Curtains hang either side of it. Call 911 on the wall phone and the
// house across the street catches fire, and a fire engine comes to put it out.
import "./snowWindow.css";
import { h } from "../../editor/core/ui";
import { daylight } from "./daylight";
import { PhoneSounds } from "./phone/sounds";

type RGB = [number, number, number];
const mix = (night: RGB, day: RGB, t: number) =>
  `rgb(${night.map((n, i) => Math.round(n + (day[i] - n) * t)).join(",")})`;

interface Flake {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
}

// a 36" x 48" window, upright like a real double-hung one
const W = 320;
const H = 427;
const GROUND = H - 230; // the hills and houses are drawn for a 230-pixel-high view

export function snowyWindow(): HTMLElement {
  const canvas = h("canvas", { width: W, height: H, "aria-hidden": "true" });
  const el = h(
    "div",
    { class: "snow-window", role: "img" },
    h("div", { class: "sw-rod", "aria-hidden": "true" }),
    h(
      "div",
      { class: "sw-frame" },
      canvas,
      h("div", { class: "sw-bars", "aria-hidden": "true" }),
    ),
    h("div", { class: "sill" }),
    h("div", { class: "sw-curtain left", "aria-hidden": "true" }),
    h("div", { class: "sw-curtain right", "aria-hidden": "true" }),
  );
  const ctx = canvas.getContext("2d")!;
  const rnd = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };
  const stars = Array.from({ length: 60 }, (_, i) => [
    rnd(i) * W,
    rnd(i + 99) * H * 0.6,
    rnd(i + 7) < 0.2 ? 1.4 : 0.8,
  ]);
  const flakes: Flake[] = Array.from({ length: 180 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0.6 + Math.random() * 1.9,
    speed: 0.25 + Math.random() * 0.6,
    drift: Math.random() * Math.PI * 2,
  }));

  const pine = (
    x: number,
    base: number,
    size: number,
    color: string,
    snow: string,
  ) => {
    ctx.fillStyle = color;
    for (let i = 0; i < 3; i++) {
      const y = base - size * (0.35 + i * 0.3);
      const w = size * (0.42 - i * 0.1);
      ctx.beginPath();
      ctx.moveTo(x - w, y + size * 0.3);
      ctx.lineTo(x, y - size * 0.12);
      ctx.lineTo(x + w, y + size * 0.3);
      ctx.fill();
    }
    ctx.fillStyle = snow;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.08, base - size * 0.95);
    ctx.lineTo(x, base - size * 1.08);
    ctx.lineTo(x + size * 0.08, base - size * 0.95);
    ctx.fill();
  };

  const house = (
    x: number,
    base: number,
    w: number,
    hgt: number,
    lit: boolean,
  ) => {
    const d = light;
    ctx.fillStyle = mix([46, 38, 52], [128, 98, 92], d);
    ctx.fillRect(x, base - hgt, w, hgt);
    // chimney, then the snowy roof
    ctx.fillStyle = mix([40, 32, 40], [110, 80, 70], d);
    ctx.fillRect(x + w * 0.7, base - hgt - w * 0.42, w * 0.1, w * 0.3);
    ctx.fillStyle = mix([176, 186, 206], [250, 252, 255], d);
    ctx.beginPath();
    ctx.moveTo(x - 7, base - hgt + 2);
    ctx.lineTo(x + w / 2, base - hgt - w * 0.42);
    ctx.lineTo(x + w + 7, base - hgt + 2);
    ctx.fill();
    ctx.fillStyle = lit ? "#ffd77a" : mix([60, 60, 72], [92, 104, 124], d);
    ctx.fillRect(x + w * 0.2, base - hgt * 0.62, w * 0.18, w * 0.18);
    ctx.fillRect(x + w * 0.6, base - hgt * 0.62, w * 0.18, w * 0.18);
    ctx.fillStyle = mix([30, 24, 30], [86, 62, 52], d);
    ctx.fillRect(x + w * 0.42, base - hgt * 0.45, w * 0.14, hgt * 0.45);
  };

  const scenery = () => {
    const d = light;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, mix([10, 14, 34], [140, 166, 196], d));
    sky.addColorStop(0.7, mix([44, 52, 84], [214, 222, 234], d));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // the moon and the stars after dark
    if (d < 0.5) {
      ctx.globalAlpha = 1 - d * 2;
      ctx.fillStyle = "#fff";
      for (const [x, y, r] of stars) ctx.fillRect(x, y, r, r);
      // a crescent: the full moon with its shadowed side cut away, so the sky shows there
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.arc(257, 145, 13, 0, Math.PI * 2);
      ctx.clip("evenodd");
      ctx.fillStyle = "#f4f0dc";
      ctx.beginPath();
      ctx.arc(250, 150, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    // far hills, then pines along them
    ctx.save();
    ctx.translate(0, GROUND);
    ctx.fillStyle = mix([70, 80, 110], [200, 210, 226], d);
    ctx.beginPath();
    ctx.moveTo(0, 150);
    ctx.quadraticCurveTo(80, 112, 170, 140);
    ctx.quadraticCurveTo(250, 118, W, 136);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();
    const tree = mix([22, 34, 40], [70, 96, 92], d);
    const treeSnow = mix([150, 160, 182], [244, 247, 252], d);
    for (const [x, s] of [
      [24, 34],
      [44, 26],
      [210, 30],
      [232, 40],
      [300, 28],
    ])
      pine(x, 160, s, tree, treeSnow);
    const lit = d < 0.6;
    house(66, 186, 64, 36, lit);
    house(160, 192, 82, 40, lit && light < 0.4);
    // drifts on the ground
    ctx.fillStyle = mix([150, 160, 186], [244, 247, 252], d);
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, 190);
    ctx.quadraticCurveTo(80, 176, 160, 194);
    ctx.quadraticCurveTo(240, 180, W, 192);
    ctx.lineTo(W, H);
    ctx.fill();
    ctx.restore();
  };

  // ---- the house fire (seconds since the call) ----------------------------------------
  // flames grow, the engine comes up the street with its siren on, sprays the house until
  // the fire is out, waits while the smoke clears, and drives on
  let fireAt = 0;
  const FIRE_END = 40;
  const since = () => (fireAt ? (performance.now() - fireAt) / 1000 : -1);
  const ramp = (t: number, a: number, b: number) =>
    Math.max(0, Math.min(1, (t - a) / (b - a)));
  const flames = (t: number) => ramp(t, 0, 4) * (1 - ramp(t, 11, 19));
  const truckX = (t: number) =>
    t < 10
      ? 196 + (1 - ramp(t, 6, 10)) ** 2 * 194
      : 196 - ramp(t, 24, 29) ** 2 * 300;
  const smoke: {
    x: number;
    y: number;
    r: number;
    age: number;
    steam: boolean;
  }[] = [];
  // the burning house: house(160, 192, 82, 40) in the scenery
  const HX = 160;
  const HW = 82;
  const HB = GROUND + 192;
  const HH = 40;

  const flame = (
    x: number,
    base: number,
    size: number,
    t: number,
    seed: number,
  ) => {
    const flick =
      0.75 + 0.25 * Math.sin(t * 14 + seed * 3.1) + Math.random() * 0.12;
    const hgt = size * flick;
    const g = ctx.createLinearGradient(0, base, 0, base - hgt);
    g.addColorStop(0, "rgba(255,230,120,0.95)");
    g.addColorStop(0.45, "rgba(255,140,30,0.9)");
    g.addColorStop(1, "rgba(200,40,10,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.32, base);
    ctx.quadraticCurveTo(
      x - size * 0.3,
      base - hgt * 0.5,
      x + Math.sin(t * 9 + seed) * size * 0.15,
      base - hgt,
    );
    ctx.quadraticCurveTo(
      x + size * 0.3,
      base - hgt * 0.5,
      x + size * 0.32,
      base,
    );
    ctx.fill();
  };

  const truck = (x: number, base: number, t: number) => {
    // a red pumper facing left: the cab, the body with its ladder, wheels, and the lights
    ctx.fillStyle = "#c4161c";
    ctx.fillRect(x, base - 20, 18, 16);
    ctx.fillRect(x + 16, base - 17, 44, 13);
    ctx.fillStyle = "#9fd3ff";
    ctx.fillRect(x + 3, base - 18, 9, 6);
    ctx.fillStyle = "#e8e8e8";
    ctx.fillRect(x + 18, base - 12, 40, 2);
    ctx.fillStyle = "#b8bcc4";
    ctx.fillRect(x + 20, base - 21, 40, 2);
    for (let i = 0; i < 8; i++) ctx.fillRect(x + 21 + i * 5, base - 23, 1, 4);
    ctx.fillRect(x + 20, base - 25, 40, 2);
    ctx.fillStyle = "#111";
    for (const wx of [x + 9, x + 48]) {
      ctx.beginPath();
      ctx.arc(wx, base - 3, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    const blink = Math.floor(t * 4) % 2 === 0;
    ctx.fillStyle = blink ? "#ff2020" : "#ffffff";
    ctx.fillRect(x + 2, base - 23, 5, 3);
    ctx.fillStyle = blink ? "#ffffff" : "#ff2020";
    ctx.fillRect(x + 10, base - 23, 5, 3);
    // the lights wash red over the snow
    const glow = ctx.createRadialGradient(
      x + 8,
      base - 20,
      2,
      x + 8,
      base - 20,
      70,
    );
    glow.addColorStop(0, `rgba(255,40,40,${blink ? 0.35 : 0.12})`);
    glow.addColorStop(1, "rgba(255,40,40,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 70, base - 90, 140, 110);
  };

  const drawFire = (t: number) => {
    const f = flames(t);
    // charred: the snow on the roof has melted off, the windows glow while it burns
    const char = ramp(t, 1, 5) * (1 - ramp(t, 30, FIRE_END));
    ctx.fillStyle = `rgba(40,30,30,${0.85 * char})`;
    ctx.beginPath();
    ctx.moveTo(HX - 7, HB - HH + 2);
    ctx.lineTo(HX + HW / 2, HB - HH - HW * 0.42);
    ctx.lineTo(HX + HW + 7, HB - HH + 2);
    ctx.fill();
    if (f > 0) {
      ctx.fillStyle = `rgba(255,${120 + Math.random() * 60},30,${0.9 * f})`;
      ctx.fillRect(HX + HW * 0.2, HB - HH * 0.62, HW * 0.18, HW * 0.18);
      ctx.fillRect(HX + HW * 0.6, HB - HH * 0.62, HW * 0.18, HW * 0.18);
      const glow = ctx.createRadialGradient(
        HX + HW / 2,
        HB - HH,
        4,
        HX + HW / 2,
        HB - HH,
        110,
      );
      glow.addColorStop(0, `rgba(255,140,40,${0.45 * f})`);
      glow.addColorStop(1, "rgba(255,140,40,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(HX - 110, HB - HH - 140, HW + 220, 220);
      for (let i = 0; i < 7; i++) {
        const fx = HX + 4 + (i * (HW - 8)) / 6;
        const roof =
          HB -
          HH -
          HW * 0.42 * (1 - Math.abs(fx - (HX + HW / 2)) / (HW / 2 + 7));
        flame(fx, roof + 4, (16 + (i % 3) * 7) * f, t, i);
      }
    }
    // smoke while it burns, white steam once the water hits it
    const steam = t > 11 && t < 26;
    if ((f > 0.05 || steam) && Math.random() < 0.6)
      smoke.push({
        x: HX + 10 + Math.random() * (HW - 20),
        y: HB - HH - 20,
        r: 4 + Math.random() * 4,
        age: 0,
        steam: t > 11,
      });
    for (let i = smoke.length - 1; i >= 0; i--) {
      const p = smoke[i];
      p.age += 1 / 60;
      p.y -= 0.6;
      p.x += 0.25 + Math.sin(p.age * 2 + i) * 0.2;
      p.r += 0.12;
      const a = Math.max(0, 0.5 - p.age / 6);
      if (a <= 0) {
        smoke.splice(i, 1);
        continue;
      }
      ctx.fillStyle = p.steam
        ? `rgba(225,230,236,${a})`
        : `rgba(60,58,62,${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    const tx = truckX(t);
    const tb = GROUND + 214;
    if (t >= 6 && tx < W + 10 && tx > -80) {
      truck(tx, tb, t);
      // the hose: an arc of water from the truck onto the roof, with drops falling
      if (t > 11 && t < 21) {
        ctx.strokeStyle = "rgba(190,225,255,0.85)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.lineDashOffset = -t * 60;
        ctx.beginPath();
        ctx.moveTo(tx + 22, tb - 25);
        ctx.quadraticCurveTo(
          tx - 10,
          HB - HH - 70,
          HX + HW * 0.6,
          HB - HH - 14,
        );
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(190,225,255,0.8)";
        for (let i = 0; i < 6; i++)
          ctx.fillRect(
            HX + HW * 0.4 + Math.random() * 30,
            HB - HH - 10 + Math.random() * 30,
            1.5,
            3,
          );
      }
    }
  };

  const onFire = () => {
    if (!el.isConnected) return removeEventListener("gm-house-fire", onFire);
    if (fireAt && since() < FIRE_END) return; // already burning
    fireAt = performance.now();
    smoke.length = 0;
    PhoneSounds.open()?.siren(3, 7.5);
    label();
    // without motion the snow stands still, but the fire still plays out
    if (still) {
      const loop = () => {
        draw(false);
        if (since() < FIRE_END && el.isConnected) requestAnimationFrame(loop);
        else label();
      };
      requestAnimationFrame(loop);
    }
  };
  addEventListener("gm-house-fire", onFire);

  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let light = daylight();
  const label = () => {
    const t = since();
    const outside =
      t < 0 || t > FIRE_END
        ? ""
        : t < 10
          ? " A house across the street is on fire, and a fire engine is coming!"
          : t < 19
            ? " Firefighters are spraying water on the burning house."
            : " The fire is out; smoke drifts up from the house.";
    el.setAttribute(
      "aria-label",
      `A window: snow is falling outside, ${light > 0.5 ? "in daylight" : light > 0 ? "at dusk" : "at night"}.${outside}`,
    );
  };
  label();
  let t = 0;
  const draw = (move: boolean) => {
    scenery();
    const ft = since();
    if (ft >= 0 && ft < FIRE_END) drawFire(ft);
    else fireAt = 0;
    ctx.fillStyle = "#fff";
    for (const f of flakes) {
      if (move) {
        f.y += f.speed;
        f.x += Math.sin((t + f.drift * 40) / 40) * 0.3;
        if (f.y > H) {
          f.y = -2;
          f.x = Math.random() * W;
        }
      }
      ctx.globalAlpha = 0.6 + f.r / 5;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  const frame = () => {
    if (!el.isConnected) return;
    t += 1;
    if (t % 600 === 0 || (fireAt && t % 60 === 0)) {
      light = daylight();
      label();
    }
    draw(true);
    requestAnimationFrame(frame);
  };
  // the light outside also brightens the wall beside the window (deskStage.css)
  const shine = () =>
    el
      .closest<HTMLElement>(".desk")
      ?.style.setProperty("--window-light", (0.04 + light * 0.16).toFixed(3));
  // Start once the window is on the page; stop when the desk goes away. Without motion the
  // snow hangs still in the air.
  requestAnimationFrame(() => {
    shine();
    if (still) draw(false);
    else requestAnimationFrame(frame);
  });
  return el;
}
