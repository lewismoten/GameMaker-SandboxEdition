// `npm run video:transcript -- <youtube-id>`: a Library video's public/videos/<id>.transcript.json
// from its own audio, for a video with no captions worth keeping. It is for the maintainer's own
// YouTube videos only (the Library's): the .srt it makes is the captions, and the transcript
// is shown beside the video. A maintainer's tool, run by hand: no build, test or GitHub Action
// runs it or needs its tools. yt-dlp downloads the audio, ffmpeg
// makes it 16 kHz mono wav, whisper-cli (large-v3; -mc 0 stops its repeat loops) writes an .srt, and
// videoTranscript.ts turns that into the transcript. Work files go in the git-ignored
// web/.video-work/<id>/. Needs yt-dlp, ffmpeg and whisper-cli on PATH and the model in
// ~/.cache/whisper-cpp. Run from web/. A long video takes hours.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { MODEL, missing, parseId } from './videoTools';

function run(cmd: string, args: string[]): void {
  console.log(`$ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`${cmd} failed (${r.status ?? r.error?.message})`);
}

function main(): void {
  const id = parseId(process.argv.slice(2));
  if (!id) {
    console.error('Usage: npm run video:transcript -- <youtube-id>  (11 characters: A-Z a-z 0-9 - _)');
    process.exit(2);
  }
  const problems = missing();
  if (problems.length) {
    for (const p of problems) console.error(p);
    console.error('npm run video:transcript needs these installed; nothing was downloaded.');
    process.exit(1);
  }
  const dir = join(__dirname, '..', '.video-work', id);
  mkdirSync(dir, { recursive: true });
  const wav = join(dir, `${id}.wav`);
  run('yt-dlp', [
    '--js-runtimes',
    'node',
    '--remote-components',
    'ejs:github',
    '-f',
    'bestaudio',
    '-o',
    join(dir, `${id}.%(ext)s`),
    `https://www.youtube.com/watch?v=${id}`,
  ]);
  const audio = readdirSync(dir).find((f) => f.startsWith(`${id}.`) && !/\.(wav|srt)$/.test(f));
  if (!audio) throw new Error('yt-dlp saved no audio file');
  run('ffmpeg', ['-y', '-i', join(dir, audio), '-ar', '16000', '-ac', '1', wav]);
  run('whisper-cli', ['-m', MODEL, '-mc', '0', '-osrt', '-of', join(dir, id), '-f', wav]);
  run('npx', ['vite-node', 'scripts/videoTranscript.ts', join(dir, `${id}.srt`)]);
}

main();
