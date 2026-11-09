// What a game's laser-cut kits are, read from the manifests the build writes to laser/<id>/manifest.json on the
// site (games/kit/laserNickels.ts writes the wooden nickel's; another kit, such as a puzzle box, only has to write a
// manifest with a `kit` entry in the same shape). The shelf (trinketShelf.ts, laserKitList.ts) lists whatever this
// returns, so a new kit needs no UI code. A secret game has no manifest, so none is listed.

interface LaserPreview {
  /** A PNG next to the manifest. */
  file: string;
  /** What the picture shows ("Front of the nickel"). */
  alt: string;
}

interface LaserDownload {
  /** A file next to the manifest, or `../name` for one shared by every game (the checklist). */
  file: string;
  /** What the file is for, in words ("The 12-nickel sheet: first pass"). */
  label: string;
}

/** A flat part on a sheet, in millimeters from the sheet's top left (the Stage Box's manifest lists them). */
interface LaserPart {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A sheet of a kit with its preview PNG and where each part lies on it (for the 3D box's face pictures). */
export interface LaserSheet {
  preview: string;
  w: number;
  h: number;
  parts: LaserPart[];
}

export interface LaserKit {
  /** 'nickel': a wooden coin; 'box': the Final Curtain Stage Box (drawn in 3D from its parts); 'kit': any other. */
  kind: 'nickel' | 'box' | 'kit' | 'patch';
  title: string;
  /** Material thickness in mm (the nickel's wood, the box's plywood). */
  thickness?: number;
  /** The coin's or patch's diameter in mm. */
  coin?: number;
  /** The width in mm of the square picture of a patch (its stitch simulation), which the 3D face is cut from. */
  pictureMm?: number;
  /** The sheets of a kit that lists its parts (the Stage Box). */
  sheets?: LaserSheet[];
  /** One line: what it is and what it is cut on. */
  summary: string;
  previews: LaserPreview[];
  downloads: LaserDownload[];
  /** Where the files are served, ending in a slash. */
  base: string;
}

/** Where game `id`'s laser files are served. */
const laserBase = (id: string): string => `./laser/${id}/`;

const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const list = <T>(v: unknown, ok: (x: Record<string, unknown>) => T | null): T[] =>
  Array.isArray(v) ? v.flatMap((x) => (x && typeof x === 'object' ? (ok(x as Record<string, unknown>) ?? []) : [])) : [];
/** A file name that stays inside the laser folder: a plain name, or one level up (`../checklist.svg`). */
const safe = (f: string) => /^(\.\.\/)?[A-Za-z0-9][\w.-]*$/.test(f);

/** The kit a manifest describes: its own `kit` entry, or the wooden nickel's, which is worded here. Null for one that isn't a kit. */
export function kitOf(manifest: unknown, base: string): LaserKit | null {
  if (!manifest || typeof manifest !== 'object') return null;
  const m = manifest as Record<string, unknown>;
  const kit = m.kit && typeof m.kit === 'object' ? (m.kit as Record<string, unknown>) : null;
  if (kit && str(kit.title) && str(kit.summary)) {
    const previews = list(kit.previews, (p) => (str(p.file) && str(p.alt) && safe(p.file) ? { file: p.file, alt: p.alt } : null));
    const downloads = list(kit.downloads, (d) => (str(d.file) && str(d.label) && safe(d.file) ? { file: d.file, label: d.label } : null));
    const material = m.material && typeof m.material === 'object' ? (m.material as { thickness?: unknown }).thickness : undefined;
    const sheets = list(m.sheets, (s) => {
      const parts = list(s.parts, (p) =>
        str(p.name) && [p.x, p.y, p.w, p.h].every((n) => typeof n === 'number')
          ? { name: p.name, x: p.x as number, y: p.y as number, w: p.w as number, h: p.h as number }
          : null,
      );
      return str(s.preview) && safe(s.preview) && typeof s.w === 'number' && typeof s.h === 'number' ? { preview: s.preview, w: s.w, h: s.h, parts } : null;
    });
    return {
      kind: m.id === 'stage-box' && sheets.length ? 'box' : m.id === 'embroidery-patch' ? 'patch' : 'kit',
      coin: typeof m.diameter === 'number' ? m.diameter : undefined,
      pictureMm: typeof m.pictureMm === 'number' ? m.pictureMm : undefined,
      title: kit.title,
      thickness: typeof material === 'number' ? material : undefined,
      sheets: sheets.length ? sheets : undefined,
      summary: kit.summary,
      previews,
      downloads,
      base,
    };
  }
  if (m.key !== 'laser-nickel') return null;
  const coin = typeof m.mm === 'object' && m.mm ? (m.mm as { coin?: unknown }).coin : undefined;
  const inches = typeof coin === 'number' && coin > 0 ? `${+(coin / 25.4).toFixed(1)} in` : '1.5 in';
  const wood = typeof m.mm === 'object' && m.mm ? (m.mm as { wood?: unknown }).wood : undefined;
  return {
    kind: 'nickel',
    coin: typeof coin === 'number' && coin > 0 ? coin : 38.1,
    thickness: typeof wood === 'number' ? wood : 3,
    title: 'Wooden nickel',
    summary: `A laser-cut wooden nickel, ${inches} across, for a Glowforge. Cut the sheet, flip it onto the jig, then run the back.`,
    previews: [
      { file: 'front.png', alt: 'Front of the wooden nickel' },
      { file: 'back.png', alt: 'Back of the wooden nickel' },
    ],
    downloads: [
      { file: 'sheet.svg', label: 'Sheet of 12, front pass (SVG)' },
      { file: 'sheet-back.svg', label: 'Sheet of 12, back pass after the flip (SVG)' },
      { file: 'front.svg', label: 'One nickel, front (SVG)' },
      { file: 'back.svg', label: 'One nickel, back (SVG)' },
      { file: '../checklist.svg', label: 'Collector’s checklist of all 26 (SVG)' },
    ],
    base,
  };
}

/** Folders under laser/<id>/ that each hold one kit's manifest.json: the wooden nickel's is the folder itself. */
const KIT_FOLDERS = ['', 'stage-box/', 'plowed-street/', 'cryptex/', 'patch/'];

/** Game `id`'s laser kits, or none when it has no manifest (a dev server answers a missing file with the page, so the type is checked). */
export async function loadLaserKits(id: string): Promise<LaserKit[]> {
  const found = await Promise.all(
    KIT_FOLDERS.map(async (sub) => {
      const base = `${laserBase(id)}${sub}`;
      try {
        const res = await fetch(`${base}manifest.json`);
        if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null;
        return kitOf(await res.json(), base);
      } catch {
        return null;
      }
    }),
  );
  return found.filter((k): k is LaserKit => k !== null);
}
