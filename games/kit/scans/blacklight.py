# The desk's black-light poster of Doc Leo (web/src/desk/props/blacklight.ts), made from
# Lewis's own photo of himself as the hobo clown (the Bard of Bizarre portrait in
# .for-lewis, not in git): cut out from the sky and the street, posterized into a few flat
# regions (the fedora, the face, the red nose and cheeks, the white mouth makeup, the
# stubble, the shirt, the jacket), each filled flat in a fluorescent ink on velvet black,
# with neon outlines traced from the edges, and DOC LEO across the bottom in 70s black-light
# poster lettering. Two pictures: the day one, muted velvet colors in plain light, and the
# night one, glowing under the tube. Only those go in git (web/public/desk/).
#
# Run once (needs Pillow and NumPy; the photo in .for-lewis):
#   python3 games/kit/scans/blacklight.py
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[3]
PHOTO = ROOT / '.for-lewis/songs/the-bard-of-bizarre-lewie.jpg'
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'web/public/desk'
W, H = 360, 540  # the poster, 2:3
ART_H = 450  # the portrait above the title

# The photo, 700 x 700 (it is square): Lewis's silhouette (hat, face, shoulders), traced
# round by hand, so the sky, the house and the car behind him go to velvet black.
OUTLINE = [
    (178, 175), (200, 110), (228, 52), (270, 22), (330, 8), (395, 8), (445, 28), (478, 70),
    (498, 140), (512, 192), (560, 232), (568, 286),
    (522, 304), (516, 360), (512, 440), (498, 515), (575, 530), (700, 610), (700, 700),
    (0, 700), (0, 600), (150, 510), (176, 455), (162, 345), (124, 300), (112, 262), (130, 236),
]
# where the fedora ends (the brim's underside) and the face is (700-scale, traced on the
# photo): the rest of him is the shirt and the jacket, told apart by color
BRIM = [(100, 300), (124, 300), (220, 250), (350, 216), (480, 236), (560, 282), (600, 290)]  # its underside
FACE = (344, 404, 182, 214)  # an ellipse: center, radii (the ears and neck join it by color)
BAND = ((176, 172), (512, 184))  # the hat band's bottom edge, a line just above the brim

INK = {
    'hat': (40, 110, 255),  # electric blue
    'hatlit': (60, 140, 255),
    'band': (255, 140, 20),  # orange
    'shade': (255, 100, 40),  # the skin: orange, dim to bright (see SHADE)
    'face': (255, 150, 60),
    'lit': (255, 200, 120),
    'red': (255, 40, 200),  # magenta: the nose and the cheeks
    'white': (120, 255, 60),  # UV green: the white makeup round the mouth
    'stubble': (150, 100, 255),  # violet
    'brow': (0, 0, 0),
    'shirt': (200, 60, 255),  # violet
    'jacket': (40, 110, 255),
}
# how bright each fill is (the outlines are always full): the face only a glow, so the
# makeup and the features stand out on it, as on a real flocked poster
SHADE = {'hat': 0.3, 'hatlit': 0.55, 'band': 0.9, 'shade': 0.22, 'face': 0.45, 'lit': 0.78, 'red': 1.0, 'white': 1.0, 'stubble': 0.42, 'brow': 0, 'shirt': 0.6, 'jacket': 0.22}
VELVET = np.array([14, 10, 20], float)


def silhouette(size: int) -> np.ndarray:
    m = Image.new('L', (700, 700), 0)
    ImageDraw.Draw(m).polygon(OUTLINE, fill=255)
    return np.asarray(m.filter(ImageFilter.GaussianBlur(1.5)).resize((size, size), Image.LANCZOS), float) / 255


def polygon(points: list, size: int) -> np.ndarray:
    m = Image.new('L', (700, 700), 0)
    ImageDraw.Draw(m).polygon(points, fill=255)
    return np.asarray(m.resize((size, size), Image.NEAREST)) > 127


