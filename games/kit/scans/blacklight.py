# The desk's black-light poster of Doc Leo (web/src/desk/props/blacklight.ts), made from
# Lewis's own photo of himself as the hobo clown (the Bard of Bizarre portrait in
# .for-lewis, not in git) and drawn as a cartoon: cut out from the sky and the street, the
# photo smoothed of its noise, split into a few simple flat shapes with smooth edges (the
# fedora and its band, the skin in two tones, the red nose and cheeks, the white makeup round
# the mouth, the stubble as one beard shape, the shirt, the jacket), each in a fluorescent
# ink, with bold black outlines soft at the edges like the flocking on a felt black-light
# poster, the glasses, eyes and mouth inked the same way, and DOC LEO across the bottom in
# 70s lettering. Two pictures: the day one, muted velvet colors in plain light, and the
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
W, H = 416, 430  # the poster: as wide as the wall between the big poster and the monitor
ART_H = 340  # the portrait above the title

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
# his face, drawn as a cartoon over the photo's shapes, traced on the photo (700-scale): the
# glasses, the eyes, the painted eyebrows, the round red nose, the red cheeks, the white
# makeup round the mouth and the smile in it
FEATURES = dict(
    lensL=(180, 290, 328, 386), lensR=(358, 286, 514, 383),
    eyeL=(228, 316, 296, 346), eyeR=(392, 312, 462, 342),
    browL=[(205, 276), (255, 262), (312, 268)], browR=[(382, 266), (440, 260), (492, 272)],
    nose=(310, 354, 392, 438), cheekL=(180, 380, 290, 470), cheekR=(415, 368, 515, 455),
    mouth=(262, 452, 420, 528), smile=[(292, 490), (318, 498), (342, 501), (368, 498), (394, 487)],
)

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
SHADE = {'hat': 0.5, 'hatlit': 0.6, 'band': 0.95, 'shade': 0.45, 'face': 0.68, 'lit': 0.68, 'red': 1.0, 'white': 1.0, 'stubble': 0.5, 'brow': 0, 'shirt': 0.65, 'jacket': 0.3}
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
    (x0, y0), (x1, y1) = BAND
    edge = y0 + (xs - x0) * (y1 - y0) / (x1 - x0)
    lab[hat & (ys < edge) & (ys > edge - 20)] = PARTS.index('band')
    # the skin in two flat tones by how lit it is; the grey stubble one violet beard shape
    # (the makeup, the glasses and the eyes are drawn over it: FEATURES)
    lab[face] = PARTS.index('shade')
    lab[face & (lum > 115)] = PARTS.index('face')
    lab[face & ~skin & (lum > 80) & (ys > 430)] = PARTS.index('stubble')
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


def soften(rgb: np.ndarray) -> np.ndarray:
    """The photo without its noise (the stubble's speckle, the felt's fuzz): flat areas."""
    img = Image.fromarray(rgb.astype(np.uint8))
    for _ in range(2):
        img = img.filter(ImageFilter.MedianFilter(9))
    return np.asarray(img.filter(ImageFilter.GaussianBlur(2)), float)


def rounded(lab: np.ndarray, sigma: float) -> np.ndarray:
    """Each region's outline smoothed into a cartoon curve: every label's mask blurred, and
    each pixel goes to whichever is strongest there (specks smaller than sigma vanish)."""
    best = np.full(lab.shape, -1.0)
    out = np.zeros_like(lab)
    for k in np.unique(lab):
        m = Image.fromarray(((lab == k) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(sigma))
        v = np.asarray(m, float)
        out = np.where(v > best, k, out)
        best = np.maximum(best, v)
    return out


def soft(mask: np.ndarray, grow: int, blur: float) -> np.ndarray:
    """A line grown to `grow` pixels and its edge softened (the felt's fuzz), 0 to 1."""
    img = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(grow))
    return np.asarray(img.filter(ImageFilter.GaussianBlur(blur)), float) / 255


def mask(draw) -> np.ndarray:
    """A shape drawn at twice the size (for smooth curves), 0 to 1 at 700 x 700."""
    m = Image.new('L', (1400, 1400), 0)
    draw(ImageDraw.Draw(m), lambda box: [v * 2 for v in box])
    return np.asarray(m.resize((700, 700), Image.LANCZOS), float) / 255


