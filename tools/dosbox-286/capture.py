#!/usr/bin/env python3
"""Run the original PLAYGAME in headless DOSBox-X and finalize its own WAV."""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import time

from wav_stats import analyze

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
PRESETS = {'286-6': 1000, '286-8': 2000, '286-12': 3000, 'baseline': 20000}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('cycles', help='positive fixed cycles or 286-6/286-8/286-12/baseline')
    parser.add_argument('game', type=Path, help='.gam file, or directory containing exactly one .gam')
    parser.add_argument('seconds', type=float, help='minimum captured audio seconds, including startup')
    parser.add_argument('output', type=Path, help='new or empty output directory')
    parser.add_argument('--select-wait', type=float, default=8, help='emulated seconds before filename typing (0..30)')
    parser.add_argument('--keys', default='', help='optional DOSBox-X ADDKEY schedule, e.g. "p40000 f3 p5000 f3"')
    parser.add_argument('--player', type=Path, default=REPO / 'cd/gm/playgame.exe')
    args = parser.parse_args()
    try:
        cycles = str(PRESETS.get(args.cycles, args.cycles))
        if not str(cycles).isdigit() or not 1 <= int(cycles) <= 1000000:
            raise ValueError('cycles must be 1..1000000 or a named preset (not max)')
        if not math.isfinite(args.seconds) or not 1 <= args.seconds <= 3600:
            raise ValueError('seconds must be finite and between 1 and 3600')
        if not math.isfinite(args.select_wait) or not 0 <= args.select_wait <= 30:
            raise ValueError('select-wait must be between 0 and 30')
        if len(args.keys) > 2000 or any(not re.fullmatch(r'(?:[pl][0-9]{1,7}|[a-z0-9]|f(?:[1-9]|1[0-2])|enter|space|escape|up|down|left|right)', token) for token in args.keys.split()):
            raise ValueError('keys must be ADDKEY key names or p<ms>/l<ms>; no DOS commands')
        game = args.game.resolve()
        if game.is_dir():
            games = [p for p in game.iterdir() if p.suffix.lower() == '.gam']
            if len(games) != 1:
                raise ValueError('game directory must contain exactly one .gam; specify the file')
            game = games[0]
        if not game.is_file() or not re.fullmatch(r'[A-Za-z0-9_]{1,8}\.[gG][aA][mM]', game.name):
            raise ValueError('game must exist and have a simple DOS 8.3 .gam filename')
        output = args.output.resolve()
        if output.is_relative_to(game.parent):
            raise ValueError('output must be outside the source game directory')
        player = args.player.resolve()
        driver = REPO / 'cd/gm/sndblast.drv'
        if not player.is_file() or not driver.is_file():
            raise ValueError('PLAYGAME executable or SNDBLAST.DRV missing')
        binary = shutil.which(os.environ.get('DOSBOX_X', 'dosbox-x'))
        if not binary:
            raise ValueError('DOSBox-X not found; install it or set DOSBOX_X to its executable')
        version_result = subprocess.run([binary, '-version'], capture_output=True, text=True, timeout=10)
        version = (version_result.stdout + version_result.stderr).strip()
        if 'DOSBox-X version' not in version:
            raise ValueError('DOSBOX_X must identify itself as DOSBox-X')
        output = args.output.resolve()
        if any(char in str(output) for char in '\n\r"'):
            raise ValueError('output path cannot contain quotes or newlines')
        output.mkdir(parents=True, exist_ok=True)
        if any(output.iterdir()):
            raise ValueError('output directory must be empty; refusing to overwrite a run')
        staged = output / 'game'
        shutil.copytree(game.parent, staged)
        # DOS is case-insensitive even when the host is not. Replace only staged copies.
        for path in staged.iterdir():
            if path.name.lower() in ('config.dat', 'playgame.exe', 'sndblast.drv'):
                if not path.is_file():
                    raise ValueError(f'reserved staged name is not a file: {path.name}')
                path.unlink()
        shutil.copy2(player, staged / 'PLAYGAME.EXE')
        shutil.copy2(driver, staged / 'SNDBLAST.DRV')
        config = bytearray(512)
        # code/GM/JSTICK.H: 10 x int16 joystick values, VGA, sound, IRQ, port,
        # then a 41-byte driver path and 431 reserved bytes (Borland 16-bit layout).
        struct.pack_into('<4H', config, 20, 0, 1, 7, 0x220)
        config[28:40] = b'SNDBLAST.DRV\0'
        (staged / 'CONFIG.DAT').write_bytes(config)
        captures = output / 'raw'
        captures.mkdir()
        select = ' '.join('period' if c == '.' else c for c in game.name.lower()) + ' enter'
        replacements = {'CAPTURES': str(captures), 'GAME_DIR': str(staged),
                        'CYCLES': str(cycles), 'WAIT': str(args.select_wait),
                        'SELECT_KEYS': select, 'EXTRA_KEYS': f'addkey {args.keys}' if args.keys else ''}
        conf = (HERE / 'dosbox.conf.in').read_text()
        for key, value in replacements.items():
            conf = conf.replace(f'@{key}@', value)
        conf_path = output / 'dosbox.conf'
        conf_path.write_text(conf)
        env = dict(os.environ, SDL_VIDEODRIVER='dummy', SDL_AUDIODRIVER='dummy')
        command = [binary, '-defaultconf', '-fastlaunch', '-conf', str(conf_path)]
        metadata = {'dosbox_version': version, 'dosbox_binary': binary,
                    'command': command, 'cpu': '286', 'core': 'normal', 'cycles': int(cycles),
                    'requested_audio_seconds': args.seconds, 'game': str(game),
                    'select_keys': select, 'select_wait': args.select_wait, 'extra_keys': args.keys,
                    'environment': {k: env[k] for k in ('SDL_VIDEODRIVER', 'SDL_AUDIODRIVER')},
                    'staged_sha256': {str(p.relative_to(staged)): hashlib.sha256(p.read_bytes()).hexdigest()
                                      for p in sorted(staged.rglob('*')) if p.is_file()}}
        (output / 'run.json').write_text(json.dumps(metadata, indent=2) + '\n')
        started = time.monotonic()
        target_bytes = 44 + math.ceil(args.seconds * 48000) * 4
        reached = False
        with (output / 'dosbox.log').open('w') as log:
            process = subprocess.Popen(command, cwd=output, env=env, stdout=log, stderr=subprocess.STDOUT)
            try:
                while process.poll() is None:
                    waves = list(captures.glob('*.wav'))
                    if len(waves) == 1 and waves[0].stat().st_size >= target_bytes:
                        reached = True
                        break
                    if time.monotonic() - started > 30 + args.seconds * 3:
                        raise ValueError('capture deadline exceeded; see dosbox.log')
                    time.sleep(0.1)
            finally:
                if process.poll() is None:
                    process.terminate()  # SDL quit event; quit warning=false permits finalization.
                    try:
                        process.wait(timeout=10)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait()
                        raise ValueError('DOSBox-X required SIGKILL; WAV is NOT trusted')
        if not reached or process.returncode != 0:
            raise ValueError(f'DOSBox-X exited before capture completed (status {process.returncode}); see dosbox.log')
        wavs = list(captures.glob('*.wav'))
        if len(wavs) != 1:
            raise ValueError('expected exactly one WAV')
        stats = analyze(wavs[0])
        (output / 'stats.json').write_text(json.dumps(stats, indent=2) + '\n')
        if stats['duration_seconds'] < args.seconds or stats['rms'] <= 0.001:
            raise ValueError('capture is short or silent (RMS <= 0.001); see stats.json and dosbox.log')
        wavs[0].rename(output / 'capture.wav')
        dros = list(captures.glob('*.dro'))
        if len(dros) == 1:
            dros[0].rename(output / 'capture.dro')
        metadata.update(wall_seconds=time.monotonic() - started, exit_code=process.returncode,
                        wav_sha256=hashlib.sha256((output / 'capture.wav').read_bytes()).hexdigest())
        (output / 'run.json').write_text(json.dumps(metadata, indent=2) + '\n')
        print(json.dumps({'wav': str(output / 'capture.wav'), 'duration_seconds': stats['duration_seconds'],
                          'rms': stats['rms'], 'cycles': int(cycles)}))
    except (OSError, ValueError, subprocess.SubprocessError) as exc:
        parser.exit(1, f'Capture failed: {exc}\n')


if __name__ == '__main__':
    main()
