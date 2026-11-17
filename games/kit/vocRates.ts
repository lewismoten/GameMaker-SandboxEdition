// Repository-only build policy: opt in reviewed generated effects; never speech or recordings.
// Source provenance: each game's src/sound/sounds.ts (or src/sounds.ts), kit/teddySounds.ts;
// tuneup also uses src/sound/notes.ts. Recorded song clips come from src/sound/clips.ts,
// tuneup's real barks from barks.ts, and voice/mountain-next-door from their voice modules.
import { deflateRawSync } from 'node:zlib';
import { decodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';
import { lowerPcmVoc, vocBandShares } from '@lewismoten/gamemaker-sandbox-tools/kit/vocRate';

/** At most 0.01% (-40 dB) of measured energy may occupy either discarded/transition band. */
const VOC_LOST_BAND_LIMIT = 0.0001;

// Unknown/new files stay unchanged. Vocal imitations, recorded barks, choir/aah and composites
// containing any voice are deliberately absent. Slow Computers retains its size demonstration.
const effects: Record<string, string> = {
  bakers: 'boing clack fife gulp kazoo latch musicbox sparkle squawk squeak toy trombone tumblers',
  blaster: 'bit blip boom charge kaboom nova oneup repair zap',
  brief: 'clunk ding fanfare flutter pop',
  carl: 'buzz creak crunch ding roll sip splat',
  depth: 'bonk derender egg gate glitch lens light oneup photon render zap',
  goat: 'munch thud blip clang',
  lark: 'gear creak',
  loaf: 'puff roll crunch crumble chime holy creak flop sip',
  logic: 'boing clack ding fanfare fizzle zap',
  loofah: 'pat drip chime squelch hiss scrub pop match kaching wring splash bell',
  maximus:
    'boom bubble buzz cell coin dash drain engine flak gem grab heal hover jet lance medkit mine motor nova oneup paid pew roll shield splash splat thunk warp',
  mustard: 'boing scritch drip chime sip pop crumble',
  needle: 'clop clink chime sip twinkle',
  'pass-the-pie': 'blip bonk boom chime door fwip gain jingle kick spring tick wahwah whump',
  rain: 'splash',
  realm: 'ahooga bonk clunk coins ding fanfare feather kazoo pay pickup puff slide sparkle swish',
  reckoning: 'pat chime sip tada hum squeak splash sizzle glug thunder',
  remote: 'poof click whirr clink chime clack gate pop warm boff',
  risi: 'pat chime pop shutter blat gulp tantara clang sparkle squeak chomp crack splash boing thud rimshot',
  sleuth: 'aha chime click creak gong hmm rustle step thud whoosh',
  smirked: 'hiss creak thump click rustle crinkle chime slurp register whoosh clonk',
  snowbound: 'blip bonk brake cocoa crunch kaching oneup patpat poof push scoop slide whoosh',
  'slow-computers': 'blip longsnd',
  'stick-man-stars': 'houselit',
  sweats: 'pat clink ching applause snaps cheer curtain pop swoon glint',
  teddy: 'blip boing chomp crunch dig flop honk pie pop rumble slap sparkle squeak tada whoosh yum',
  teddy2: 'blip boing chomp crunch dig ding flop grab honk munch pop slap sparkle splash squeak tada whoosh yum zoom',
  teddy3: 'blip boing chomp crunch dig ding flop grab honk munch pop rumble slap sparkle splash squawk squeak tada twist whoosh yum zap zoom',
  tickle: 'boing ding door dread joy press sip squeak step tickle',
  tuneup:
    'bells charge clamp clunk fanfare fanon home honk horns hpc5 hpe5 hpg5 kazoos kzc5 kzc6 kze5 kzg5 lamp oilb4 oild5 oile4 oilf5 oilg4 oompah pnc5 pnc6 pne5 png5 psi radio razz slide st1 st2 tada tapes tda5 tdb5 tdd5 tdfs5 ticket toot vba5 vbas5 vbb5 vbc5 vbcs6 vbd5 vbe5 vbfs5 vbg5 vbgs5',
  year2000: 'access arcade boing bonk dialtone fizzle gulp kaching oneup pew rustle slide',
};

export function isGeneratedEffect(game: string, name: string): boolean {
  return (effects[game] ?? '').split(' ').includes(name.replace(/\.voc$/i, '').toLowerCase());
}

/** Called while producing the build's files, before any disk output is written. */
export function selectiveVoc(game: string, name: string, bytes: Uint8Array): Uint8Array {
  if (!isGeneratedEffect(game, name) || game === 'slow-computers') return bytes;
  const { sampleRate } = decodeVoc(bytes);
  // Lowest qualifying candidate first. No repeat reductions: always start with source PCM.
  for (const cap of [sampleRate / 2, 8000].sort((a, b) => a - b)) {
    if (cap < 1e6 / 256 || cap >= sampleRate) continue;
    const rate = Math.round(1e6 / (256 - Math.round(256 - 1e6 / cap)));
    if (rate >= sampleRate) continue;
    // The extra 0.45-rate check protects the sinc filter's transition band as well as Nyquist.
    if (vocBandShares(bytes, [rate / 2, rate * 0.45]).some((share) => share > VOC_LOST_BAND_LIMIT)) continue;
    const result = lowerPcmVoc(bytes, cap);
    // Avoid any increase in a clip's wait measured in engine ticks (18.2 Hz).
    const before = decodeVoc(bytes),
      after = decodeVoc(result);
    if (Math.ceil((before.samples.length * 18.2) / before.sampleRate) !== Math.ceil((after.samples.length * 18.2) / after.sampleRate)) continue;
    if (result === bytes || deflateRawSync(result, { level: 6 }).length >= deflateRawSync(bytes, { level: 6 }).length) continue;
    return result;
  }
  return bytes;
}