def features(ink: np.ndarray, level: np.ndarray, black: np.ndarray) -> None:
    """The cartoon face (FEATURES): fills into ink and level, the black ink lines into black."""
    F = FEATURES
    pts = lambda line: [(x * 2, y * 2) for x, y in line]

    def fill(m: np.ndarray, color, lit: float) -> None:
        ink[:] = ink * (1 - m[..., None]) + np.array(color, float) * m[..., None]
        level[:] = level * (1 - m) + lit * m

    # the red cheeks, soft at the edges like rouge
    for k in ('cheekL', 'cheekR'):
        m = mask(lambda d, sc, k=k: d.ellipse(sc(F[k]), fill=255))
        m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10)), float) / 255
        fill(m * 0.85, INK['red'], 0.8)
    fill(mask(lambda d, sc: d.ellipse(sc(F['mouth']), fill=255)), INK['white'], 1.0)
    fill(mask(lambda d, sc: d.ellipse(sc(F['nose']), fill=255)), INK['red'], 1.0)
    for k in ('eyeL', 'eyeR'):
        fill(mask(lambda d, sc, k=k: d.ellipse(sc(F[k]), fill=255)), (225, 240, 255), 0.9)
    lines = mask(lambda d, sc: (
        [d.rounded_rectangle(sc(F[k]), 36, outline=255, width=14) for k in ('lensL', 'lensR')],
        d.line([(656, 640), (716, 630)], fill=255, width=12),  # the bridge
        [d.ellipse(sc(F[k]), outline=255, width=10) for k in ('eyeL', 'eyeR', 'nose', 'mouth')],
        [d.line(pts(F[k]), fill=255, width=22, joint='curve') for k in ('browL', 'browR')],
        d.line(pts(F['smile']), fill=255, width=12, joint='curve'),
    ))
    # the pupils, looking at you
    for k in ('eyeL', 'eyeR'):
        x0, y0, x1, y1 = F[k]
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2 + 2
        lines = np.maximum(lines, mask(lambda d, sc, cx=cx, cy=cy: d.ellipse(sc((cx - 10, cy - 11, cx + 10, cy + 11)), fill=255)))
    soft_lines = np.asarray(Image.fromarray((lines * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6)), float) / 255
    black[:] = np.maximum(black, soft_lines)


def portrait() -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """The inks (0-255), how bright each is, and the black flocking over them (0 to 1)."""
    photo = Image.open(PHOTO).convert('RGB')
    side = 700
    rgb = soften(np.asarray(photo.resize((side, side), Image.LANCZOS), float))
    inside = silhouette(side)
    lab = rounded(regions(rgb, inside), 10)
    # the shading inside the skin is flat color, no lines; the skin's two tones and the
    # stubble are one shape for the outlines
    skin = [PARTS.index(p) for p in ('shade', 'face', 'stubble')]
    ink = np.zeros((side, side, 3))
    level = np.zeros((side, side))
    for i, name in enumerate(PARTS[1:], 1):
        sel = lab == i
        ink[sel] = INK[name]
        level[sel] = SHADE[name]
    group = np.where(np.isin(lab, skin), 100, lab)
    line = soft(boundaries(group) & (inside > 0.02), 7, 1.8)
    black = line.copy()
    features(ink, level, black)
    # crop to the poster's portrait, the full width of the photo
    hgt = int(side * ART_H / W)
    crop = lambda a: a[:hgt]
    ink, level, black = crop(ink), crop(level), crop(black)
    size = (W, ART_H)
    ink = np.asarray(Image.fromarray(ink.astype(np.uint8)).resize(size, Image.LANCZOS), float)
    level = np.asarray(Image.fromarray((level * 255).astype(np.uint8)).resize(size, Image.LANCZOS), float) / 255
    black = np.asarray(Image.fromarray((black * 255).astype(np.uint8)).resize(size, Image.LANCZOS), float) / 255
    return ink, level, black


def title(size: tuple[int, int]) -> tuple[np.ndarray, np.ndarray]:
    """DOC LEO in fat 70s letters: a magenta face, an orange tube round it, green outside."""
    w, h = size
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Phosphate.ttc', 62, index=1)
    layers = []
    for grow, color in ((8, INK['white']), (4, INK['band']), (0, INK['red'])):
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
    black = np.zeros((H, W))
    ink[:ART_H], level[:ART_H], black[:ART_H] = portrait()
    ti, tl = title((W, H - ART_H))
    ink[ART_H:], level[ART_H:] = ti, tl
    base = velvet(rng)
    if night:
        lit = ink * level[..., None]
        glow = np.asarray(Image.fromarray(np.clip(lit, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6)), float)
        img = base * 0.6 + lit + glow * 0.55
    else:
        # plain light: the inks read as chalky pastels on the velvet, no glow
        grey = ink.mean(-1, keepdims=True)
        muted = (ink * 0.45 + grey * 0.35) * 0.75 + 30
        img = base * (1 - level[..., None] * 0.85) + muted * level[..., None] * 0.85
    # the black flocking over it all (it doesn't glow)
    img = img * (1 - black[..., None] * 0.92) + VELVET * 0.5 * black[..., None] * 0.92
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, night in (('day', False), ('night', True)):
        img = compose(night)
        img.save(OUT / f'docleo-blacklight-{name}.webp', quality=86, method=6)
        print('wrote', name)


if __name__ == '__main__':
    main()
