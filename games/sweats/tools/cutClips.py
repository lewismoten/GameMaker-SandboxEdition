#!/usr/bin/env python3
# Cuts the digitized lines of "Shakespeare in Sweatpants" (The Bard of Bizarre: seventeen spoken
# monologues over music beds, made with Riffusion) out of the recordings, which are NOT committed
# (.for-lewis/songs/shakespeare/*.mp3), into games/sweats/src/sound/clips/<name>.pcm, plus
# clips/rates.json (the rate each was kept at); games/sweats/src/sound/clips.ts wraps them as
# Creative Voice Files. games/kit/song/cutclips.py does the cutting (see it for the filters).
#
#   python3 -I games/sweats/tools/cutClips.py [path/to/the/shakespeare/folder] [--out DIR]
#
# Four clips a monologue: <key>_o its opening line (the spotlight), <key>_l the line B says,
# <key>_p the punch line (the last gate), <key>_w the word Space declaims. The cues were found
# with Whisper's word timings (medium.en); each edge snaps to the quietest 10 ms of the voice
# nearby. Game-Maker reads a VOC's size as 16 bits, so a clip longer than 3.6 s is kept at a
# lower rate (a VOC says its own rate) so that it fits.
import json
import os
import sys

import numpy as np
import scipy.signal as sg

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.dont_write_bytecode = True  # no __pycache__ in games/kit/song
sys.path.insert(0, os.path.join(ROOT, 'games', 'kit', 'song'))
import cutclips  # noqa: E402

FOLDER = os.path.join(ROOT, '.for-lewis', 'songs', 'shakespeare')
OUT = os.path.join(ROOT, 'games', 'sweats', 'src', 'sound', 'clips')
MAX_BYTES = 39900

