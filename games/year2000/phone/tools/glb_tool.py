#!/usr/bin/env python3
"""Reads a GLB (glTF 2.0 binary) with no dependencies.

usage:
  glb_tool.py info file.glb                  list nodes, meshes, triangle counts and bounding boxes (mm if the file is in mm)
  glb_tool.py pack file.glb out_dir [--budget-mb 2]   write parts.json + parts.bin for the site viewer (see README)

The packed format: parts.json = {units, board: bbox, materials: [...], parts: [{id, kind: board|component, side,
color:[r,g,b], bbox:[x0,y0,z0,x1,y1,z1], pos:{offset,count}, idx:{offset,count}}]}; parts.bin = little-endian,
all vertex arrays as float32 x,y,z (one block) and all index arrays as uint32 (second block); offsets are in
elements (floats / indices) and each part's indices are relative to its own vertices.
Part ids come from the glTF node names (KiCad names component meshes after their model files and references).
"""
import json
import math
import struct
import sys


def read_glb(path):
    b = open(path, "rb").read()
    magic, ver, ln = struct.unpack("<4sII", b[:12])
    if magic != b"glTF":
        raise SystemExit("not a GLB")
    off = 12
    js = binchunk = None
    while off < len(b):
        cl, ct = struct.unpack("<I4s", b[off:off + 8])
        data = b[off + 8:off + 8 + cl]
        if ct == b"JSON":
            js = json.loads(data)
        elif ct == b"BIN\0":
            binchunk = data
        off += 8 + cl
    return js, binchunk


CT = {5120: ("b", 1), 5121: ("B", 1), 5122: ("h", 2), 5123: ("H", 2), 5125: ("I", 4), 5126: ("f", 4)}
NC = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def accessor(js, bin_, i):
    a = js["accessors"][i]
    bv = js["bufferViews"][a["bufferView"]]
    fmt, size = CT[a["componentType"]]
    n = NC[a["type"]]
    stride = bv.get("byteStride") or size * n
    base = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    out = []
    for k in range(a["count"]):
        out.append(struct.unpack_from("<" + fmt * n, bin_, base + k * stride))
    return out


def mat_mul(a, b):
    return [sum(a[r + 4 * k] * b[k + 4 * c] for k in range(4)) for c in range(4) for r in range(4)]


def node_matrix(nd):
    if "matrix" in nd:
        return list(nd["matrix"])
    t = nd.get("translation", [0, 0, 0])
    q = nd.get("rotation", [0, 0, 0, 1])
    s = nd.get("scale", [1, 1, 1])
    x, y, z, w = q
    r = [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0,
         2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0,
         2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0, 0, 0, 0, 1]
    for c in range(3):
        for rr in range(3):
            r[c * 4 + rr] *= s[c]
    r[12], r[13], r[14] = t
    return r


def walk(js):
    """Yield (node name, world matrix, mesh index) for every node with a mesh."""
    nodes = js["nodes"]
    out = []

    def rec(i, parent):
        nd = nodes[i]
        m = mat_mul(parent, node_matrix(nd))
        if "mesh" in nd:
            out.append((nd.get("name", f"node{i}"), m, nd["mesh"]))
        for c in nd.get("children", []):
            rec(c, m)

    ident = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    scene = js["scenes"][js.get("scene", 0)]
    for r in scene["nodes"]:
        rec(r, ident)
    return out


def xform(m, p):
    return (m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14])


def prims(js, bin_, name, m, mesh):
    """Yield (name, material color, world vertices, indices) per primitive."""
    for k, pr in enumerate(js["meshes"][mesh]["primitives"]):
        pos = accessor(js, bin_, pr["attributes"]["POSITION"])
        idx = [i[0] for i in accessor(js, bin_, pr["indices"])] if "indices" in pr else list(range(len(pos)))
        col = [0.7, 0.7, 0.7]
        if "material" in pr:
            mt = js["materials"][pr["material"]]
            col = mt.get("pbrMetallicRoughness", {}).get("baseColorFactor", [0.7, 0.7, 0.7, 1])[:3]
        yield name, col, [xform(m, p) for p in pos], idx


