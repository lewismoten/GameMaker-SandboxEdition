// 3MF (the 3D Manufacturing Format, 3MF Consortium, https://3mf.io): a ZIP of XML that carries
// several bodies, each with a color, so a multi-filament printer gives every color its own filament.
// This writes the core spec's model part (3D/3dmodel.model: one <object> per part with its mesh and a
// base material color, one <build> item each), the content types and the relationships, in
// millimeters. Parts are meshes plus a color, nothing game specific.
import type { Mesh } from './mesh';
import { readZip, writeZip, type ZipCodec, type ZipEntry } from './zipFile';

export interface Part {
  name: string;
  mesh: Mesh;
  /** 0-255 each. */
  color: [number, number, number];
}

const hex = (c: [number, number, number]) =>
  `#${c
    .map((v) => Math.round(v).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (v: number) => String(+v.toFixed(3));

/** The parts as a 3MF file. */
export function write3mf(parts: Part[], title: string, codec: ZipCodec = {}): Uint8Array {
  return writeZip(threeMfEntries(parts, title), codec);
}

/** The files inside the 3MF `write3mf` writes, before they are zipped (threeMfPack.ts makes them again from a pack). */
export function threeMfEntries(parts: Part[], title: string): ZipEntry[] {
  const xml: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">`,
    `<metadata name="Title">${esc(title)}</metadata>`,
    '<resources>',
    '<basematerials id="1">',
    ...parts.map((p) => `<base name="${esc(p.name)}" displaycolor="${hex(p.color)}"/>`),
    '</basematerials>',
  ];
  parts.forEach((p, i) => {
    xml.push(`<object id="${i + 2}" type="model" name="${esc(p.name)}" pid="1" pindex="${i}"><mesh><vertices>`);
    const pos = p.mesh.positions;
    for (let v = 0; v < pos.length; v += 3) xml.push(`<vertex x="${num(pos[v])}" y="${num(pos[v + 1])}" z="${num(pos[v + 2])}"/>`);
    xml.push('</vertices><triangles>');
    const ix = p.mesh.indices;
    for (let t = 0; t < ix.length; t += 3) xml.push(`<triangle v1="${ix[t]}" v2="${ix[t + 1]}" v3="${ix[t + 2]}"/>`);
    xml.push('</triangles></mesh></object>');
  });
  xml.push('</resources><build>', ...parts.map((_, i) => `<item objectid="${i + 2}"/>`), '</build></model>');
  const enc = new TextEncoder();
  return [
    {
      name: '[Content_Types].xml',
      data: enc.encode(
        '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>',
      ),
    },
    {
      name: '_rels/.rels',
      data: enc.encode(
        '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>',
      ),
    },
    { name: '3D/3dmodel.model', data: enc.encode(xml.join('\n')) },
  ];
}

/** A 3MF written by `write3mf` read back (its parts, meshes and colors). */
export function read3mf(data: Uint8Array, codec: ZipCodec = {}): Part[] {
  const model = readZip(data, codec).find((e) => e.name === '3D/3dmodel.model');
  if (!model) throw new Error('No 3D/3dmodel.model in the file');
  const text = new TextDecoder().decode(model.data);
  const colors = [...text.matchAll(/<base name="([^"]*)" displaycolor="#([0-9A-F]{6})"/g)].map(
    (m) => [m[1], [0, 2, 4].map((i) => parseInt(m[2].slice(i, i + 2), 16))] as const,
  );
  const parts: Part[] = [];
  for (const o of text.matchAll(/<object [^>]*pindex="(\d+)"[^>]*>([\s\S]*?)<\/object>/g)) {
    const [name, color] = colors[Number(o[1])];
    const positions = [...o[2].matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].flatMap((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);
    const indices = [...o[2].matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"/g)].flatMap((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);
    parts.push({ name, color: color as [number, number, number], mesh: { positions: Float32Array.from(positions), indices: Uint32Array.from(indices) } });
  }
  return parts;
}
