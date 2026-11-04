"""Dex Dynamo's standing sprite as block art (rows copied from games/year2000/src/sprites/sprites.ts: D_HEAD + D_BODY + D_LEGS0).
Characters: k outline, c/C cap, h hair, s/S skin (left bare), e eye, m mouth, j/J jumpsuit, p stripe, g gold cuffs, B/b sneakers.
Silkscreen is white, so silk = light: skin (face and hands) is solid silk, the outline, hair, eyes and mouth are bare green,
and every tone between is hatched (denser = lighter), so his clothes stay hatched and he never looks undressed."""
ROWS = [
    '.....kkkkkk.....',
    '....kccccccck...',
    '...kcCccccccCk..',
    '...kChhhhhhhhk..',
    '...khssssssshk..',
    '...ksseSsseSssk.',
    '...kssssssssk...',
    '....kssmmssk....',
    '...kkjjjjjjkk...',
    '..kgjjjpjjjjgk..',
    '..kgjjjpjjjjgk..',
    '..kskJjpjjJksk..',
    '....kjjpjjjk....',
    '....kJJJJJJk....',
    '....kjjjkjjjk...',
    '....kjjk.kjjk...',
    '....kBBk.kBBk...',
    '...kbbbk.kbbbk..',
]
# char -> ("solid",) or (hatch kinds, spacing mm). Silkscreen is WHITE on green solder mask, so silk means LIGHT: skin is solid
# silk, the darkest things (outline k, hair h, eyes e, mouth m) are left as bare green, and the mid tones are hatched, denser the
# lighter the sprite color is (brightness from the palette ramps used in sprites.ts: pink 3 and chrome 6 light, chrome 4 and gold
# 4 mid, teal 3 and pink 1 darker mid, neon 2 dark mid). A character not listed here stays bare.
TONES = {
    "s": ("solid",), "S": ("solid",),
    "c": ("/\\", 0.34), "C": ("/", 0.6),
    "j": ("/\\", 0.3), "J": ("/\\", 0.5),
    "p": ("/", 0.5), "g": ("\\", 0.4),
    "b": ("/\\", 0.34), "B": ("/", 0.8),
}