def info(path):
    js, bin_ = read_glb(path)
    print("nodes", len(js["nodes"]), "meshes", len(js.get("meshes", [])), "materials", len(js.get("materials", [])))
    tri = 0
    for name, m, mesh in walk(js):
        for nm, col, vs, idx in prims(js, bin_, name, m, mesh):
            xs = [v[0] for v in vs]
            ys = [v[1] for v in vs]
            zs = [v[2] for v in vs]
            tri += len(idx) // 3
            print(f"{nm[:40]:40s} tris {len(idx) // 3:6d} x {min(xs):8.2f}..{max(xs):8.2f} y {min(ys):8.2f}..{max(ys):8.2f} z {min(zs):8.2f}..{max(zs):8.2f}")
    print("triangles", tri)


def pack(path, outdir, budget_mb=2.0):
    js, bin_ = read_glb(path)
    parts = []
    for name, m, mesh in walk(js):
        for k, (nm, col, vs, idx) in enumerate(prims(js, bin_, name, m, mesh)):
            parts.append(dict(name=nm, col=col, vs=vs, idx=idx))
    # one part per primitive; merge nothing. Decimate by snapping vertices to a grid if over budget.
    snap = 0.0
    while True:
        verts, inds, meta = [], [], []
        for p in parts:
            vs = p["vs"]
            if snap:
                vs = [(round(v[0] / snap) * snap, round(v[1] / snap) * snap, round(v[2] / snap) * snap) for v in vs]
            remap, nv = {}, []
            ni = []
            for i in p["idx"]:
                v = vs[i]
                if v not in remap:
                    remap[v] = len(nv)
                    nv.append(v)
                ni.append(remap[v])
            tri = [ni[i:i + 3] for i in range(0, len(ni), 3) if len(set(ni[i:i + 3])) == 3]
            meta.append((p, nv, [i for t in tri for i in t]))
        size = sum(len(nv) * 12 + len(ix) * 4 for _, nv, ix in meta)
        if size <= budget_mb * 1e6 or snap > 2:
            break
        snap = snap * 2 if snap else 0.05
    vf, ii, parts_out = [], [], []
    for p, nv, ix in meta:
        xs = [v[0] for v in nv] or [0]
        ys = [v[1] for v in nv] or [0]
        zs = [v[2] for v in nv] or [0]
        nm = p["name"]
        kind = "board" if "board" in nm.lower() or ("PCB" in nm) else "component"
        zc = (min(zs) + max(zs)) / 2
        parts_out.append(dict(id=nm, kind=kind, side="back" if zc < 0 else "front", color=[round(c, 3) for c in p["col"]],
                              bbox=[round(min(xs), 3), round(min(ys), 3), round(min(zs), 3), round(max(xs), 3), round(max(ys), 3), round(max(zs), 3)],
                              pos=dict(offset=len(vf), count=len(nv) * 3), idx=dict(offset=len(ii), count=len(ix))))
        for v in nv:
            vf += [v[0], v[1], v[2]]
        ii += ix
    blob = struct.pack(f"<{len(vf)}f", *vf) + struct.pack(f"<{len(ii)}I", *ii)
    import os
    os.makedirs(outdir, exist_ok=True)
    meta_json = dict(format="potf-parts-1", units="mm, as exported by KiCad (y is up in glTF)", snap_mm=snap,
                     floats=len(vf), indices=len(ii), binary="parts.bin", parts=parts_out)
    json.dump(meta_json, open(os.path.join(outdir, "parts.json"), "w"), separators=(",", ":"))
    open(os.path.join(outdir, "parts.bin"), "wb").write(blob)
    print("parts", len(parts_out), "bytes", len(blob), "snap", snap)


if __name__ == "__main__":
    if sys.argv[1] == "info":
        info(sys.argv[2])
    elif sys.argv[1] == "pack":
        pack(sys.argv[2], sys.argv[3], float(sys.argv[5]) if len(sys.argv) > 5 else 2.0)
