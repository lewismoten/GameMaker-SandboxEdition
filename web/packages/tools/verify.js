// Exercise the actual tarball in a temporary consumer, with no repository-relative imports.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const here = dirname(fileURLToPath(import.meta.url));
const consumer = mkdtempSync(resolve(tmpdir(), 'gamemaker-tools-consumer-'));
try {
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', consumer], { cwd: here, encoding: 'utf8' }));
  for (const file of pack.files)
    assert.ok(!/\.(?:pal|bbl|cbl|mbl|map|mon|chr|voc|gam|rec|cmf|pcm|flac|ogg|wav)$/i.test(file.path), `game content in toolkit: ${file.path}`);
  assert.ok(pack.files.some((file) => file.path === 'LICENSE'));
  assert.ok(pack.files.some((file) => file.path === 'NOTICE.md'));
  writeFileSync(resolve(consumer, 'package.json'), '{"type":"module","private":true}');
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...process.argv.slice(2), resolve(consumer, pack.filename)], {
    cwd: consumer,
    stdio: 'pipe',
  });
  writeFileSync(
    resolve(consumer, 'smoke.mjs'),
    `
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import { emptyBlock, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { emptyFrame, newCharacter } from '@lewismoten/gamemaker-sandbox-tools/formats/character';
import { newMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { Pixels, text, PaletteBuilder, FONT_CP437, glyphRows, encodeText, renderText, colorRamp, adjustPalette, lightColor } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { sample, osc, tune, v, INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/audio';
import { decodeVoc } from '@lewismoten/gamemaker-sandbox-tools/formats/voc';
import { encodePng, crc32, medianCutRgba, Pixels as ImagePixels, turn90, shiftPixels, floodFill } from '@lewismoten/gamemaker-sandbox-tools/images';
import {rgbToHsv,hsvToRgb} from '@lewismoten/gamemaker-sandbox-tools/colors';
import { Sim, GameSim } from '@lewismoten/gamemaker-sandbox-tools/simulation';
import { audioFileToVoc, decodeAudioFile } from '@lewismoten/gamemaker-sandbox-tools/audio-files';
import {MICRO_GLYPHS,MICRO_SQUARE_GLYPHS} from '@lewismoten/gamemaker-sandbox-tools/microFont';
import {libraryDefaultPalette,PALETTE_PRESETS,createPalettePreset} from '@lewismoten/gamemaker-sandbox-tools/palettes';
import {buildRampPalette} from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import {recordedDemo} from '@lewismoten/gamemaker-sandbox-tools/kit/recordedDemo';
import {parseRecording} from '@lewismoten/gamemaker-sandbox-tools/formats/recording';
import {Disk} from '@lewismoten/gamemaker-sandbox-tools/kit/disk';
for(const name of ['actors','align','coverPaint','disk','fadeOut','fliClips','hopBot','levelPicture','menuVersion','microText','palRamps','photo','png','quantize','raytrace','recordedDemo','road3d','routeChecks','saveSlots','sceneInit','screenText','sdftext','song','songFx','synthParts','textfit','transforms'])
  await import('@lewismoten/gamemaker-sandbox-tools/kit/'+name);
assert.equal(libraryDefaultPalette().length,768);assert.deepEqual(libraryDefaultPalette().slice(0,3),Uint8Array.of(0,0,0));const changed=libraryDefaultPalette();changed[0]=63;assert.equal(libraryDefaultPalette()[0],0);
assert.equal(PALETTE_PRESETS.length,20);assert.equal(createPalettePreset('atari-pal').length,768);assert.deepEqual(createPalettePreset('nes').slice(765),Uint8Array.of(0,0,0));
assert.equal(MICRO_GLYPHS['µ'],'000101101111100');assert.notEqual(MICRO_GLYPHS.C,MICRO_SQUARE_GLYPHS.C);
const built=buildRampPalette([['ink',2,[0,0,0],[252,252,252]]]);assert.equal(built.c('ink',99),built.r('ink')[1]);
assert.deepEqual(parseRecording(recordedDemo([1,77],3,2)).slice(-2),[{delta:3,key:1},{delta:2,key:129}]);
const disk=new Disk('native');disk.put('TEST.GAM',Uint8Array.of(1,2,3));assert.equal(disk.write(),3);

assert.equal(typeof audioFileToVoc, 'function');
const wav=Buffer.alloc(48); wav.write('RIFF');wav.writeUInt32LE(40,4);wav.write('WAVEfmt ',8);
wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
wav.writeUInt32LE(8000,24);wav.writeUInt32LE(8000,28);wav.writeUInt16LE(1,32);wav.writeUInt16LE(8,34);
wav.write('data',36);wav.writeUInt32LE(3,40);wav.set([0,128,255],44);
writeFileSync('voice.wav',wav);
assert.deepEqual(audioFileToVoc('voice.wav',{sampleRate:8000,ffmpegPath:'/not-installed'}).subarray(32,-1),Uint8Array.of(0,128,255));
assert.throws(() => decodeAudioFile('unused.flac', {sampleRate:0}), RangeError);
const picture = new Pixels(20,20,1); text(picture,0,0,'HI',2);
assert.ok(picture.px.includes(2)); assert.equal(new PaletteBuilder().color(255,0,0),0);
assert.equal(FONT_CP437.length,2048); assert.equal(glyphRows(219)[0],255);
assert.deepEqual(encodeText('é♥'),Uint8Array.of(130,3));
const caption=renderText('╔═╗',{color:4,outline:0,shadow:{color:8}});
assert.equal(caption.width,26); assert.ok(caption.pixels.includes(4));
assert.equal(renderText('GO!',{font:'micro'}).width,11);
assert.deepEqual(lightColor([100,100,100],'night'),[54,58,108]);
assert.equal(colorRamp(3,[0,0,0],[255,255,255])[1][0],128);
assert.deepEqual(adjustPalette(new Uint8Array(768),'noon'),new Uint8Array(768));
assert.deepEqual(hsvToRgb(rgbToHsv([12,34,56])),[12,34,56]);
assert.deepEqual(medianCutRgba([{width:1,height:1,data:Uint8Array.of(100,20,30,255)}],1),[[100,20,30]]);
const tile=new ImagePixels(2,3);tile.px.set([1,2,3,4,5,6]);
assert.deepEqual([...turn90(tile).px],[5,3,1,6,4,2]);
assert.deepEqual([...shiftPixels(tile,1,0).px],[2,1,4,3,6,5]);
const filled=new Uint8Array(6);floodFill(filled,3,2,0,0,7,(x)=>x!==1);assert.deepEqual([...filled],[7,0,0,7,0,0]);
const blocks=Array.from({length:150},(_,i)=>emptyBlock(i)); blocks[0].pixels.set(picture.px);
assert.deepEqual(parseBlocks(serializeBlocks(blocks),150)[0].pixels,picture.px);
const png=await encodePng({width:20,height:20,pixels:picture.px,palette:new Uint8Array(768)});
assert.equal(png[0],137); assert.equal(crc32(new TextEncoder().encode('123456789')),0xcbf43926);
assert.ok(decodeVoc(sample(0.02,osc.sine(440))).samples.length>0);
assert.ok(tune(120,[v(0,INSTRUMENTS.bell,'C4 q, D4 q')]).length>50);
const map=newMap(); blocks[1].solid=15; blocks[0].grav=4;
for(let x=0;x<100;x++)map.blocks[40*100+x]=1;
const chr=newCharacter();chr.sequences[0].frames[0]={...emptyFrame(),pic2:0};
chr.sequences[5].key=77<<8;chr.sequences[5].frames[0]={...emptyFrame(),pic2:0,x:4};
const sim=new Sim({map,bbl:blocks,chr,cbl:Array.from({length:50},(_,i)=>emptyBlock(i,true))},{x:8,y:39});
sim.press(77);await sim.run(4);assert.ok(sim.pos.x>160);assert.equal(typeof GameSim,'function');
`,
  );
  execFileSync(process.execPath, ['smoke.mjs'], { cwd: consumer, stdio: 'inherit' });
  writeFileSync(
    resolve(consumer, 'consumer.ts'),
    `import {Pixels as ImagePixels,shiftPixels,type SurfaceMirror} from '@lewismoten/gamemaker-sandbox-tools/images';\nexport const mode: SurfaceMirror = 'both';\nexport const moved: ImagePixels = shiftPixels(new ImagePixels(2,3),1,0);\nimport { Pixels, renderText, TIME_OF_DAY_SKY, PaletteBuilder, type TextImage } from '@lewismoten/gamemaker-sandbox-tools/drawing';\nimport { Sim } from '@lewismoten/gamemaker-sandbox-tools/simulation';\nimport {audioFileToVoc, type VocFileOptions} from '@lewismoten/gamemaker-sandbox-tools/audio-files';\nexport const convert: (file: string | URL, options?: VocFileOptions) => Uint8Array = audioFileToVoc;\nimport {libraryDefaultPalette} from '@lewismoten/gamemaker-sandbox-tools/palettes';\nexport const palette: Uint8Array = libraryDefaultPalette();\nexport const p: Pixels = new Pixels(20,20);\nexport const label: TextImage = renderText('Hi', {font:'micro',outline:0});\nnew PaletteBuilder().ramp('sky',8,...TIME_OF_DAY_SKY.sunset);\nexport type Scene = ConstructorParameters<typeof Sim>[0];\nimport {HopBot} from '@lewismoten/gamemaker-sandbox-tools/kit/hopBot';\nimport {buildRampPalette} from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';\nexport type SavedBot = ReturnType<HopBot['snapshot']>;\nexport const built=buildRampPalette([['ink',2,[0,0,0],[252,252,252]]]);\n`,
  );
  execFileSync(
    process.execPath,
    [
      createRequire(import.meta.url).resolve('typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--target',
      'es2022',
      '--module',
      'nodenext',
      '--moduleResolution',
      'nodenext',
      'consumer.ts',
    ],
    { cwd: consumer, stdio: 'inherit' },
  );
  let rejected = false;
  try {
    execFileSync(process.execPath, ['--conditions=browser', '--input-type=module', '-e', "import '@lewismoten/gamemaker-sandbox-tools/drawing'"], {
      cwd: consumer,
      stdio: 'pipe',
    });
  } catch {
    rejected = true;
  }
  assert.ok(rejected, 'development tools must reject browser resolution');
  execFileSync(
    process.execPath,
    [
      '--conditions=browser',
      '--input-type=module',
      '-e',
      "import {libraryDefaultPalette} from '@lewismoten/gamemaker-sandbox-tools/palettes';if(libraryDefaultPalette().length!==768)throw new Error('portable palette failed');import {renderText} from '@lewismoten/gamemaker-sandbox-tools/text';import {lightColor} from '@lewismoten/gamemaker-sandbox-tools/colors';import {MICRO_GLYPHS} from '@lewismoten/gamemaker-sandbox-tools/microFont';if(renderText('µ',{font:'micro'}).width!==3||lightColor([100,100,100],'night')[0]!==54||!MICRO_GLYPHS['¢'])throw new Error('portable text/color entry failed');",
    ],
    { cwd: consumer, stdio: 'inherit' },
  );
  process.stdout.write(`Packed toolkit runtime, NodeNext declarations, content boundary, and browser rejection passed (${pack.files.length} files).\n`);
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
