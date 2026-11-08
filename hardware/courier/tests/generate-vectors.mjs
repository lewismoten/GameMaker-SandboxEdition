// SPDX-License-Identifier: MIT
// Execute the actual Git-pinned TypeScript oracle, never the C implementation.
// Usage: node tests/generate-vectors.mjs [revision] [typescript module path]
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ts = require(process.argv[3] || 'typescript');
const revision = process.argv[2] || '93880e054f164ac47ba934c30ab58c1691c4d139';
const dir = dirname(fileURLToPath(import.meta.url));
const temp = mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'courier-oracle-'));
try {
  for (const name of ['tables', 'courierId', 'capsule']) {
    const source = execFileSync('git', ['show', `${revision}:web/src/courier/${name}.ts`], { encoding: 'utf8' });
    const js = ts.transpileModule(source.replace(/from '(\.\/[^']+)'/g, "from '$1.mjs'"), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
    }).outputText;
    writeFileSync(join(temp, `${name}.mjs`), js);
  }
  const ids = await import(pathToFileURL(join(temp, 'courierId.mjs')));
  const cap = await import(pathToFileURL(join(temp, 'capsule.mjs')));
  let entropy;
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      getRandomValues: (out) => {
        out.set(entropy);
        return out;
      },
      randomUUID: () => {
        const h = Buffer.from(entropy).toString('hex');
        return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
      },
    },
  });
  const idVectors = [];
  for (let i = 0; i < 32; i++) {
    entropy = Array.from({ length: 16 }, (_, j) => (i === 0 ? j : i === 1 ? 0 : i === 2 ? 255 : i * 37 + j * 17) & 255);
    const id = ids.makeCourierId(false);
    if (!ids.isCourierId(id) || ids.makeCourierId(true) !== id) throw Error('TS ID oracle disagreement');
    idVectors.push({ random: entropy, id });
  }
  const id = (n) => idVectors[n % idVectors.length].id;
  const catalog = ['test-public', 'another-public', 'café', '星🌍'];
  const known = new Map(catalog.map((s) => [cap.gameHash(s), s]));
  const base = () => ({ trip: id(0), home: id(1), from: id(2), world: 0, packages: [], postcards: [] });
  const card = (i, stamps = []) => ({ from: id(i + 3), world: i % 16, stamps });
  const encoded = [];
  const add = (name, c) => {
    let hex = null,
      encodeError = null,
      decodeError = null,
      canonical = null,
      unknown = null;
    try {
      const bytes = cap.encodeCapsule(c);
      hex = Buffer.from(bytes).toString('hex');
      try {
        canonical = Buffer.from(cap.encodeCapsule(cap.decodeCapsule(bytes, (h) => known.get(h)))).toString('hex');
        unknown = Buffer.from(cap.encodeCapsule(cap.decodeCapsule(bytes, () => undefined))).toString('hex');
      } catch (e) {
        decodeError = e.problem;
      }
    } catch (e) {
      encodeError = e.problem;
    }
    encoded.push({ name, input: c, hex, encodeError, decodeError, canonical, unknown });
  };
  add('minimal', base());
  add('mixed-known-unknown-unicode', {
    ...base(),
    world: 15,
    packages: ['test-public', 'unknown', '星🌍'],
    postcards: [
      card(0, [{ kind: 'game', game: 'café' }, { kind: 'sample-cd' }, { kind: 'graduation' }, { kind: 'mystery' }, { kind: 'game', game: 'unknown' }]),
      card(1, [{ kind: 'game' }, { kind: 'game', game: '' }, { kind: 'invalid-kind' }]),
    ],
  });
  for (let world = 0; world < 16; world++) add(`world-${world}`, { ...base(), world, postcards: [card(world)] });
  add('max-packages', { ...base(), packages: catalog.slice(0, 3) });
  add('too-many-packages', { ...base(), packages: catalog });
  add('eight-cards', { ...base(), postcards: Array.from({ length: 8 }, (_, i) => card(i)) });
  add('nine-cards', { ...base(), postcards: Array.from({ length: 9 }, (_, i) => card(i)) });
  add('64-stamps', {
    ...base(),
    postcards: [
      card(
        0,
        Array.from({ length: 64 }, () => ({ kind: 'graduation' })),
      ),
    ],
  });
  add('65-stamps', {
    ...base(),
    postcards: [
      card(
        0,
        Array.from({ length: 65 }, () => ({ kind: 'mystery' })),
      ),
    ],
  });
  // 62 + 2*18 + 64*5 + 18*5 + 4*1 = 512. Increasing the last stamp to game gives 516.
  const exact = {
    ...base(),
    postcards: [
      card(
        0,
        Array.from({ length: 64 }, () => ({ kind: 'game', game: 'test-public' })),
      ),
      card(1, [...Array.from({ length: 18 }, () => ({ kind: 'game', game: 'another-public' })), ...Array.from({ length: 4 }, () => ({ kind: 'mystery' }))]),
    ],
  };
  add('exact-512', exact);
  const over = structuredClone(exact);
  over.postcards[1].stamps[21] = { kind: 'game', game: 'test-public' };
  add('over-512', over);
  add('encode-world-255-decode-reject', { ...base(), world: 255 });
  add('encode-card-world-16-decode-reject', { ...base(), postcards: [{ ...card(0), world: 16 }] });
  add('encode-duplicate-decode-reject', { ...base(), postcards: [card(0), card(0)] });
  const malformed = [];
  const bad = (name, bytes) => {
    let error = null;
    try {
      cap.decodeCapsule(bytes, (h) => known.get(h));
    } catch (e) {
      error = e.problem;
    }
    if (!error) throw Error(`Expected invalid oracle fixture ${name}`);
    malformed.push({ name, hex: Buffer.from(bytes).toString('hex'), error });
  };
  const repair = (bytes) => {
    new DataView(bytes.buffer).setUint32(bytes.length - 4, cap.crc32(bytes.subarray(0, -4)), true);
    return bytes;
  };
  const minimal = Uint8Array.from(Buffer.from(encoded[0].hex, 'hex'));
  const rich = Uint8Array.from(Buffer.from(encoded[1].hex, 'hex'));
  for (let n = 0; n < rich.length; n++) bad(`truncate-${n}`, rich.slice(0, n));
  for (let at = 0; at < rich.length; at++) {
    const b = rich.slice();
    b[at] ^= 1;
    bad(`tamper-${at}`, b);
  }
  for (const [at, val, name] of [
    [0, 0, 'magic'],
    [4, 0, 'version-0'],
    [4, 2, 'version-2'],
    [5, 0, 'table-0'],
    [5, 2, 'table-2'],
    [6, 1, 'flags'],
    [7, 16, 'world'],
    [14, 0, 'trip-id'],
    [30, 0, 'home-id'],
    [46, 0, 'from-id'],
    [56, 4, 'package-count'],
    [57, 9, 'card-count'],
  ]) {
    const b = minimal.slice();
    b[at] = val;
    bad(`recrc-${name}`, repair(b));
  }
  const one = Uint8Array.from(Buffer.from(encoded.find((v) => v.name === 'world-0').hex, 'hex'));
  for (const [at, val, name] of [
    [64, 0, 'card-id'],
    [74, 16, 'card-world'],
    [75, 65, 'stamp-count'],
  ]) {
    const b = one.slice();
    b[at] = val;
    bad(`recrc-${name}`, repair(b));
  }
  const stampWire = Uint8Array.from(cap.encodeCapsule({ ...base(), postcards: [card(0, [{ kind: 'mystery' }])] }));
  stampWire[76] = 4;
  bad('recrc-stamp-kind', repair(stampWire));
  // CRC-valid structural truncations bypass the outer checksum guard.
  for (let n = 58; n < rich.length - 4; n++) {
    const b = new Uint8Array(n + 4);
    b.set(rich.subarray(0, n));
    bad(`structural-truncate-${n}`, repair(b));
  }
  for (const n of [63, 512, 513, 1024]) {
    const b = new Uint8Array(n);
    b.set(minimal.subarray(0, 58));
    bad(`trailing-size-${n}`, repair(b));
  }
  const result = { revision, idVectors, catalog: catalog.map((s) => ({ id: s, hash: cap.gameHash(s) })), encoded, malformed };
  writeFileSync(join(dir, 'vectors.json'), JSON.stringify(result, null, 2) + '\n');
  const bytes = (hex) => `{${Array.from(Buffer.from(hex, 'hex'), (b) => `${b}u`).join(',')}}`;
  const ident = (s) => `{${bytes(s.replaceAll('-', ''))}}`;
  const errorCode = (s) =>
    ({
      size: 'COURIER_CAPSULE_SIZE',
      'not-capsule': 'COURIER_CAPSULE_NOT_CAPSULE',
      version: 'COURIER_CAPSULE_VERSION_ERROR',
      tampered: 'COURIER_CAPSULE_TAMPERED',
      malformed: 'COURIER_CAPSULE_MALFORMED',
    })[s] || 'COURIER_CAPSULE_OK';
  const cInput = (c) => {
    const stamp = (s) => {
      if (s.kind === 'game' && s.game) return `{0u,${cap.gameHash(s.game)}u}`;
      const k = ['game', 'sample-cd', 'graduation', 'mystery'].indexOf(s.kind);
      return `{${k > 0 ? k : 3}u,0u}`;
    };
    // Invalid oversized counts are stored, but never write beyond C's fixed arrays.
    return `{.trip=${ident(c.trip)},.home=${ident(c.home)},.from=${ident(c.from)},.world=${c.world}u,.package_count=${c.packages.length}u,.packages={${
      c.packages
        .slice(0, 3)
        .map((s) => `${cap.gameHash(s)}u`)
        .join(',') || '0u'
    }},.postcard_count=${c.postcards.length}u,.postcards={${
      c.postcards
        .slice(0, 8)
        .map(
          (p) =>
            `{.from=${ident(p.from)},.world=${p.world}u,.stamp_count=${p.stamps.length}u,.stamps={${p.stamps.slice(0, 64).map(stamp).join(',') || '{0u,0u}'}}}`,
        )
        .join(',') || '{.from={{0u}},.world=0u,.stamp_count=0u,.stamps={{0u,0u}}}'
    }}}`;
  };
  let h = `/* SPDX-License-Identifier: MIT\n * Generated by generate-vectors.mjs from TS ${revision}. Do not hand-edit.\n */\n`;
  h += 'static const struct id_vector { uint8_t entropy[16]; const char *text; } id_vectors[] = {\n';
  h += idVectors.map((v) => `{${bytes(Buffer.from(v.random).toString('hex'))},"${v.id}"}`).join(',\n') + '\n};\n';
  h += 'static const uint32_t catalog_hashes[] = {' + [...known.keys()].map((x) => `${x}u`).join(',') + '};\n';
  for (let i = 0; i < encoded.length; i++) {
    const v = encoded[i];
    h += `static const courier_capsule input_${i} = ${cInput(v.input)};\n`;
    for (const key of ['hex', 'canonical', 'unknown']) if (v[key]) h += `static const uint8_t ${key}_${i}[] = ${bytes(v[key])};\n`;
  }
  h +=
    'static const struct encode_vector { const char *name; const courier_capsule *input; courier_capsule_result encode_result,decode_result; const uint8_t *wire; size_t length; const uint8_t *canonical; size_t canonical_length; const uint8_t *unknown; size_t unknown_length; } encode_vectors[] = {\n';
  h +=
    encoded
      .map(
        (v, i) =>
          `{"${v.name}",&input_${i},${errorCode(v.encodeError)},${errorCode(v.decodeError)},${v.hex ? `hex_${i},sizeof hex_${i}` : 'NULL,0u'},${v.canonical ? `canonical_${i},sizeof canonical_${i}` : 'NULL,0u'},${v.unknown ? `unknown_${i},sizeof unknown_${i}` : 'NULL,0u'}}`,
      )
      .join(',\n') + '\n};\n';
  for (let i = 0; i < malformed.length; i++) h += `static const uint8_t bad_${i}[] = ${malformed[i].hex ? bytes(malformed[i].hex) : '{0u}'};\n`;
  h += 'static const struct bad_vector { const char *name; const uint8_t *wire; size_t length; courier_capsule_result result; } bad_vectors[] = {\n';
  h += malformed.map((v, i) => `{"${v.name}",bad_${i},${v.hex.length / 2}u,${errorCode(v.error)}}`).join(',\n') + '\n};\n';
  writeFileSync(join(dir, 'vectors.h'), h);
  console.log(`TS ${revision}: ${idVectors.length} IDs, ${encoded.length} encode cases, ${malformed.length} malformed cases`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
