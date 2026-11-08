#!/usr/bin/env python3
"""Report normalized RMS over time for a finalized DOSBox 16-bit PCM WAV."""
import argparse
import array
import json
import math
import sys
import wave


def analyze(path, window=1.0):
    if not math.isfinite(window) or window <= 0:
        raise ValueError('window must be finite and positive')
    with wave.open(str(path), 'rb') as wav:
        if wav.getsampwidth() != 2 or wav.getcomptype() != 'NONE':
            raise ValueError('expected uncompressed 16-bit PCM')
        rate, channels = wav.getframerate(), wav.getnchannels()
        frames = max(1, round(rate * window))
        windows, total_squares, total_samples, read_frames = [], 0, 0, 0
        while data := wav.readframes(frames):
            samples = array.array('h', data)
            if sys.byteorder != 'little':
                samples.byteswap()
            squares = sum(value * value for value in samples)
            count = len(samples)
            windows.append({'start_seconds': read_frames / rate,
                            'duration_seconds': count / channels / rate,
                            'rms': math.sqrt(squares / count) / 32768})
            total_squares += squares
            total_samples += count
            read_frames += count // channels
        if read_frames != wav.getnframes() or not total_samples:
            raise ValueError('empty or truncated WAV')
        return {'duration_seconds': read_frames / rate, 'sample_rate': rate,
                'channels': channels, 'rms': math.sqrt(total_squares / total_samples) / 32768,
                'windows': windows}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('wav')
    parser.add_argument('--window', type=float, default=1)
    args = parser.parse_args()
    try:
        print(json.dumps(analyze(args.wav, args.window), indent=2))
    except (OSError, ValueError, wave.Error, EOFError) as exc:
        parser.exit(1, f'WAV analysis failed: {exc}\n')


if __name__ == '__main__':
    main()