def regions(rgb: np.ndarray, inside: np.ndarray) -> np.ndarray:
    """A label (an index into PARTS) for each pixel, 0 for the background: the felt hat (and
    its band), the skin (lit and in shadow), the red nose and cheeks, the white makeup round
    the mouth, the stubble, the eyebrows, the purple shirt and the dark jacket."""
    h, w, _ = rgb.shape
    r, g, b = (rgb[..., i] for i in range(3))
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    sat = rgb.max(-1) - rgb.min(-1)
    ys, xs = np.mgrid[0:h, 0:w] * (700 / h)
    lab = np.zeros((h, w), np.int8)
    body = inside > 0.5
    under = np.interp(xs, [x for x, _ in BRIM], [y for _, y in BRIM])
    hat = body & (ys < under)
    cx, cy, rx, ry = FACE
    skin = (sat >= 45) & (r > b + 20)
    face = body & ~hat & ((((xs - cx) / rx) ** 2 + ((ys - cy) / ry) ** 2 < 1) | skin & (ys < 560))
    clothes = body & ~hat & ~face
    lab[clothes] = PARTS.index('jacket')
    lab[clothes & (b > g + 10) & (r > g) & (lum > 60)] = PARTS.index('shirt')
    lab[hat] = PARTS.index('hat')
    lab[hat & (lum > 120)] = PARTS.index('hatlit')
    (x0, y0), (x1, y1) = BAND
    edge = y0 + (xs - x0) * (y1 - y0) / (x1 - x0)
    lab[hat & (ys < edge) & (ys > edge - 20)] = PARTS.index('band')
    # the skin in three flat tones by how lit it is; the grey stubble a violet shadow
    lab[face] = PARTS.index('shade')
    lab[face & ~skin & (lum > 80)] = PARTS.index('stubble')
    lab[face & skin & (lum > 85)] = PARTS.index('face')
    lab[face & skin & (lum > 150)] = PARTS.index('lit')
    lab[face & (r > 170) & (r - g > 85) & (r - b > 70) & (ys > 320) & (ys < 470)] = PARTS.index('red')
    lab[face & (lum > 160) & (sat < 70) & (ys > 430) & (ys < 540) & (np.abs(xs - 340) < 95)] = PARTS.index('white')
    lab[face & (lum < 60) & (sat < 60) & (ys > 250) & (ys < 300)] = PARTS.index('brow')
    return lab


PARTS = ['bg', 'hat', 'hatlit', 'band', 'shade', 'face', 'lit', 'red', 'white', 'stubble', 'brow', 'shirt', 'jacket']


def tidy(lab: np.ndarray, rounds: int = 2) -> np.ndarray:
    """Smooths the regions' edges (a majority filter), so they read as flat shapes."""
    for _ in range(rounds):
        img = Image.fromarray(lab.astype(np.uint8))
        lab = np.asarray(img.filter(ImageFilter.ModeFilter(5)), np.int8)
    return lab


def edges(gray: np.ndarray) -> np.ndarray:
    """How strong an edge each pixel is on (Sobel on a softened picture), 0 to 1."""
    g = np.asarray(Image.fromarray(gray.astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6)), float)
    gx = np.zeros_like(g)
    gy = np.zeros_like(g)
    gx[1:-1, 1:-1] = (g[:-2, 2:] + 2 * g[1:-1, 2:] + g[2:, 2:]) - (g[:-2, :-2] + 2 * g[1:-1, :-2] + g[2:, :-2])
    gy[1:-1, 1:-1] = (g[2:, :-2] + 2 * g[2:, 1:-1] + g[2:, 2:]) - (g[:-2, :-2] + 2 * g[:-2, 1:-1] + g[:-2, 2:])
    m = np.hypot(gx, gy)
    return np.clip((m - 60) / 120, 0, 1)


def boundaries(lab: np.ndarray) -> np.ndarray:
    """Where one region meets another (the neon outline round each shape)."""
    b = np.zeros(lab.shape, bool)
    b[:, 1:] |= lab[:, 1:] != lab[:, :-1]
    b[1:, :] |= lab[1:, :] != lab[:-1, :]
    return b


def thicken(mask: np.ndarray, r: int) -> np.ndarray:
    img = Image.fromarray((mask * 255).astype(np.uint8))
    return np.asarray(img.filter(ImageFilter.MaxFilter(r)), float) / 255


