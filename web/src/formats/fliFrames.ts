// An .FLI animation as a list of whole frames (each its own picture and 6-bit palette),
// for editing: break an animation apart, change it, and write it back as an .FLI.
// The original Game-Maker only played .FLI files (FLI::View in code/Image/FLI/FLI.CPP);
// editing them is new to this port. Because most FLI frames are deltas (LC chunks) on the
// frame before, frames can only be taken apart by playing them in order; the file layout
// itself is described in fli.ts.
import { applyFliFrame, encodeFli, newFliCanvas, parseFli } from './fli';

export interface FliFrame {
  pixels: Uint8Array;
  /** 6-bit palette, 768 bytes. */
  palette: Uint8Array;
}

export interface FliFrames {
  width: number;
  height: number;
  /** Delay after each frame in 1/70 s. */
  speed: number;
  frames: FliFrame[];
}

/** Plays the animation through, keeping a copy of every frame (not the closing ring frame). */
export function decodeFliFrames(bytes: Uint8Array): FliFrames {
  const anim = parseFli(bytes);
  const c = newFliCanvas(anim);
  const frames: FliFrame[] = [];
  // The header's frame count excludes the ring frame that loops back to frame 0.
  const count = Math.min(anim.frameCount, anim.frames.length);
  for (let i = 0; i < count; i++) {
    applyFliFrame(anim, i, c);
    frames.push({ pixels: c.pixels.slice(), palette: c.palette.slice() });
  }
  return { width: anim.width, height: anim.height, speed: anim.speed, frames };
}

/** Writes the frames as an .FLI; palette changes are stored on the frames where they happen. */
export function encodeFliFrames(a: FliFrames): Uint8Array {
  if (!a.frames.length) throw new Error('An animation needs at least one frame');
  // The header's speed field is a u16.
  return encodeFli(
    a.frames.map((f) => f.pixels),
    a.frames[0].palette,
    { width: a.width, height: a.height, speed: Math.max(0, Math.min(65535, Math.round(a.speed))), palettes: a.frames.map((f) => f.palette) },
  );
}

/** Places a picture on a width x height frame: centered, cropped or padded with color 0. */
export function fitPicture(pixels: Uint8Array, pw: number, ph: number, width: number, height: number): Uint8Array {
  const out = new Uint8Array(width * height);
  const ox = Math.floor((width - pw) / 2);
  const oy = Math.floor((height - ph) / 2);
  for (let y = 0; y < height; y++) {
    const sy = y - oy;
    if (sy < 0 || sy >= ph) continue;
    for (let x = 0; x < width; x++) {
      const sx = x - ox;
      if (sx >= 0 && sx < pw) out[y * width + x] = pixels[sy * pw + sx];
    }
  }
  return out;
}