# recording: {name: (start, end, what is said)} in seconds of the recording
CUES = {
    'A Totally Normal Meeting.mp3': {
        'pen_o': (0.00, 4.15, 'Just an hour. I even brought my favorite pen.'),
        'pen_l': (63.55, 68.85, "It wasn't just a pen. It was my pen. The chosen one."),
        'pen_p': (107.45, 112.80, 'There it was, the pen, tucked behind my ear'),
        'pen_w': (150.35, 150.85, 'Thanks.'),
    },
    'The Coffee Goat in the Breakroom.mp3': {
        'goat_o': (0.55, 2.35, 'Jeremy, can you make me a coffee?'),
        'goat_l': (61.05, 62.65, 'Coffee should not fizz.'),
        'goat_p': (81.15, 83.40, "You're now the brew coordinator for this floor."),
        'goat_w': (37.88, 38.50, 'Empty.'),
    },
    'The Office Chair That Tried to Kill Me.mp3': {
        'chair_o': (0.00, 4.45, 'Ladies and gentlemen, behold my battleground'),
        'chair_l': (80.00, 82.15, 'like a banshee with arthritis'),
        'chair_p': (132.45, 134.95, 'I refuse to let it defeat me.'),
        'chair_w': (149.65, 150.80, 'Fight anyway.'),
    },
    '2025-06-16 Riffusion - Gerald the Ficus is Dead.mp3': {
        'ficus_o': (2.70, 4.70, 'Water the plants, my boss said.'),
        'ficus_l': (79.40, 81.80, "Stay with me, buddy, you're stronger than this."),
        'ficus_p': (129.10, 131.45, "Wow, he said, they've never looked better."),
        'ficus_w': (74.80, 75.45, 'Nothing.'),
    },
    'The Day the Self-Checkout Tried to Destroy Me.mp3': {
        'kale_o': (26.50, 31.20, 'Easy, right? Scan. Pay. Go. Nope.'),
        'kale_l': (47.70, 50.55, 'Unexpected item in the bagging area.'),
        'kale_p': (175.10, 179.40, 'One beep at a time.'),
        'kale_w': (30.76, 31.20, 'Nope.'),
    },
    'How I Earned a Nod from the Smoking Cashier.mp3': {
        'cart_o': (17.05, 20.95, 'And yet, there it was. The cart.'),
        'cart_l': (92.10, 93.65, 'I was the cart crusader.'),
        'cart_p': (122.18, 126.10, 'A cashier smoking behind the dumpsters gave me a nod.'),
        'cart_w': (88.05, 89.20, 'I pressed on.'),
    },
    'I Don’t Work Here, But Emotionally I Do.mp3': {
        'plate_o': (21.30, 23.80, 'Do I stack the plates? Do I help?'),
        'plate_l': (53.95, 55.75, 'Had I just committed ceramic heresy'),
        'plate_p': (139.98, 144.55, 'and letting the professionals stack.'),
        'plate_w': (40.98, 42.40, 'So I did it.'),
    },
    'I Held in a Fart and Killed a Bird.mp3': {
        'bird_o': (0.00, 2.80, 'It began at precisely 6:42 p.m.'),
        'bird_l': (42.65, 43.98, 'By gods, I clenched'),
        'bird_p': (159.55, 161.30, 'Fly high, little bird.'),
        'bird_w': (41.12, 42.45, 'I clenched.'),
    },
    'She Took the Blanket (and Left My Soul on the Floor).mp3': {
        'blnkt_o': (41.45, 46.05, 'But then she left. And she took the blanket.'),
        'blnkt_l': (52.48, 55.50, 'That was metaphorical. That was being poetic.'),
        'blnkt_p': (122.65, 126.70, 'and with it, my faith and warmth.'),
        'blnkt_w': (37.86, 39.00, 'We survived.'),
    },
    'Wore All the Weird Socks.mp3': {
        'socks_o': (0.72, 5.70, 'Seven socks, seven solitary souls, none alike.'),
        'socks_l': (47.42, 50.00, 'The dryer, a cruel trickster'),
        'socks_p': (109.58, 115.05, 'sometimes seven lonely socks are better than one lost pair.'),
        'socks_w': (64.96, 67.35, 'No peace, no truce.'),
    },
    'How the Cat Won the Pizza War.mp3': {
        'pizza_o': (4.74, 7.25, 'This was no ordinary slice.'),
        'pizza_l': (149.66, 153.60, 'Take your spatula. Make your move.'),
        'pizza_p': (115.34, 117.55, 'Kevin snatched the slice.'),
        'pizza_w': (69.38, 70.40, 'ACHOO!'),
    },
    'Janet, This Is Not About You (It’s About the Itch).mp3': {
        'itch_o': (13.70, 16.90, 'the itch, the forbidden itch.'),
        'itch_l': (71.74, 73.40, 'Interesting idea, Janet.'),
        'itch_p': (188.36, 193.60, 'Pick with pride. Just maybe sanitize after.'),
        'itch_w': (74.86, 75.70, 'Wrong.'),
    },
    'Double Tap for Justice.mp3': {
        'like_o': (0.00, 2.30, 'I support the latest thing.'),
        'like_l': (23.00, 25.65, 'I liked it. Twice I double tapped.'),
        'like_p': (100.26, 101.65, 'I hear turtles are trending.'),
        'like_w': (35.00, 35.85, 'Papayas.'),
    },
    'This Is Why I Don’t Go Outside.mp3': {
        'out_o': (19.90, 22.20, 'And then the wind struck.'),
        'out_l': (42.16, 43.30, "It's my receipt!"),
        'out_p': (126.32, 127.45, 'I respect the wind.'),
        'out_w': (98.90, 99.60, 'I dove.'),
    },
    'The Ants Have Spoken.mp3': {
        'ants_o': (6.40, 8.80, 'Charming fixer-upper with character.'),
        'ants_l': (53.46, 54.75, 'They unionize.'),
        'ants_p': (115.16, 119.55, "For a kitchen that doesn't hiss when I open the cupboard."),
        'ants_w': (112.02, 113.10, 'For freedom.'),
    },
    'The Day I Fought Cardboard.mp3': {
        'lily_o': (2.40, 5.90, 'The sign did say mild scares for all ages.'),
        'lily_l': (121.66, 123.70, "You know it's not real, right?"),
        'lily_p': (164.40, 168.65, 'I bonded with the emergency exit sign.'),
        'lily_w': (62.48, 64.35, 'GET DOWN!'),
    },
    'Shelter Me Gently, You Wounded Beast.mp3': {
        'umbr_o': (2.32, 4.90, 'The moment when legend meets the mundane'),
        'umbr_l': (40.60, 44.20, 'This was a cause worth fighting for.'),
        'umbr_p': (144.86, 151.40, 'the man who fought the storm and won.'),
        'umbr_w': (113.30, 114.10, 'Victory!'),
    },
}


def main():
    out, folder = cutclips.paths(OUT)
    folder = folder or FOLDER
    os.makedirs(out, exist_ok=True)
    cutclips.MAX_SECONDS = 7.0
    rates = {}
    for mp3, cues in CUES.items():
        x = cutclips.decode(os.path.join(folder, mp3))
        env = cutclips.voice_envelope(x)
        for name, (s, e, said) in cues.items():
            start, end, p = cutclips.cut(x, env, s, e, 0.01, 0.2)
            y = (p.astype(np.float64) - 128) / 127
            rate = cutclips.RATE
            if len(y) + 33 > MAX_BYTES:
                rate = int(MAX_BYTES / (end - start) / 100) * 100
                y = sg.resample_poly(y, rate, cutclips.RATE)
                y *= 0.97 / np.abs(y).max()
            data = np.clip(np.round(y * 127 + 128), 0, 255).astype(np.uint8)
            cutclips.write_pcm(out, name, data)
            rates[name] = rate
            print('%-8s %7.2f - %7.2f s  %.2f s  %5d Hz  VOC %6d bytes  "%s"' % (name, start, end, end - start, rate, len(data) + 33, said))
    with open(os.path.join(out, 'rates.json'), 'w') as f:
        json.dump(rates, f, indent=1, sort_keys=True)
        f.write('\n')


if __name__ == '__main__':
    main()
