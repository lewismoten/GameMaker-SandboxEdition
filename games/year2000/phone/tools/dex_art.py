"""Dex Dynamo's standing sprite as block art (rows copied from games/year2000/src/sprites/sprites.ts: D_HEAD + D_BODY + D_LEGS0).
Characters: k outline, c/C cap, h hair, s/S skin (left bare), e eye, m mouth, j/J jumpsuit, p stripe, g gold cuffs, B/b sneakers.
Tone is shown by hatching. Skin stays bare (face and hands only); everything else is clothes, hair or outline, so he never
looks undressed in one color."""
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
# char -> ("solid",) or (hatch kinds, spacing mm)
TONES = {
    "k": ("solid",), "e": ("solid",), "m": ("solid",), "p": ("solid",), "g": ("solid",), "b": ("solid",),
    "c": ("/\\", 0.5), "C": ("/", 0.5), "h": ("/", 0.35),
    "j": ("/", 0.7), "J": ("/\\", 0.5), "B": ("\\", 0.4),
}
