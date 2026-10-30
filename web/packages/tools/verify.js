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
  for (const file of pack.files) assert.ok(!/\.(?:pal|bbl|cbl|mbl|map|mon|chr|voc|gam|rec|cmf)$/i.test(file.path), `game content in toolkit: ${file.path}`);
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
import { emptyBlock, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { emptyFrame, newCharacter } from '@lewismoten/gamemaker-sandbox-tools/formats/character';
import { newMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { Pixels, text, PaletteBuilder, FONT_CP437, glyphRows, encodeText, renderText, colorRamp, adjustPalette, lightColor } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { sample, osc, tune, v, INSTRUMENTS } from '@lewismoten/gamemaker-sandbox-tools/audio';
import { decodeVoc } from '@lewismoten/gamemaker-sandbox-tools/formats/voc';
import { encodePng, crc32 } from '@lewismoten/gamemaker-sandbox-tools/images';
import { Sim, GameSim } from '@lewismoten/gamemaker-sandbox-tools/simulation';
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
    `import { Pixels, renderText, TIME_OF_DAY_SKY, PaletteBuilder, type TextImage } from '@lewismoten/gamemaker-sandbox-tools/drawing';\nimport { Sim } from '@lewismoten/gamemaker-sandbox-tools/simulation';\nexport const p: Pixels = new Pixels(20,20);\nexport const label: TextImage = renderText('Hi', {font:'micro',outline:0});\nnew PaletteBuilder().ramp('sky',8,...TIME_OF_DAY_SKY.sunset);\nexport type Scene = ConstructorParameters<typeof Sim>[0];\n`,
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
  process.stdout.write(`Packed toolkit runtime, NodeNext declarations, content boundary, and browser rejection passed (${pack.files.length} files).\n`);
} finally {
  rmSync(consumer, { recursive: true, force: true });
}