def portrait() -> tuple[np.ndarray, np.ndarray]:
    """The inks (0-255, before shading for day or night) and how bright each pixel is."""
    photo = Image.open(PHOTO).convert('RGB')
    side = 700
    big = photo.resize((side, side), Image.LANCZOS)
    rgb = np.asarray(big, float)
    inside = silhouette(side)
    lab = tidy(regions(rgb, inside))
    ink = np.zeros((side, side, 3))
    level = np.zeros((side, side))
    for i, name in enumerate(PARTS[1:], 1):
        sel = lab == i
        ink[sel] = INK[name]
        level[sel] = SHADE[name]
    # the features traced in neon: the edges of the photo inside the face and the hat (the
    # glasses, the eyes, the mouth, the ears), and the outline round every region
    gray = rgb @ np.array([0.299, 0.587, 0.114])
    e = edges(gray) * (inside > 0.5)
    face = np.isin(lab, [PARTS.index(p) for p in ('shade', 'face', 'lit', 'red', 'white', 'stubble', 'brow')])
    feat = thicken(e * face > 0.6, 3)
    group = np.select([lab == 0, np.isin(lab, [PARTS.index(p) for p in ('hat', 'hatlit')]), face, lab == PARTS.index('band')], [0, 1, 2, 4], 3)
    group = np.where(np.isin(lab, [PARTS.index('red'), PARTS.index('white')]), lab + 10, group)
    out = thicken(boundaries(group), 3) * (inside > 0.02)
    # the outline: green round the face, orange round the hat, blue round the clothes
    line_ink = np.zeros_like(ink)
    line_ink[:] = INK['jacket']
    line_ink[face | (lab == PARTS.index('shirt'))] = INK['white']
    line_ink[np.isin(lab, [PARTS.index('hat'), PARTS.index('hatlit'), PARTS.index('band')])] = INK['band']
    ink = np.where(out[..., None] > 0.5, line_ink, ink)
    level = np.maximum(level, out)
    # the features (the glasses, the eyes, the mouth) in electric blue on the face
    ink = np.where(feat[..., None] > 0.5, np.array((70, 150, 255), float), ink)
    level = np.maximum(level, feat)
    # crop to the poster's portrait (2:3 less the title), centered on the face
    w = int(side * W / ART_H)
    x0 = 342 - w // 2
    x0 = max(0, min(side - w, x0))
    ink = ink[:, x0 : x0 + w]
    level = level[:, x0 : x0 + w]
    ink = np.asarray(Image.fromarray(ink.astype(np.uint8)).resize((W, ART_H), Image.LANCZOS), float)
    level = np.asarray(Image.fromarray((level * 255).astype(np.uint8)).resize((W, ART_H), Image.LANCZOS), float) / 255
    return ink, level


def title(size: tuple[int, int]) -> tuple[np.ndarray, np.ndarray]:
    """DOC LEO in fat 70s letters: a magenta face, an orange tube round it, green outside."""
    w, h = size
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Phosphate.ttc', 66, index=1)
    layers = []
    for grow, color in ((9, INK['white']), (5, INK['band']), (0, INK['red'])):
        m = Image.new('L', size, 0)
        ImageDraw.Draw(m).text((w / 2, h / 2 + 2), 'DOC LEO', font=font, anchor='mm', fill=255, stroke_width=grow, stroke_fill=255)
        layers.append((np.asarray(m, float) / 255, color))
    ink = np.zeros((h, w, 3))
    level = np.zeros((h, w))
    for m, color in layers:
        ink = np.where(m[..., None] > 0.5, np.array(color, float), ink)
        level = np.maximum(level, m)
    return ink, level


def velvet(rng: np.random.Generator) -> np.ndarray:
    """Black velvet: a little nap, a soft sheen at the top left."""
    nap = rng.normal(0, 3.0, (H, W, 1))
    ys, xs = np.mgrid[0:H, 0:W]
    sheen = np.exp(-(((xs - W * 0.3) / (W * 0.7)) ** 2 + ((ys - H * 0.2) / (H * 0.6)) ** 2))[..., None] * 10
    return np.clip(VELVET + nap + sheen, 0, 255)


def compose(night: bool) -> Image.Image:
    rng = np.random.default_rng(1994)
    ink = np.zeros((H, W, 3))
    level = np.zeros((H, W))
    pi, pl = portrait()
    ink[:ART_H], level[:ART_H] = pi, pl
    ti, tl = title((W, H - ART_H))
    ink[ART_H:], level[ART_H:] = ti, tl
    base = velvet(rng)
    if night:
        lit = ink * level[..., None]
        glow = np.asarray(Image.fromarray(np.clip(lit, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)), float)
        img = base * 0.6 + lit + glow * 0.7
    else:
        # plain light: the inks read as chalky pastels on the velvet, no glow
        grey = ink.mean(-1, keepdims=True)
        muted = (ink * 0.45 + grey * 0.35) * 0.75 + 30
        img = base * (1 - level[..., None] * 0.85) + muted * level[..., None] * 0.85
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, night in (('day', False), ('night', True)):
        img = compose(night)
        img.save(OUT / f'docleo-blacklight-{name}.webp', quality=86, method=6)
        print('wrote', name)


if __name__ == '__main__':
    main()
